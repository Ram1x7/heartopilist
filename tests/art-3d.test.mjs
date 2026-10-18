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
  const module=new vm.SyntheticModule(['openPreview'],function(){this.setExport('openPreview',(b)=>{bridge=b;return {close(){closed++;},update(){updates++;}};});},{context});
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
