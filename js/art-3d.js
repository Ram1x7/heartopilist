// js/art-3d.js
// アイテム別プリセットの3Dプレビュー（検証段階：スウェットのみ対応）。
//
// ゲーム内の3Dアセットは一切使わない。既存のmaskLines（輪郭線データ、js/art-masks.js）は
// 「正面から見たときのシルエット（幅）」を決めるためだけに使い、奥行き方向の体積は
// 高さごとの楕円断面リングを積み重ねて生成する。
//
// 胴体と袖は、肩の高さのリングに実際に穴（窓）を開け、その境界をそのまま袖の
// 付け根リングとして使うことで、頂点を共有した1つの連続したメッシュにする
// （胴体・袖という別パーツを重ねて配置する方式はやめた）。
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

// 断面の分割数（32分割＝11.25度刻み）。角度0が右、角度180度(=index SEGMENTS/2)が左。
// 肩の袖取り付け用の「窓」をこの分割のどこに開けるかも、この分割数を基準に決める。
// 分割数を増やすことで、胴体・肩・袖のカーブを滑らかにし、角張りを減らす
const TORSO_SEGMENTS = 32;
const RIGHT_WINDOW = [29, 30, 31, 0, 1, 2, 3]; // 右肩：角度0を中心に前後3つ分をあける
const LEFT_WINDOW = [13, 14, 15, 16, 17, 18, 19]; // 左肩：角度180度（index16）を中心に同様にあける

