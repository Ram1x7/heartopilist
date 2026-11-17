// js/art-pixelate.js
// 「アート」機能で共有する画像→ドット絵変換の純粋処理（js/art-converter.jsから抽出）。
// 元々art-converter.js（「画像から作る」）専用だったが、js/art-screenshot-import.js
// （「スクショから取り込む」）でも同じ変換処理が必要になったため、両者から呼べるよう
// 独立ファイルに切り出した。ここにある関数はDOM・モジュール外の状態に一切依存しない
// 純粋関数のみで、js/art-config.jsのGAME_PALETTE_FLAT / nearestGamePaletteHexだけを使う。

function drawPixelsToCanvas(canvas, pixels, w, h, maxBox){
  if(!canvas) return;
  const cell = Math.max(1, Math.floor(maxBox / Math.max(w, h)));
  canvas.width = w * cell;
  canvas.height = h * cell;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const c = pixels[y * w + x];
      if(c){
        ctx.fillStyle = c;
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }
}

// 中央基準でキャンバス比率(targetW:targetH)に合わせてクロップする範囲を求める（cover fit）
function coverCropRect(srcW, srcH, targetW, targetH){
  const srcRatio = srcW / srcH;
  const targetRatio = targetW / targetH;
  let sw, sh;
  if(srcRatio > targetRatio){
    sh = srcH;
    sw = srcH * targetRatio;
  }else{
    sw = srcW;
    sh = srcW / targetRatio;
  }
  return { sx: (srcW - sw) / 2, sy: (srcH - sh) / 2, sw, sh };
}

function applyBrightnessContrast(imgData, brightness, contrast){
  const d = imgData.data;
  const c = contrast / 100 + 1;
  const cOffset = 128 * (1 - c);
  const b = (brightness / 100) * 128;
  for(let i = 0; i < d.length; i += 4){
    for(let ch = 0; ch < 3; ch++){
      let v = d[i + ch] * c + cOffset + b;
      d[i + ch] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
}

function applyEdgeEnhance(imgData, level){
  const amount = { weak: 0.3, mid: 0.6, strong: 1.0 }[level] || 0;
  if(amount <= 0) return;
  const w = imgData.width, h = imgData.height;
  const src = new Uint8ClampedArray(imgData.data);
  const d = imgData.data;
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      for(let ch = 0; ch < 3; ch++){
        let sum = 0, ki = 0;
        for(let ky = -1; ky <= 1; ky++){
          for(let kx = -1; kx <= 1; kx++){
            const sx = Math.min(w - 1, Math.max(0, x + kx));
            const sy = Math.min(h - 1, Math.max(0, y + ky));
            sum += src[(sy * w + sx) * 4 + ch] * kernel[ki++];
          }
        }
        const idx = (y * w + x) * 4 + ch;
        const sharpened = sum < 0 ? 0 : sum > 255 ? 255 : sum;
        d[idx] = src[idx] * (1 - amount) + sharpened * amount;
      }
    }
  }
}

// ノイズ除去（3×3メディアンフィルタをstrengthの割合だけ元画像とブレンド）
function applyNoiseReduction(imgData, strength){
  const amount = strength / 100;
  if(amount <= 0) return;
  const w = imgData.width, h = imgData.height;
  const src = new Uint8ClampedArray(imgData.data);
  const d = imgData.data;
  const win = new Array(9);
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      for(let ch = 0; ch < 3; ch++){
        let wi = 0;
        for(let ky = -1; ky <= 1; ky++){
          for(let kx = -1; kx <= 1; kx++){
            const sx = Math.min(w - 1, Math.max(0, x + kx));
            const sy = Math.min(h - 1, Math.max(0, y + ky));
            win[wi++] = src[(sy * w + sx) * 4 + ch];
          }
        }
        win.sort((a, b) => a - b);
        const idx = (y * w + x) * 4 + ch;
        d[idx] = src[idx] * (1 - amount) + win[4] * amount;
      }
    }
  }
}

function computeBackgroundMask(imgData, mode){
  const w = imgData.width, h = imgData.height;
  const d = imgData.data;
  const mask = new Array(w * h).fill(false);
  if(mode === "keep") return mask;

  if(mode === "white"){
    for(let i = 0; i < w * h; i++){
      const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      if(r > 235 && g > 235 && b > 235) mask[i] = true;
    }
    return mask;
  }

  // auto: 四隅から連結する近似色領域を背景とみなす簡易フラッドフィル
  const threshold = 40;
  const visited = new Array(w * h).fill(false);
  const getColor = (x, y) => {
    const i = (y * w + x) * 4;
    return [d[i], d[i + 1], d[i + 2]];
  };
  const dist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
  const corners = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
  const stack = [];
  corners.forEach(([cx, cy]) => stack.push([cx, cy, getColor(cx, cy)]));
  while(stack.length){
    const [x, y, refColor] = stack.pop();
    if(x < 0 || y < 0 || x >= w || y >= h) continue;
    const idx = y * w + x;
    if(visited[idx]) continue;
    const col = getColor(x, y);
    if(dist(col, refColor) > threshold) continue;
    visited[idx] = true;
    mask[idx] = true;
    stack.push([x + 1, y, refColor], [x - 1, y, refColor], [x, y + 1, refColor], [x, y - 1, refColor]);
  }
  return mask;
}

