// Original lightweight preview geometry. Coordinates are a visual approximation,
// not an imported game model. Every surface retains explicit pattern-space UVs.
export function buildTshirt(THREE, parts) {
  const meshes = [];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b-a)*t;
  function span(part, y) {
    const path = part.maskLines[0], xs = [];
    for(let i=0; i<path.length; i++) {
      const a=path[i], b=path[(i+1)%path.length];
      if((a.y<=y && b.y>y) || (b.y<=y && a.y>y)) xs.push(a.x+(b.x-a.x)*(y-a.y)/(b.y-a.y));
    }
    return xs.length ? [Math.min(...xs), Math.max(...xs)] : [2, part.width-2];
  }
  function topAt(part, x) {
    const ys=[], path=part.maskLines[0];
    for(let i=0;i<path.length;i++) {
      const a=path[i],b=path[(i+1)%path.length];
      if((a.x<=x && b.x>x)||(b.x<=x && a.x>x)) ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));
    }
    return ys.length ? Math.min(...ys) : 8;
  }
  function surface(role, nu, nv, sample) {
    const positions=[],uvs=[],indices=[];
    for(let v=0;v<=nv;v++) for(let u=0;u<=nu;u++) {
      const p=sample(u/nu,v/nv);
      positions.push(...p.position); uvs.push(p.x/parts[role].width,1-p.y/parts[role].height);
    }
    for(let v=0;v<nv;v++) for(let u=0;u<nu;u++) {
      const a=v*(nu+1)+u,b=a+nu+1;
      indices.push(a,b,a+1,a+1,b,b+1);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    meshes.push({role,geometry});
  }
  for(const role of ['front','back']) {
    const part=parts[role], sign=role==='front'?1:-1;
    surface(role,64,32,(u,v)=>{
      const angle=(u-.5)*Math.PI, across=Math.sin(angle);
      const topX=lerp(11.01,52.99,u), ty=topAt(part,topX);
      const neck=clamp((ty-8)/8,0,1);
      const topY=.47-.055*Math.abs(across)-.14*neck;
      const width=lerp(.32,.35,v);
      const y=lerp(ty+.12,69.8,v), [x0,x1]=span(part,y);
      return {position:[sign*width*across,lerp(topY,-.48,v),sign*(.135+.025*v)*Math.cos(angle)],
        x:lerp(x0+.15,x1-.15,u), y};
    });
  }
  for(const role of ['leftSleeve','rightSleeve']) {
    const part=parts[role], sign=role==='leftSleeve'?1:-1;
    surface(role,48,16,(u,v)=>{
      const a=u*Math.PI*2, radius=lerp(.155,.125,v);
      const cx=sign*lerp(.295,.60,v),cy=lerp(.29,.11,v);
      const x=lerp(6.2,57.8,u),ty=topAt(part,x);
      return {position:[cx+sign*.38*radius*Math.cos(a),cy+.925*radius*Math.cos(a),radius*Math.sin(a)],
        x,y:lerp(ty+.15,37.8,v)};
    });
  }
  return meshes;
}
