// js/art-3d.js
// アイテム別プリセットの3Dプレビュー（検証段階：スウェットのみ対応）。
//
// ゲーム内の3Dアセットは一切使わない。既存のmaskLines（輪郭線データ、js/art-masks.js）を
// 「1着の服を組み立てるための2D型紙」として扱い、フロント・バックの輪郭を直接つなぎ
// 合わせた1つの立体（ロフト）として服を構築する。実際に塗ったピクセル画像をテクスチャ
// として貼り付ける（参考サイトの制作者が「形はキャンバスのガイド線から作っており、
// ゲーム内のモデルは使用していない」と明言しているものと同じ発想）。
//
// 以前の実装はパーツごとに独立した平らな板（ExtrudeGeometry）を並べるだけだったため、
// 「板を配置しただけ」に見えるという指摘を受けた。今回は、フロントとバックの輪郭を
// 弧長に沿って同じ点数に再分割し、対応する点同士を側面でつないで1つの連続した胴体
// メッシュを作る。首元も同様に、襟ぐりの弧を体表面〜少し持ち上げた高さの間でロフトし、
// リング状の立ち襟にする。袖は円柱状に巻いた連続メッシュとして、実データから求めた
// 肩〜脇の位置に取り付ける。
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

// スウェットの構造・寸法の設定。
//
// front/back.neckArcRangeは、本体の輪郭（maskLines）のうち「襟ぐりが凹んでいる区間」
// を指す配列の開始・終了インデックス（slice用、終了側は含まない）。これは
// js/art-masks.jsの実データを直接調べて求めた固定値：
// ・フロント本体の輪郭は index1〜9が襟ぐりの凹み（両端は肩の平らな線の終点）
// ・バック本体の輪郭は index1〜7が襟ぐりの凹み（フロントよりわずかに浅い）
// collarPathIndexは、同じキャンバスにある襟リブ用の小さな長方形パス（本体とは別パス）。
//
// sleeve.right/leftのx/y/zは、本体の肩(64,20)〜脇(64,48〜55)の実座標から求めた
// おおよその取り付け位置（暫定値）。wrapRadius/wrapCenterXは袖の型紙をどの半径・
// どの中心で円柱に巻き付けるか
const FRAME_3D_LAYOUTS = {
  sweatshirt: {
    scale: 1 / 16,
    depth: 0.1,
    torsoResample: 40,
    collarRaise: 0.5,
    cameraDistance: 7.5,
    front: { partId: "default", bodyPathIndex: 1, collarPathIndex: 0, neckArcRange: [1, 10] },
    back: { partId: "canvas-1777618043251", bodyPathIndex: 1, collarPathIndex: 0, neckArcRange: [1, 8] },
    sleeve: {
      partId: "canvas-1777618057689",
      right: { pathIndex: 0, wrapCenterX: 1.875, wrapRadius: 1.1, x: 1.7, y: 0.4, z: 0, rotY: -0.6 },
      left: { pathIndex: 1, wrapCenterX: -1.875, wrapRadius: 1.1, x: -1.7, y: 0.4, z: 0, rotY: 0.6 },
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

// 保存済みデザイン一覧から、指定パーツの最新の保存データを探す（同じframeId+partIdが
// 複数あれば一番新しいものを使う）。今まさに編集中のパーツは、保存前の最新状態を
// 見せたいため、保存データではなく編集中のpixels等をそのまま使う
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

// パーツのpixelDataから、そのままテクスチャに使えるcanvas要素を作る
// （js/art-editor.jsのbuildExportCanvas()と同じ描き方だが、グローバルの
// pixels/gridWidth/gridHeightに依存せず任意のパーツのデータを渡せるようにしたもの）
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

// maskLinesの1点（キャンバスのマス座標）を3D空間のローカル座標に変換する。
// 元のピクセル座標(px,py)も持たせておき、後でテクスチャのUVを計算するのに使う
function localizePath(path, w, h, scale){
  return path.map(pt => ({
    x: (pt.x - w / 2) * scale,
    y: (h / 2 - pt.y) * scale, // マス座標は下向きが正のため、3D空間の上向きに反転する
    px: pt.x,
    py: pt.y,
  }));
}

function pixelUV(pt, w, h){
  return [pt.px / w, 1 - pt.py / h];
}

// 始点と終点が重なっている（閉じたループを表す）場合、重複した終点を取り除く
function dedupClosed(pts){
  if(pts.length > 1){
    const a = pts[0], b = pts[pts.length - 1];
    if(Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6) return pts.slice(0, -1);
  }
  return pts;
}

// 閉じたループ（重複終点は事前にdedupClosed()で取り除いておく）を、弧長に沿って
// n個の点へ均等に再分割する。x/y/px/pyをすべて線形補間するので、これで作った
// フロント・バックそれぞれのリングは「輪郭に沿った同じ割合の位置」同士が対応する
function resampleClosedPath(pts, n){
  const segLens = [];
  let total = 0;
  for(let i = 0; i < pts.length; i++){
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    segLens.push(d);
    total += d;
  }
  const out = [];
  for(let k = 0; k < n; k++){
    const target = total * k / n;
    let acc = 0, i = 0;
    while(i < segLens.length - 1 && acc + segLens[i] < target){ acc += segLens[i]; i++; }
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const segLen = segLens[i] || 1e-9;
    const t = Math.min(1, Math.max(0, (target - acc) / segLen));
    out.push({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      px: a.px + (b.px - a.px) * t,
      py: a.py + (b.py - a.py) * t,
    });
  }
  return out;
}

// フロントとバックの輪郭を弧長に沿って同じ点数に分割し、対応する点同士を側面で
// つないだ1つの胴体メッシュを組み立てる（frontCap＋backCap＋側面）。
// マテリアルは[フロント用, バック用, 側面用(無地)]の3つで、geometry.groups側で
// 面ごとにどのマテリアルを使うかを振り分ける
function buildLoftGeometry(THREE, frontRing, backRing, frontW, frontH, backW, backH){
  const N = frontRing.length;
  const positions = [];
  const uvs = [];
  const groups = [];

  function pushTri(p0, p1, p2, uv0, uv1, uv2){
    positions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
    uvs.push(uv0[0], uv0[1], uv1[0], uv1[1], uv2[0], uv2[1]);
  }

  // フロントキャップ（+Z向き）
  const frontStart = positions.length / 3;
  const frontContour = frontRing.map(p => new THREE.Vector2(p.x, p.y));
  THREE.ShapeUtils.triangulateShape(frontContour, []).forEach(([i0, i1, i2]) => {
    pushTri(
      frontRing[i0], frontRing[i1], frontRing[i2],
      pixelUV(frontRing[i0], frontW, frontH), pixelUV(frontRing[i1], frontW, frontH), pixelUV(frontRing[i2], frontW, frontH)
    );
  });
  groups.push([frontStart, positions.length / 3 - frontStart, 0]);

  // バックキャップ（-Z向きになるよう、頂点順序を反転する）
  const backStart = positions.length / 3;
  const backContour = backRing.map(p => new THREE.Vector2(p.x, p.y));
  THREE.ShapeUtils.triangulateShape(backContour, []).forEach(([i0, i1, i2]) => {
    pushTri(
      backRing[i0], backRing[i2], backRing[i1],
      pixelUV(backRing[i0], backW, backH), pixelUV(backRing[i2], backW, backH), pixelUV(backRing[i1], backW, backH)
    );
  });
  groups.push([backStart, positions.length / 3 - backStart, 1]);

  // 側面（フロントとバックの対応する点同士をつなぐ。専用のアート画像がないため
  // テクスチャは貼らず、無地の生地色マテリアルを使う）
  const sideStart = positions.length / 3;
  for(let i = 0; i < N; i++){
    const j = (i + 1) % N;
    const f0 = frontRing[i], f1 = frontRing[j], b0 = backRing[i], b1 = backRing[j];
    pushTri(f0, f1, b1, [0, 0], [0, 0], [0, 0]);
    pushTri(f0, b1, b0, [0, 0], [0, 0], [0, 0]);
  }
  groups.push([sideStart, positions.length / 3 - sideStart, 2]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  groups.forEach(([start, count, materialIndex]) => geometry.addGroup(start, count, materialIndex));
  geometry.computeVertexNormals();
  return geometry;
}

// 首まわりのリブ襟：本体輪郭のうち襟ぐりの凹み部分の弧だけを取り出し、体表面の高さと
// 少し持ち上げた高さの間でロフトして、立ち襟のような筒状の壁（両端は開いたリング状）
// を作る。3D形状は本体の襟ぐり（neckArcRange）から、テクスチャは同じキャンバスにある
// 襟リブ専用の小さな長方形パーツ（collarPathIndex）から取る
function buildCollarGeometry(THREE, cfgSide, localBody, w, h, z, raise){
  const [s, e] = cfgSide.neckArcRange;
  const arc = localBody.slice(s, e);
  const collarPath = PRESET_MASKS.sweatshirt[cfgSide.partId].maskLines[cfgSide.collarPathIndex];
  const collarPx = collarPath.map(p => p.x);
  const collarPy = collarPath.map(p => p.y);
  const rectMinX = Math.min(...collarPx), rectMaxX = Math.max(...collarPx);
  const rectMinY = Math.min(...collarPy), rectMaxY = Math.max(...collarPy);

  let total = 0;
  const cum = [0];
  for(let i = 0; i < arc.length - 1; i++){
    total += Math.hypot(arc[i + 1].x - arc[i].x, arc[i + 1].y - arc[i].y);
    cum.push(total);
  }

  const positions = [];
  const uvs = [];
  for(let i = 0; i < arc.length - 1; i++){
    const t0 = total > 0 ? cum[i] / total : 0;
    const t1 = total > 0 ? cum[i + 1] / total : 0;
    const px0 = rectMinX + t0 * (rectMaxX - rectMinX);
    const px1 = rectMinX + t1 * (rectMaxX - rectMinX);
    const uvBody0 = [px0 / w, 1 - rectMaxY / h], uvBody1 = [px1 / w, 1 - rectMaxY / h];
    const uvTop0 = [px0 / w, 1 - rectMinY / h], uvTop1 = [px1 / w, 1 - rectMinY / h];
    const a0 = { x: arc[i].x, y: arc[i].y, z };
    const a1 = { x: arc[i + 1].x, y: arc[i + 1].y, z };
    const b0 = { x: arc[i].x, y: arc[i].y + raise, z };
    const b1 = { x: arc[i + 1].x, y: arc[i + 1].y + raise, z };
    positions.push(a0.x, a0.y, a0.z, a1.x, a1.y, a1.z, b1.x, b1.y, b1.z);
    uvs.push(uvBody0[0], uvBody0[1], uvBody1[0], uvBody1[1], uvTop1[0], uvTop1[1]);
    positions.push(a0.x, a0.y, a0.z, b1.x, b1.y, b1.z, b0.x, b0.y, b0.z);
    uvs.push(uvBody0[0], uvBody0[1], uvTop1[0], uvTop1[1], uvTop0[0], uvTop0[1]);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  return geometry;
}

// キャンバス上のピクセル座標をそのままUVに変換する。1つのキャンバスに複数のパーツ
// （袖キャンバスの左右）が描かれている場合、ExtrudeGeometry/ShapeGeometryの既定の
// UV自動生成は「そのシェイプ自身の外接矩形」を基準に0〜1へ正規化するため、部分的な
// 範囲しか使わないパーツでは誤ったUVになってしまう。そのため、キャンバスの実サイズ
// (w,h)を基準に明示的にUVを計算し直す。呼び出しは、位置をまだ立体化（巻き付けなど）
// する前の平らな状態のうちに行うこと
function applyPixelUV(THREE, geometry, w, h, scale){
  const pos = geometry.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for(let i = 0; i < pos.count; i++){
    const lx = pos.getX(i), ly = pos.getY(i);
    const px = lx / scale + w / 2;
    const py = h / 2 - ly / scale;
    uv[i * 2] = px / w;
    uv[i * 2 + 1] = 1 - py / h;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

// 平らな型紙形状（THREE.Shape）を円柱面に巻き付けた立体に変換する。
// centerXを軸に、型紙のローカルXを「円柱を上から見た時の角度」とみなして
// 円周方向に丸める。Y（縦方向）はそのまま高さとして使う。
// UVは巻き付ける前の平らな座標を基準に計算しておく（applyPixelUV参照）
function buildWrapGeometry(THREE, shape, radius, centerX, w, h, scale){
  const geometry = new THREE.ShapeGeometry(shape, 12);
  applyPixelUV(THREE, geometry, w, h, scale);
  const pos = geometry.attributes.position;
  for(let i = 0; i < pos.count; i++){
    const x = pos.getX(i) - centerX;
    const y = pos.getY(i);
    const angle = x / radius;
    pos.setXYZ(i, centerX + radius * Math.sin(angle), y, radius * (1 - Math.cos(angle)));
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

// テクスチャキャッシュ（同じパーツ／キャンバスを複数箇所で使う場合に使い回す）
function getPartTexture(THREE, textureCache, partId, w, h){
  let cached = textureCache.get(partId);
  if(!cached){
    const found = findPixelDataForPart("sweatshirt", partId);
    const fabricColor = document.body.classList.contains("dark") ? "#4a453c" : "#f4ecd8";
    const canvas = found
      ? pixelsToTextureCanvas(found.pixelData, found.width, found.height, fabricColor)
      : pixelsToTextureCanvas(new Array(w * h).fill(null), w, h, fabricColor);
    const texture = new THREE.CanvasTexture(canvas);
    if(THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
    cached = { texture };
    textureCache.set(partId, cached);
    art3DDisposables.push(texture);
  }
  return cached.texture;
}

// スウェット1着分の立体をTHREE.Groupとして組み立てる。
// 「板を並べる」のではなく、フロント・バックの輪郭を直接ロフトでつないだ1つの胴体、
// 襟ぐりから立ち上げた襟リング、肩〜脇に取り付けた円柱状の袖、という構成にする
function buildSweatshirtGroup(THREE, textureCache){
  const cfg = FRAME_3D_LAYOUTS.sweatshirt;
  const frame = DESIGN_FRAME_PRESETS.find(f => f.id === "sweatshirt");
  const group = new THREE.Group();
  const halfDepth = cfg.depth / 2;
  const fabricColor = document.body.classList.contains("dark") ? 0x4a453c : 0xf4ecd8;

  const frontMeta = frame.parts.find(p => p.id === cfg.front.partId);
  const backMeta = frame.parts.find(p => p.id === cfg.back.partId);
  const fw = frontMeta.width, fh = frontMeta.height;
  const bw = backMeta.width, bh = backMeta.height;

  const frontBodyPath = PRESET_MASKS.sweatshirt[cfg.front.partId].maskLines[cfg.front.bodyPathIndex];
  const backBodyPath = PRESET_MASKS.sweatshirt[cfg.back.partId].maskLines[cfg.back.bodyPathIndex];
  const frontBodyLocal = localizePath(frontBodyPath, fw, fh, cfg.scale);
  const backBodyLocal = localizePath(backBodyPath, bw, bh, cfg.scale);

  const N = cfg.torsoResample;
  const frontRing = resampleClosedPath(dedupClosed(frontBodyLocal), N).map(p => ({ ...p, z: halfDepth }));
  const backRing = resampleClosedPath(dedupClosed(backBodyLocal), N).map(p => ({ ...p, z: -halfDepth }));

  const frontTexture = getPartTexture(THREE, textureCache, cfg.front.partId, fw, fh);
  const backTexture = getPartTexture(THREE, textureCache, cfg.back.partId, bw, bh);

  const torsoGeometry = buildLoftGeometry(THREE, frontRing, backRing, fw, fh, bw, bh);
  const frontMat = new THREE.MeshStandardMaterial({ map: frontTexture, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
  const backMat = new THREE.MeshStandardMaterial({ map: backTexture, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
  const sideMat = new THREE.MeshStandardMaterial({ color: fabricColor, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
  const torsoMesh = new THREE.Mesh(torsoGeometry, [frontMat, backMat, sideMat]);
  art3DDisposables.push(torsoGeometry, frontMat, backMat, sideMat);
  group.add(torsoMesh);

  const frontCollarGeometry = buildCollarGeometry(THREE, cfg.front, frontBodyLocal, fw, fh, halfDepth, cfg.collarRaise);
  const backCollarGeometry = buildCollarGeometry(THREE, cfg.back, backBodyLocal, bw, bh, -halfDepth, cfg.collarRaise);
  const frontCollarMat = new THREE.MeshStandardMaterial({ map: frontTexture, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
  const backCollarMat = new THREE.MeshStandardMaterial({ map: backTexture, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
  art3DDisposables.push(frontCollarGeometry, backCollarGeometry, frontCollarMat, backCollarMat);
  group.add(new THREE.Mesh(frontCollarGeometry, frontCollarMat));
  group.add(new THREE.Mesh(backCollarGeometry, backCollarMat));

  const sleeveMeta = frame.parts.find(p => p.id === cfg.sleeve.partId);
  const sw = sleeveMeta.width, sh = sleeveMeta.height;
  const sleeveTexture = getPartTexture(THREE, textureCache, cfg.sleeve.partId, sw, sh);
  [cfg.sleeve.right, cfg.sleeve.left].forEach(side => {
    const path = PRESET_MASKS.sweatshirt[cfg.sleeve.partId].maskLines[side.pathIndex];
    const shape = new THREE.Shape();
    path.forEach((pt, i) => {
      const lx = (pt.x - sw / 2) * cfg.scale;
      const ly = (sh / 2 - pt.y) * cfg.scale;
      if(i === 0) shape.moveTo(lx, ly); else shape.lineTo(lx, ly);
    });
    const geometry = buildWrapGeometry(THREE, shape, side.wrapRadius, side.wrapCenterX, sw, sh, cfg.scale);
    const material = new THREE.MeshStandardMaterial({ map: sleeveTexture, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(side.x, side.y, side.z);
    mesh.rotation.y = side.rotY || 0;
    art3DDisposables.push(geometry, material);
    group.add(mesh);
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

  const textureCache = new Map();
  if(activeFrameId === "sweatshirt"){
    art3DScene.add(buildSweatshirtGroup(THREE, textureCache));
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
