// Run: node --experimental-vm-modules --test tests/art-3d.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from '../js/vendor/three/three.module.min.js';
import { buildTshirt } from '../js/art-3d-models/tshirt.js';

const root=new URL('../',import.meta.url);
function patterns(context) {
  for(const file of ['js/art-config.js','js/art-masks.js']) vm.runInContext(fs.readFileSync(new URL(file,root),'utf8'),context);
}
test('T-shirt shell, lining and edges have valid geometry and independent cached buffers',()=>{
  const context=vm.createContext({});patterns(context);
  const parts=vm.runInContext(`Object.fromEntries(DESIGN_FRAME_PRESETS.find(f=>f.id==='t_shirt').parts.map((p,i)=>[
    ['front','back','leftSleeve','rightSleeve'][i],{width:p.width,height:p.height,maskLines:PRESET_MASKS.t_shirt[p.id].maskLines}]))`,context);
  const {geometry,groups}=buildTshirt(THREE,parts);
  assert.ok(groups.some(g=>g.fabricLining));
  assert.deepEqual(new Set(groups.map(g=>g.role)),new Set(['front','back','leftSleeve','rightSleeve']));
  {
    const p=geometry.getAttribute('position'),uv=geometry.getAttribute('uv'),n=geometry.getAttribute('normal');
    assert.ok(p.array.every(Number.isFinite));assert.ok(n.array.every(Number.isFinite));
    assert.ok(uv.array.every(value=>Number.isFinite(value)&&value>=0&&value<=1));
    assert.ok(geometry.index.array.every(value=>value<p.count));
    assert.ok(geometry.index.count/3>100000 && geometry.index.count/3<300000);
    const other=buildTshirt(THREE,parts).geometry,original=other.attributes.position.array[0];
    geometry.translate(5,0,0);assert.equal(other.attributes.position.array[0],original);
    other.dispose();geometry.dispose();
  }
});

function adapter(){
  const listeners={},button={hidden:true,disabled:false,addEventListener:(event,fn)=>listeners[event]=fn,focus(){},setAttribute(){}};
  let bridge,closes=0,updates=0,done;
  const context=vm.createContext({console,document:{getElementById:()=>button},window:{},clearTimeout,showToast(){}});patterns(context);
  vm.runInContext(`let activeFrameId='',activePartId='',gridWidth=0,gridHeight=0,pixels=[],savedDesigns=[],blockStatus={},isLocked=false;function saveDraft(){window.HatopiArtProject.snapshot();}`,context);
  vm.runInContext(fs.readFileSync(new URL('js/art-project.js',root),'utf8'),context);
  const module=new vm.SyntheticModule(['openPreview','loadPreviewStyles'],function(){
    this.setExport('loadPreviewStyles',()=>Promise.resolve());
    this.setExport('openPreview',(b,close)=>{bridge=b;done=close;return {close(){closes++;close();},update(){updates++;}};});
  },{context});
  async function init(){await module.link(()=>{});await module.evaluate();new vm.Script(fs.readFileSync(new URL('js/art-3d-adapter.js',root),'utf8'),{importModuleDynamically:()=>module}).runInContext(context);}
  function activate(id,index=0){vm.runInContext(`{const f=DESIGN_FRAME_PRESETS.find(f=>f.id===${JSON.stringify(id)}),p=f.parts[${index}];activeFrameId=f.id;activePartId=p.id;gridWidth=p.width;gridHeight=p.height;pixels=new Array(gridWidth*gridHeight).fill('#124578');window.HatopiArtProject.reset();}`,context);context.window.HatopiArt3D.refresh();}
  return {context,button,init,activate,open:()=>listeners.click(),close:()=>done(),get bridge(){return bridge;},get closes(){return closes;},get updates(){return updates;}};
}
test('all 22 item presets and every part connect to finite model geometry',async()=>{
  const {buildGarment}=await import('../js/art-3d-models/garment.js');
  const {buildFurniture}=await import('../js/art-3d-models/furniture.js');
  const a=adapter();await a.init();
  const frames=vm.runInContext('DESIGN_FRAME_PRESETS',a.context);assert.equal(frames.length,22);
  for(const frame of frames)for(let i=0;i<frame.parts.length;i++){
    a.activate(frame.id,i);assert.equal(a.button.hidden,false,frame.id);await a.open();
    const b=a.bridge,parts=b.snapshot();assert.equal(b.title,frame.name);assert.equal(parts[b.activeRole()].pixels[0],'#124578');
    assert.equal(Object.values(parts).filter(p=>p.pixels).length,1);
    if(i===0 || frame.id==='book'){
      const {geometry:g,groups}=b.simplified?buildFurniture(THREE,parts,b.kind,b.activeRole()):buildGarment(THREE,parts,b.kind);
      const p=g.attributes.position,uv=g.attributes.uv,n=g.attributes.normal;
      assert.ok(p.array.every(Number.isFinite),frame.id+' positions');assert.ok(n.array.every(Number.isFinite),frame.id+' normals');
      assert.ok(uv.array.every(v=>Number.isFinite(v)&&v>=0&&v<=1),frame.id+' UV');
      assert.ok(g.index.array.every(v=>Number.isInteger(v)&&v<p.count),frame.id+' indices');
      assert.equal(groups.reduce((total,g)=>total+g.count,0),g.index.count);
      assert.ok(groups.every(g=>parts[g.role]),frame.id+' roles');
      assert.ok(g.index.count>100 && g.index.count<1200000,frame.id+' triangle budget');
      if(frame.id!=='book')assert.deepEqual(new Set(groups.map(g=>g.role)),new Set(Object.keys(parts)),frame.id+' all parts');
      g.dispose();
    }
    a.close();
  }
});
test('saved parts are copied into the project, persist after close and reject wrong item/size',async()=>{
  const a=adapter();await a.init();a.activate('t_shirt');
  vm.runInContext(`savedDesigns=[{id:'legacy',name:'背面',frameId:'t_shirt',partId:'canvas-1777194719606',width:64,height:80,pixelData:new Array(5120).fill('#abcdef')},
    {id:'bad',frameId:'pants',partId:'default',width:64,height:80,pixelData:new Array(5120).fill('#abcdef')}];`,a.context);
  await a.open();const before=vm.runInContext('JSON.stringify(savedDesigns)',a.context);
  assert.equal(a.bridge.candidates('back').length,1);assert.equal(a.bridge.useDesign('back','bad'),false);
  assert.equal(a.bridge.useDesign('back','legacy'),true);assert.equal(a.bridge.snapshot().back.pixels[0],'#abcdef');
  assert.equal(vm.runInContext('JSON.stringify(savedDesigns)',a.context),before);
  a.close();await a.open();assert.equal(a.bridge.snapshot().back.pixels[0],'#abcdef');
  a.activate('tank_top');assert.equal(a.closes,1);await a.open();assert.equal(a.bridge.kind,'tank');
  vm.runInContext('activeFrameId=null',a.context);a.context.window.HatopiArt3D.refresh();assert.equal(a.button.hidden,true);assert.equal(a.closes,2);
});
