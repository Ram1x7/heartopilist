// js/art-3d.js
// アイテム別プリセットの3Dプレビュー（検証段階：スウェットのみ対応）。
//
// ゲーム内の3Dアセットは一切使わない。既存のmaskLines（輪郭線データ、js/art-masks.js）を
// 「1着の服を組み立てるための2D型紙」として扱い、フロント・バックの輪郭を頂点レベルで
// 直接つなぎ合わせた1つの立体として服を構築する。板（PlaneGeometry/ShapeGeometryを
// そのまま使った平面）を並べる方式は使わない。頂点・法線・インデックスはすべて
// BufferGeometryとして自前で組み立てる。
//
// 現段階ではまず形状の正しさを確認するため、テクスチャは使わず白一色のマテリアルで
// 表示する。テクスチャ（UVマッピング）は、白いモデルで1着の服として成立している
// ことを確認できてから追加する。
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

// スウェット本体の輪郭（maskLines）のうち、各部位がどのインデックス範囲にあたるかを
// 実データから特定した固定値。フロント・バックとも同じ順番（肩L→襟ぐり→肩R→
// 右脇の下→脇〜裾→裾→脇〜裾→左脇の下、を1周）でたどれるようにしてある。
// armholeR/armholeLは、肩・脇の中間点・脇の下という3点の並び（肩→脇の下の向き）。
// この3点はそのまま袖の付け根（肩リング）としても使うため、本体側と袖側で
// 同じ座標を共有する（別々に配置し直さない＝隙間ができない）
const BODY_LANDMARKS = {
  front: {
    shoulderL: 0, neckStart: 1, neckEnd: 9, shoulderR: 10,
    armholeR: [10, 11, 12], sideHemR: [12, 13], hem: [13, 14],
    sideHemL: [14, 15], armholeL: [15, 16, 0],
  },
  back: {
    shoulderL: 0, neckStart: 1, neckEnd: 7, shoulderR: 8,
    armholeR: [8, 9, 10], sideHemR: [10, 11, 12], hem: [12, 13],
    sideHemL: [13, 14, 15], armholeL: [15, 16, 0],
  },
};

// 襟ぐりの分割点数（フロント9点・バック7点なので、共通の点数にそろえる）。
// 脇〜裾の分割点数（フロント2点・バック3点なので、同じくそろえる）
const NECK_RESAMPLE = 9;
const SIDE_HEM_RESAMPLE = 3;

