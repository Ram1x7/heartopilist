// js/art-3d.js
// アイテム別プリセットの3Dプレビュー（検証段階：スウェットのみ対応）。
//
// ゲーム内の3Dアセットは一切使わない。既存のmaskLines（輪郭線データ、js/art-masks.js）は
// 「正面から見たときのシルエット（幅）」を決めるためだけに使い、奥行き方向の体積は
// 高さごとの楕円断面リングを積み重ねて生成する。フロント面とバック面を作って薄く
// つなぐ方式（板を曲げただけに見える）はやめ、最初から立体（横長の楕円〜カプセル状の
// 断面）として胴体・袖を組み立てる。
//
// 現段階ではまず形状の正しさを確認するため、テクスチャは使わずグレー一色の
// マテリアルで表示する。テクスチャ（UVマッピング）は、この形状で1着の服として
// 成立していることを確認できてから追加する。
//
// three.js本体は重いため、ページ読み込み時には読み込まず、3Dプレビューを実際に
// 開いた時だけCDNから遅延読み込みする（js/music-hum.jsのBasic Pitch読み込みと同じ方式）。
const THREE_ESM_URL = "https://cdn.jsdelivr.net/npm/three@0.179.1/+esm";
const THREE_ORBIT_CONTROLS_URL = "https://cdn.jsdelivr.net/npm/three@0.179.1/examples/jsm/controls/OrbitControls.js/+esm";

let threeLib = null;
let OrbitControlsClass = null;
let art3DRenderer = null;
let art3DScene = null;
let art3DCamera = null;
let art3DControls = null;
let art3DAnimHandle = null;
let art3DResizeObserver = null;
let art3DDisposables = []; // geometry/material/textureをまとめて破棄するため

// フロント型紙の右側輪郭を「高さ(ピクセルY)→半幅(中心からのピクセルX)」の折れ線として
// 持っておき、任意の高さでの胴体の半幅を線形補間で求める（実データから特定した値）。
// 肩(y=20)〜脇の下の曲がり角(y=48)までは半幅24（肩幅そのまま）、そこから脇の下の
// 一番外側(y=55)にかけて半幅30まで広がり、裾(y=80)まで半幅30のまま、という実際の
// テンプレートの形状に合わせている
const FRONT_WIDTH_PROFILE = [
  { y: 20, halfX: 24 },
  { y: 48, halfX: 24 },
  { y: 55, halfX: 30 },
  { y: 80, halfX: 30 },
];

// 襟ぐりの実際の開口幅（フロントの襟ぐりの凹みが(28,20)〜(52,20)の間にあることから、
// 中心からの半幅は(52-28)/2=12ピクセル）
const NECK_HOLE_HALF_X = 12;

function halfWidthAtPixelY(y){
  const profile = FRONT_WIDTH_PROFILE;
  if(y <= profile[0].y) return profile[0].halfX;
  if(y >= profile[profile.length - 1].y) return profile[profile.length - 1].halfX;
  for(let i = 0; i < profile.length - 1; i++){
    const a = profile[i], b = profile[i + 1];
    if(y >= a.y && y <= b.y){
      const t = (y - a.y) / (b.y - a.y || 1);
      return a.halfX + (b.halfX - a.halfX) * t;
    }
  }
  return profile[profile.length - 1].halfX;
}

const FRAME_3D_LAYOUTS = {
  sweatshirt: {
    scale: 1 / 16,
    cameraDistance: 8,
    torso: {
      // 肩のすぐ下〜裾までを何段の断面リングでたどるか（ピクセルY、実データの
      // 高さ範囲に合わせている）
      ringPixelYs: [22, 38, 52, 66, 80],
      segments: 24,
      depthMin: 0.32, // 肩・裾に近いところの前後の厚み
      depthMax: 0.55, // 胴の中央付近の前後の厚み（ここが最大になる）
      collarRaise: 0.4,
      collarShrink: 0.8,
    },
    sleeve: {
      segments: 20,
      ringCount: 6,
      length: 3.4,
      startHalfWidth: 0.5,
      startDepth: 0.42,
      cuffTaper: 0.68,
      axisRight: { x: 1, y: -0.32, z: 0.05 },
      axisLeft: { x: -1, y: -0.32, z: 0.05 },
    },
  },
};

function has3DPreview(frameId){
  return !!FRAME_3D_LAYOUTS[frameId];
}

// js/art-editor.jsのrebuildActiveMask()（activeFrameId/activePartIdが変わる箇所すべてで
// 呼ばれる）にフックして、3Dプレビューボタンの表示・非表示を同期する
function update3DPreviewButton(){
  const section = document.getElementById("art3DSection");
  if(!section) return;
  section.style.display = has3DPreview(activeFrameId) ? "" : "none";
}

