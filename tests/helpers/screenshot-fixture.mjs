// Controlled screenshot-like raster with known cells, subpixel placement and optional guide overlays.
export function screenshotFixture(colors,{width=24,height=18,pitch=5.4,x=12.3,y=9.2,noise=0,grid=false,paths=[],lineWidth=1.2,background=[48,60,69]}={}){
  const iw=Math.ceil(x+width*pitch+14),ih=Math.ceil(y+height*pitch+14),data=new Uint8ClampedArray(iw*ih*4);
  const expected=Array.from({length:width*height},(_,i)=>colors[i%colors.length].toUpperCase());
  const rgb=hex=>hex.match(/[a-f0-9]{2}/gi).map(s=>parseInt(s,16));
  for(let py=0;py<ih;py++)for(let px=0;px<iw;px++){
    const cx=Math.floor((px+.5-x)/pitch),cy=Math.floor((py+.5-y)/pitch),i=(py*iw+px)*4;
    let c=cx>=0&&cy>=0&&cx<width&&cy<height?rgb(expected[cy*width+cx]):background;
    if(noise && cx>=0&&cy>=0&&cx<width&&cy<height)c=c.map((v,k)=>Math.max(0,Math.min(255,v+((px*19+py*31+k*7)%(noise*2+1))-noise)));
    if(grid && cx>=0&&cy>=0&&cx<width&&cy<height){
      const fx=(px+.5-x)/pitch-cx,fy=(py+.5-y)/pitch-cy;
      if(Math.min(fx,1-fx,fy,1-fy)<.055)c=c.map(v=>Math.round(v*.55+100));
    }
    data.set([...c,255],i);
  }
  for(const path of paths)for(let n=1;n<path.length;n++){
    const a={x:x+path[n-1].x*pitch,y:y+path[n-1].y*pitch},b={x:x+path[n].x*pitch,y:y+path[n].y*pitch},dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
    for(let py=Math.max(0,Math.floor(Math.min(a.y,b.y)-lineWidth));py<=Math.min(ih-1,Math.ceil(Math.max(a.y,b.y)+lineWidth));py++)for(let px=Math.max(0,Math.floor(Math.min(a.x,b.x)-lineWidth));px<=Math.min(iw-1,Math.ceil(Math.max(a.x,b.x)+lineWidth));px++){
      const t=den?Math.max(0,Math.min(1,((px+.5-a.x)*dx+(py+.5-a.y)*dy)/den)):0;
      const distance=Math.hypot(px+.5-a.x-t*dx,py+.5-a.y-t*dy),alpha=Math.max(0,Math.min(1,lineWidth/2+.5-distance));
      const i=(py*iw+px)*4;for(let k=0;k<3;k++)data[i+k]=Math.round(data[i+k]*(1-alpha)+255*alpha);
    }
  }
  return {image:{width:iw,height:ih,data},rect:{x,y,w:width*pitch,h:height*pitch},width,height,expected};
}
export function accuracy(actual,expected){return actual.filter((v,i)=>v?.toUpperCase()===expected[i]?.toUpperCase()).length/expected.length;}
