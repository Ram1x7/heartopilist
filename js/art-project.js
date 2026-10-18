// A project owns copies of every part; old single-part records remain readable.
(function(){
  'use strict';
  let frameId=null,parts={},histories={},revision=0,tabSignature='';
  const frame=()=>typeof activeFrameId==='undefined'?null:DESIGN_FRAME_PRESETS.find(f=>f.id===activeFrameId);
  function valid(part,definition){
    return !!part && part.width===definition.width && part.height===definition.height &&
      Array.isArray(part.pixelData) && part.pixelData.length===definition.width*definition.height &&
      part.pixelData.every(c=>c===null || /^#[0-9a-f]{6}$/i.test(c));
  }
  function copy(part){return {width:part.width,height:part.height,pixelData:part.pixelData.slice(),blockStatus:{...(part.blockStatus||{})},locked:!!part.locked};}
  function reset(record={}){
    frameId=typeof activeFrameId==='undefined'?null:activeFrameId;parts={};histories={};revision++;tabSignature='';
    const preset=frame();
    if(preset && record.frameId===frameId && record.parts && typeof record.parts==='object'){
      for(const definition of preset.parts)if(valid(record.parts[definition.id],definition))parts[definition.id]=copy(record.parts[definition.id]);
    }
  }
  function capture(){
    const preset=frame();if(!preset)return;
    if(frameId!==preset.id)reset();
    const definition=preset.parts.find(p=>p.id===activePartId);
    const current={width:gridWidth,height:gridHeight,pixelData:pixels,blockStatus,locked:isLocked};
    if(definition && valid(current,definition))parts[definition.id]=copy(current);
  }
  function snapshot(){capture();return Object.fromEntries(Object.entries(parts).map(([id,part])=>[id,copy(part)]));}
  function getPart(id){
    if(frameId!==activeFrameId)return null;
    if(id===activePartId)return {width:gridWidth,height:gridHeight,pixelData:pixels,blockStatus,locked:isLocked};
    return parts[id]||null;
  }
  function switchPart(id){
    const preset=frame(),definition=preset?.parts.find(p=>p.id===id);
    if(!definition || id===activePartId)return;
    capture();clearTimeout(saveTimer);cancelPendingTouchPaint();
    histories[activePartId]={undo:undoStack,redo:redoStack};
    const part=parts[id]||{width:definition.width,height:definition.height,pixelData:new Array(definition.width*definition.height).fill(null)};
    gridWidth=definition.width;gridHeight=definition.height;pixels=part.pixelData.slice();blockStatus={...(part.blockStatus||{})};
    activePartId=id;isLocked=!!part.locked;
    undoStack=histories[id]?.undo||[];redoStack=histories[id]?.redo||[];
    inspectedCell=null;highlightedColor=null;shapeStartCell=null;shapePreviewCells=null;guideLines=[];currentGuidePath=null;
    isDrawing=false;lastCell=null;activePointers.clear();pinchState=null;
    rebuildActiveMask();renderToolbar();renderCanvas();updateColorUsage();updateUndoRedoButtons();renderBlockList();renderLockUI();saveDraft();
  }
  function useDesign(id,design){
    const definition=frame()?.parts.find(p=>p.id===id);
    if(!definition || id===activePartId)return false;
    if(design && (design.frameId!==activeFrameId || design.partId!==id || !valid(design,definition)))return false;
    const previous=parts[id]||{width:definition.width,height:definition.height,pixelData:new Array(definition.width*definition.height).fill(null)};
    const undo=[...(histories[id]?.undo||[]),{width:previous.width,height:previous.height,pixels:previous.pixelData.slice()}].slice(-50);
    parts[id]=design?copy(design):{width:definition.width,height:definition.height,pixelData:new Array(definition.width*definition.height).fill(null),blockStatus:{},locked:false};
    histories[id]={undo,redo:[]};revision++;saveDraft();return true;
  }
  function renderTabs(){
    const host=document.getElementById('artPartTabs');if(!host)return;
    const preset=frame();host.hidden=!preset;
    if(!preset){tabSignature='';return;}
    const signature=JSON.stringify([preset.id,activePartId,revision]);if(signature===tabSignature)return;tabSignature=signature;
    host.replaceChildren();
    const help=document.createElement('p');help.textContent='パーツを切り替えて編集できます。「保存する」で全パーツをまとめて保存します。';host.append(help);
    const tabs=document.createElement('div');tabs.setAttribute('role','group');tabs.setAttribute('aria-label','編集するパーツ');
    for(const part of preset.parts){const button=document.createElement('button');button.type='button';button.textContent=part.name;button.setAttribute('aria-pressed',String(part.id===activePartId));button.addEventListener('click',()=>switchPart(part.id));tabs.append(button);}
    host.append(tabs);
  }
  window.HatopiArtProject={reset,capture,snapshot,getPart,switchPart,useDesign,renderTabs,valid};
})();
