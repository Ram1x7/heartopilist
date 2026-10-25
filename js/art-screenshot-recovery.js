// Screenshot restoration: preserve cell boundaries and recover palette colors locally.
const HatopiScreenshotRecovery = (() => {
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function guideField(image){
    const {width:w,height:h,data:d}=image,light=new Uint8Array(w*h),neutral=new Uint8Array(w*h),field=new Float32Array(w*h);
    for(let i=0;i<light.length;i++){const r=d[i*4],g=d[i*4+1],b=d[i*4+2];light[i]=Math.min(r,g,b);neutral[i]=Math.max(r,g,b)-light[i]<42?1:0;}
    const radius=2;
    for(let y=radius;y<h-radius;y++)for(let x=radius;x<w-radius;x++){
      const i=y*w+x;if(!neutral[i])continue;
      const center=light[i];let strength=0;
      for(const delta of [radius,radius*w,radius*(w+1),radius*(w-1)]){
        const a=light[i-delta],b=light[i+delta];
        if(center>155)strength=Math.max(strength,Math.min(a,b)<center-24?(center-Math.max(a,b))/100:0);
        if(Math.min(a,b)>170)strength=Math.max(strength,(Math.min(a,b)-center)/100);
      }
      field[i]=clamp(strength,0,1);
    }
    return {data:field,width:w,height:h};
  }
  function at(field,x,y){
    const {width:w,height:h,data}=field;
    if(x<0||y<0||x>=w-1||y>=h-1)return 0;
    const ix=Math.floor(x),iy=Math.floor(y),dx=x-ix,dy=y-iy,i=iy*w+ix;
    return (data[i]*(1-dx)+data[i+1]*dx)*(1-dy)+(data[i+w]*(1-dx)+data[i+w+1]*dx)*dy;
  }
  function pathPoints(paths,spacing=2){
    const points=[];
    for(const path of paths||[])for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i],steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/spacing));
      for(let n=0;n<steps;n++)points.push({x:a.x+(b.x-a.x)*(n+.5)/steps,y:a.y+(b.y-a.y)*(n+.5)/steps});
    }
    return points;
  }
  function fitScore(field,points,rect,width,height){
    if(!points.length)return 0;
    let total=0;
    for(const p of points)total+=at(field,rect.x+p.x*rect.w/width,rect.y+p.y*rect.h/height);
    return total/points.length;
  }
  function refineGuide(field,paths,rect,width,height){
    const points=pathPoints(paths),initial=fitScore(field,points,rect,width,height);let best={...rect},score=initial;
    const pitch=(rect.w/width+rect.h/height)/2;
    // Joint scale/translation seeds avoid getting trapped on a neighboring grid
    // line when coordinate descent changes one parameter at a time.
    for(let si=-4;si<=4;si++)for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++){
      const w=rect.w*(1+si*.01),h=rect.h*(1+si*.01);
      const next={x:rect.x+(rect.w-w)/2+dx*pitch*.5,y:rect.y+(rect.h-h)/2+dy*pitch*.5,w,h};
      const value=fitScore(field,points,next,width,height);
      if(value>score){best=next;score=value;}
    }
    for(const step of [Math.min(5,pitch),1,.25])for(let iter=0;iter<12;iter++){
      let improved=false;
      for(const [dx,dy,ds] of [[step,0,0],[-step,0,0],[0,step,0],[0,-step,0],[0,0,step/Math.max(width,height)],[0,0,-step/Math.max(width,height)]]){
        const next={x:best.x+dx,y:best.y+dy,w:best.w+ds*width,h:best.h+ds*height};
        if(next.w<=0||next.h<=0||Math.abs(next.x-rect.x)>pitch*2||Math.abs(next.y-rect.y)>pitch*2||Math.abs(next.w/rect.w-1)>.08)continue;
        const value=fitScore(field,points,next,width,height);
        if(value>score+.0001){best=next;score=value;improved=true;}
      }
      if(!improved)break;
    }
    return {rect:score>=.2?best:{...rect},score,improved:score>=.2&&score>initial+.01};
  }
  function cellMask(width,height,paths=[],disabledRanges){
    const mask=new Uint8Array(width*height);
    if(Array.isArray(disabledRanges)){
      if(paths.length)mask.set(cellMask(width,height,paths));else mask.fill(1);for(const [y,x0,x1] of disabledRanges)if(y>=0&&y<height)for(let x=Math.max(0,x0);x<=Math.min(width-1,x1);x++)mask[y*width+x]=0;
      return mask;
    }
    if(!paths.length){mask.fill(1);return mask;}
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      for(const path of paths){let inside=false;
        for(let i=0,j=path.length-1;i<path.length;j=i++){
          const a=path[i],b=path[j];if((a.y>y+.5)!==(b.y>y+.5)&&x+.5<(b.x-a.x)*(y+.5-a.y)/(b.y-a.y)+a.x)inside=!inside;
        }
        if(inside){mask[y*width+x]=1;break;}
      }
    }
    return mask;
  }
  function alignGrid(image,rect,width,height,mask){
    const {data:d,width:iw,height:ih}=image;
    function axis(horizontal){
      const n=horizontal?width:height,start=horizontal?rect.x:rect.y,extent=horizontal?rect.w:rect.h,pitch=extent/n;
      if(pitch<2)return null;
      const length=horizontal?iw:ih,profile=new Float64Array(length),counts=new Uint16Array(length);
      const other=horizontal?height:width;
      for(let row=0;row<other;row+=Math.max(1,Math.ceil(other/80))){
        const cross=(horizontal?rect.y:rect.x)+(row+.5)*(horizontal?rect.h/height:rect.w/width);
        if(cross<1||cross>=(horizontal?ih:iw)-1)continue;
        for(let p=Math.max(1,Math.floor(start));p<Math.min(length-1,start+extent);p++){
          const col=clamp(Math.floor((p-start)/pitch),0,n-1),mi=horizontal?row*width+col:col*width+row;
          if(!mask[mi])continue;
          const index=horizontal?(Math.floor(cross)*iw+p)*4:(p*iw+Math.floor(cross))*4,delta=horizontal?4:iw*4;
          let value=0;for(let c=0;c<3;c++)value+=Math.abs(d[index+delta+c]-d[index-delta+c]);
          profile[p]+=Math.min(300,value);counts[p]++;
        }
      }
      let energy=0,used=0;
      for(let p=0;p<length;p++)if(counts[p]){profile[p]/=counts[p];energy+=profile[p];used++;}
      const mean=energy/Math.max(1,used);if(mean<1)return null;
      const read=p=>{if(p<0||p>=length-1)return 0;const i=Math.floor(p),f=p-i;return profile[i]*(1-f)+profile[i+1]*f;};
      const score=(offset,period)=>{let total=0;for(let i=1;i<n;i++)total+=read(offset+i*period-.5)-.7*read(offset+(i-.5)*period-.5);return total/Math.max(1,n-1);};
      const original=score(start,pitch);let best={offset:start,period:pitch,score:original};
      for(let si=-15;si<=15;si++){
        const period=pitch*(1+si*.002);
        for(let phase=-10;phase<=10;phase++){
          const offset=start+phase*pitch*.04-(period-pitch)*n/2;
          if(offset<0||offset+period*n>length)continue;
          const value=score(offset,period)-mean*.03*(Math.abs(phase)/10+Math.abs(si)/15);
          if(value>best.score)best={offset,period,score:value};
        }
      }
      return best.score>mean*.35&&best.score>original+mean*.07?best:null;
    }
    const x=axis(true),y=axis(false),out={...rect};
    if(x){out.x=x.offset;out.w=x.period*width;}if(y){out.y=y.offset;out.h=y.period*height;}
    // Non-square matches usually indicate an unrelated repeating pattern; keep the user's rectangle.
    if(Math.abs(out.w/width-out.h/height)/Math.max(out.w/width,out.h/height)>.12)return {rect:{...rect},improved:false};
    return {rect:out,improved:!!(x||y)};
  }
  function guideMask(image,rect,width,height,paths,field){
    const mask=new Uint8Array(image.width*image.height),pitch=Math.min(rect.w/width,rect.h/height),radius=Math.max(.7,Math.min(2.5,pitch*.16));
    for(const path of paths||[])for(let i=1;i<path.length;i++){
      const ax=rect.x+path[i-1].x*rect.w/width,ay=rect.y+path[i-1].y*rect.h/height;
      const bx=rect.x+path[i].x*rect.w/width,by=rect.y+path[i].y*rect.h/height;
      const dx=bx-ax,dy=by-ay,den=dx*dx+dy*dy;
      for(let y=Math.max(0,Math.floor(Math.min(ay,by)-radius));y<=Math.min(image.height-1,Math.ceil(Math.max(ay,by)+radius));y++)for(let x=Math.max(0,Math.floor(Math.min(ax,bx)-radius));x<=Math.min(image.width-1,Math.ceil(Math.max(ax,bx)+radius));x++){
        const t=den?clamp(((x+.5-ax)*dx+(y+.5-ay)*dy)/den,0,1):0;
        if(Math.hypot(x+.5-ax-t*dx,y+.5-ay-t*dy)<=radius&&field.data[y*image.width+x]>.15)mask[y*image.width+x]=1;
      }
    }
    return mask;
  }
  function recover(image,rect,width,height,options={}){
    const paths=options.maskLines||[],mask=cellMask(width,height,paths,options.disabledRanges);
    const field=options.field||guideField(image),excluded=options.removeGuides===false?new Uint8Array(image.width*image.height):guideMask(image,rect,width,height,paths,field);
    const pixels=new Array(width*height).fill(null),raw=new Uint8ClampedArray(width*height*4),samples=[],exact=new Map();
    for(const p of GAME_PALETTE_FLAT)exact.set(p.hex.toUpperCase(),p.hex.toUpperCase());
    let unreadable=0,guideSamples=0,weak=0;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const cell=y*width+x;if(!mask[cell])continue;
      const groups=new Map(),seen=new Set();let total=0;
      function gather(low,high){
        for(let sy=0;sy<5;sy++)for(let sx=0;sx<5;sx++){
          const ix=Math.floor(rect.x+(x+low+(high-low)*(sx+.5)/5)*rect.w/width),iy=Math.floor(rect.y+(y+low+(high-low)*(sy+.5)/5)*rect.h/height);
          if(ix<0||iy<0||ix>=image.width||iy>=image.height)continue;
          const index=iy*image.width+ix;if(seen.has(index))continue;seen.add(index);
          if(excluded[index]){guideSamples++;continue;}
          const i=index*4;if(image.data[i+3]<128)continue;
          const r=image.data[i],g=image.data[i+1],b=image.data[i+2],key=(r>>3)*1024+(g>>3)*32+(b>>3);
          let group=groups.get(key);if(!group){group={r:0,g:0,b:0,count:0};groups.set(key,group);}
          group.r+=r;group.g+=g;group.b+=b;group.count++;total++;
        }
      }
      gather(.24,.76);if(!total)gather(.08,.92);
      if(!total){unreadable++;continue;}
      const group=[...groups.values()].sort((a,b)=>b.count-a.count)[0];
      const rgb=[group.r,group.g,group.b].map(v=>Math.round(v/group.count));
      if(group.count/total<.55)weak++;
      raw.set([...rgb,255],cell*4);samples.push({cell,rgb,hex:rgbToHex(rgb)});
    }
    // Reconcile repeated screenshot colors without dropping rare one-cell details.
    const clusters=new Map();
    for(const sample of samples){
      if(exact.has(sample.hex))continue;
      const key=sample.rgb.map(v=>v>>2).join(',');let c=clusters.get(key);
      if(!c){c={sum:[0,0,0],count:0};clusters.set(key,c);}sample.rgb.forEach((v,i)=>c.sum[i]+=v);c.count++;
    }
    const mapped=new Map();
    for(const [key,c] of clusters)mapped.set(key,nearestGamePaletteHex(c.sum.map(v=>v/c.count)));
    const votes=new Map(),paletteRgb=new Map(GAME_PALETTE_FLAT.map(p=>[p.hex.toUpperCase(),[parseInt(p.hex.slice(1,3),16),parseInt(p.hex.slice(3,5),16),parseInt(p.hex.slice(5,7),16)]]));
    for(const sample of samples){
      sample.mapped=exact.get(sample.hex)||mapped.get(sample.rgb.map(v=>v>>2).join(','));
      votes.set(sample.mapped,(votes.get(sample.mapped)||0)+1);
    }
    const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
    const anchors=[...votes].filter(([,n])=>n>=Math.max(4,samples.length*.015));
    for(const sample of samples){
      let color=sample.mapped;
      // Only reconcile uncertain, infrequent JPEG outliers. Exact or nearly exact
      // palette samples remain independent, including isolated one-cell details.
      if(options.stabilizeColors!==false&&!exact.has(sample.hex)&&distance(sample.rgb,paletteRgb.get(color))>8){
        let best=55;
        for(const [anchor,n] of anchors){
          if(n<(votes.get(sample.mapped)||0)*4)continue;
          const d=distance(sample.rgb,paletteRgb.get(anchor));
          if(d<best){best=d;color=anchor;}
        }
      }
      pixels[sample.cell]=color;
    }
    return {pixels,image:{width,height,data:raw},mask,unreadable,weak,guideSamples,smallCells:Math.min(rect.w/width,rect.h/height)<2.5};
  }
  return {guideField,pathPoints,fitScore,refineGuide,cellMask,alignGrid,recover};
})();
