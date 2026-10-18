import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const source=file=>fs.readFileSync(new URL(file,root),'utf8');
function editor(){
  const storage=new Map(),messages=[];let quota=false;
  const elements=new Map();
  const node=()=>({style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},addEventListener(){},getContext(){return {};}});
  const c=vm.createContext({console,URL,URLSearchParams,setTimeout,clearTimeout,requestAnimationFrame(){},prompt:()=> 'まとめた作品',confirm:()=>true,
    T:(key,text)=>text,showToast:m=>messages.push(m),location:{search:'',href:'https://example.test/art-create.html'},history:{replaceState(){}},
    document:{getElementById:id=>{if(!elements.has(id))elements.set(id,node());return elements.get(id);},addEventListener(){},body:node()},
    window:{addEventListener(){}},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>{if(quota)throw Error('quota');storage.set(key,value);}}});
  for(const f of ['js/art-config.js','js/art-masks.js','js/lz-string.min.js','js/art-share-code.js','js/art-project.js'])vm.runInContext(source(f),c);
  vm.runInContext(source('js/art-editor.js').replace(/\ninitArtEditor\(\);\s*$/,''),c);
  c.showToast=m=>messages.push(m);
  vm.runInContext(`for(const name of ['rebuildActiveMask','renderToolbar','renderCanvas','updateColorUsage','updateUndoRedoButtons','renderBlockList','renderLockUI','closeMyDesignsModal'])eval(name+' = function(){}');`,c);
  function activate(id,index=0){vm.runInContext(`{const f=DESIGN_FRAME_PRESETS.find(f=>f.id===${JSON.stringify(id)}),p=f.parts[${index}];activeFrameId=f.id;activePartId=p.id;gridWidth=p.width;gridHeight=p.height;pixels=new Array(p.width*p.height).fill(null);blockStatus={};currentDesignId=null;isLocked=false;window.HatopiArtProject.reset();}`,c);}
  return {c,storage,messages,activate,quota:value=>quota=value,run:code=>vm.runInContext(code,c)};
}
test('part switching preserves paint, per-part undo, progress, locks, draft and saved project',()=>{
  const e=editor();e.activate('t_shirt');
  e.run(`pixels[1000]='#EF6E72';blockStatus={'0,0':2};undoStack=[{marker:1}];isLocked=true;window.HatopiArtProject.switchPart('canvas-1777194719606');`);
  assert.equal(e.run('pixels[1000]'),null);assert.equal(e.run('isLocked'),false);
  e.run(`pixels[1000]='#0599BA';saveDraft();window.HatopiArtProject.switchPart('default');`);
  assert.equal(e.run('pixels[1000]'),'#EF6E72');assert.equal(e.run('undoStack[0].marker'),1);assert.equal(e.run('isLocked'),true);
  assert.equal(e.run("blockStatus['0,0']"),2);
  e.run('saveCurrentAsDesign()');
  const saved=JSON.parse(e.storage.get('hatopiArt_savedDesigns'));assert.equal(saved.length,1);
  assert.equal(saved[0].parts['canvas-1777194719606'].pixelData[1000],'#0599BA');
  const firstId=saved[0].id;
  e.run(`window.HatopiArtProject.switchPart('canvas-1777194719606');pixels[1001]='#EF6E72';saveCurrentAsDesign();`);
  const next=JSON.parse(e.storage.get('hatopiArt_savedDesigns'));assert.equal(next.length,1);assert.equal(next[0].id,firstId);
  assert.equal(next[0].parts.default.pixelData[1000],'#EF6E72');
  const draft=JSON.parse(e.storage.get('hatopiArt_currentDraft'));assert.equal(Object.keys(draft.parts).length,2);
  e.activate('pants');e.run(`loadDesign(${JSON.stringify(firstId)});window.HatopiArtProject.switchPart('default');`);
  assert.equal(e.run('pixels[1000]'),'#EF6E72');assert.equal(e.run('activeFrameId'),'t_shirt');
});
test('legacy records open without absorbing another project and saved-part imports own a copy',()=>{
  const e=editor();e.activate('t_shirt');e.run(`pixels[0]='#EF6E72';saveCurrentAsDesign();`);
  e.run(`savedDesigns.push({id:'legacy',frameId:'tank_top',partId:'default',width:64,height:64,pixelData:new Array(4096).fill('#0599BA')});loadDesign('legacy');saveDraft();`);
  assert.deepEqual(Object.keys(JSON.parse(e.storage.get('hatopiArt_currentDraft')).parts),['default']);
  e.run(`window.HatopiArtProject.switchPart('canvas-1777279606554');`);
  assert.equal(e.run('pixels[0]'),null);
  e.run(`window.HatopiArtProject.switchPart('default');window.HatopiArtProject.useDesign('canvas-1777279606554',{frameId:'tank_top',partId:'canvas-1777279606554',width:64,height:64,pixelData:savedDesigns.find(d=>d.id==='legacy').pixelData});window.HatopiArtProject.switchPart('canvas-1777279606554');pixels[0]='#EF6E72';`);
  assert.equal(e.run("savedDesigns.find(d=>d.id==='legacy').pixelData[0]"),'#0599BA');
  assert.equal(e.run("window.HatopiArtProject.useDesign('default',{frameId:'pants',partId:'default',width:64,height:64,pixelData:new Array(4096).fill(null)})"),false);
});
test('failed storage writes preserve the last saved record and report failure instead of success',()=>{
  const e=editor();e.activate('t_shirt');e.run(`pixels[0]='#EF6E72';saveCurrentAsDesign();`);
  const previous=e.storage.get('hatopiArt_savedDesigns');e.messages.length=0;e.quota(true);
  e.run(`pixels[0]='#0599BA';saveCurrentAsDesign();saveDraft();saveDraft();`);
  assert.equal(e.storage.get('hatopiArt_savedDesigns'),previous);
  assert.equal(e.run('savedDesigns[0].pixelData[0]'),'#EF6E72');
  assert.ok(e.messages.some(m=>m.includes('保存できませんでした')));assert.ok(!e.messages.includes('更新しました'));
  assert.equal(e.messages.filter(m=>m.includes('下書き')).length,1);
});
test('version-1 codes still decode and project codes retain every part with strict validation',()=>{
  const e=editor();e.activate('t_shirt');
  e.run(`pixels[0]='#EF6E72';window.HatopiArtProject.switchPart('canvas-1777194719606');pixels[0]='#0599BA';
    var single=encodeDesignToShareCode({width:gridWidth,height:gridHeight,pixelData:pixels,frameId:activeFrameId,partId:activePartId,name:'旧形式'});
    var code=encodeDesignToShareCode({width:gridWidth,height:gridHeight,pixelData:pixels,frameId:activeFrameId,partId:activePartId,name:'一着',parts:window.HatopiArtProject.snapshot()});
    var result=decodeShareCode(code);`);
  assert.equal(e.run('decodeShareCode(single).name'),'旧形式');
  assert.equal(e.run('result.parts.default.pixelData[0]'),'#EF6E72');
  assert.equal(e.run("result.parts['canvas-1777194719606'].pixelData[0]"),'#0599BA');
  e.run('applyImportedDesign(result)');assert.equal(e.run('Object.keys(window.HatopiArtProject.snapshot()).length'),2);
  e.run(`function wrap(value){const b=LZString.compressToEncodedURIComponent(JSON.stringify(value));return b+'.'+shareChecksum(b);}
    var bad=wrap([2,'t_shirt',activePartId,'bad',[[activePartId,single],[activePartId,single]]]);`);
  assert.ok(e.run('decodeShareCode(bad).error'));
  assert.ok(e.run("decodeShareCode(wrap([2,'pants',activePartId,'bad',[[activePartId,single]]])).error"));
  assert.ok(e.run("decodeShareCode(wrap([2,'t_shirt',activePartId,'nested',[[activePartId,code]]])).error"));
});