const FRAME_3D_LAYOUTS = {
  sweatshirt: {
    scale: 1 / 16,
    cameraDistance: 8,
    torso: {
      // 肩のすぐ下〜裾までを何段の断面リングでたどるか（ピクセルY）。段数を増やすほど
      // 縦方向のグリッドが細かくなり、箱っぽさが減る
      ringPixelYs: [22, 28, 34, 41, 48, 55, 62, 69, 76, 80],
      segments: TORSO_SEGMENTS,
      depthMin: 0.3,
      depthMax: 0.56,
      depthPeakT: 0.4, // 前後の厚みが最大になる高さ（0=肩寄り、1=裾寄り）。胸をやや厚めにする
      // 首の立ち上がりの高さ（低いリブ程度に抑え、タートルネックのように見えないようにする）
      collarRaise: 0.12,
      collarShrink: 0.85,
      // 裾のふち：断面をわずかに内側へ縮めてから底面を閉じることで、切断面ではなく
      // 折り返しのリブのように見せる
      hemLipShrink: 0.92,
      hemLipDrop: 0.06,
    },
    sleeve: {
      ringCount: 6,
      length: 3.2,
      startHalfWidth: 0.5,
      startDepth: 0.42,
      cuffTaper: 0.62,
      // 袖口のリブ：最後の断面をわずかに広げてから閉じることで、別パーツではなく
      // 袖の続きとして自然なリブに見せる
      cuffRibFlare: 1.06,
      cuffRibLength: 0.12,
      // 肩側の向きから袖口側の向きへ少しずつ曲げていくことで、腕が重力で
      // わずかに垂れているような自然な曲線にする（完全な直線にしない）
      axisStartRight: { x: 1, y: -0.12, z: 0.06 },
      axisEndRight: { x: 1, y: -0.55, z: 0.1 },
      axisStartLeft: { x: -1, y: -0.12, z: 0.06 },
      axisEndLeft: { x: -1, y: -0.55, z: 0.1 },
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
function vdot(a, b){ return a.x * b.x + a.y * b.y + a.z * b.z; }
function vsub(a, b){ return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }; }
function vadd(a, b){ return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }; }
function vscale(a, s){ return { x: a.x * s, y: a.y * s, z: a.z * s }; }
function vlerp(a, b, t){ return vadd(vscale(a, 1 - t), vscale(b, t)); }

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
// 連続した筒状メッシュを作る
function lofteRings(positions, ringA, ringB){
  const K = ringA.length;
  for(let k = 0; k < K; k++){
    const k2 = (k + 1) % K;
    pushTri(positions, ringA[k], ringA[k2], ringB[k2]);
    pushTri(positions, ringA[k], ringB[k2], ringB[k]);
  }
}

// lofteRings()と同じだが、skipSpans（角度の区間、袖を取り付けるための「窓」）に
// あたる部分だけ面を作らない。窓の境界（skipSpansの外側の点）はそのまま袖の
// 付け根リングとして使うため、ここでは触れない
function lofteRingsWithWindow(positions, ringA, ringB, skipSpans){
  const K = ringA.length;
  for(let k = 0; k < K; k++){
    if(skipSpans.has(k)) continue;
    const k2 = (k + 1) % K;
    pushTri(positions, ringA[k], ringA[k2], ringB[k2]);
    pushTri(positions, ringA[k], ringB[k2], ringB[k]);
  }
}

function windowSpans(window){
  const s = new Set();
  for(let i = 0; i < window.length - 1; i++) s.add(window[i]);
  return s;
}

// 1つのリングを塞ぐ。半径40%の内側リングを経由してから中心へファンする2段構成にし、
// 巨大な三角形が1枚だけできる（半径いっぱいに広がる扇）のを避ける
function capRing(positions, ring, reverse){
  let center = { x: 0, y: 0, z: 0 };
  ring.forEach(p => { center = vadd(center, p); });
  center = vscale(center, 1 / ring.length);
  const K = ring.length;
  const inner = ring.map(p => vadd(center, vscale(vsub(p, center), 0.4)));
  for(let k = 0; k < K; k++){
    const k2 = (k + 1) % K;
    if(reverse){
      pushTri(positions, ring[k2], ring[k], inner[k]);
      pushTri(positions, ring[k2], inner[k], inner[k2]);
      pushTri(positions, center, inner[k2], inner[k]);
    }else{
      pushTri(positions, ring[k], ring[k2], inner[k2]);
      pushTri(positions, ring[k], inner[k2], inner[k]);
      pushTri(positions, center, inner[k], inner[k2]);
    }
  }
}

// 胴体：肩のすぐ下から裾まで、高さごとの楕円断面リングを積み重ねてつなぎ、最初から
// 体積のある立体として作る。正面から見たときのシルエット（各リングの半幅）は、
// 実際のテンプレートの輪郭幅（halfWidthAtPixelY）をそのまま使う。奥行き（前後の
// 厚み）は、肩・裾に近いところで薄く、胸のあたりで最大になるよう独立したカーブで
// 決める。首元は、襟ぐりの実際の開口幅に合わせた小さな輪から、少し内側に縮めて
// 持ち上げた輪（襟の自由端）へさらにロフトすることで、実際に空洞が見えるリング状の
// 立ち襟にする。裾は底面をふさいで閉じる。
//
// 肩のリングとその1つ下のリングの間には、左右の肩に「窓」を開ける（面を作らない）。
// その窓の境界（肩リングの一部＋1つ下のリングの一部）を、そのまま袖の付け根リングと
// して返すことで、胴体と袖が頂点を共有した1つのメッシュになるようにする
function buildTorsoGeometry(THREE, cfg, scale){
  const positions = [];
  const canvasH = 88; // フロント/バックのキャンバス高さ（両方とも80x88）
  const halfCanvasH = canvasH / 2;
  const toLocalY = pixelY => (halfCanvasH - pixelY) * scale;

  const shoulderPixelY = cfg.ringPixelYs[0];
  const shoulderY = toLocalY(shoulderPixelY);
  const neckHoleHalfWidth = NECK_HOLE_HALF_X * scale;
  const shoulderHalfWidth = halfWidthAtPixelY(shoulderPixelY) * scale;

  const ringDepths = cfg.ringPixelYs.map((pixelY, i) => {
    const t = cfg.ringPixelYs.length > 1 ? i / (cfg.ringPixelYs.length - 1) : 0;
    const bell = Math.sin(Math.PI * Math.pow(t, cfg.depthPeakT > 0 ? Math.log(0.5) / Math.log(cfg.depthPeakT) : 1));
    return cfg.depthMin + (cfg.depthMax - cfg.depthMin) * Math.max(0, bell);
  });
  const mainRings = cfg.ringPixelYs.map((pixelY, i) => {
    const y = toLocalY(pixelY);
    const halfWidth = halfWidthAtPixelY(pixelY) * scale;
    return buildEllipseRing({ x: 0, y, z: 0 }, halfWidth, ringDepths[i], cfg.segments);
  });

  const neckOuterDepth = neckHoleHalfWidth * 0.6;
  const neckOuter = buildEllipseRing({ x: 0, y: shoulderY, z: 0 }, neckHoleHalfWidth, neckOuterDepth, cfg.segments);
  const neckMid = buildEllipseRing(
    { x: 0, y: shoulderY - 0.05, z: 0 },
    (neckHoleHalfWidth + shoulderHalfWidth) / 2,
    (neckOuterDepth + ringDepths[0]) / 2,
    cfg.segments
  );
  const neckInner = buildEllipseRing(
    { x: 0, y: shoulderY + cfg.collarRaise, z: 0 },
    neckHoleHalfWidth * cfg.collarShrink,
    neckHoleHalfWidth * 0.6 * cfg.collarShrink,
    cfg.segments
  );

  // 首の内側リング（立ち襟の自由端、上端は開いたまま）→襟ぐりの開口→
  // （なだらかな移行用のリング）→肩→…の順につなぐ
  lofteRings(positions, neckInner, neckOuter);
  lofteRings(positions, neckOuter, neckMid);
  lofteRings(positions, neckMid, mainRings[0]);

  // 肩リング（mainRings[0]）とその1つ下（mainRings[1]）の間は、左右の窓を除いて
  // 通常どおりつなぐ
  lofteRingsWithWindow(positions, mainRings[0], mainRings[1], new Set([...windowSpans(RIGHT_WINDOW), ...windowSpans(LEFT_WINDOW)]));

  for(let i = 1; i < mainRings.length - 1; i++){
    lofteRings(positions, mainRings[i], mainRings[i + 1]);
  }

  // 裾のふち：一番下のリングをそのまま底面としてふさぐと切断面のように見えるため、
  // わずかに内側へ縮めて少し下げたリングを間に挟んでからふさぐ（折り返しのリブ風）
  const hemRing = mainRings[mainRings.length - 1];
  let hemCenter = { x: 0, y: 0, z: 0 };
  hemRing.forEach(p => { hemCenter = vadd(hemCenter, p); });
  hemCenter = vscale(hemCenter, 1 / hemRing.length);
  const hemLip = hemRing.map(p => {
    const shrunk = vadd(hemCenter, vscale(vsub(p, hemCenter), cfg.hemLipShrink));
    return { x: shrunk.x, y: shrunk.y - cfg.hemLipDrop, z: shrunk.z };
  });
  lofteRings(positions, hemRing, hemLip);
  capRing(positions, hemLip, false); // 裾の底面を閉じる

  // 窓の境界（肩リングの窓部分＋1つ下のリングの窓部分を逆順にしたもの）を、
  // 袖の付け根リングとして返す
  function windowLoop(window){
    const topArc = window.map(i => mainRings[0][i]);
    const bottomArc = window.map(i => mainRings[1][i]).reverse();
    return topArc.concat(bottomArc);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return {
    geometry,
    rightShoulderLoop: windowLoop(RIGHT_WINDOW),
    leftShoulderLoop: windowLoop(LEFT_WINDOW),
  };
}

// 肩の付け根リング（shoulderLoop、本体の窓の境界と同じ座標＝共有頂点）を出発点に、
// 腕の軸方向にリングを並べていく。各リングは円ではなく楕円断面にし、肩の付け根の
// 実際の（左右非対称な）形から、少しずつ平たい楕円へブレンドしていく。
// 腕の軸はaxisStart→axisEndへ少しずつ向きを変えながら進むことで、完全な直線には
// ならず、重力でわずかに垂れているような自然な曲線にする
function buildSleeveGeometry(THREE, shoulderLoop, cfg, axisStart, axisEnd){
  const K0 = shoulderLoop.length;
  let center0 = { x: 0, y: 0, z: 0 };
  shoulderLoop.forEach(p => { center0 = vadd(center0, p); });
  center0 = vscale(center0, 1 / K0);

  const stepCount = cfg.ringCount - 1;
  const stepLength = cfg.length / stepCount;
  const ringCenters = [center0];
  const ringDirs = [vnorm(axisStart)];
  let current = center0;
  for(let i = 1; i < cfg.ringCount; i++){
    const t = i / stepCount;
    const dir = vnorm(vlerp(axisStart, axisEnd, t));
    current = vadd(current, vscale(dir, stepLength));
    ringCenters.push(current);
    ringDirs.push(dir);
  }

  // ring0（本体と共有する頂点）だけの断面基準を作っておき、そこから先のリングの
  // 「平たい断面」への滑らかな移行に使う
  const axis0 = ringDirs[0];
  const worldUp = { x: 0, y: 1, z: 0 };
  let basisV0 = vcross(axis0, worldUp);
  if(vlen(basisV0) < 1e-6) basisV0 = { x: 0, y: 0, z: 1 };
  basisV0 = vnorm(basisV0);
  const basisU0 = vnorm(vcross(basisV0, axis0));

  const hexUV = shoulderLoop.map(p => {
    const d = vsub(p, center0);
    return { u: vdot(d, basisU0), v: vdot(d, basisV0) };
  });

  const SUBSTEPS = 4;
  const smoothUV = [];
  for(let k = 0; k < K0; k++){
    const a = hexUV[k], b = hexUV[(k + 1) % K0];
    for(let s = 0; s < SUBSTEPS; s++){
      const t = s / SUBSTEPS;
      const u = a.u + (b.u - a.u) * t;
      const v = a.v + (b.v - a.v) * t;
      smoothUV.push({ u, v, angle: Math.atan2(v, u) });
    }
  }

  function ringAt(ringIdx){
    const dir = ringDirs[ringIdx];
    let basisV = vcross(dir, worldUp);
    if(vlen(basisV) < 1e-6) basisV = { x: 0, y: 0, z: 1 };
    basisV = vnorm(basisV);
    const basisU = vnorm(vcross(basisV, dir));
    const t = ringIdx / stepCount;
    const blend = Math.min(1, t / 0.8); // 肩の実際の形を長めに残し、なだらかに楕円へ移行する
    // 肩は太く、肘のあたりから袖口にかけて少しずつ細くなる（直線的な細まりにしない）
    const taper = 1 - (1 - cfg.cuffTaper) * Math.pow(t, 0.8);
    const center = ringCenters[ringIdx];
    return smoothUV.map(p => {
      const ovalU = Math.cos(p.angle) * cfg.startHalfWidth;
      const ovalV = Math.sin(p.angle) * cfg.startDepth;
      const u = (p.u * (1 - blend) + ovalU * blend) * taper;
      const v = (p.v * (1 - blend) + ovalV * blend) * taper;
      return vadd(center, vadd(vscale(basisU, u), vscale(basisV, v)));
    });
  }

  const rings = ringCenters.map((_, idx) => (idx === 0 ? shoulderLoop : ringAt(idx)));

  const positions = [];

  // ring0（K0点、本体と共有）→ring1（K0*SUBSTEPS点）の橋渡し
  const ring0 = rings[0], ring1 = rings[1];
  for(let k = 0; k < K0; k++){
    const k2 = (k + 1) % K0;
    const base = k * SUBSTEPS;
    const r1a = ring1[base];
    const r1b = ring1[base + 1];
    const r1c = ring1[(base + 2) % ring1.length];
    const r1d = ring1[(base + SUBSTEPS) % ring1.length];
    pushTri(positions, ring0[k], r1a, r1b);
    pushTri(positions, ring0[k], r1b, ring0[k2]);
    pushTri(positions, ring0[k2], r1b, r1c);
    pushTri(positions, ring0[k2], r1c, r1d);
  }

  // ring1〜ring[N-1]（すべて同じ点数）は通常のクアッド接続でつなぐ
  for(let r = 1; r < rings.length - 1; r++){
    lofteRings(positions, rings[r], rings[r + 1]);
  }

  // 袖口のリブ：最後の断面をそのまま袖口にすると切断面のように見えるため、
  // 少し先までわずかに広げたリングを足し、薄いリブとして自然につながるようにする
  const cuffRing = rings[rings.length - 1];
  const cuffDir = ringDirs[ringDirs.length - 1];
  const cuffCenter = vadd(ringCenters[ringCenters.length - 1], vscale(cuffDir, cfg.cuffRibLength));
  let cuffPivot = { x: 0, y: 0, z: 0 };
  cuffRing.forEach(p => { cuffPivot = vadd(cuffPivot, p); });
  cuffPivot = vscale(cuffPivot, 1 / cuffRing.length);
  const cuffRib = cuffRing.map(p => vadd(cuffCenter, vscale(vsub(p, cuffPivot), cfg.cuffRibFlare)));
  lofteRings(positions, cuffRing, cuffRib);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

// スウェット1着分の立体をTHREE.Groupとして組み立てる（現段階はテクスチャなし、
// グレー一色）。胴体は高さごとの楕円断面リングを積み重ねた1つの立体で、肩の
// 左右に袖取り付け用の窓を開けてある。袖はその窓の境界を付け根リングとして
// 共有し、腕の軸方向に楕円断面を積み重ねた連続した筒として続く
function buildSweatshirtGroup(THREE){
  const cfg = FRAME_3D_LAYOUTS.sweatshirt;
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0xbfbab0, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
  art3DDisposables.push(material);

  const { geometry: torsoGeometry, rightShoulderLoop, leftShoulderLoop } = buildTorsoGeometry(THREE, cfg.torso, cfg.scale);
  art3DDisposables.push(torsoGeometry);
  group.add(new THREE.Mesh(torsoGeometry, material));

  [
    { loop: rightShoulderLoop, axisStart: cfg.sleeve.axisStartRight, axisEnd: cfg.sleeve.axisEndRight },
    { loop: leftShoulderLoop, axisStart: cfg.sleeve.axisStartLeft, axisEnd: cfg.sleeve.axisEndLeft },
  ].forEach(side => {
    const sleeveGeometry = buildSleeveGeometry(THREE, side.loop, cfg.sleeve, side.axisStart, side.axisEnd);
    art3DDisposables.push(sleeveGeometry);
    group.add(new THREE.Mesh(sleeveGeometry, material));
  });

  return group;
}

const VIEW_PRESETS = {
  front: { position: { x: 0, y: 0.3, z: 8 }, target: { x: 0, y: -0.3, z: 0 } },
  back: { position: { x: 0, y: 0.3, z: -8 }, target: { x: 0, y: -0.3, z: 0 } },
  side: { position: { x: 8, y: 0.3, z: 0 }, target: { x: 0, y: -0.3, z: 0 } },
  top: { position: { x: 0, y: 8, z: 0.01 }, target: { x: 0, y: -0.3, z: 0 } },
};

function setView(name){
  const preset = VIEW_PRESETS[name];
  if(!preset || !art3DCamera || !art3DControls) return;
  art3DCamera.position.set(preset.position.x, preset.position.y, preset.position.z);
  art3DControls.target.set(preset.target.x, preset.target.y, preset.target.z);
  art3DControls.update();
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
  document.querySelectorAll("#art3DViewButtons [data-view]").forEach(el => {
    el.addEventListener("click", () => setView(el.dataset.view));
  });
}

bind3DPreviewControls();
update3DPreviewButton(); // このスクリプトの読み込み前にinitArtEditor()が既に実行されているため、初回分をここで反映する
