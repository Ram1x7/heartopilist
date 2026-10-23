// Pillar fronts are 1 unit wide and 2 units tall. Preserve the image's physical aspect.
export function pillarMuralDimensions(value, aspect, basis='width') {
  if(!Number.isFinite(value) || value<1 || !Number.isFinite(aspect) || aspect<=0) throw new Error('壁画のサイズが不正です');
  let w=basis==='height'?value*aspect*2:value;
  let h=basis==='height'?value:value/aspect/2;
  const scale=Math.min(1,96/w,17/h);
  w=Math.max(1,Math.min(96,Math.round(w*scale)));
  h=Math.max(1,Math.min(17,Math.round(h*scale)));
  return {w,h,d:1};
}
export function buildPillarMural(grid,w,h) {
  const pieces=[];
  for(let row=0;row<h;row++) for(let x=0;x<w;x++) {
    const material=grid.cells[row*w+x];
    if(material) pieces.push({x,y:h-1-row,z:0,materialId:material.materialId,hex:material.hex,name:material.name});
  }
  return pieces;
}