// ── パレット生成 ──
// ゲーム内で実際に選べる色（js/art-config.jsのGAME_PALETTE、約125色）のみを使う。
// まず各ピクセルを最も近い固定パレット色に丸め、その出現頻度が多い上位n色を
// 「この変換で使う色」として残し、残りのピクセルもその上位n色の中から最も近い色に丸め直す
// （＝「125色の中から何色まで絞り込むか」を n で調整する）。
function buildPalette(imgData, n, bgMask){
  const d = imgData.data;
  const counts = new Map();
  for(let i = 0; i < bgMask.length; i++){
    if(bgMask[i]) continue;
    const hex = nearestGamePaletteHex([d[i * 4], d[i * 4 + 1], d[i * 4 + 2]]);
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  if(counts.size === 0) return [hexToRgb(GAME_PALETTE_FLAT[0].hex)];
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([hex]) => hexToRgb(hex));
}

// labPaletteは事前に各パレット色をrgbToLab()で変換した配列（呼び出し側で1回だけ作る）。
// パレット自体はピクセル数に対して小さく使い回されるため、ピクセルごとに毎回
// Lab変換をやり直すのではなく、ここで一度だけ変換して渡すことで無駄な再計算を避ける。
function nearestPaletteIndex(lab, labPalette){
  let best = 0, bestDist = Infinity;
  labPalette.forEach((p, i) => {
    const dist = labDistSq(lab, p);
    if(dist < bestDist){ bestDist = dist; best = i; }
  });
  return best;
}

function rgbToHex(rgb){
  return ("#" + rgb.map(v => {
    const n = Math.max(0, Math.min(255, Math.round(v)));
    return n.toString(16).padStart(2, "0");
  }).join("")).toUpperCase();
}

function mapToPalette(imgData, palette, bgMask){
  const w = imgData.width, h = imgData.height, d = imgData.data;
  const labPalette = palette.map(rgbToLab);
  const out = new Array(w * h).fill(null);
  for(let i = 0; i < w * h; i++){
    if(bgMask[i]) continue;
    const rgb = [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]];
    out[i] = rgbToHex(palette[nearestPaletteIndex(rgbToLab(rgb), labPalette)]);
  }
  return out;
}

// Lab色空間でのFloyd–Steinberg誤差拡散（js/build.jsのdiffuseLabErrorと同じ方式）。
// RGB空間で拡散すると量子化誤差が知覚的な色距離とズレるため、マッチングと同じ
// Lab空間で誤差を計算・伝播させる。
function ditherToPalette(imgData, palette, bgMask){
  const w = imgData.width, h = imgData.height;
  const labPalette = palette.map(rgbToLab);
  const labBuf = [];
  for(let i = 0; i < w * h; i++){
    labBuf.push(rgbToLab([imgData.data[i * 4], imgData.data[i * 4 + 1], imgData.data[i * 4 + 2]]));
  }
  const out = new Array(w * h).fill(null);
  const errors = new Array(w * h).fill(null);
  const spread = (x, y, err, dx, dy, factor) => {
    const nx = x + dx, ny = y + dy;
    if(nx < 0 || ny < 0 || nx >= w || ny >= h) return;
    const ni = ny * w + nx;
    if(bgMask[ni]) return;
    const add = [err[0] * factor, err[1] * factor, err[2] * factor];
    errors[ni] = errors[ni]
      ? [errors[ni][0] + add[0], errors[ni][1] + add[1], errors[ni][2] + add[2]]
      : add;
  };
  for(let y = 0; y < h; y++){
    for(let x = 0; x < w; x++){
      const i = y * w + x;
      if(bgMask[i]) continue;
      const lab = labBuf[i];
      const err = errors[i];
      const dithered = err ? [lab[0] + err[0], lab[1] + err[1], lab[2] + err[2]] : lab;
      const idx = nearestPaletteIndex(dithered, labPalette);
      const nearest = palette[idx];
      out[i] = rgbToHex(nearest);
      const matchLab = labPalette[idx];
      const diff = [lab[0] - matchLab[0], lab[1] - matchLab[1], lab[2] - matchLab[2]];
      spread(x, y, diff, 1, 0, 7 / 16);
      spread(x, y, diff, -1, 1, 3 / 16);
      spread(x, y, diff, 0, 1, 5 / 16);
      spread(x, y, diff, 1, 1, 1 / 16);
    }
  }
  return out;
}
