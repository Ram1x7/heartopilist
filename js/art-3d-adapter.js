// Connect the item project to the lazy 3D panel. Saved parts are copied explicitly.
(function(){
  'use strict';
  const catalog={
    t_shirt:['tshirt',['front','back','sleeve','sleeveR']],tank_top:['tank',['front','back']],
    mini_skirt:['skirt',['front','back']],shorts:['shorts',['front','back']],
    bucket_hat:['bucketHat',['front','back','top']],sweatshirt:['sweatshirt',['front','back','sleeve']],
    pants:['pants',['front','back']],dress:['dress',['front','back','inner']],cap:['cap',['front','back','top']],
    shoes:['shoes',['front','back','top']],mary_jane:['maryJane',['front','top']],
    book:['book',['front','wide']],single_bed:['single_bed',['front','back']],double_bed:['double_bed',['front','back']],
    closet:['closet',['front']],nightstand:['nightstand',['front']],table_lamp:['table_lamp',['front','back','top']],
    chair:['chair',['front','back','top']],low_table:['low_table',['front']],double_sofa:['double_sofa',['front','back']],
    single_sofa:['single_sofa',['front','back']],floor_lamp:['floor_lamp',['front','back','top']]
  };
  let viewer=null,opening=false,generation=0,openedKey=null;
  const button=document.getElementById('art3DOpenBtn');
  const project=()=>window.HatopiArtProject;
  function configuration(){
    if(typeof activeFrameId==='undefined' || !catalog[activeFrameId])return null;
    const frame=DESIGN_FRAME_PRESETS.find(f=>f.id===activeFrameId);if(!frame)return null;
    const [kind,names]=catalog[frame.id];
    return {frame,kind,roles:Object.fromEntries(frame.parts.map((p,i)=>[names[i],{id:p.id,label:p.name,width:p.width,height:p.height}]))};
  }
  function available(){const c=configuration();return !!c && Object.values(c.roles).some(r=>r.id===activePartId);}
  function modelKey(){return activeFrameId+(activeFrameId==='book'?':'+activePartId:'');}
  function activeRole(){const roles=configuration().roles;return Object.keys(roles).find(key=>roles[key].id===activePartId);}
  function savedPart(design,definition){
    if(design.frameId!==activeFrameId)return null;
    const part=design.parts?.[definition.id]||(design.partId===definition.id?design:null);
    return project().valid(part,definition)?{...part,frameId:activeFrameId,partId:definition.id}:null;
  }
  const bridge={
    get roles(){return configuration().roles;},get kind(){return configuration().kind;},get title(){return configuration().frame.name;},
    get simplified(){return configuration().frame.category!=='clothes';},activeRole,
    candidates(role){const definition=configuration().roles[role];return savedDesigns.filter(d=>savedPart(d,definition)).map(d=>({id:d.id,name:d.name||'デザイン'}));},
    hasPart(role){return !!project().getPart(configuration().roles[role].id);},
    switchPart(role){project().switchPart(configuration().roles[role].id);},
    useDesign(role,id){
      const definition=configuration().roles[role],design=savedDesigns.find(d=>d.id===id);
      if(id && !design)return false;
      const source=design?savedPart(design,definition):null;if(design && !source)return false;
      const result=project().useDesign(definition.id,source);
      if(result && viewer)viewer.update();return result;
    },
    snapshot(){
      if(!available() || (openedKey && openedKey!==modelKey()))return null;
      return Object.fromEntries(Object.entries(configuration().roles).map(([key,definition])=>{
        const part=project().getPart(definition.id),mask=PRESET_MASKS[activeFrameId][definition.id];
        return [key,{width:definition.width,height:definition.height,pixels:part?.pixelData||null,maskLines:mask.maskLines}];
      }));
    }
  };
  function refresh(){
    button.hidden=!available();
    if(!available() || (openedKey && openedKey!==modelKey())){generation++;viewer?.close();viewer=null;openedKey=null;return;}
    viewer?.update();
  }
  button.addEventListener('click',async()=>{
    if(viewer){viewer.close();return;}
    if(opening || !available())return;
    opening=true;button.disabled=true;const ticket=++generation,key=modelKey();
    try{
      const {openPreview,loadPreviewStyles}=await import('./art-3d-preview.js?v=7');await loadPreviewStyles();
      if(ticket!==generation || !available() || key!==modelKey())return;
      openedKey=key;button.setAttribute('aria-expanded','true');
      viewer=openPreview(bridge,()=>{viewer=null;openedKey=null;button.setAttribute('aria-expanded','false');});
    }catch(error){console.warn('3D preview could not be loaded',error);openedKey=null;showToast('3Dを読み込めませんでした。オンラインで開き直してください。');}
    finally{opening=false;button.disabled=false;}
  });
  window.HatopiArt3D=Object.freeze({refresh});
})();
