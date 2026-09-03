// js/build3d-scene.js
// 建築サポートページ（build.html）：3Dボクセル空間の描画専用モジュール。
// InstancedMesh 1個にボクセル全体をまとめて描画し（個々にMeshを作らない）、
// 手動オービットカメラ（ドラッグ回転／ホイール・ピンチでズーム）を持つ。
// js/build.jsからESモジュールとしてimportして使う。生成ロジック・保存等は
// 一切持たず、「渡されたボクセル配列を描画する」ことだけに責任を絞る。
import * as THREE from "./three.module.min.js";

// ハートピアの支柱建材は実際には1(幅)×1(奥行き)×2(高さ)で、幅・奥行きの
// 2倍の高さがある（参考にしたRibo's Game Labが前提とする1×1×1の立方体とは
// 異なる）。ボクセル1段＝実際の支柱1個ぶんの高さとして扱うため、高さ(Y)軸
// だけをこの倍率で描画することで、実際に建てたときと同じ縦横比になるように
// する（データ上のy座標そのものは段数のまま、描画時にだけ2倍の間隔を空ける）
const Y_UNIT_SCALE = 2;

// 低い壁は実寸で幅4×奥行き0.5×高さ2（支柱のような換算不要で、そのまま
// ワールド座標の単位として使う）
const WALL_PANEL_W = 4;
const WALL_PANEL_H = 2;
const WALL_PANEL_D = 0.5;

let canvasEl, stageEl, scene, camera, renderer, mesh, wallMesh, boundBox;
let blockGuide = null;
let floorGridDotted = null, floorGridBold = null;
let bounds = { w: 24, h: 24, d: 24 };
let camTheta = 0.9, camPhi = 1.05, camDist = 40;
// ズーム操作（ホイール・ピンチ）の許容範囲の基準値。表示中のコンテンツの
// 規模（支柱ボクセルの外接範囲 or 低い壁パネルの外接範囲）に合わせて
// fitToVoxels()/fitToWallSegments()の中で更新する（boundsは常にサイト最大値の
// ままなので、低い壁のようにboundsと無関係な実寸単位を使う描画にはそのまま
// 使えないため）
let cameraSpanBasis = 40;
const camTarget = new THREE.Vector3();
let dragging = false, lastX = 0, lastY = 0;
let downX = 0, downY = 0, downPointerId = null, movedDuringDrag = false;
let pinchStartDist = null;
let rafId = null;
let currentVoxels = [];
let editClickCallback = null;

function updateCamera(){
  const x = camTarget.x + camDist * Math.sin(camPhi) * Math.sin(camTheta);
  const y = camTarget.y + camDist * Math.cos(camPhi);
  const z = camTarget.z + camDist * Math.sin(camPhi) * Math.cos(camTheta);
  camera.position.set(x, y, z);
  camera.lookAt(camTarget);
}

// クリック（ドラッグせずに指/マウスを離した）とドラッグ回転を区別するための
// しきい値（px）。これ未満の移動量なら「編集クリック」とみなす
const CLICK_MOVE_THRESHOLD = 6;

