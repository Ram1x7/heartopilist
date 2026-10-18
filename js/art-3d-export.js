// Copy the newly rendered frame before WebGL clears its drawing buffer.
export function capturePreviewPng(renderer,scene,camera,createCanvas=()=>document.createElement('canvas')){
  const size=renderer.getSize({set(x,y){this.x=x;this.y=y;return this;}}),ratio=renderer.getPixelRatio();
  try{
    const scale=1600/Math.max(size.x,size.y),w=Math.max(1,Math.round(size.x*scale)),h=Math.max(1,Math.round(size.y*scale));
    renderer.setPixelRatio(1);renderer.setSize(w,h,false);renderer.render(scene,camera);
    const output=createCanvas();output.width=w;output.height=h;
    output.getContext('2d').drawImage(renderer.domElement,0,0);
    return new Promise((resolve,reject)=>output.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG encoding failed')),'image/png'));
  }finally{renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);}
}
