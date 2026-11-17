// Approximate display shapes. Pattern regions stay in their original canvas coordinates.
export function buildFurniture(THREE,parts,kind,activeRole='front'){
  const positions=[],uvs=[],indices=[],groups=[];
  function bounds(role,region=0){
    const path=parts[role].maskLines[region];
    return {x0:Math.min(...path.map(p=>p.x)),x1:Math.max(...path.map(p=>p.x)),y0:Math.min(...path.map(p=>p.y)),y1:Math.max(...path.map(p=>p.y))};
  }
  function patch(role,map,region=0,steps=12){
    const part=parts[role],b=bounds(role,region),base=positions.length/3,start=indices.length;
    for(let y=0;y<=steps;y++)for(let x=0;x<=steps;x++){
      const u=x/steps,v=y/steps;positions.push(...map(u,v));
      uvs.push((b.x0+(b.x1-b.x0)*u)/part.width,1-(b.y1-(b.y1-b.y0)*v)/part.height);
    }
    for(let y=0;y<steps;y++)for(let x=0;x<steps;x++){
      const a=base+y*(steps+1)+x,b=a+1,c=a+steps+2,d=a+steps+1;indices.push(a,b,c,a,c,d);
    }
    groups.push({start,count:indices.length-start,role});
  }
  function solid(role,geometry,color='#c8b99b'){
    const g=geometry.toNonIndexed(),base=positions.length/3,start=indices.length;
    positions.push(...g.attributes.position.array);uvs.push(...g.attributes.uv.array);
    for(let i=0;i<g.attributes.position.count;i++)indices.push(base+i);
    groups.push({start,count:indices.length-start,role,solidColor:color});g.dispose();geometry.dispose();
  }
  const box=(role,w,h,d,x,y,z,color)=>solid(role,new THREE.BoxGeometry(w,h,d).translate(x,y,z),color);
  const cylinder=(role,top,bottom,h,x,y,z,color)=>solid(role,new THREE.CylinderGeometry(top,bottom,h,48).translate(x,y,z),color);
  function front(role,w,h,x,y,z,region=0,flip=false){patch(role,(u,v)=>[x+(flip?.5-u:u-.5)*w,y+(v-.5)*h,z],region);}
  function top(role,w,d,x,y,z){patch(role,(u,v)=>[x+(u-.5)*w,y,z+(.5-v)*d]);}
  function legs(role,w,d,height,y){for(const x of [-1,1])for(const z of [-1,1])box(role,.045,height,.045,x*w/2,y,z*d/2);}
  if(kind==='book'){
    const role=activeRole==='wide'?'wide':'front';
    const regions=parts[role].maskLines.map((_,i)=>({i,b:bounds(role,i)})).sort((a,b)=>a.b.x0-b.b.x0);
    const spine=regions[1],cover=regions[2],back=regions[0];
    box(role,.58,.8,.09,0,0,0,'#eee8dc');
    front(role,.62,.84,0,0,.055,cover.i);front(role,.62,.84,0,0,-.055,back.i,true);
    patch(role,(u,v)=>[-.315,(v-.5)*.84,(u-.5)*.11],spine.i);
  }else if(kind==='single_bed'||kind==='double_bed'){
    const w=kind==='double_bed'?1.06:.66;
    box('back',w,.12,1.25,0,.02,0);legs('back',w-.08,1.08,.22,-.14);
    box('back',w+.04,.42,.06,0,.23,-.62);box('back',w+.04,.24,.05,0,.14,.62);
    const regions=parts.back.maskLines.map((_,i)=>({i,b:bounds('back',i)})).sort((a,b)=>a.b.y0-b.b.y0);
    front('back',w,.36,0,.25,-.582,regions[0].i);front('back',w,.20,0,.14,.651,regions[1].i);
    patch('front',(u,v)=>[(u-.5)*w*1.15,.13-Math.pow(Math.max(0,Math.abs(2*u-1)-.75)/.25,2)*.13,(.5-v)*1.12],0,32);
  }else if(kind==='closet'||kind==='nightstand'){
    const tall=kind==='closet',w=tall?.7:.6,h=tall?1.1:.48,d=tall?.35:.45;
    box('front',w,h,d,0,0,0);front('front',w-.035,h-.035,0,0,d/2+.003);
    if(tall){box('front',.014,h-.02,.01,0,0,d/2+.006);for(const x of [-.04,.04])box('front',.012,.12,.025,x,0,d/2+.02,'#826c48');}
    else{legs('front',w-.08,d-.08,.12,-h/2-.06);box('front',.11,.018,.025,0,0,d/2+.02,'#826c48');}
  }else if(kind==='low_table'){
    box('front',1,.07,.46,0,.2,0);top('front',1,.46,0,.237,0);legs('front',.85,.33,.35,-.01);
  }else if(kind==='chair'){
    box('top',.56,.07,.5,0,.12,0);top('top',.56,.5,0,.157,0);legs('top',.46,.4,.4,-.115);
    for(const x of [-.24,.24])box('front',.045,.7,.045,x,.2,-.22);
    box('front',.54,.28,.045,0,.44,-.22);front('front',.53,.27,0,.44,-.194);front('back',.53,.27,0,.44,-.246,0,true);
  }else if(kind==='double_sofa'||kind==='single_sofa'){
    const w=kind==='double_sofa'?1.2:.62;
    box('back',w,.22,.62,0,-.1,0);legs('back',w-.1,.45,.12,-.26);
    box('front',w,.52,.14,0,.18,-.27);front('front',w-.03,.49,0,.18,-.195);front('front',w-.03,.49,0,.18,-.345,0,true);
    top('back',w-.06,.48,0,.018,.05);
    for(const x of [-1,1])box('front',.13,.34,.66,x*(w/2+.015),.035,0);
  }else if(kind==='table_lamp'||kind==='floor_lamp'){
    const tall=kind==='floor_lamp',base=tall?-.65:-.4,shadeBottom=tall?.2:.04,shadeHeight=tall?.4:.32;
    cylinder('top',.25,.27,.05,0,base,0);cylinder('top',.022,.022,shadeBottom-base,0,(shadeBottom+base)/2,0,'#a7977b');
    for(const [role,start] of [['front',-Math.PI/2],['back',Math.PI/2]])patch(role,(u,v)=>{const a=start+u*Math.PI,r=.25-v*.08;return [Math.sin(a)*r,shadeBottom+v*shadeHeight,Math.cos(a)*r];},0,32);
    patch('top',(u,v)=>{const a=2*Math.PI*u;return [Math.sin(a)*.265,base+(v-.5)*.04,Math.cos(a)*.265];},0,32);
  }else throw new Error('Unsupported item model');
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
  groups.forEach((g,i)=>geometry.addGroup(g.start,g.count,i));geometry.computeVertexNormals();
  return {geometry,groups};
}