function bindPointer(){
  canvasEl.addEventListener("pointerdown", (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    downX = e.clientX; downY = e.clientY; downPointerId = e.pointerId; movedDuringDrag = false;
    canvasEl.setPointerCapture(e.pointerId);
  });
  canvasEl.addEventListener("pointerup", (e) => {
    dragging = false;
    if(editClickCallback && e.pointerId === downPointerId && !movedDuringDrag){
      editClickCallback(raycastVoxelAt(e.clientX, e.clientY));
    }
    downPointerId = null;
  });
  canvasEl.addEventListener("pointercancel", () => { dragging = false; downPointerId = null; });
  canvasEl.addEventListener("pointermove", (e) => {
    if(!dragging) return;
    if(Math.hypot(e.clientX - downX, e.clientY - downY) > CLICK_MOVE_THRESHOLD) movedDuringDrag = true;
    camTheta -= (e.clientX - lastX) * 0.006;
    camPhi = Math.min(Math.max(camPhi - (e.clientY - lastY) * 0.006, 0.15), Math.PI - 0.15);
    lastX = e.clientX; lastY = e.clientY;
    updateCamera();
  });
  canvasEl.addEventListener("wheel", (e) => {
    e.preventDefault();
    camDist = clampDist(camDist + e.deltaY * 0.05 * (cameraSpanBasis / 40));
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
  return Math.min(Math.max(d, cameraSpanBasis * 0.15), cameraSpanBasis * 5);
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
  dir.position.set(dims.w * 0.6, dims.h * Y_UNIT_SCALE * 1.6, dims.d * 0.6);
  scene.add(dir);

  const renderedH = dims.h * Y_UNIT_SCALE;
  boundBox = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(dims.w, renderedH, dims.d)),
    new THREE.LineBasicMaterial({ color: 0x9a9284, transparent: true, opacity: 0.35 })
  );
  boundBox.position.set(0, renderedH / 2, 0);
  scene.add(boundBox);

  camTarget.set(0, renderedH * 0.35, 0);
  cameraSpanBasis = Math.max(dims.w, dims.d, renderedH, 8);
  camDist = cameraSpanBasis * 1.4;
  updateCamera();

  bindPointer();
  new ResizeObserver(() => resize()).observe(stageEl);
  resize();
  if(rafId == null) animate();
}

function disposeMesh(m){
  if(!m) return;
  scene.remove(m);
  m.geometry.dispose();
  m.material.dispose();
}

// voxels: [{x,y,z,hex}]（x:幅方向 0..bounds.w-1, y:高さ方向 0..bounds.h-1, z:奥行き方向 0..bounds.d-1）
// opts.fit: falseにすると外接範囲へのカメラ再フィットをスキップする
// （手動編集のたびに視点が飛ぶのを防ぐため、編集後の再描画ではfalseを渡す）
function setVoxels(voxels, opts = {}){
  disposeMesh(mesh);
  mesh = null;
  // モード切替直後など、低い壁の描画が残っていれば消す（両方同時に表示することはない）
  disposeMesh(wallMesh);
  wallMesh = null;
  currentVoxels = voxels;
  if(!voxels || voxels.length === 0) return;

  const geometry = new THREE.BoxGeometry(0.96, 0.96 * Y_UNIT_SCALE, 0.96);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.05 });
  mesh = new THREE.InstancedMesh(geometry, material, voxels.length);

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  voxels.forEach((v, i) => {
    dummy.position.set(v.x - bounds.w / 2 + 0.5, v.y * Y_UNIT_SCALE + Y_UNIT_SCALE / 2, v.z - bounds.d / 2 + 0.5);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    color.set(v.hex);
    mesh.setColorAt(i, color);
  });
  mesh.instanceMatrix.needsUpdate = true;
  if(mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);

  if(opts.fit !== false) fitToVoxels(voxels);
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
    ((minY + maxY) / 2) * Y_UNIT_SCALE + Y_UNIT_SCALE / 2,
    (minZ + maxZ) / 2 - bounds.d / 2 + 0.5
  );
  const span = Math.max(maxX - minX, maxZ - minZ, (maxY - minY) * Y_UNIT_SCALE, 4);
  cameraSpanBasis = span;
  camDist = clampDist(span * 1.7);
  updateCamera();
}

