// js/art-share-code.js
// 「アート」デザインの共有コード機能（あつ森のマイデザインのような文字列での
// エクスポート/インポート）。アカウント登録不要で、デザインをコードやURLとして
// 他の人と共有したり、端末変更前のバックアップとして使ったりできるようにする。
//
// パレットの色そのものは埋め込まず、共通パレット表（GAME_PALETTE_FLAT、
// js/art-config.js）への番号参照だけを持たせてデータ量を減らす。将来パレットの
// 並びを変える場合は、PALETTE_TABLESに新しいバージョンの表を追加し、
// SHARE_CODE_PALETTE_VERSIONを上げる。既存バージョンの表は消さずに残しておくことで、
// 古いバージョンのコードもそのまま復元できるようにする（後方互換）。
//
// コード構造： <lzStringで圧縮したJSON>.<簡易チェックサム>
// JSON側は [フォーマットバージョン, パレットバージョン, 幅, 高さ, デザイン枠ID,
//          パーツID, デザイン名, ランレングス配列] という順序固定の配列（キー名を
// 持たせずデータ量を減らす）。

const SHARE_CODE_FORMAT_VERSION = 1; // 符号化フォーマット自体のバージョン（配列の構造など）
const SHARE_CODE_PALETTE_VERSION = 1; // 参照するパレット表のバージョン
const SHARE_CODE_MAX_DIMENSION = 300; // 壊れたコードで極端に巨大な配列を作らないための安全上限

// パレット表のバージョン管理。将来GAME_PALETTEの並び順を変える場合は、ここに
// 新バージョンの表を追加すること（既存のgetterは消さない）
const SHARE_CODE_PALETTE_TABLES = {
  1: () => GAME_PALETTE_FLAT,
};

function getSharePaletteTable(version){
  const getter = SHARE_CODE_PALETTE_TABLES[version];
  return getter ? getter() : null;
}

function buildSharePaletteIndexMap(table){
  const map = new Map();
  table.forEach((entry, i) => map.set(entry.hex.toUpperCase(), i));
  return map;
}

// ── ランレングス圧縮（ドット絵特有の「同じ色が連続する」冗長性を圧縮する） ──
function shareRunLengthEncode(values){
  const runs = [];
  let i = 0;
  while(i < values.length){
    const v = values[i];
    let run = 1;
    while(i + run < values.length && values[i + run] === v) run++;
    runs.push(v, run);
    i += run;
  }
  return runs;
}

function shareRunLengthDecode(runs, expectedLength){
  if(!Array.isArray(runs) || runs.length % 2 !== 0) return null;
  const out = [];
  for(let i = 0; i < runs.length; i += 2){
    const v = runs[i], run = runs[i + 1];
    if(!Number.isInteger(v) || !Number.isInteger(run) || run <= 0) return null;
    if(out.length + run > expectedLength) return null;
    for(let j = 0; j < run; j++) out.push(v);
  }
  return out.length === expectedLength ? out : null;
}

// ── 簡易チェックサム（FNV-1a 32bit）。暗号的な強度は不要で、貼り付けミスの早期検知が目的 ──
function shareChecksum(str){
  let h = 0x811c9dc5;
  for(let i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

// ── エンコード：現在のデザインを共有コード文字列にする ──
// design: { width, height, pixelData, frameId, partId, name }
function encodeDesignToShareCode(design){
  const table = getSharePaletteTable(SHARE_CODE_PALETTE_VERSION);
  const indexMap = buildSharePaletteIndexMap(table);
  // 0=未着色、1以降=パレット表のindex+1（パレット外の色が万一残っていた場合も未着色扱いにする）
  const codeValues = design.pixelData.map(c => {
    if(!c) return 0;
    const idx = indexMap.get(String(c).toUpperCase());
    return idx === undefined ? 0 : idx + 1;
  });
  const runs = shareRunLengthEncode(codeValues);
  const payload = [
    SHARE_CODE_FORMAT_VERSION,
    SHARE_CODE_PALETTE_VERSION,
    design.width,
    design.height,
    design.frameId || "",
    design.partId || "",
    design.name || "",
    runs,
  ];
  const json = JSON.stringify(payload);
  const blob = LZString.compressToEncodedURIComponent(json);
  return `${blob}.${shareChecksum(blob)}`;
}

// ── デコード：共有コード文字列からデザインを復元する ──
// 成功時 { width, height, pixelData, frameId, partId, name }
// 失敗時 { error: "<T()用のi18nキー>" }
function decodeShareCode(code){
  const trimmed = String(code || "").trim();
  if(!trimmed) return { error: "art_share_code_empty" };

  const dot = trimmed.lastIndexOf(".");
  if(dot <= 0 || dot === trimmed.length - 1) return { error: "art_share_code_invalid" };
  const blob = trimmed.slice(0, dot);
  const checksum = trimmed.slice(dot + 1);
  if(shareChecksum(blob) !== checksum) return { error: "art_share_code_checksum" };

  let json = null;
  try{
    json = LZString.decompressFromEncodedURIComponent(blob);
  }catch(e){
    json = null;
  }
  if(!json) return { error: "art_share_code_invalid" };

  let payload;
  try{
    payload = JSON.parse(json);
  }catch(e){
    return { error: "art_share_code_invalid" };
  }
  if(!Array.isArray(payload) || payload.length < 8) return { error: "art_share_code_invalid" };

  const [formatVersion, paletteVersion, width, height, frameId, partId, name, runs] = payload;
  if(formatVersion !== SHARE_CODE_FORMAT_VERSION) return { error: "art_share_code_unsupported_version" };
  if(!Number.isInteger(width) || !Number.isInteger(height)
    || width <= 0 || height <= 0 || width > SHARE_CODE_MAX_DIMENSION || height > SHARE_CODE_MAX_DIMENSION){
    return { error: "art_share_code_invalid" };
  }
  const table = getSharePaletteTable(paletteVersion);
  if(!table) return { error: "art_share_code_unsupported_version" };

  const codeValues = shareRunLengthDecode(runs, width * height);
  if(!codeValues) return { error: "art_share_code_invalid" };

  const pixelData = codeValues.map(v => {
    if(v === 0) return null;
    const entry = table[v - 1];
    return entry ? entry.hex : null;
  });

  return {
    width, height, pixelData,
    frameId: typeof frameId === "string" && frameId ? frameId : null,
    partId: typeof partId === "string" && partId ? partId : null,
    name: typeof name === "string" ? name : "",
  };
}

// ── 共有URL ──
function buildShareUrl(code){
  const url = new URL(location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("d", code);
  return url.toString();
}
