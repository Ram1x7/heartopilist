// js/build3d-scene.js
// 建築サポートページ（build.html）：3Dボクセル空間の描画専用モジュール。
// InstancedMesh 1個にボクセル全体をまとめて描画し（個々にMeshを作らない）、
// 手動オービットカメラ（ドラッグ回転／ホイール・ピンチでズーム）を持つ。
// js/build.jsからESモジュールとしてimportして使う。生成ロジック・保存等は
// 一切持たず、「渡されたボクセル配列を描画する」ことだけに責任を絞る。
import * as THREE from "./three.module.min.js";

let canvasEl, stageEl, scene, camera, renderer, mesh;
let bounds = { w: 24, h: 24, d: 24 };
let camTheta = 0.9, camPhi = 1.05, camDist = 40;
const camTarget = new THREE.Vector3();
let dragging = false, lastX = 0, lastY = 0;
let pinchStartDist = null;
let rafId = null;
let currentVoxels = [];

function updateCamera(){
  const x = camTarget.x + camDist * Math.sin(camPhi) * Math.sin(camTheta);
  const y = camTarget.y + camDist * Math.cos(camPhi);
  const z = camTarget.z + camDist * Math.sin(camPhi) * Math.cos(camTheta);
  camera.position.set(x, y, z);
  camera.lookAt(camTarget);
}

function bindPointer(){
  canvasEl.addEventListener("pointerdown", (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvasEl.setPointerCapture(e.pointerId);
  });
  canvasEl.addEventListener("pointerup", () => { dragging = false; });
  canvasEl.addEventListener("pointercancel", () => { dragging = false; });
  canvasEl.addEventListener("pointermove", (e) => {
    if(!dragging) return;
    camTheta -= (e.clientX - lastX) * 0.006;
    camPhi = Math.min(Math.max(camPhi - (e.clientY - lastY) * 0.006, 0.15), Math.PI - 0.15);
    lastX = e.clientX; lastY = e.clientY;
    updateCamera();
  });
  canvasEl.addEventListener("wheel", (e) => {
    e.preventDefault();
    const span = Math.max(bounds.w, bounds.d, bounds.h, 8);
    camDist = clampDist(camDist + e.deltaY * 0.05 * (span / 40));
    updateCamera();
  }, { passive: false });

  // 2本指ピンチズーム（モバイル）
  canvasEl.addEventListener("touchstart", (e) => {
    if(e.touches.length === 2){
      pinchStartDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    }
  }, { passive: true });
  canvasEl.addEventListener("touchmove", (e) => {
    if(e.touches.length === 2 && pinchStartDist != null){
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      camDist = clampDist(camDist + (pinchStartDist - d) * 0.3);
      pinchStartDist = d;
      updateCamera();
    }
  }, { passive: true });
  canvasEl.addEventListener("touchend", () => { pinchStartDist = null; });
}

function clampDist(d){
  const span = Math.max(bounds.w, bounds.d, bounds.h, 8);
  return Math.min(Math.max(d, span * 0.15), span * 5);
}

function resize(){
  if(!stageEl || !renderer) return;
  const w = stageEl.clientWidth, h = stageEl.clientHeight;
  if(w === 0 || h === 0) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

function animate(){
  rafId = requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// canvas: <canvas>要素。dims: {w,h,d}（ボクセル座標での外枠サイズ、表示用の目安）
function init(canvas, dims){
  canvasEl = canvas;
  stageEl = canvas.parentElement;
  bounds = dims;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 3000);
  renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const dir = new THREE.DirectionalLight(0xffffff, 0.85);
  dir.position.set(dims.w * 0.6, dims.h * 1.6, dims.d * 0.6);
  scene.add(dir);

  const boundBox = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(dims.w, dims.h, dims.d)),
    new THREE.LineBasicMaterial({ color: 0x9a9284, transparent: true, opacity: 0.35 })
  );
  boundBox.position.set(0, dims.h / 2, 0);
  scene.add(boundBox);

  camTarget.set(0, dims.h * 0.35, 0);
  camDist = Math.max(dims.w, dims.d, dims.h, 8) * 1.4;
  updateCamera();

  bindPointer();
  new ResizeObserver(() => resize()).observe(stageEl);
  resize();
  if(rafId == null) animate();
}

// voxels: [{x,y,z,hex}]（x:幅方向 0..bounds.w-1, y:高さ方向 0..bounds.h-1, z:奥行き方向 0..bounds.d-1）
function setVoxels(voxels){
  if(mesh){
    scene.remove(mesh);
    mesh.geometry.dispose();
    mesh.material.dispose();
    mesh = null;
  }
  currentVoxels = voxels;
  if(!voxels || voxels.length === 0) return;

  const geometry = new THREE.BoxGeometry(0.96, 0.96, 0.96);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.05 });
  mesh = new THREE.InstancedMesh(geometry, material, voxels.length);

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  voxels.forEach((v, i) => {
    dummy.position.set(v.x - bounds.w / 2 + 0.5, v.y + 0.5, v.z - bounds.d / 2 + 0.5);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    color.set(v.hex);
    mesh.setColorAt(i, color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if(mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);

  fitToVoxels(voxels);
}

// 生成結果の外接範囲にカメラの注視点・距離を合わせる
function fitToVoxels(voxels){
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
  voxels.forEach((v) => {
    if(v.x < minX) minX = v.x; if(v.x > maxX) maxX = v.x;
    if(v.y < minY) minY = v.y; if(v.y > maxY) maxY = v.y;
    if(v.z < minZ) minZ = v.z; if(v.z > maxZ) maxZ = v.z;
  });
  camTarget.set(
    (minX + maxX) / 2 - bounds.w / 2 + 0.5,
    (minY + maxY) / 2 + 0.5,
    (minZ + maxZ) / 2 - bounds.d / 2 + 0.5
  );
  const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ, 4);
  camDist = clampDist(span * 1.7);
  updateCamera();
}

// 画面上のクリック/タップ座標から、当たったボクセルを返す（今後の編集機能用）
function raycastVoxelAt(clientX, clientY){
  if(!mesh) return null;
  const rect = canvasEl.getBoundingClientRect();
  const ndc = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObject(mesh);
  if(!hit.length) return null;
  return { instanceId: hit[0].instanceId, voxel: currentVoxels[hit[0].instanceId] };
}

function setBackgroundColor(hex){
  if(scene) scene.background = hex == null ? null : new THREE.Color(hex);
}

function dispose(){
  if(rafId != null){ cancelAnimationFrame(rafId); rafId = null; }
  if(mesh){ mesh.geometry.dispose(); mesh.material.dispose(); mesh = null; }
  if(renderer) renderer.dispose();
}

export { init, setVoxels, resize, raycastVoxelAt, setBackgroundColor, dispose };