// 低い壁（壁画）モード専用の描画。低い壁は幅4×奥行き0.5×高さ2の実寸パネルで、
// 支柱のようなbounds/Y_UNIT_SCALE換算は不要（そのままワールド座標の単位として
// 使う）。手動編集・当たり判定（raycastVoxelAt）には未対応（このバージョンの
// 低い壁モードはペン/消しゴム編集を提供しないため）
// segments: [{x,y,hex}]（x:列 0..dims.w-1, y:行 0..dims.h-1、y=0が壁画の最下段）
// dims: {w,h}（低い壁モードの結果グリッドサイズ）
function setWallSegments(segments, dims, opts = {}){
  disposeMesh(wallMesh);
  wallMesh = null;
  disposeMesh(mesh);
  mesh = null;
  currentVoxels = [];
  if(!segments || segments.length === 0 || !dims) return;

  const geometry = new THREE.BoxGeometry(WALL_PANEL_W * 0.96, WALL_PANEL_H * 0.96, WALL_PANEL_D * 0.96);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.05 });
  wallMesh = new THREE.InstancedMesh(geometry, material, segments.length);

  const offX = (dims.w * WALL_PANEL_W) / 2;
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  segments.forEach((v, i) => {
    dummy.position.set(
      v.x * WALL_PANEL_W - offX + WALL_PANEL_W / 2,
      v.y * WALL_PANEL_H + WALL_PANEL_H / 2,
      0
    );
    dummy.updateMatrix();
    wallMesh.setMatrixAt(i, dummy.matrix);
    color.set(v.hex);
    wallMesh.setColorAt(i, color);
  });
  wallMesh.instanceMatrix.needsUpdate = true;
  if(wallMesh.instanceColor) wallMesh.instanceColor.needsUpdate = true;
  scene.add(wallMesh);

  if(opts.fit !== false) fitToWallSegments(segments, dims);
}

// 生成結果（低い壁）の外接範囲にカメラの注視点・距離を合わせる
function fitToWallSegments(segments, dims){
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  segments.forEach((v) => {
    if(v.x < minX) minX = v.x; if(v.x > maxX) maxX = v.x;
    if(v.y < minY) minY = v.y; if(v.y > maxY) maxY = v.y;
  });
  const offX = (dims.w * WALL_PANEL_W) / 2;
  camTarget.set(
    ((minX + maxX) / 2) * WALL_PANEL_W - offX + WALL_PANEL_W / 2,
    ((minY + maxY) / 2) * WALL_PANEL_H + WALL_PANEL_H / 2,
    0
  );
  const span = Math.max((maxX - minX + 1) * WALL_PANEL_W, (maxY - minY + 1) * WALL_PANEL_H, 4);
  cameraSpanBasis = span;
  camDist = clampDist(span * 1.4);
  updateCamera();
}

// solid/flatモードの外枠ワイヤーフレーム（サイト最大の建築可能範囲の目安）の
// 表示・非表示を切り替える。低い壁モードは単位系が全く異なる（ボクセル単位
// ではなく実寸4×0.5×2）ため、この枠は意味を持たず邪魔になるので隠す
function setBoundaryBoxVisible(visible){
  if(boundBox) boundBox.visible = visible;
}

// 画面上のクリック/タップ座標から、当たったボクセルを返す（編集機能用）。
// adjacent: クリックされた面の外側に隣接する、まだ何もない位置のグリッド座標
// （ペン工具で「既存の面に接する形で」新しいボクセルを置くために使う。
// インスタンスは平行移動のみで回転させていないため、面のローカル法線
// （BoxGeometryの軸に沿った±1ベクトル）がそのままワールド方向に一致する）
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
  const voxel = currentVoxels[hit[0].instanceId];
  const n = hit[0].face ? hit[0].face.normal : null;
  const adjacent = n && voxel
    ? { x: voxel.x + Math.round(n.x), y: voxel.y + Math.round(n.y), z: voxel.z + Math.round(n.z) }
    : null;
  return { instanceId: hit[0].instanceId, voxel, adjacent };
}

// キャンバス上での「ドラッグを伴わないクリック/タップ」1回ごとに呼ばれる
// コールバックを登録する。引数はraycastVoxelAt()と同じ形（何にも当たらなければnull）
function setEditClickCallback(fn){
  editClickCallback = fn;
}

function setBackgroundColor(hex){
  if(scene) scene.background = hex == null ? null : new THREE.Color(hex);
}

