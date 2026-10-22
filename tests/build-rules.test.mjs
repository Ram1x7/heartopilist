import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLoad, validateGrid } from '../js/build-rules.mjs';
import { expandPlan, validatePlan } from '../js/build-ai-plan.mjs';
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