async function ensureThreeLoaded(){
  if(threeLib) return;
  threeLib = await import(/* webpackIgnore: true */ THREE_ESM_URL);
  const controlsModule = await import(/* webpackIgnore: true */ THREE_ORBIT_CONTROLS_URL);
  OrbitControlsClass = controlsModule.OrbitControls;
}

// 保存済みデザイン一覧から、指定パーツの最新の保存データを探す（今はテクスチャ未使用
// だが、テクスチャ追加時にそのまま使えるよう残してある）
function findPixelDataForPart(frameId, partId){
  if(frameId === activeFrameId && partId === activePartId){
    return { pixelData: pixels, width: gridWidth, height: gridHeight };
  }
  const candidates = savedDesigns.filter(d => d.frameId === frameId && d.partId === partId);
  if(candidates.length === 0) return null;
  candidates.sort((a, b) => b.updatedAt - a.updatedAt);
  const d = candidates[0];
  return { pixelData: d.pixelData, width: d.width, height: d.height };
}

function pixelsToTextureCanvas(pixelData, w, h, fallbackColor){
  const cell = 6;
  const c = document.createElement("canvas");
  c.width = w * cell;
  c.height = h * cell;
  const tctx = c.getContext("2d");
  tctx.fillStyle = fallbackColor;
  tctx.fillRect(0, 0, c.width, c.height);
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const col = pixelData[y * w + x];
      if(col){
        tctx.fillStyle = col;
        tctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }
  return c;
}