// 平面（床）モード向けの配置ガイド：床面（Y=0付近）にN マス区切りの
// 罫線を描画する。アートページの「10×10ブロック表示」に相当する機能で、
// 実際の建築を4×4/8×8/16×16等のブロック単位で計画しやすくする。
// blockSize: 区切りのマス数（0以下でガイド非表示）
// designDims: {w,d}（現在の設計の実サイズ。boundsは常にサイト最大値なので別途渡す）
// dark: ダークテーマかどうか（線の色をテーマに合わせて切り替える）
function setBlockGuide(blockSize, designDims, dark){
  if(blockGuide){
    scene.remove(blockGuide);
    blockGuide.geometry.dispose();
    blockGuide.material.dispose();
    blockGuide = null;
  }
  if(!blockSize || blockSize <= 0 || !designDims || !designDims.w || !designDims.d) return;

  const w = designDims.w, d = designDims.d;
  const offX = bounds.w / 2, offZ = bounds.d / 2;
  const y = 0.02; // 最下段ボクセルの底面よりわずかに下に描き、Zファイティングを避ける
  const positions = [];

  for(let x = 0; x <= w; x += blockSize){
    const wx = Math.min(x, w) - offX;
    positions.push(wx, y, -offZ, wx, y, d - offZ);
  }
  if(w % blockSize !== 0){
    const wx = w - offX;
    positions.push(wx, y, -offZ, wx, y, d - offZ);
  }
  for(let z = 0; z <= d; z += blockSize){
    const wz = Math.min(z, d) - offZ;
    positions.push(-offX, y, wz, w - offX, y, wz);
  }
  if(d % blockSize !== 0){
    const wz = d - offZ;
    positions.push(-offX, y, wz, w - offX, y, wz);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.LineBasicMaterial({
    color: dark ? 0xe8c93c : 0xb1503b,
    transparent: true,
    opacity: 0.8,
  });
  blockGuide = new THREE.LineSegments(geometry, material);
  scene.add(blockGuide);
}

function disposeFloorGrid(){
  if(floorGridDotted){
    scene.remove(floorGridDotted);
    floorGridDotted.geometry.dispose();
    floorGridDotted.material.dispose();
    floorGridDotted = null;
  }
  if(floorGridBold){
    scene.remove(floorGridBold);
    floorGridBold.traverse((obj) => { if(obj.geometry) obj.geometry.dispose(); });
    // グループ内の全メッシュが同じmaterialを共有しているので1回だけdisposeする
    if(floorGridBold.children[0]) floorGridBold.children[0].material.dispose();
    floorGridBold = null;
  }
}

// 底面のマス目（1×1点線・2×2太線）の実体を組み立てる共通処理。
// w,d: ワールド単位での床の幅・奥行き／offX,offZ: 中心を合わせるためのオフセット
// （呼び出し側のモードごとの座標系に応じて渡す。詳細はsetFloorGrid/
// setWallFloorGridのコメントを参照）
function buildFloorGridMeshes(w, d, offX, offZ, dark){
  const dottedColor = dark ? 0x9a9284 : 0xb0a795;
  const boldColor = dark ? 0xd8cba6 : 0x8a7554;

  // 1×1点線（2の倍数の位置は太線と重なるので除外する）
  const dottedPositions = [];
  for(let x = 0; x <= w; x++){
    if(x % 2 === 0) continue;
    const wx = x - offX;
    dottedPositions.push(wx, 0.012, -offZ, wx, 0.012, d - offZ);
  }
  for(let z = 0; z <= d; z++){
    if(z % 2 === 0) continue;
    const wz = z - offZ;
    dottedPositions.push(-offX, 0.012, wz, w - offX, 0.012, wz);
  }
  if(dottedPositions.length > 0){
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(dottedPositions, 3));
    const material = new THREE.LineDashedMaterial({
      color: dottedColor, dashSize: 0.22, gapSize: 0.18, transparent: true, opacity: 0.8,
    });
    floorGridDotted = new THREE.LineSegments(geometry, material);
    floorGridDotted.computeLineDistances(); // ダッシュ表示にはセグメントごとの距離計算が必須
    scene.add(floorGridDotted);
  }

  // 2×2太線：LineBasicMaterialのlinewidthは環境（ANGLE/OS）依存でほぼ効かない
  // ため、確実に太く見えるよう薄い板（Box）で代用する
  const BOLD_WIDTH = 0.07;
  const boldMaterial = new THREE.MeshBasicMaterial({ color: boldColor, transparent: true, opacity: 0.85 });
  floorGridBold = new THREE.Group();
  for(let x = 0; x <= w; x += 2){
    const wx = x - offX;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(BOLD_WIDTH, 0.01, d), boldMaterial);
    strip.position.set(wx, 0.018, d / 2 - offZ);
    floorGridBold.add(strip);
  }
  for(let z = 0; z <= d; z += 2){
    const wz = z - offZ;
    const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.01, BOLD_WIDTH), boldMaterial);
    strip.position.set(w / 2 - offX, 0.018, wz);
    floorGridBold.add(strip);
  }
  scene.add(floorGridBold);
}

