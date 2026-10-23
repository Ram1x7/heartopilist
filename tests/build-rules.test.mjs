import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLoad, validateGrid } from '../js/build-rules.mjs';
import { expandPlan, validatePlan, fitPlanToLimits } from '../js/build-ai-plan.mjs';
const pillar = (materialId='006',hex='#ffffff') => ({materialId,hex});
const wall = patternId => ({materialId:'008',patternId});
const floor = patternId => ({kind:'floor',patternId});

test('measured loads count pieces, independent types and independent patterns',()=>{
  assert.equal(calculateLoad([]),0);
  assert.equal(calculateLoad(Array.from({length:5},()=>pillar())),240);
  assert.equal(calculateLoad([pillar(),pillar('006','#000000')]),210);
  assert.equal(calculateLoad([pillar(),pillar('005')]),400);
  assert.equal(calculateLoad(Array.from({length:5},()=>wall('a'))),290);
  assert.equal(calculateLoad(['a','a','a','a','b'].map(wall)),480);
  assert.equal(calculateLoad(['a','b','c','d','e'].map(wall)),1050);
  assert.equal(calculateLoad(Array.from({length:5},()=>floor('a'))),480);
  assert.equal(calculateLoad(['a','a','a','a','b'].map(floor)),670);
  assert.equal(calculateLoad(['a','b','c','d','e'].map(floor)),1240);
  assert.equal(calculateLoad([floor('a'),wall('a')]),610);
});

test('wall height 13, pillar height 17, bounds and duplicates are enforced',()=>{
  const item={...pillar(),x:95,y:16,z:119};
  validateGrid([item],{w:96,h:17,d:120},'solid');
  assert.throws(()=>validateGrid([{...item,y:17}],{w:96,h:17,d:120},'solid'));
  validateGrid([{materialId:'008',hex:'#ffffff',x:23,y:12}],{w:24,h:13},'wall');
  assert.throws(()=>validateGrid([],{w:24,h:14},'wall'));
  assert.throws(()=>validateGrid([item,item],{w:96,h:17,d:120},'solid'));
  assert.throws(()=>validateGrid([],{w:1,h:1,d:1},'unknown'));
});

const materials=[{id:'006',name:'木製支柱',colors:['#ffffff','#000000']}];
const limits={w:8,h:4,d:8};
const box={shape:'box',op:'add',x:0,y:0,z:0,w:4,h:3,d:4,materialId:'006',hex:'#fdfdfd'};
test('AI shapes expand into actual fixed-height pillars and palette colors',()=>{
  const result=expandPlan({title:'箱',shapes:[box]},limits,materials);
  assert.equal(result.length,48);
  assert.ok(result.every(v=>v.hex==='#ffffff'));
  assert.equal(calculateLoad(result),670);
  validateGrid(result,limits,'solid');
});
test('AI can carve an opening; rejects oversized and empty designs',()=>{
  const result=expandPlan({title:'門',shapes:[box,{...box,op:'subtract',x:1,w:2,h:2}]},limits,materials);
  assert.equal(result.length,32);
  assert.throws(()=>validatePlan({title:'外',shapes:[{...box,x:7}]},limits));
  assert.throws(()=>expandPlan({title:'空',shapes:[box,{...box,op:'subtract'}]},limits,materials));
  assert.throws(()=>validatePlan({title:'NaN',shapes:[{...box,w:NaN}]},limits));
});
test('round shapes and overlapping unions remain in bounds without duplicates',()=>{
  const plan={title:'塔',shapes:[{...box,shape:'ellipsoid'},{...box,shape:'cone'}]};
  const result=expandPlan(plan,limits,materials);
  assert.ok(result.length>0 && result.length<=48);
  validateGrid(result,limits,'solid');
});

test('oversized AI plans scale uniformly, keep material and order, and do not mutate the source',()=>{
 const plan={title:'門',shapes:[{...box,w:16,h:8,d:16},{...box,op:'subtract',x:4,w:8,h:4,d:16}]};
 const before=structuredClone(plan);
 const result=fitPlanToLimits(plan,limits);
 assert.equal(result.adjustment.scale,0.5);
 assert.deepEqual(result.plan.shapes[0],{...box,w:8,h:4,d:8});
 assert.equal(result.plan.shapes[1].op,'subtract');
 assert.equal(result.plan.shapes[1].x,2);
 assert.equal(result.plan.shapes[1].w,4);
 assert.deepEqual(plan,before);
 assert.ok(expandPlan(result.plan,limits,materials).length>0);
 validateGrid(expandPlan(result.plan,limits,materials),limits,'solid');
});
test('fit translates negative and offset coordinates; keeps valid plans unchanged and rejects malformed data',()=>{
 const valid={title:'箱',shapes:[box]};
 assert.equal(fitPlanToLimits(valid,limits).plan,valid);
 assert.equal(fitPlanToLimits(valid,limits).adjustment,null);
 const moved=fitPlanToLimits({title:'移動',shapes:[{...box,x:-3,z:20}]},limits);
 assert.equal(moved.adjustment.scale,1);
 assert.equal(moved.plan.shapes[0].x,0);
 assert.equal(moved.plan.shapes[0].z,4);
 for(const changed of [{w:0},{x:'0.5'},{h:NaN},{materialId:'999'}]) assert.throws(()=>fitPlanToLimits({title:'不正',shapes:[{...box,...changed}]},limits));
 assert.throws(()=>fitPlanToLimits({title:'null',shapes:[null]},limits));
});
test('fit remains in bounds for thin pieces and extreme integer extents',()=>{
 for(let i=1;i<=60;i++) {
  const plan={title:'試験',shapes:[{...box,x:-i*17,y:-i,z:i,w:i*31,h:i*13,d:i*29},{...box,x:i*34,y:i*12,z:i*20,w:1,h:1,d:1}]};
  const fitted=fitPlanToLimits(plan,limits);
  validatePlan(fitted.plan,limits);
  assert.ok(fitted.plan.shapes.every(s=>s.w>=1 && s.h>=1 && s.d>=1));
  assert.equal(fitPlanToLimits(fitted.plan,limits).adjustment,null);
 }
});

test('fractional model coordinates snap to valid pillar units with an explicit adjustment',()=>{
 const fitted=fitPlanToLimits({title:'小数',shapes:[{...box,x:0.5,y:0.5,w:2.5,h:0.25}]},limits);
 assert.equal(fitted.adjustment.quantized,true);
 validatePlan(fitted.plan,limits);
 assert.ok(fitted.plan.shapes[0].h>=1);
});
