import test from 'node:test';
import assert from 'node:assert/strict';
import {capturePreviewPng} from '../js/art-3d-export.js';
function harness(fail=false){
  let width=400,height=200,ratio=1.5,frame=0,snapshot;
  const renderer={domElement:{frame:0},getSize:v=>v.set(width,height),getPixelRatio:()=>ratio,setPixelRatio:r=>ratio=r,setSize(w,h){width=w;height=h;},render(){this.domElement.frame=++frame;}};
  const canvas={getContext:()=>({drawImage(image){snapshot={frame:image.frame,width:canvas.width,height:canvas.height};if(fail)throw Error('copy failed');}}),toBlob(callback,type){queueMicrotask(()=>callback(new Blob([JSON.stringify(snapshot)],{type})));}};
  return {renderer,canvas,get state(){return {width,height,ratio};}};
}
test('PNG export captures a fresh high-resolution frame and restores preview size before encoding completes',async()=>{
  const h=harness(),pending=capturePreviewPng(h.renderer,{}, {},()=>h.canvas);
  assert.deepEqual(h.state,{width:400,height:200,ratio:1.5});
  const blob=await pending;assert.equal(blob.type,'image/png');
  assert.deepEqual(JSON.parse(await blob.text()),{frame:1,width:1600,height:800});
});
test('failed capture and null PNG output are reported and leave preview size intact',async()=>{
  const h=harness(true);assert.throws(()=>capturePreviewPng(h.renderer,{}, {},()=>h.canvas));assert.deepEqual(h.state,{width:400,height:200,ratio:1.5});
  const other=harness();other.canvas.toBlob=callback=>callback(null);
  await assert.rejects(capturePreviewPng(other.renderer,{}, {},()=>other.canvas));assert.deepEqual(other.state,{width:400,height:200,ratio:1.5});
});
