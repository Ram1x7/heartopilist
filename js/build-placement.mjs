// Coordinates use pillar widths for X/Z, pillar heights for Y. Rotations are XYZ degrees.
export function pillarBounds(v) {
  const [x,y,z]=['rx','ry','rz'].map(k=>(v[k]||0)*Math.PI/360);
  const [s1,s2,s3,c1,c2,c3]=[Math.sin(x),Math.sin(y),Math.sin(z),Math.cos(x),Math.cos(y),Math.cos(z)];
  const qx=s1*c2*c3+c1*s2*s3, qy=c1*s2*c3-s1*c2*s3;
  const qz=c1*c2*s3+s1*s2*c3, qw=c1*c2*c3-s1*s2*s3;
  const m=[
    [1-2*(qy*qy+qz*qz),2*(qx*qy-qz*qw),2*(qx*qz+qy*qw)],
    [2*(qx*qy+qz*qw),1-2*(qx*qx+qz*qz),2*(qy*qz-qx*qw)],
    [2*(qx*qz-qy*qw),2*(qy*qz+qx*qw),1-2*(qx*qx+qy*qy)],
  ];
  const e=m.map(row=>Math.abs(row[0])*0.5+Math.abs(row[1])+Math.abs(row[2])*0.5);
  return {minX:v.x+0.5-e[0],maxX:v.x+0.5+e[0],minY:(v.y*2+1-e[1])/2,maxY:(v.y*2+1+e[1])/2,minZ:v.z+0.5-e[2],maxZ:v.z+0.5+e[2]};
}
export function validateFreePillar(v,dims) {
  if (!['x','y','z'].every(k=>typeof v[k]==='number' && Number.isFinite(v[k]))
      || !['rx','ry','rz'].every(k=>v[k]===undefined || (typeof v[k]==='number' && Number.isFinite(v[k]) && Math.abs(v[k])<=360))) throw new Error('自由配置の座標・角度が不正です');
  const b=pillarBounds(v), eps=1e-8;
  if(b.minX < -eps || b.minY < -eps || b.minZ < -eps || b.maxX > dims.w+eps || b.maxY > dims.h+eps || b.maxZ > dims.d+eps) throw new Error('回転後の支柱全体を指定範囲内に収めてください');
  return v;
}