// 3Dビューの底面（Y≈0の床面）に、1×1マスごとの点線と2×2マスごとの太線で
// マス目の目安を表示する（常時表示・トグルなし）。立体・平面モード用
// （支柱と同じ、サイト最大幅を中心とする座標系＝boundsを使う）。
// 低い壁モードは実寸単位系が異なるためsetWallFloorGrid()を使う
// designDims: {w,d}（現在の設計の外接サイズ。boundsは常にサイト最大値なので
// 　配置ガイド同様に別途渡す）
// dark: ダークテーマかどうか（線の色をテーマに合わせて切り替える）
function setFloorGrid(designDims, dark){
  disposeFloorGrid();
  if(!designDims || !designDims.w || !designDims.d) return;
  buildFloorGridMeshes(designDims.w, designDims.d, bounds.w / 2, bounds.d / 2, dark);
}

// 低い壁は実寸奥行きが0.5しかなく、そのままだと床マス目のZ方向がほぼ
// 潰れて見えなくなってしまうため、手前に少し伸ばした目安の奥行きを使う
// （壁の実寸ではなく、あくまで足元の位置確認用の参考グリッド）
const WALL_FLOOR_GRID_DEPTH = 4;

// 低い壁（壁画）モード用の床マス目。低い壁は幅4×奥行き0.5の実寸パネルで、
// setWallSegments()と同じ座標系（bounds非依存・低い壁自身の幅を中心にする）
// を使う必要があるため、setFloorGrid()とは別の入口にしている
// dims: {w}（低い壁モードの結果グリッドの列数）
function setWallFloorGrid(dims, dark){
  disposeFloorGrid();
  if(!dims || !dims.w) return;
  const worldW = dims.w * WALL_PANEL_W;
  buildFloorGridMeshes(worldW, WALL_FLOOR_GRID_DEPTH, worldW / 2, WALL_FLOOR_GRID_DEPTH / 2, dark);
}

function dispose(){
  if(rafId != null){ cancelAnimationFrame(rafId); rafId = null; }
  if(mesh){ mesh.geometry.dispose(); mesh.material.dispose(); mesh = null; }
  if(wallMesh){ wallMesh.geometry.dispose(); wallMesh.material.dispose(); wallMesh = null; }
  if(blockGuide){ blockGuide.geometry.dispose(); blockGuide.material.dispose(); blockGuide = null; }
  disposeFloorGrid();
  if(renderer) renderer.dispose();
}

export {
  init, setVoxels, setWallSegments, resize, raycastVoxelAt, setEditClickCallback,
  setBackgroundColor, setBlockGuide, setFloorGrid, setWallFloorGrid, setBoundaryBoxVisible, dispose,
};
