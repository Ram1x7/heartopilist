import { buildPatternGarment } from './pattern-garment.js';

// Keep the editor's role IDs independent of the geometry module's part names.
export const MODEL_ROLES=Object.freeze({front:'front',back:'back',sleeve:'leftSleeve',sleeveR:'rightSleeve'});
let cachedShape=null,cachedKey='';
export function buildTshirt(THREE,parts) {
  const face=role=>{
    const part=parts[role],path=part.maskLines[0];
    const closed=path[0].x===path.at(-1).x && path[0].y===path.at(-1).y;
    return {w:part.width,h:part.height,outline:closed?path.slice(0,-1):path.slice()};
  };
  const faces={front:face('front'),back:face('back'),sleeve:face('leftSleeve'),sleeveR:face('rightSleeve')};
  const key=JSON.stringify(faces);
  if(!cachedShape || cachedKey!==key){cachedShape=buildPatternGarment(faces,.15,'tshirt');cachedKey=key;}
  const mesh=cachedShape;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(mesh.positions.slice(),3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(mesh.normals.slice(),3));
  geometry.setAttribute('uv',new THREE.BufferAttribute(mesh.uvs.slice(),2));
  geometry.setIndex(new THREE.BufferAttribute(mesh.indices.slice(),1));
  mesh.groups.forEach((group,i)=>geometry.addGroup(group.start,group.count,i));
  return {geometry,groups:mesh.groups.map(group=>({...group,role:MODEL_ROLES[group.part]}))};
}
