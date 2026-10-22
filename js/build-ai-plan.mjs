// AI describes a small set of shapes. Deterministic code expands them into pillars.
export const PLAN_SCHEMA = {
  type: 'object', required: ['title', 'shapes'], additionalProperties: false,
  properties: {
    title: {type: 'string', maxLength: 80},
    shapes: {type: 'array', minItems: 1, maxItems: 40, items: {
      type: 'object', additionalProperties: false,
      required: ['shape','op','x','y','z','w','h','d','materialId','hex'],
      properties: {
        shape: {type:'string', enum:['box','ellipsoid','cone']},
        op: {type:'string', enum:['add','subtract']},
        ...Object.fromEntries(['x','y','z'].map(k => [k,{type:'integer',minimum:0}])),
        ...Object.fromEntries(['w','h','d'].map(k => [k,{type:'integer',minimum:1}])),
        materialId: {type:'string',enum:['005','006','007']},
        hex: {type:'string',pattern:'^#[0-9a-fA-F]{6}$'},
      },
    }},
  },
};

export function validatePlan(plan, limits) {
  if (!limits || !Number.isInteger(limits.w) || limits.w < 4 || limits.w > 96
      || !Number.isInteger(limits.h) || limits.h < 2 || limits.h > 17
      || !Number.isInteger(limits.d) || limits.d < 4 || limits.d > 120) throw new Error('生成サイズが不正です');
  if (!plan || typeof plan.title !== 'string' || plan.title.length > 80
      || !Array.isArray(plan.shapes) || plan.shapes.length < 1 || plan.shapes.length > 40) throw new Error('AIの設計形式が不正です');
  for (const s of plan.shapes) {
    if (!['box','ellipsoid','cone'].includes(s.shape) || !['add','subtract'].includes(s.op)
        || !['005','006','007'].includes(s.materialId) || !/^#[0-9a-f]{6}$/i.test(s.hex)) throw new Error('AIの建材指定が不正です');
    for (const [pos, size, max] of [['x','w',limits.w],['y','h',limits.h],['z','d',limits.d]]) {
      if (!Number.isInteger(s[pos]) || !Number.isInteger(s[size]) || s[pos] < 0
          || s[size] < 1 || s[pos] + s[size] > max) throw new Error('AIの設計が指定範囲を超えています');
    }
  }
  return plan;
}

export function expandPlan(plan, limits, materials) {
  validatePlan(plan, limits);
  const cells = new Map();
  const rgb = hex => [1,3,5].map(i => parseInt(hex.slice(i,i+2),16));
  for (const s of plan.shapes) {
    const material = materials.find(m => m.id === s.materialId);
    if (!material || !material.colors?.length) throw new Error('利用できない建材です');
    const target = rgb(s.hex);
    const distance = hex => rgb(hex).reduce((sum,n,i) => sum+(n-target[i])**2,0);
    const hex = material.colors.reduce((best,c) => distance(c) < distance(best) ? c : best);
    for (let y=0;y<s.h;y++) for (let z=0;z<s.d;z++) for (let x=0;x<s.w;x++) {
      const nx = (x+0.5)/s.w*2-1, nz = (z+0.5)/s.d*2-1;
      const ny = (y+0.5)/s.h*2-1;
      if (s.shape === 'ellipsoid' && nx*nx+ny*ny+nz*nz > 1) continue;
      if (s.shape === 'cone' && nx*nx+nz*nz > (1-y/s.h)**2) continue;
      const key = `${s.x+x},${s.y+y},${s.z+z}`;
      if (s.op === 'subtract') cells.delete(key);
      else cells.set(key,{x:s.x+x,y:s.y+y,z:s.z+z,materialId:material.id,name:material.name,hex});
    }
    if (cells.size > 30000) throw new Error('建材数が試験版の上限30,000本を超えました。サイズを小さくしてください');
  }
  if (!cells.size) throw new Error('AIの設計に建材がありません');
  return [...cells.values()];
}
