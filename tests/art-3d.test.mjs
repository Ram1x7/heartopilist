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

test('adapter uses unsaved active pixels, explicit compatible saved parts, and never writes storage',async()=>{
  const listeners={};const button={hidden:true,disabled:false,addEventListener:(name,fn)=>listeners[name]=fn,focus(){}};
  let bridge, closed=0, updates=0;
  const context=vm.createContext({console,document:{getElementById:()=>button},window:{},
    localStorage:{setItem(){throw Error('unexpected storage write');}}});
  patterns(context);
  vm.runInContext(`let activeFrameId='t_shirt',activePartId='default',gridWidth=64,gridHeight=80;
    let pixels=new Array(64*80).fill('#123456');
    let savedDesigns=[
      {id:'back',name:'選んだ背面',frameId:'t_shirt',partId:'canvas-1777194719606',width:64,height:80,pixelData:new Array(5120).fill('#abcdef')},
      {id:'bad',name:'不正な寸法',frameId:'t_shirt',partId:'canvas-1777194719606',width:1,height:1,pixelData:['#ffffff']}
    ];`,context);
  const module=new vm.SyntheticModule(['openPreview','loadPreviewStyles'],function(){this.setExport('loadPreviewStyles',()=>Promise.resolve());this.setExport('openPreview',(b)=>{bridge=b;return {close(){closed++;},update(){updates++;}};});},{context});
  await module.link(()=>{});await module.evaluate();
  const script=new vm.Script(fs.readFileSync(new URL('js/art-3d-adapter.js',root),'utf8'),{importModuleDynamically:()=>module});
  script.runInContext(context);
  context.window.HatopiArt3D.refresh();assert.equal(button.hidden,false);
  await listeners.click();assert.ok(bridge);
  const before=vm.runInContext('JSON.stringify({pixels,savedDesigns})',context);
  assert.equal(bridge.candidates('back').length,1);
  let parts=bridge.snapshot({});assert.equal(parts.front.pixels[0],'#123456');assert.equal(parts.back.pixels,null);
  parts=bridge.snapshot({back:'back'});assert.equal(parts.back.pixels[0],'#abcdef');
  assert.equal(vm.runInContext('JSON.stringify({pixels,savedDesigns})',context),before);
  vm.runInContext("pixels[0]='#ff0000'",context);context.window.HatopiArt3D.refresh();
  assert.equal(bridge.snapshot({}).front.pixels[0],'#ff0000');assert.equal(updates,1);
  vm.runInContext("activeFrameId='book'",context);context.window.HatopiArt3D.refresh();
  assert.equal(button.hidden,true);assert.equal(closed,1);assert.equal(bridge.snapshot({}),null);
});

test('every clothing preset and every part opens with valid model groups and read-only pixels',async()=>{
  const {buildGarment}=await import('../js/art-3d-models/garment.js');
  const listeners={},button={hidden:true,disabled:false,addEventListener:(event,fn)=>listeners[event]=fn,focus(){}};
  let bridge,closes=0,onClose;
  const context=vm.createContext({console,document:{getElementById:()=>button},window:{}});
  patterns(context);
  vm.runInContext(`let activeFrameId='',activePartId='',gridWidth=0,gridHeight=0,pixels=[],savedDesigns=[];`,context);
  const module=new vm.SyntheticModule(['openPreview','loadPreviewStyles'],function(){
    this.setExport('loadPreviewStyles',()=>Promise.resolve());
    this.setExport('openPreview',(b,close)=>{bridge=b;onClose=close;return {close(){closes++;close();},update(){}};});
  },{context});
  await module.link(()=>{});await module.evaluate();
  new vm.Script(fs.readFileSync(new URL('js/art-3d-adapter.js',root),'utf8'),{importModuleDynamically:()=>module}).runInContext(context);
  const frames=vm.runInContext("DESIGN_FRAME_PRESETS.filter(f=>f.category==='clothes')",context);
  assert.equal(frames.length,11);
  for(const frame of frames) {
    for(const part of frame.parts) {
      vm.runInContext(`activeFrameId=${JSON.stringify(frame.id)};activePartId=${JSON.stringify(part.id)};gridWidth=${part.width};gridHeight=${part.height};pixels=new Array(gridWidth*gridHeight).fill('#124578');`,context);
      context.window.HatopiArt3D.refresh();assert.equal(button.hidden,false,frame.id);
      await listeners.click();assert.equal(bridge.title,frame.name);
      const parts=bridge.snapshot({}),active=bridge.activeRole();
      assert.equal(parts[active].pixels[0],'#124578');
      assert.equal(Object.values(parts).filter(p=>p.pixels).length,1);
      assert.deepEqual(Object.values(bridge.roles).map(p=>p.id),Array.from(frame.parts,p=>p.id));
      if(part===frame.parts[0]) {
        const {geometry,groups}=buildGarment(THREE,parts,bridge.kind);
        const positions=geometry.attributes.position,uv=geometry.attributes.uv,normals=geometry.attributes.normal;
        assert.ok(positions.array.every(Number.isFinite),frame.id+' positions');
        assert.ok(normals.array.every(Number.isFinite),frame.id+' normals');
        assert.ok(uv.array.every(v=>Number.isFinite(v)&&v>=0&&v<=1),frame.id+' UV');
        assert.ok(geometry.index.array.every(v=>Number.isInteger(v)&&v<positions.count),frame.id+' indices');
        assert.equal(groups.reduce((total,g)=>total+g.count,0),geometry.index.count);
        assert.ok(groups.every(g=>parts[g.role]),frame.id+' group roles');
        assert.deepEqual(new Set(groups.map(g=>g.role)),new Set(Object.keys(parts)),frame.id+' all parts represented');
        assert.ok(geometry.index.count/3>10000 && geometry.index.count/3<400000,frame.id+' triangle budget');
        for(const group of groups) if(group.colorSample)assert.ok(group.colorSample.every(v=>v>=0&&v<=1));
        geometry.dispose();
      }
      onClose();
    }
  }
  // Changing directly between supported frames must discard the old viewer.
  await listeners.click();
  vm.runInContext("activeFrameId='tank_top';activePartId='default';gridWidth=64;gridHeight=64;pixels=new Array(4096).fill(null)",context);
  context.window.HatopiArt3D.refresh();assert.equal(closes,1);
  await listeners.click();assert.equal(bridge.kind,'tank');
  vm.runInContext("activeFrameId='book'",context);context.window.HatopiArt3D.refresh();assert.equal(button.hidden,true);assert.equal(closes,2);
});