function vlen(v){ return Math.hypot(v.x, v.y, v.z) || 1e-9; }
function vnorm(v){ const l = vlen(v); return { x: v.x / l, y: v.y / l, z: v.z / l }; }
function vcross(a, b){ return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
function vadd(a, b){ return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
function vscale(a, s){ return { x: a.x * s, y: a.y * s, z: a.z * s }; }

function pushTri(positions, p0, p1, p2){
  positions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
}

// 中心(center)・半幅(halfWidth、X方向)・奥行き(depth、Z方向)を持つ楕円形の断面リングを
// segments個の頂点で作る。X=身幅方向、Z=前後方向という胴体の座標系に合わせている
function buildEllipseRing(center, halfWidth, depth, segments){
  const ring = [];
  for(let k = 0; k < segments; k++){
    const angle = (k / segments) * Math.PI * 2;
    ring.push({
      x: center.x + halfWidth * Math.cos(angle),
      y: center.y,
      z: center.z + depth * Math.sin(angle),
    });
  }
  return ring;
}

// 隣接するリング同士（同じ頂点数であること）をクアッド面（三角形2枚）でつなぎ、
// 連続した筒状メッシュを作る。両端は開いたまま（キャップは別途capRing()で塞ぐ）
function lofteRings(positions, rings){
  for(let r = 0; r < rings.length - 1; r++){
    const ringA = rings[r], ringB = rings[r + 1];
    const K = ringA.length;
    for(let k = 0; k < K; k++){
      const k2 = (k + 1) % K;
      pushTri(positions, ringA[k], ringA[k2], ringB[k2]);
      pushTri(positions, ringA[k], ringB[k2], ringB[k]);
    }
  }
}

// 1つのリングを、その重心から放射状の三角形（ファン）で塞ぐ。裾の底面のように、
// 筒の端を閉じたい場合に使う。reverse=trueで面の表裏（法線の向き）を反転する
function capRing(positions, ring, reverse){
  let center = { x: 0, y: 0, z: 0 };
  ring.forEach(p => { center = vadd(center, p); });
  center = vscale(center, 1 / ring.length);
  const K = ring.length;
  for(let k = 0; k < K; k++){
    const k2 = (k + 1) % K;
    if(reverse) pushTri(positions, center, ring[k2], ring[k]);
    else pushTri(positions, center, ring[k], ring[k2]);
  }
}

// 胴体：肩のすぐ下から裾まで、高さごとの楕円断面リングを積み重ねてつなぎ、
// 「板を曲げたもの」ではなく最初から体積のある立体として作る。
// 正面から見たときのシルエット（各リングの半幅）は、実際のテンプレートの
// 輪郭幅（halfWidthAtPixelY）をそのまま使う。奥行き（前後の厚み）は、肩・裾に
// 近いところで薄く、胴の中央付近で最大になるよう独立したカーブで決める。
// 首元は、襟ぐりの実際の開口幅に合わせた小さな輪（neckHoleRing）から、少し
// 内側に縮めて持ち上げた輪（襟の自由端）へさらにロフトすることで、実際に
// 空洞が見えるリング状の立ち襟にする。裾は底面をふさいで閉じる
function buildTorsoGeometry(THREE, cfg, scale){
  const positions = [];
  const canvasH = 88; // フロント/バックのキャンバス高さ（両方とも80x88）
  const halfCanvasH = canvasH / 2;
  const toLocalY = pixelY => (halfCanvasH - pixelY) * scale;

  const shoulderPixelY = cfg.ringPixelYs[0];
  const shoulderY = toLocalY(shoulderPixelY);
  const neckHoleHalfWidth = NECK_HOLE_HALF_X * scale;

  const mainRings = cfg.ringPixelYs.map((pixelY, i) => {
    const y = toLocalY(pixelY);
    const halfWidth = halfWidthAtPixelY(pixelY) * scale;
    const t = cfg.ringPixelYs.length > 1 ? i / (cfg.ringPixelYs.length - 1) : 0;
    const depth = cfg.depthMin + (cfg.depthMax - cfg.depthMin) * Math.sin(Math.PI * t);
    return buildEllipseRing({ x: 0, y, z: 0 }, halfWidth, depth, cfg.segments);
  });

  const neckOuter = buildEllipseRing({ x: 0, y: shoulderY, z: 0 }, neckHoleHalfWidth, neckHoleHalfWidth * 0.6, cfg.segments);
  const neckInner = buildEllipseRing(
    { x: 0, y: shoulderY + cfg.collarRaise, z: 0 },
    neckHoleHalfWidth * cfg.collarShrink,
    neckHoleHalfWidth * 0.6 * cfg.collarShrink,
    cfg.segments
  );

  // 首の内側リング（立ち襟の自由端）→襟ぐりの開口→肩→…→裾、という順に全部つなげる。
  // 首の内側リングの先（さらに上）は開いたまま＝実際に空洞として見える
  const allRings = [neckInner, neckOuter, ...mainRings];
  lofteRings(positions, allRings);
  capRing(positions, mainRings[mainRings.length - 1], false); // 裾の底面を閉じる

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return { geometry, shoulderY };
}

// 袖：肩から袖口まで、高さ（腕の軸方向の距離）ごとの楕円断面リングを積み重ねて
// 連続した筒状メッシュにする。円ではなく楕円断面にし、肩から袖口に向かって
// 少しずつ細くする。腕は重力でわずかに下に垂れているような角度（axisDir）にする。
// 付け根は胴体の肩の高さ・幅に合わせた位置に置き、めり込ませることで隙間なく
// 接続する（頂点そのものを完全に共有する溶接までは行っていない）
function buildSleeveGeometry(THREE, cfg, originCenter, axisDir){
  const axis = vnorm(axisDir);
  const worldUp = { x: 0, y: 1, z: 0 };
  let basisV = vcross(axis, worldUp);
  if(vlen(basisV) < 1e-6) basisV = { x: 0, y: 0, z: 1 };
  basisV = vnorm(basisV);
  const basisU = vnorm(vcross(basisV, axis));

  const rings = [];
  for(let i = 0; i < cfg.ringCount; i++){
    const t = cfg.ringCount > 1 ? i / (cfg.ringCount - 1) : 0;
    const dist = cfg.length * t;
    const taper = 1 - (1 - cfg.cuffTaper) * t;
    const center = vadd(originCenter, vscale(axis, dist));
    const ring = [];
    for(let k = 0; k < cfg.segments; k++){
      const angle = (k / cfg.segments) * Math.PI * 2;
      const u = cfg.startHalfWidth * taper * Math.cos(angle);
      const v = cfg.startDepth * taper * Math.sin(angle);
      ring.push(vadd(center, vadd(vscale(basisU, u), vscale(basisV, v))));
    }
    rings.push(ring);
  }

  const positions = [];
  lofteRings(positions, rings);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

// スウェット1着分の立体をTHREE.Groupとして組み立てる（現段階はテクスチャなし、
// グレー一色）。胴体は高さごとの楕円断面リングを積み重ねた1つの立体、首元は
// 実際に空洞のあるリング状の立ち襟、袖は肩から袖口まで楕円断面が連続する筒
function buildSweatshirtGroup(THREE){
  const cfg = FRAME_3D_LAYOUTS.sweatshirt;
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0xbfbab0, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
  art3DDisposables.push(material);

  const { geometry: torsoGeometry, shoulderY } = buildTorsoGeometry(THREE, cfg.torso, cfg.scale);
  art3DDisposables.push(torsoGeometry);
  group.add(new THREE.Mesh(torsoGeometry, material));

  const shoulderHalfWidth = halfWidthAtPixelY(cfg.torso.ringPixelYs[0]) * cfg.scale;
  [
    { sign: 1, axis: cfg.sleeve.axisRight },
    { sign: -1, axis: cfg.sleeve.axisLeft },
  ].forEach(side => {
    // 肩リングの側面（角度0＝右／角度180度＝左に相当する点）のすぐ内側に袖の
    // 付け根を置くことで、胴体の表面と重なり合い、隙間ができないようにする
    const originCenter = { x: side.sign * shoulderHalfWidth * 0.85, y: shoulderY - 0.15, z: 0 };
    const sleeveGeometry = buildSleeveGeometry(THREE, cfg.sleeve, originCenter, side.axis);
    art3DDisposables.push(sleeveGeometry);
    group.add(new THREE.Mesh(sleeveGeometry, material));
  });

  return group;
}

async function open3DPreview(){
  if(!has3DPreview(activeFrameId)) return;
  document.getElementById("art3DModal").style.display = "block";
  const loading = document.getElementById("art3DLoading");
  if(loading){ loading.style.display = "block"; loading.textContent = T("art_3d_preview_loading", "読み込み中…"); }

  try{
    await ensureThreeLoaded();
  }catch(e){
    if(loading) loading.textContent = T("art_3d_preview_load_error", "読み込みに失敗しました。電波の良い場所でもう一度お試しください");
    return;
  }

  const THREE = threeLib;
  const host = document.getElementById("art3DHost");
  if(loading) loading.style.display = "none";

  dispose3DScene(); // 前回開いた分が残っていれば先に片付ける

  const layout = FRAME_3D_LAYOUTS[activeFrameId];
  art3DScene = new THREE.Scene();

  const width = host.clientWidth, height = host.clientHeight;
  art3DCamera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  art3DCamera.position.set(0, 0.5, layout.cameraDistance || 6);

  art3DRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  art3DRenderer.setSize(width, height);
  art3DRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  host.appendChild(art3DRenderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  const dir = new THREE.DirectionalLight(0xffffff, 0.85);
  dir.position.set(3, 5, 4);
  art3DScene.add(ambient, dir);

  if(activeFrameId === "sweatshirt"){
    art3DScene.add(buildSweatshirtGroup(THREE));
  }

  art3DControls = new OrbitControlsClass(art3DCamera, art3DRenderer.domElement);
  art3DControls.enableDamping = true;
  art3DControls.dampingFactor = 0.08;
  art3DControls.enablePan = false;
  art3DControls.minDistance = 2;
  art3DControls.maxDistance = 14;
  art3DControls.saveState();

  const animate = () => {
    art3DAnimHandle = requestAnimationFrame(animate);
    art3DControls.update();
    art3DRenderer.render(art3DScene, art3DCamera);
  };
  animate();

  art3DResizeObserver = new ResizeObserver(() => {
    if(!art3DRenderer || !host.clientWidth || !host.clientHeight) return;
    art3DCamera.aspect = host.clientWidth / host.clientHeight;
    art3DCamera.updateProjectionMatrix();
    art3DRenderer.setSize(host.clientWidth, host.clientHeight);
  });
  art3DResizeObserver.observe(host);
}

function reset3DView(){
  if(art3DControls) art3DControls.reset();
}

function dispose3DScene(){
  if(art3DAnimHandle) cancelAnimationFrame(art3DAnimHandle);
  art3DAnimHandle = null;
  if(art3DResizeObserver) art3DResizeObserver.disconnect();
  art3DResizeObserver = null;
  if(art3DControls) art3DControls.dispose();
  art3DControls = null;
  art3DDisposables.forEach(d => { if(d && typeof d.dispose === "function") d.dispose(); });
  art3DDisposables = [];
  if(art3DRenderer){
    art3DRenderer.dispose();
    if(art3DRenderer.domElement && art3DRenderer.domElement.parentNode){
      art3DRenderer.domElement.parentNode.removeChild(art3DRenderer.domElement);
    }
  }
  art3DRenderer = null;
  art3DScene = null;
  art3DCamera = null;
}

function close3DPreview(){
  document.getElementById("art3DModal").style.display = "none";
  dispose3DScene();
}

function bind3DPreviewControls(){
  const btn = document.getElementById("art3DPreviewBtn");
  if(btn) btn.addEventListener("click", open3DPreview);
  const resetBtn = document.getElementById("art3DResetBtn");
  if(resetBtn) resetBtn.addEventListener("click", reset3DView);
}

bind3DPreviewControls();
update3DPreviewButton(); // このスクリプトの読み込み前にinitArtEditor()が既に実行されているため、初回分をここで反映する
