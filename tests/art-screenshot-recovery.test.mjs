import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {screenshotFixture,accuracy} from './helpers/screenshot-fixture.mjs';
const context=vm.createContext({console});
for(const name of ['art-config','art-pixelate','art-template-match','art-screenshot-recovery'])vm.runInContext(fs.readFileSync(new URL('../js/'+name+'.js',import.meta.url),'utf8'),context);
const recovery=vm.runInContext('HatopiScreenshotRecovery',context),palette=vm.runInContext('GAME_PALETTE_FLAT.map(p=>p.hex)',context);
const colors=['#EF6E72','#0599BA','#41B97B','#051616','#FEFFFF'];
test('central cell samples retain exact colors across fractional scaling, grid overlays and noise',()=>{
  for(const settings of [{pitch:4.8,grid:true},{pitch:6.25,noise:2},{pitch:2.3,grid:true}]){
    const f=screenshotFixture(colors,settings),result=recovery.recover(f.image,f.rect,f.width,f.height);
    assert.ok(accuracy(result.pixels,f.expected)>.98,JSON.stringify(settings));
  }
});
test('default recovery keeps more than 32 colors and isolated one-cell details',()=>{
  const f=screenshotFixture([...new Set(palette)].slice(0,65),{width:65,height:3,pitch:5});
  const result=recovery.recover(f.image,f.rect,f.width,f.height);
  assert.equal(accuracy(result.pixels,f.expected),1);assert.equal(new Set(result.pixels).size,65);
});
test('guide suppression samples unoccluded color inside each cell, while legitimate white details stay white',()=>{
  const paths=[[{x:0,y:0},{x:12,y:0},{x:12,y:8},{x:0,y:8},{x:0,y:0}],[{x:4.5,y:0},{x:4.5,y:8}]];
  const f=screenshotFixture(colors,{width:12,height:8,pitch:8,paths,lineWidth:2.6});
  const result=recovery.recover(f.image,f.rect,f.width,f.height,{maskLines:paths});
  assert.ok(result.guideSamples>0);assert.ok(accuracy(result.pixels,f.expected)>.98);
  for(let i=0;i<f.expected.length;i++)if(f.expected[i]==='#FEFFFF')assert.equal(result.pixels[i],'#FEFFFF');
});
test('unavailable source cells and disabled or out-of-pattern cells are not invented',()=>{
  const f=screenshotFixture(colors,{width:8,height:6,pitch:5});
  const outside=recovery.recover(f.image,{...f.rect,x:f.image.width+1},f.width,f.height);
  assert.equal(outside.unreadable,48);assert.ok(outside.pixels.every(p=>p===null));
  const paths=[[{x:1,y:1},{x:7,y:1},{x:7,y:5},{x:1,y:5},{x:1,y:1}]];
  const result=recovery.recover(f.image,f.rect,f.width,f.height,{maskLines:paths,disabledRanges:[[2,2,3]]});
  assert.equal(result.pixels[0],null);assert.equal(result.pixels[2*8+2],null);assert.notEqual(result.pixels[3*8+4],null);
});
test('grid fitting improves drifted scale and phase and leaves uniform images alone',()=>{
  const f=screenshotFixture(colors.slice(0,4),{width:23,height:17,pitch:6.4,grid:true});
  const drift={x:f.rect.x+1.4,y:f.rect.y+1.3,w:f.rect.w*1.02,h:f.rect.h*1.02};
  const mask=recovery.cellMask(f.width,f.height),aligned=recovery.alignGrid(f.image,drift,f.width,f.height,mask);
  const before=recovery.recover(f.image,drift,f.width,f.height),after=recovery.recover(f.image,aligned.rect,f.width,f.height);
  assert.ok(aligned.improved);assert.ok(accuracy(after.pixels,f.expected)>=accuracy(before.pixels,f.expected));
  assert.ok(accuracy(after.pixels,f.expected)>.97,JSON.stringify(aligned));
  const flat=screenshotFixture(['#0599BA']);const none=recovery.alignGrid(flat.image,flat.rect,flat.width,flat.height,recovery.cellMask(flat.width,flat.height));
  assert.equal(none.improved,false);
});
test('template guide refinement improves a fractional offset without changing a featureless image',()=>{
  const paths=[[{x:2,y:2},{x:22,y:2},{x:22,y:7},{x:18,y:7},{x:22,y:16},{x:2,y:16},{x:6,y:7},{x:2,y:7},{x:2,y:2}]];
  const f=screenshotFixture(['#0599BA'],{paths,pitch:5.6}),field=recovery.guideField(f.image);
  const drift={...f.rect,x:f.rect.x+1.6,y:f.rect.y-.9};
  const result=recovery.refineGuide(field,paths,drift,f.width,f.height);
  assert.ok(result.improved);assert.ok(result.score>.35);
  assert.ok(Math.abs(result.rect.x-f.rect.x)<1.1,JSON.stringify(result));
  const blank={data:new Float32Array(f.image.width*f.image.height),width:f.image.width,height:f.image.height};
  assert.equal(recovery.refineGuide(blank,paths,drift,f.width,f.height).improved,false);
});
test('the import detector ranks the correct clothing outline among all supported presets',async()=>{
  const c=vm.createContext({console,setTimeout,clearTimeout,document:{getElementById:()=>({style:{}}),createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>c.fixtureImage})})}});
  for(const name of ['art-config','art-masks','art-pixelate','art-template-match','art-screenshot-recovery'])vm.runInContext(fs.readFileSync(new URL('../js/'+name+'.js',import.meta.url),'utf8'),c);
  vm.runInContext(fs.readFileSync(new URL('../js/art-screenshot-import.js',import.meta.url),'utf8').replace(/bindScreenshotImportControls\(\);\s*$/,''),c);
  const paths=vm.runInContext('PRESET_MASKS.t_shirt.default.maskLines',c);
  const f=screenshotFixture(colors.slice(0,3),{width:64,height:80,pitch:3.6,paths,lineWidth:1.5});
  assert.ok(f.image.width<=360 && f.image.height<=360);
  c.fixtureImage=f.image;
  await vm.runInContext(`ssiWorkingCanvas={width:fixtureImage.width,height:fixtureImage.height};ssiRunTemplateMatching();`,c);
  const best=vm.runInContext('ssiMatchResults[0]',c);
  assert.equal(best.frameId,'t_shirt');assert.ok(best.score>=.35,JSON.stringify(best));assert.equal(best.method,'guides');
});
test('JPEG-compressed screenshot-like cells recover against an independently encoded reference',async()=>{
  const {inflateSync}=await import('node:zlib');
  const f=JSON.parse(fs.readFileSync(new URL('fixtures/generated-screenshot-jpeg.json',import.meta.url),'utf8'));
  const data=new Uint8ClampedArray(inflateSync(Buffer.from(f.rgbaZlib,'base64')));
  const result=recovery.recover({width:f.imageWidth,height:f.imageHeight,data},f.rect,f.width,f.height);
  const expected=Array.from({length:f.width*f.height},(_,i)=>f.colors[i%f.colors.length]);
  const direct=recovery.recover({width:f.imageWidth,height:f.imageHeight,data},f.rect,f.width,f.height,{stabilizeColors:false});
  assert.ok(accuracy(result.pixels,expected)>.97,'decoded JPEG color accuracy: '+accuracy(result.pixels,expected));
  assert.ok(accuracy(result.pixels,expected)>accuracy(direct.pixels,expected));
});

