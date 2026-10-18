import { buildPatternGarment } from './pattern-garment.js';

// Cache only the last shape to bound memory when changing garment types.
let cachedShape=null,cachedKey='';
export function buildGarment(THREE,parts,kind='tshirt') {
  const aliases={leftSleeve:'sleeve',rightSleeve:'sleeveR'};
  const roles=Object.fromEntries(Object.keys(parts).map(role=>[aliases[role]||role,role]));
  const faces=Object.fromEntries(Object.entries(parts).map(([role,part])=>{
    const regions=part.maskLines.map(path=>{
      const closed=path[0].x===path.at(-1).x && path[0].y===path.at(-1).y;
      return closed?path.slice(0,-1):path.slice();
    });
    return [aliases[role]||role,{w:part.width,h:part.height,outline:regions[0],regions}];
  }));
  const key=JSON.stringify([kind,faces]);
  if(!cachedShape || cachedKey!==key){cachedShape=buildPatternGarment(faces,.15,kind);cachedKey=key;}
  const mesh=cachedShape;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(mesh.positions.slice(),3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(mesh.normals.slice(),3));
  geometry.setAttribute('uv',new THREE.BufferAttribute(mesh.uvs.slice(),2));
  geometry.setIndex(new THREE.BufferAttribute(mesh.indices.slice(),1));
  mesh.groups.forEach((group,index)=>geometry.addGroup(group.start,group.count,index));
  return {geometry,groups:mesh.groups.map(group=>({...group,role:roles[group.part]||(group.part==='sleeveR'?roles.sleeve:null)||roles.front}))};
}