const FRAME_3D_LAYOUTS = {
  sweatshirt: {
    scale: 1 / 16,
    depth: 0.1,
    cameraDistance: 7.5,
    front: { partId: "default" },
    back: { partId: "canvas-1777618043251" },
    collarRaise: 0.35,
    collarShrink: 0.85,
    hemLipRaise: 0.15,
    hemLipShrink: 0.9,
    sleeve: {
      distances: [0, 0.8, 1.6, 2.4, 3.2],
      taper: [1, 0.95, 0.85, 0.78, 0.7],
      blend: [0, 0.3, 0.55, 0.8, 1.0],
      targetRy: 0.55,
      targetRz: 0.42,
      axisRight: { x: 1, y: -0.22, z: 0.08 },
      axisLeft: { x: -1, y: -0.22, z: 0.08 },
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

// maskLinesの1点（キャンバスのマス座標）を3D空間のローカル座標(x,y)に変換する
function localizePath(path, w, h, scale){
  return path.map(pt => ({
    x: (pt.x - w / 2) * scale,
    y: (h / 2 - pt.y) * scale, // マス座標は下向きが正のため、3D空間の上向きに反転する
  }));
}

// 開いた折れ線（ループしない）を、弧長に沿ってn個の点へ均等に再分割する。
// 元の点数とnが同じ場合は、余計な補間による誤差を避けるためそのまま返す
function resampleOpenPoints(pts, n){
  if(pts.length === n) return pts.map(p => ({ x: p.x, y: p.y }));
  const segLens = [];
  let total = 0;
  for(let i = 0; i < pts.length - 1; i++){
    const d = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    segLens.push(d);
    total += d;
  }
  const out = [];
  for(let k = 0; k < n; k++){
    const target = n > 1 ? total * k / (n - 1) : 0;
    let acc = 0, i = 0;
    while(i < segLens.length - 1 && acc + segLens[i] < target){ acc += segLens[i]; i++; }
    const a = pts[i], b = pts[i + 1] || pts[i];
    const segLen = segLens[i] || 1e-9;
    const t = Math.min(1, Math.max(0, (target - acc) / segLen));
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
}

// 本体輪郭（フロントまたはバック）を、肩L→襟ぐり→肩R→右脇の下→脇〜裾→裾→
// 脇〜裾→左脇の下、の順に1周ぶんの点列としてつなげる。境界の点が前後の区間で
// 重複しないよう、区間の先頭点は（直前の区間の末尾と同じであるため）省く
function buildBodyPerimeter(localPts, landmarks){
  const ordered = [];
  const push = pts => { pts.forEach(p => ordered.push(p)); };

  push([localPts[landmarks.shoulderL]]);
  push(resampleOpenPoints(localPts.slice(landmarks.neckStart, landmarks.neckEnd + 1), NECK_RESAMPLE));
  push([localPts[landmarks.shoulderR]]);

  const armR = landmarks.armholeR.map(i => localPts[i]); // 肩→中間→脇の下
  push(armR.slice(1));

  const sideHemR = resampleOpenPoints(landmarks.sideHemR.map(i => localPts[i]), SIDE_HEM_RESAMPLE);
  push(sideHemR.slice(1));

  push([localPts[landmarks.hem[1]]]);

  const sideHemL = resampleOpenPoints(landmarks.sideHemL.map(i => localPts[i]), SIDE_HEM_RESAMPLE);
  push(sideHemL.slice(1));

  const armL = landmarks.armholeL.map(i => localPts[i]); // 脇の下→中間→肩（肩は次の周でordered[0]と重複するため含めない）
  push(armL.slice(1, -1));

  return ordered;
}

function pushTri(positions, p0, p1, p2){
  positions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
}

// フロントとバックの輪郭（同じ点数になるようbuildBodyPerimeter()で揃えてある）を
// 直接つなぎ合わせて1つの胴体メッシュを組み立てる（frontCap＋backCap＋側面）。
// 右脇・左脇の付け根部分（armholeR/armholeLの3点）は、袖の付け根リングと同じ座標を
// 共有するため、ここで新たに点を作り直したりはしない
function buildTorsoGeometry(THREE, frontRing, backRing){
  const N = frontRing.length;
  const positions = [];

  const frontContour = frontRing.map(p => new THREE.Vector2(p.x, p.y));
  THREE.ShapeUtils.triangulateShape(frontContour, []).forEach(([i0, i1, i2]) => {
    pushTri(positions, frontRing[i0], frontRing[i1], frontRing[i2]);
  });

  const backContour = backRing.map(p => new THREE.Vector2(p.x, p.y));
  THREE.ShapeUtils.triangulateShape(backContour, []).forEach(([i0, i1, i2]) => {
    // バック側は法線が-Z側を向くよう、頂点順序を反転する
    pushTri(positions, backRing[i0], backRing[i2], backRing[i1]);
  });

  for(let i = 0; i < N; i++){
    const j = (i + 1) % N;
    const f0 = frontRing[i], f1 = frontRing[j], b0 = backRing[i], b1 = backRing[j];
    pushTri(positions, f0, f1, b1);
    pushTri(positions, f0, b1, b0);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

// 隣接するリング同士をクアッド面（三角形2枚）でつなぎ、連続した筒状メッシュを作る。
// 両端は開いたまま（キャップは付けない＝首穴・袖口は実際に空洞として見える）
function buildTubeGeometry(THREE, rings){
  const positions = [];
  const K = rings[0].length;
  for(let r = 0; r < rings.length - 1; r++){
    const ringA = rings[r], ringB = rings[r + 1];
    for(let k = 0; k < K; k++){
      const k2 = (k + 1) % K;
      const a0 = ringA[k], a1 = ringA[k2], b0 = ringB[k], b1 = ringB[k2];
      pushTri(positions, a0, a1, b1);
      pushTri(positions, a0, b1, b0);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function vlen(v){ return Math.hypot(v.x, v.y, v.z) || 1e-9; }
function vnorm(v){ const l = vlen(v); return { x: v.x / l, y: v.y / l, z: v.z / l }; }
function vcross(a, b){ return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x }; }
function vdot(a, b){ return a.x * b.x + a.y * b.y + a.z * b.z; }
function vsub(a, b){ return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
function vadd(a, b){ return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
function vscale(a, s){ return { x: a.x * s, y: a.y * s, z: a.z * s }; }

// 肩の付け根リング（armholeHex、本体の脇の下データと同じ座標＝共有頂点）を出発点に、
// 腕の軸方向にリングを並べていく。各リングは、肩リングの実際の（左右非対称な）形から、
// 少しずつ「平たい断面の楕円」に近づけていく（完全な円筒にはしない）。
// 角度（atan2）を基準にブレンドすることで、リングがねじれないようにしている
function buildSleeveRings(armholeHex, cfg, axisDir){
  const axis = vnorm(axisDir);
  const worldUp = { x: 0, y: 1, z: 0 };
  let basisV = vcross(axis, worldUp);
  if(vlen(basisV) < 1e-6) basisV = { x: 0, y: 0, z: 1 };
  basisV = vnorm(basisV);
  const basisU = vnorm(vcross(basisV, axis));

  let center0 = { x: 0, y: 0, z: 0 };
  armholeHex.forEach(p => { center0 = vadd(center0, p); });
  center0 = vscale(center0, 1 / armholeHex.length);

  const baseOffsets = armholeHex.map(p => {
    const d = vsub(p, center0);
    const u = vdot(d, basisU);
    const v = vdot(d, basisV);
    return { u, v, angle: Math.atan2(v, u) };
  });

  return cfg.distances.map((dist, ringIdx) => {
    if(ringIdx === 0){
      // 肩の付け根リング（本体のarmholeR/armholeLと共有する頂点）はそのまま返す。
      // ここで（u,v）平面へ射影して作り直すと、軸方向の成分が失われて元の座標から
      // ずれてしまい、本体側との溶接（隙間なし）が崩れてしまうため
      return armholeHex.map(p => ({ x: p.x, y: p.y, z: p.z }));
    }
    const center = vadd(center0, vscale(axis, dist));
    const t = cfg.blend[ringIdx];
    const tp = cfg.taper[ringIdx];
    return baseOffsets.map(o => {
      const ovalU = Math.cos(o.angle) * cfg.targetRy;
      const ovalV = Math.sin(o.angle) * cfg.targetRz;
      const u = (o.u * (1 - t) + ovalU * t) * tp;
      const v = (o.v * (1 - t) + ovalV * t) * tp;
      return vadd(center, vadd(vscale(basisU, u), vscale(basisV, v)));
    });
  });
}

// 首まわりのリブ襟・裾のふち：外周リング（体表面にある実際の輪郭）と、それを少し
// 中心側へ縮めて持ち上げた内周リングの間をロフトし、リング状の立体（両端が開いた
// 筒）を作る。首元は「外周リング〜内周リングの筒」＋「内周リングの内側は何も
// 塞がない」ことで、実際に空洞として見える首穴になる
function buildLipGeometry(THREE, outerRing, raise, shrink){
  let centroid = { x: 0, y: 0, z: 0 };
  outerRing.forEach(p => { centroid = vadd(centroid, p); });
  centroid = vscale(centroid, 1 / outerRing.length);
  const innerRing = outerRing.map(p => ({
    x: centroid.x + (p.x - centroid.x) * shrink,
    y: p.y + raise,
    z: centroid.z + (p.z - centroid.z) * shrink,
  }));
  return buildTubeGeometry(THREE, [outerRing, innerRing]);
}

// 本体の襟ぐり（フロントの弧＋バックの弧）を1つの連続したリングにする。
// フロント弧は肩L側→肩R側、バック弧も肩L側→肩R側の順に取れるので、バック側は
// 逆順にしてつなぐことで、肩L→…→肩R→（バックの肩R側）→…→肩L、という
// 1周する輪にする
function buildNeckRing(frontLocal, backLocal, halfDepth){
  const f = BODY_LANDMARKS.front, b = BODY_LANDMARKS.back;
  const frontNeck = resampleOpenPoints(frontLocal.slice(f.neckStart, f.neckEnd + 1), NECK_RESAMPLE)
    .map(p => ({ x: p.x, y: p.y, z: halfDepth }));
  const backNeck = resampleOpenPoints(backLocal.slice(b.neckStart, b.neckEnd + 1), NECK_RESAMPLE)
    .map(p => ({ x: p.x, y: p.y, z: -halfDepth }));
  return frontNeck.concat(backNeck.slice().reverse());
}

// スウェット1着分の立体をTHREE.Groupとして組み立てる（現段階はテクスチャなし、白一色）。
// Body（フロント・バック・側面・肩・脇の下を1つのロフトでつなぐ）／Sleeves（肩の
// 付け根から袖口まで連続したリングの筒）／Collar（首ぐりのリング状の立ち襟）／
// Hem（裾の内側の折り返し風のふち）で構成する
function buildSweatshirtGroup(THREE){
  const cfg = FRAME_3D_LAYOUTS.sweatshirt;
  const frame = DESIGN_FRAME_PRESETS.find(f => f.id === "sweatshirt");
  const group = new THREE.Group();
  const halfDepth = cfg.depth / 2;

  const frontMeta = frame.parts.find(p => p.id === cfg.front.partId);
  const backMeta = frame.parts.find(p => p.id === cfg.back.partId);
  const frontPath = PRESET_MASKS.sweatshirt[cfg.front.partId].maskLines[1];
  const backPath = PRESET_MASKS.sweatshirt[cfg.back.partId].maskLines[1];
  const frontLocal = localizePath(frontPath, frontMeta.width, frontMeta.height, cfg.scale);
  const backLocal = localizePath(backPath, backMeta.width, backMeta.height, cfg.scale);

  const frontOrdered = buildBodyPerimeter(frontLocal, BODY_LANDMARKS.front).map(p => ({ x: p.x, y: p.y, z: halfDepth }));
  const backOrdered = buildBodyPerimeter(backLocal, BODY_LANDMARKS.back).map(p => ({ x: p.x, y: p.y, z: -halfDepth }));

  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
  art3DDisposables.push(material);

  const torsoGeometry = buildTorsoGeometry(THREE, frontOrdered, backOrdered);
  art3DDisposables.push(torsoGeometry);
  group.add(new THREE.Mesh(torsoGeometry, material));

  // 首元：フロント・バックの襟ぐりを1つのリングにし、少し持ち上げた内周リングとの
  // 間をロフトして、穴の開いた立ち襟にする
  const neckOuter = buildNeckRing(frontLocal, backLocal, halfDepth);
  const collarGeometry = buildLipGeometry(THREE, neckOuter, cfg.collarRaise, cfg.collarShrink);
  art3DDisposables.push(collarGeometry);
  group.add(new THREE.Mesh(collarGeometry, material));

  // 裾：本体の裾（フロント2点＋バック2点）を1つのリングにし、少し内側に縮めて
  // 持ち上げた内周リングとの間をロフトして、裾の折り返しのような厚みを作る
  const hemOuter = [
    { x: frontLocal[BODY_LANDMARKS.front.hem[0]].x, y: frontLocal[BODY_LANDMARKS.front.hem[0]].y, z: halfDepth },
    { x: frontLocal[BODY_LANDMARKS.front.hem[1]].x, y: frontLocal[BODY_LANDMARKS.front.hem[1]].y, z: halfDepth },
    { x: backLocal[BODY_LANDMARKS.back.hem[1]].x, y: backLocal[BODY_LANDMARKS.back.hem[1]].y, z: -halfDepth },
    { x: backLocal[BODY_LANDMARKS.back.hem[0]].x, y: backLocal[BODY_LANDMARKS.back.hem[0]].y, z: -halfDepth },
  ];
  const hemGeometry = buildLipGeometry(THREE, hemOuter, cfg.hemLipRaise, cfg.hemLipShrink);
  art3DDisposables.push(hemGeometry);
  group.add(new THREE.Mesh(hemGeometry, material));

  // 袖：肩の付け根（本体のarmholeR/armholeLと同じ座標）から袖口まで、連続した
  // リングの筒として生成する。本体側の点をそのまま使うため、肩と袖の間に
  // 隙間ができない
  [
    { armhole: BODY_LANDMARKS.front.armholeR, armholeBack: BODY_LANDMARKS.back.armholeR, axis: cfg.sleeve.axisRight },
    { armhole: BODY_LANDMARKS.front.armholeL, armholeBack: BODY_LANDMARKS.back.armholeL, axis: cfg.sleeve.axisLeft },
  ].forEach(side => {
    const frontArm = side.armhole.map(i => ({ x: frontLocal[i].x, y: frontLocal[i].y, z: halfDepth }));
    const backArm = side.armholeBack.map(i => ({ x: backLocal[i].x, y: backLocal[i].y, z: -halfDepth }));
    // 肩→中間→脇の下（フロント）→脇の下→中間→肩（バック、逆順）で閉じた六角形リングにする
    const shoulderRing = [frontArm[0], frontArm[1], frontArm[2], backArm[2], backArm[1], backArm[0]];
    const rings = buildSleeveRings(shoulderRing, cfg.sleeve, side.axis);
    const sleeveGeometry = buildTubeGeometry(THREE, rings);
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
