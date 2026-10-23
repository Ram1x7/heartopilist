import {validateFreePillar} from './build-placement.mjs';
// Confirmed by in-game measurements, 2026-10-22. Floor width = 1 tile.
export const BUILD_RULES = Object.freeze({
  widthTiles: 24, depthTiles: 30, pillarWidth: 0.25,
  pillarLayers: 17, wallLayers: 13, floorMaxLevel: 12,
  // Height and thickness remain estimates, not verified game units.
  estimatedLayerHeight: 0.5, estimatedWallThickness: 0.05,
});

// Colors never create another surcharge. Floors/walls have independent patterns.
// A design starts on an empty site; existing building costs must be added separately.
export function calculateLoad(items) {
  const pillars = new Map(), wallPatterns = new Set(), floorPatterns = new Set();
  let walls = 0, floors = 0;
  for (const item of items) {
    if (['005', '006', '007'].includes(item.materialId)) {
      pillars.set(item.materialId, (pillars.get(item.materialId) || 0) + 1);
    } else if (item.kind === 'wall' || item.materialId === '008') {
      if (!item.patternId) throw new Error('低い壁の模様が未指定です');
      walls++; wallPatterns.add(item.patternId);
    } else if (item.kind === 'floor') {
      if (!item.patternId) throw new Error('床の模様が未指定です');
      floors++; floorPatterns.add(item.patternId);
    } else throw new Error('未対応の建材です');
  }
  const pillarLoad = [...pillars.values()].reduce((sum, n) => sum + 190 + 10 * n, 0);
  return pillarLoad + 20 * walls + 190 * wallPatterns.size
    + (floors ? 190 + 20 * floors + 190 * floorPatterns.size : 0);
}

export function validateGrid(items, dims, mode) {
  if (!['solid','flat','wall','pillar-wall'].includes(mode)) throw new Error('未対応の建築モードです');
  const wall = mode === 'wall';
  const maxW = wall ? BUILD_RULES.widthTiles : BUILD_RULES.widthTiles * 4;
  const maxH = wall ? BUILD_RULES.wallLayers : BUILD_RULES.pillarLayers;
  const maxD = wall ? 1 : BUILD_RULES.depthTiles * 4;
  const integerBetween = (n, max) => Number.isInteger(n) && n > 0 && n <= max;
  if (!dims || !integerBetween(dims.w, maxW) || !integerBetween(dims.h, maxH)
      || (!wall && !integerBetween(dims.d, maxD))) throw new Error('設計図の寸法が建築範囲を超えています');
  if (!Array.isArray(items) || items.length > maxW * maxH * maxD) throw new Error('配置データの個数が不正です');
  if(mode === 'pillar-wall' && dims.d !== 1) throw new Error('支柱の壁画は奥行き1本分です');
  const seen = new Set();
  for (const v of items) {
    if (v?.freePlacement === true && ['solid','pillar-wall'].includes(mode)) {
      if (!/^#[0-9a-f]{6}$/i.test(v.hex) || !['005','006','007'].includes(v.materialId)) throw new Error('未対応の建材です');
      validateFreePillar(v,dims);
      continue; // Intentional overlaps each count as a separate piece.
    }
    if (!v || v.freePlacement === true || ['rx','ry','rz'].some(k=>v[k] !== undefined && v[k] !== 0) || !Number.isInteger(v.x) || v.x < 0 || v.x >= dims.w
        || !Number.isInteger(v.y) || v.y < 0 || v.y >= dims.h
        || (!wall && (!Number.isInteger(v.z) || v.z < 0 || v.z >= dims.d))
        || !/^#[0-9a-f]{6}$/i.test(v.hex)
        || !(wall ? v.materialId === '008' : ['005','006','007'].includes(v.materialId))) {
      throw new Error('設計図に範囲外の配置または未対応の建材があります');
    }
    const key = wall ? `${v.x},${v.y}` : `${v.x},${v.y},${v.z}`;
    if (seen.has(key)) throw new Error('設計図に重複配置があります');
    seen.add(key);
  }
}
