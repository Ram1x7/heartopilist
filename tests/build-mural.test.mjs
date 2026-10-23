import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {pillarMuralDimensions,buildPillarMural} from '../js/build-mural.mjs';
import {BUILD_RULES,validateGrid,calculateLoad} from '../js/build-rules.mjs';

test('pillar mural fits width/height using physical 1:2 pillar fronts',()=>{
 assert.deepEqual(pillarMuralDimensions(24,1),{w:24,h:12,d:1});
 assert.deepEqual(pillarMuralDimensions(12,1,'height'),{w:24,h:12,d:1});
 assert.deepEqual(pillarMuralDimensions(96,0.5),{w:17,h:17,d:1});
 assert.deepEqual(pillarMuralDimensions(96,4),{w:96,h:12,d:1});
 assert.throws(()=>pillarMuralDimensions(24,0));
 for(let i=1;i<=80;i++) {
  const aspect=i/10,d=pillarMuralDimensions(96,aspect);
  assert.ok(d.w<=96 && d.h<=17 && d.h>=1);
  assert.ok(Math.abs(d.w-d.h*aspect*2)<=Math.max(1,aspect)+1e-8);
 }
});

test('pillar mural preserves top/bottom, colors and transparent holes as a single depth plane',()=>{
 const a={materialId:'006',hex:'#bb7c31',name:'wood'}, b={materialId:'005',hex:'#494542',name:'metal'};
 const pieces=buildPillarMural({cells:[a,null,b,a]},2,2);
 assert.deepEqual(pieces,[{x:0,y:1,z:0,...a},{x:0,y:0,z:0,...b},{x:1,y:0,z:0,...a}]);
 validateGrid(pieces,{w:2,h:2,d:1},'pillar-wall');
 assert.equal(calculateLoad(pieces),410);
 const design=JSON.parse(JSON.stringify({mode:'pillar-wall',dims:{w:2,h:2,d:1},voxels:pieces}));
 validateGrid(design.voxels,design.dims,design.mode);
 assert.throws(()=>validateGrid(pieces,{w:2,h:2,d:2},'pillar-wall'));
 assert.throws(()=>validateGrid([{...pieces[0],z:1}],{w:2,h:2,d:1},'pillar-wall'));
});

test('editor height/width controls stay in sync with fitted pillar mural dimensions',()=>{
 const source=fs.readFileSync(new URL('../js/build.js',import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace(/\ninitBuildPage\(\);\s*$/,'');
 const nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'0',max:'78',checked:false,style:{}});return nodes.get(id);};
 node('buildWidthInput').value='96';node('buildWallHeightInput').value='12';node('buildThicknessInput').value='6';node('buildColorCountInput').value='8';
 const context=vm.createContext({BUILD_RULES,calculateLoad,validateGrid,pillarMuralDimensions,buildPillarMural,T:(_,fallback)=>fallback,document:{addEventListener(){},getElementById:node},console});
 vm.runInContext(source,context);
 vm.runInContext(`settings.mode='pillar-wall'; frontImage={naturalWidth:200,naturalHeight:400}; readOptionInputs();`,context);
 assert.equal(node('buildWidthInput').value,'17');
 assert.equal(node('buildWallHeightInput').value,'17');
 assert.equal(vm.runInContext('computeOtherDim()',context),17);
 vm.runInContext(`settings.wallSizeBasis='height'; frontImage={naturalWidth:200,naturalHeight:200}; readOptionInputs();`,context);
 assert.equal(node('buildWidthInput').value,'34');
 assert.equal(node('buildWallHeightInput').value,'17');
 assert.equal(vm.runInContext('cellAspectRatio()',context),0.5);
});

test('pillar murals can retain floating, overlapping and in-plane rotated pillar edits',()=>{
 const v={x:2,y:2.5,z:0,materialId:'006',hex:'#bb7c31',freePlacement:true,rz:35};
 validateGrid([v,v],{w:8,h:8,d:1},'pillar-wall');
 assert.equal(calculateLoad([v,v]),210);
 assert.throws(()=>validateGrid([{...v,rx:35}],{w:8,h:8,d:1},'pillar-wall'));
});
