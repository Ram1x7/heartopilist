import * as THREE from './vendor/three/three.module.min.js';
import { buildTshirt } from './art-3d-models/tshirt.js';

// One viewer per editor, no writes to browser storage or source pixel arrays.
export function openPreview(bridge, onClose) {
  const dialog=document.createElement('dialog');
  dialog.className='art3d-dialog'; dialog.setAttribute('aria-labelledby','art3d-title');
  dialog.innerHTML=`<header class="art3d-header"><h2 id="art3d-title">Tシャツの3Dプレビュー</h2><button type="button" data-close aria-label="3Dプレビューを閉じる">閉じる</button></header>
    <div class="art3d-body"><div><div class="art3d-stage" role="img" aria-label="Tシャツの立体表示。ドラッグで回転できます"><p class="art3d-status" role="status">3Dを準備しています…</p></div>
    <div class="art3d-directions" aria-label="表示する方向"><button type="button" data-view="front">前</button><button type="button" data-view="back">後</button><button type="button" data-view="left">左</button><button type="button" data-view="right">右</button><button type="button" data-view="reset">初期位置</button></div></div>
    <div class="art3d-options"><div class="art3d-controls"><button type="button" data-color aria-pressed="false">色確認</button> <button type="button" data-auto aria-pressed="false">自動回転</button></div></div></div>
    <p class="art3d-note">ドラッグで回転できます。未設定の面・未着色のマスは白で表示します。形状と柄の位置は目安です。ゲーム内の着用姿とは異なる場合があります。</p>`;
  document.body.append(dialog); dialog.showModal();
  const stage=dialog.querySelector('.art3d-stage'),status=dialog.querySelector('.art3d-status');
  const options=dialog.querySelector('.art3d-options'), selections={},selects={};
  const abort=new AbortController(), signal=abort.signal;
  let renderer=null, scene=null, camera=null, model=null, observer=null;
  let closed=false, raf=0, pending=false, auto=false, color=false, lastTime=0;
  let surfaces=[], oldPixels={}, rememberedRole=null;
  let drag=null;
  const listen=(target,event,fn)=>target.addEventListener(event,fn,{signal});
  const error=message=>{ status.textContent=message;status.setAttribute('role','alert'); };
  for(const [role,definition] of Object.entries(bridge.roles)) {
    const label=document.createElement('label');label.append(document.createTextNode(definition.label));
    const select=document.createElement('select');select.setAttribute('aria-label',definition.label+'のデザイン');
    label.append(select); options.append(label); selects[role]=select;
    listen(select,'change',()=>{selections[role]=select.value;requestUpdate();});
  }
  function rebuildChoices() {
    const active=bridge.activeRole();
    for(const role of Object.keys(bridge.roles)) {
      const select=selects[role],value=selections[role]||'';
      const candidates=bridge.candidates(role);
      const entries=role===active?[{id:'',name:'編集中の内容（未保存も反映）'}]:[{id:'',name:'未設定（白）'},...candidates];
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
    return {canvas,ctx,texture};
  }
  function writeTexture(target,part) {
    const {ctx,canvas,texture}=target;
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
    if(part.pixels) for(let i=0;i<part.pixels.length;i++) if(part.pixels[i]) {
      ctx.fillStyle=part.pixels[i];ctx.fillRect(i%part.width,Math.floor(i/part.width),1,1);
    }
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
    for(const surface of surfaces) if(changed(surface.role,parts[surface.role].pixels)) {
      writeTexture(surface,parts[surface.role]);
      oldPixels[surface.role]=parts[surface.role].pixels?.slice()||null;
    }
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
    auto=value;lastTime=0;dialog.querySelector('[data-auto]').setAttribute('aria-pressed',String(auto));schedule();
  }
  function close() {
    if(closed) return;closed=true;abort.abort();cancelAnimationFrame(raf);observer?.disconnect();
    if(renderer) {
      surfaces.forEach(s=>{s.geometry.dispose();s.texture.dispose();s.basic.dispose();s.cloth.dispose();});
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
    color=!color;dialog.querySelector('[data-color]').setAttribute('aria-pressed',String(color));
    surfaces.forEach(s=>{s.mesh.material=color?s.basic:s.cloth;});schedule();
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
    scene.add(new THREE.AmbientLight(0xffffff,1.8));
    const light=new THREE.DirectionalLight(0xffffff,2);light.position.set(1,2,3);scene.add(light);
    camera=new THREE.PerspectiveCamera(28,1,.01,20);camera.position.set(0,0,3.3);
    for(const {role,geometry} of buildTshirt(THREE,parts)) {
      const target=makeTexture(parts[role]);
      const basic=new THREE.MeshBasicMaterial({map:target.texture,side:THREE.DoubleSide,toneMapped:false});
      const cloth=new THREE.MeshStandardMaterial({map:target.texture,side:THREE.DoubleSide,roughness:.95,metalness:0});
      const mesh=new THREE.Mesh(geometry,cloth);model.add(mesh);
      surfaces.push({role,geometry,...target,basic,cloth,mesh});
    }
    const canvas=renderer.domElement;
    canvas.setAttribute('aria-label','ドラッグでTシャツを回転');canvas.tabIndex=0;
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
      camera.position.z=Math.max(2.5,1.35/(camera.aspect*Math.tan(camera.fov*Math.PI/360))*.55);
      camera.updateProjectionMatrix();schedule();
    });observer.observe(stage);
    status.textContent='';sync();schedule();
  } catch(error_) {
    console.warn('3D preview unavailable',error_);
    error('この環境では3Dを表示できません。閉じると2D編集を続けられます。');
  }
  return {close,update:requestUpdate};
}