test('color stabilization preserves an isolated nearly exact palette color beside a repeated color',()=>{
  const f=screenshotFixture(['#EF6E72'],{width:20,height:10,pitch:6});
  const rare=screenshotFixture(['#CA8483'],{width:20,height:10,pitch:6,noise:1});
  for(let y=0;y<f.image.height;y++)for(let x=0;x<f.image.width;x++){
    if(x>=f.rect.x+5*6&&x<f.rect.x+6*6&&y>=f.rect.y+5*6&&y<f.rect.y+6*6){
      const i=(y*f.image.width+x)*4;f.image.data.set(rare.image.data.slice(i,i+4),i);
    }
  }
  assert.equal(recovery.recover(f.image,f.rect,f.width,f.height).pixels[5*20+5],'#CA8483');
});
test('closing an import cancels matching without publishing stale candidates',async()=>{
  const c=vm.createContext({console,setTimeout,clearTimeout,document:{getElementById:()=>({style:{}}),createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>c.fixtureImage})})}});
  for(const name of ['art-config','art-masks','art-pixelate','art-template-match','art-screenshot-recovery'])vm.runInContext(fs.readFileSync(new URL('../js/'+name+'.js',import.meta.url),'utf8'),c);
  vm.runInContext(fs.readFileSync(new URL('../js/art-screenshot-import.js',import.meta.url),'utf8').replace(/bindScreenshotImportControls\(\);\s*$/,''),c);
  c.fixtureImage=screenshotFixture(colors,{width:10,height:10,pitch:4}).image;
  const running=vm.runInContext('ssiWorkingCanvas={width:fixtureImage.width,height:fixtureImage.height};ssiRunTemplateMatching()',c);
  vm.runInContext('closeScreenshotImportModal()',c);
  assert.equal(await running,false);assert.equal(vm.runInContext('ssiMatchResults.length',c),0);
});
