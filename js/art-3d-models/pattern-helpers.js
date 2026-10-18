// Generic pattern adapters; no application boot, authentication or network calls.
export function polygonMask(path, width, height) {
  const mask=new Uint8Array(width*height);
  if(!path || path.length<3) return mask.fill(1);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    let inside=false;
    for(let i=0,j=path.length-1;i<path.length;j=i++) {
      const a=path[i],b=path[j],px=x+.5,py=y+.5;
      if((a.y>py)!==(b.y>py) && px<(b.x-a.x)*(py-a.y)/(b.y-a.y)+a.x) inside=!inside;
    }
    mask[y*width+x]=inside?1:0;
  }
  return mask;
}
export function maskRows(mask,width,height) {
  return Array.from({length:height},(_,y)=>{
    let x0=-1,x1=-1;
    for(let x=0;x<width;x++) if(mask[y*width+x]) {if(x0<0)x0=x;x1=x+1;}
    return x0<0?null:{x0,x1};
  });
}
export function nearestInside(mask,width,height) {
  const nearest=new Int32Array(width*height).fill(-1),queue=new Int32Array(width*height);
  let read=0,write=0;
  for(let i=0;i<mask.length;i++) if(mask[i]) {nearest[i]=i;queue[write++]=i;}
  const add=(i,from)=>{if(nearest[i]<0){nearest[i]=nearest[from];queue[write++]=i;}};
  while(read<write) {
    const i=queue[read++],x=i%width,y=Math.floor(i/width);
    if(x>0)add(i-1,i);if(x+1<width)add(i+1,i);if(y>0)add(i-width,i);if(y+1<height)add(i+width,i);
  }
  return nearest;
}
