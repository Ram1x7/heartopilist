// js/art-3d.js
// アイテム別プリセットの3Dプレビュー（検証段階：Tシャツのみ対応）。
//
// ゲーム内の3Dアセットは一切使わない。既存のmaskLines（輪郭線データ、js/art-masks.js）を
// 押し出して「ペーパークラフト風」の立体パネルを組み立て、実際に塗ったピクセル画像を
// テクスチャとして貼り付けるという方式（参考サイトの制作者が「形はキャンバスのガイド線
// から作っており、ゲーム内のモデルは使用していない」と明言しているものと同じ発想）。
//
// パーツをどう立体的に配置するか（位置・角度）はmaskLinesの座標だけからは自動で
// 決まらないため、アイテムの種類ごとに手作業でレイアウトを定義する（FRAME_3D_LAYOUTS）。
// 現時点ではTシャツのみ対応し、動作・見た目を確認してから他アイテムへ広げる想定。
//
// three.js本体は重いため、ページ読み込み時には読み込まず、3Dプレビューを実際に
// 開いた時だけCDNから遅延読み込みする（js/music-hum.jsのBasic Pitch読み込みと同じ方式）。
const THREE_ESM_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/+esm";
const THREE_ORBIT_CONTROLS_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm";

let threeLib = null;
let OrbitControlsClass = null;
let art3DRenderer = null;
let art3DScene = null;
let art3DCamera = null;
let art3DControls = null;
let art3DAnimHandle = null;
let art3DResizeObserver = null;
let art3DDisposables = []; // geometry/material/textureをまとめて破棄するため

// パーツごとの立体配置。x/y/zはマス座標系を1/scaleに縮めた3D空間の単位。
// depthはパネル自体の押し出し厚み。rotYはY軸まわりの回転（ラジアン）
const FRAME_3D_LAYOUTS = {
  t_shirt: {
    scale: 1 / 16,
    depth: 0.3,
    cameraDistance: 6.5,
    parts: [
      { partId: "default", x: 0, y: 0, z: 0.55, rotY: 0 },
      { partId: "canvas-1777194719606", x: 0, y: 0, z: -0.55, rotY: Math.PI },
      { partId: "canvas-1777197309890", x: -2.35, y: 0.95, z: 0.15, rotY: 0.75 },
      { partId: "canvas-1777198784026", x: 2.35, y: 0.95, z: 0.15, rotY: -0.75 },
    ],
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

// 1パーツ分のパネル（輪郭線を押し出した立体＋テクスチャ）を組み立てる。
// 保存済みデータがまだないパーツは、無地の生地色で仮表示する（部分的にしか塗って
// いなくても、モデル全体の形は常に確認できるようにするため）
function buildPanelMesh(THREE, frameId, layout, layoutPart){
  const frame = DESIGN_FRAME_PRESETS.find(f => f.id === frameId);
  const partMeta = frame && frame.parts.find(p => p.id === layoutPart.partId);
  const maskEntry = PRESET_MASKS[frameId] && PRESET_MASKS[frameId][layoutPart.partId];
  if(!partMeta || !maskEntry || !maskEntry.maskLines.length) return null;

  const w = partMeta.width, h = partMeta.height, scale = layout.scale;
  const path = maskEntry.maskLines[0];
  const shape = new THREE.Shape();
  path.forEach((pt, i) => {
    const lx = (pt.x - w / 2) * scale;
    const ly = (h / 2 - pt.y) * scale; // マス座標は下向きが正のため、3D空間の上向きに反転する
    if(i === 0) shape.moveTo(lx, ly); else shape.lineTo(lx, ly);
  });

  const geometry = new THREE.ExtrudeGeometry(shape, { depth: layout.depth, bevelEnabled: false, curveSegments: 2 });

  const found = findPixelDataForPart(frameId, layoutPart.partId);
  const fabricColor = document.body.classList.contains("dark") ? "#4a453c" : "#f4ecd8";
  const textureCanvas = found
    ? pixelsToTextureCanvas(found.pixelData, found.width, found.height, fabricColor)
    : pixelsToTextureCanvas(new Array(w * h).fill(null), w, h, fabricColor);
  const texture = new THREE.CanvasTexture(textureCanvas);
  if(THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(layoutPart.x, layoutPart.y, layoutPart.z);
  mesh.rotation.y = layoutPart.rotY || 0;
  art3DDisposables.push(geometry, material, texture);
  return mesh;
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

  layout.parts.forEach(layoutPart => {
    const mesh = buildPanelMesh(THREE, activeFrameId, layout, layoutPart);
    if(mesh) art3DScene.add(mesh);
  });

  art3DControls = new OrbitControlsClass(art3DCamera, art3DRenderer.domElement);
  art3DControls.enableDamping = true;
  art3DControls.dampingFactor = 0.08;
  art3DControls.enablePan = false;
  art3DControls.minDistance = 2;
  art3DControls.maxDistance = 12;

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
}

bind3DPreviewControls();
update3DPreviewButton(); // このスクリプトの読み込み前にinitArtEditor()が既に実行されているため、初回分をここで反映する
