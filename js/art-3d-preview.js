import * as THREE from './vendor/three/three.module.min.js';
import { buildGarment } from './art-3d-models/garment.js';
import { polygonMask, nearestInside } from './art-3d-models/pattern-helpers.js';

let stylesheetPromise;
export function loadPreviewStyles() {
  if(stylesheetPromise) return stylesheetPromise;
  const href=new URL('../css/art-preview-panel.css?v=1',import.meta.url).href;
  stylesheetPromise=new Promise((resolve,reject)=>{
    let link=Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(item=>item.href===href);
    if(link?.sheet){resolve();return;}
    const fresh=!link;
    if(fresh){link=document.createElement('link');link.rel='stylesheet';link.href=href;}
    link.addEventListener('load',resolve,{once:true});
    link.addEventListener('error',()=>{link.remove();stylesheetPromise=null;reject(new Error('Preview stylesheet unavailable'));},{once:true});
    if(fresh)document.head.append(link);
  });
  return stylesheetPromise;
}

// One viewer per editor, no writes to browser storage or source pixel arrays.
export function openPreview(bridge, onClose) {
  const dialog=document.createElement('dialog');
  dialog.className='hatopi-preview'; dialog.setAttribute('aria-labelledby','hatopi-preview-title');
  dialog.innerHTML=`<header class="hatopi-preview-header"><div><span class="hatopi-preview-tag" data-item-name></span><h2 id="hatopi-preview-title" tabindex="-1">3Dプレビュー</h2></div><button type="button" data-close aria-label="3Dプレビューを閉じる">閉じる <span aria-hidden="true">×</span></button></header>
    <div class="hatopi-preview-body"><section class="hatopi-preview-viewer" aria-label="仕上がりを確認"><div class="hatopi-preview-stage"><p class="hatopi-preview-status" role="status">立体モデルを読み込んでいます…</p></div>
    <p class="hatopi-preview-caption">指やマウスで動かして、向きを変えられます</p><div class="hatopi-preview-directions" aria-label="見る方向"><button type="button" data-view="front">正面</button><button type="button" data-view="back">背面</button><button type="button" data-view="left">左側</button><button type="button" data-view="right">右側</button></div><div class="hatopi-preview-tools"><button type="button" data-view="reset">向きを戻す</button><button type="button" data-auto aria-pressed="false">自動で回す</button><button type="button" data-color aria-pressed="false">色を確認</button></div></section>
    <section class="hatopi-preview-settings" aria-labelledby="hatopi-preview-parts-title"><header><h3 id="hatopi-preview-parts-title">使うデザイン</h3><p>編集中の面は、そのまま表示されます。<br>ほかの面は保存したデザインから選べます。</p></header><div class="hatopi-preview-parts"></div><p class="hatopi-preview-hint">選んでも、保存したデザインは変更されません。</p></section></div>
    <details class="hatopi-preview-note"><summary>表示について</summary><p>デザインを選んでいない面と、塗っていないマスは白で表示します。「色を確認」を押すと、陰影を外して配色を見られます。形や柄の位置は目安です。ゲーム内の着用姿とは異なる場合があります。</p></details>`;
  dialog.querySelector('[data-item-name]').textContent=bridge.title||'Tシャツ';
  document.body.append(dialog); dialog.showModal();
  dialog.querySelector('h2').focus({preventScroll:true});
  const stage=dialog.querySelector('.hatopi-preview-stage'),status=dialog.querySelector('.hatopi-preview-status');
  const options=dialog.querySelector('.hatopi-preview-parts'), selections={},selects={};
  const abort=new AbortController(), signal=abort.signal;
  let renderer=null, scene=null, camera=null, model=null, observer=null;
  let closed=false, raf=0, pending=false, auto=false, color=false, lastTime=0;
  let surfaces=[], oldPixels={}, rememberedRole=null, modelGeometry=null, modelMesh=null, bump=null;
  let drag=null;
  const listen=(target,event,fn)=>target.addEventListener(event,fn,{signal});
  const error=message=>{ status.textContent=message;status.setAttribute('role','alert'); };
  for(const [role,definition] of Object.entries(bridge.roles)) {
    const label=document.createElement('label');label.append(document.createTextNode(definition.label));
    const select=document.createElement('select');select.setAttribute('aria-label',definition.label);
    label.append(select); options.append(label); selects[role]=select;
    listen(select,'change',()=>{selections[role]=select.value;requestUpdate();});
  }
  function rebuildChoices() {
    const active=bridge.activeRole();
    for(const role of Object.keys(bridge.roles)) {
      const select=selects[role],value=selections[role]||'';
      const candidates=bridge.candidates(role);
      const entries=role===active?[{id:'',name:'編集中のデザイン'}]:[{id:'',name:'白のまま（未設定）'},...candidates];
      // Avoid resetting focus / selected option while drawing.
      const signature=JSON.stringify([active,entries]);
      if(select.dataset.signature!==signature) {
        select.replaceChildren(...entries.map(entry=>new Option(entry.name,entry.id)));
        select.dataset.signature=signature;
      }
      select.disabled=role===active;
      select.value=entries.some(entry=>entry.id===value)?value:'';
      if(role!==active) selections[role]=select.value;
    }
    if(active!==rememberedRole) { rememberedRole=active; oldPixels={}; }
  }
  function makeTexture(part) {
    const canvas=document.createElement('canvas');canvas.width=part.width;canvas.height=part.height;
    const ctx=canvas.getContext('2d');
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;
    texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
    const rawCanvas=document.createElement('canvas');rawCanvas.width=part.width;rawCanvas.height=part.height;
    const rawctx=rawCanvas.getContext('2d'),rawTexture=new THREE.CanvasTexture(rawCanvas);
    rawTexture.colorSpace=THREE.SRGBColorSpace;rawTexture.magFilter=THREE.NearestFilter;
    rawTexture.minFilter=THREE.NearestFilter;rawTexture.generateMipmaps=false;
    const mask=new Uint8Array(part.width*part.height);
    for(const path of part.maskLines) polygonMask(path,part.width,part.height).forEach((value,index)=>{mask[index]|=value;});
    return {canvas,ctx,texture,rawCanvas,rawctx,rawTexture,mask,nearest:nearestInside(mask,part.width,part.height)};
  }
  function writeTexture(target,part) {
    const {ctx,canvas,texture}=target;
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
    if(part.pixels) for(let i=0;i<part.pixels.length;i++) if(part.pixels[i]) {
      ctx.fillStyle=part.pixels[i];ctx.fillRect(i%part.width,Math.floor(i/part.width),1,1);
    }
    // Extend the visible pattern into its margins so UV edges do not pick up white.
    const image=ctx.getImageData(0,0,part.width,part.height);
    const counts=new Map();let dominant='#ffffff',maxCount=0;
    for(let i=0;i<target.mask.length;i++) {
      if(target.mask[i]) {
        const hex=part.pixels?.[i]||'#ffffff',count=(counts.get(hex)||0)+1;
        counts.set(hex,count);if(count>maxCount){maxCount=count;dominant=hex;}
      } else if(target.nearest[i]>=0) image.data.set(image.data.subarray(target.nearest[i]*4,target.nearest[i]*4+4),i*4);
    }
    ctx.putImageData(image,0,0);
    if(target.colorSample){const [x,y]=target.colorSample;const sample=part.pixels?.[Math.min(part.height-1,Math.floor(y*part.height))*part.width+Math.min(part.width-1,Math.floor(x*part.width))];ctx.fillStyle=sample||'#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);}
    else if(target.lining){ctx.fillStyle=dominant;ctx.fillRect(0,0,canvas.width,canvas.height);}
    target.rawctx.drawImage(canvas,0,0);target.rawTexture.needsUpdate=true;
    ctx.globalAlpha=.18;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1;
    texture.needsUpdate=true;
  }
  function changed(role,pixels) {
    const old=oldPixels[role];
    if(old===null && pixels===null) return false;
    if(!old || !pixels || old.length!==pixels.length) return true;
    for(let i=0;i<pixels.length;i++) if(old[i]!==pixels[i]) return true;
    return false;
  }
  function sync() {
    if(closed) return;
    rebuildChoices();
    const parts=bridge.snapshot(selections);
    if(!parts) { close();return; }
    if(!renderer) return;
    const changedRoles=new Set(Object.keys(parts).filter(role=>changed(role,parts[role].pixels)));
    for(const surface of surfaces) if(changedRoles.has(surface.role)) {
      writeTexture(surface,parts[surface.role]);
    }
    for(const role of changedRoles)oldPixels[role]=parts[role].pixels?.slice()||null;
  }
  function draw(time=0) {
    raf=0;if(closed || document.hidden || !renderer) return;
    if(pending) {pending=false;sync();}
    if(auto && lastTime) model.rotation.y+=Math.min(50,time-lastTime)*.00035;
    lastTime=time;renderer.render(scene,camera);
    if(auto) schedule();
  }
  function schedule() { if(!closed && !document.hidden && !raf) raf=requestAnimationFrame(draw); }
  function requestUpdate() {pending=true;schedule();}
  function setAuto(value) {
    auto=value;lastTime=0;const button=dialog.querySelector('[data-auto]');button.setAttribute('aria-pressed',String(auto));button.textContent=auto?'自動回転を止める':'自動で回す';schedule();
  }
  function close() {
    if(closed) return;closed=true;abort.abort();cancelAnimationFrame(raf);observer?.disconnect();
    if(renderer) {
      surfaces.forEach(s=>{s.texture.dispose();s.rawTexture.dispose();s.basic.dispose();s.cloth.dispose();});
      modelGeometry?.dispose();bump?.dispose();
      renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
    }
    dialog.close();dialog.remove();onClose();
  }
  listen(dialog.querySelector('[data-close]'),'click',close);
  listen(dialog,'cancel',event=>{event.preventDefault();close();});
  listen(dialog,'click',event=>{if(event.target===dialog) close();});
  listen(document,'visibilitychange',()=>{cancelAnimationFrame(raf);raf=0;lastTime=0;if(!document.hidden)schedule();});
  listen(dialog.querySelector('[data-auto]'),'click',()=>setAuto(!auto));
  listen(dialog.querySelector('[data-color]'),'click',()=>{
    color=!color;const button=dialog.querySelector('[data-color]');button.setAttribute('aria-pressed',String(color));button.textContent=color?'陰影を戻す':'色を確認';
    if(modelMesh)modelMesh.material=surfaces.map(s=>color?s.basic:s.cloth);schedule();
  });
  dialog.querySelectorAll('[data-view]').forEach(button=>listen(button,'click',()=>{
    if(!model) return;setAuto(false);
    const angles={front:0,back:Math.PI,left:-Math.PI/2,right:Math.PI/2,reset:-.25};
    model.rotation.set(.15,angles[button.dataset.view],0);schedule();
  }));
  try {
    rebuildChoices();const parts=bridge.snapshot(selections);
    if(!parts) {close();return {close,update:requestUpdate};}
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.NoToneMapping;
    scene=new THREE.Scene();model=new THREE.Group();model.rotation.set(.15,-.25,0);scene.add(model);
    scene.add(new THREE.AmbientLight(0xffffff,.55*Math.PI));
    const light=new THREE.DirectionalLight(0xffffff,.65*Math.PI);light.position.set(.9,.8,1);scene.add(light);
    const rearLight=new THREE.DirectionalLight(0xffffff,.18*Math.PI);rearLight.position.set(-.5,-.3,-1);scene.add(rearLight);
    camera=new THREE.PerspectiveCamera(20,1,.01,100);camera.position.set(0,0,4);
    const clothCanvas=document.createElement('canvas');clothCanvas.width=clothCanvas.height=32;
    const clothCtx=clothCanvas.getContext('2d'),clothPixels=clothCtx.createImageData(32,32);
    for(let y=0;y<32;y++)for(let x=0;x<32;x++){
      const shade=Math.round(128+32*Math.sin(x*Math.PI/4)*Math.sin(y*Math.PI/4));
      clothPixels.data.set([shade,shade,shade,255],(y*32+x)*4);
    }
    clothCtx.putImageData(clothPixels,0,0);bump=new THREE.CanvasTexture(clothCanvas);
    bump.wrapS=bump.wrapT=THREE.RepeatWrapping;bump.repeat.set(32,64);
    const built=buildGarment(THREE,parts,bridge.kind||'tshirt');modelGeometry=built.geometry;
    modelGeometry.computeBoundingBox();const center=modelGeometry.boundingBox.getCenter(new THREE.Vector3());
    modelGeometry.translate(-center.x,-center.y,-center.z);modelGeometry.computeBoundingSphere();
    const side=['tshirt','tank','sweatshirt','shoes','maryJane'].includes(bridge.kind||'tshirt')?THREE.FrontSide:THREE.DoubleSide;
    for(const {role,fabricLining,colorSample} of built.groups) {
      const target=makeTexture(parts[role]);
      const basic=new THREE.MeshBasicMaterial({map:target.rawTexture,side,toneMapped:false});
      const cloth=new THREE.MeshStandardMaterial({map:target.texture,side,roughness:.94,metalness:0,bumpMap:bump,bumpScale:.0001});
      surfaces.push({role,...target,basic,cloth,lining:!!fabricLining,colorSample});
    }
    modelMesh=new THREE.Mesh(modelGeometry,surfaces.map(s=>s.cloth));model.add(modelMesh);
    const canvas=renderer.domElement;
    canvas.setAttribute('aria-label',(bridge.title||'Tシャツ')+'。ドラッグまたは矢印キーで回転');canvas.tabIndex=0;
    stage.append(canvas);
    listen(canvas,'pointerdown',event=>{
      if(drag || !event.isPrimary) return;setAuto(false);
      drag={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);
    });
    listen(canvas,'pointermove',event=>{
      if(!drag || drag.id!==event.pointerId) return;
      model.rotation.y+=(event.clientX-drag.x)*.01;
      model.rotation.x=Math.max(-1.3,Math.min(1.3,model.rotation.x+(event.clientY-drag.y)*.01));
      drag.x=event.clientX;drag.y=event.clientY;schedule();
    });
    const release=event=>{if(drag?.id===event.pointerId){drag=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);}};
    listen(canvas,'pointerup',release);listen(canvas,'pointercancel',release);listen(canvas,'lostpointercapture',()=>{drag=null;});
    listen(canvas,'keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) return;
      event.preventDefault();event.stopPropagation();setAuto(false);
      if(event.key==='ArrowLeft')model.rotation.y-=.15;if(event.key==='ArrowRight')model.rotation.y+=.15;
      if(event.key==='ArrowUp')model.rotation.x=Math.max(-1.3,model.rotation.x-.15);
      if(event.key==='ArrowDown')model.rotation.x=Math.min(1.3,model.rotation.x+.15);schedule();
    });
    listen(canvas,'webglcontextlost',event=>{event.preventDefault();setAuto(false);error('3D表示が中断されました。一度閉じて開き直してください。2D編集は続けられます。');});
    observer=new ResizeObserver(()=>{
      const w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight);
      renderer.setSize(w,h);camera.aspect=w/h;
      const halfAngle=Math.min(camera.fov*Math.PI/360,Math.atan(Math.tan(camera.fov*Math.PI/360)*camera.aspect));
      camera.position.z=modelGeometry.boundingSphere.radius/(Math.sin(halfAngle)*.91);
      camera.updateProjectionMatrix();schedule();
    });observer.observe(stage);
    status.textContent='';sync();schedule();
  } catch(error_) {
    console.warn('3D preview unavailable',error_);
    error('この環境では3Dを表示できません。閉じると2D編集を続けられます。');
  }
  return {close,update:requestUpdate};
}
