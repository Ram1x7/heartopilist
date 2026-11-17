import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const coverage=JSON.parse(fs.readFileSync(new URL('tests/fixtures/order-trend-coverage.json',root),'utf8'));
const src=p=>fs.readFileSync(new URL(p,root),'utf8');
function data(){
 const c=vm.createContext({});
 vm.runInContext(src('js/data-order-trend.js'),c);
 const before=JSON.parse(vm.runInContext('JSON.stringify(orderTrendData)',c));
 vm.runInContext(src('js/data-order-trend-apk.js'),c);
 return {c,before,after:JSON.parse(vm.runInContext('JSON.stringify(orderTrendData)',c))};
}
test('preserves every original identity, image and verified price',()=>{
 const {before,after}=data();
 assert.equal(before.length,904);assert.equal(after.length,coverage.total);
 for(const original of before){
  const updated=after.find(x=>x.id===original.id);assert.ok(updated);
  for(const key of Object.keys(original))assert.deepEqual(updated[key],original[key],`changed ${original.id}.${key}`);
 }
});
test('adds only distinct order IDs with real local images and explicit reference prices',()=>{
 const {after}=data();const added=after.filter(x=>typeof x.id==='string');
 assert.equal(added.length,coverage.newItems);assert.equal(new Set(after.map(x=>x.id)).size,after.length);
 assert.equal(new Set(after.filter(x=>x.orderId).map(x=>x.orderId)).size,after.filter(x=>x.orderId).length);
 const sourceCoverage=new Set([...coverage.representedExistingOrderIds,...added.map(x=>x.orderId).filter(Boolean)]);
 assert.deepEqual([...sourceCoverage].sort((a,b)=>a-b),coverage.sourceOrderIds.toSorted((a,b)=>a-b));
 assert.equal(added.filter(x=>x.imageMissing).length,coverage.noImageItems);
 assert.equal(added.filter(x=>!x.imageMissing).length,0);
 assert.equal(added.filter(x=>!x.orderId).length,0);
 for(const item of added){
  assert.ok(fs.existsSync(new URL(item.img,root)),item.img);
  assert.equal(item.priceReference,true);
  assert.equal(item.originalPrice==null,item.discountPercent==null);
  if(item.discountPercent!=null)assert.equal(item.price,item.originalPrice*(100-item.discountPercent)/100);
  assert.ok([1,2,3].includes(item.stampsRequired));assert.ok([7,10,14].includes(item.arrivalDays));
 }
});
test('loading the supplemental data twice does not duplicate products',()=>{
 const {c}=data();vm.runInContext(src('js/data-order-trend-apk.js'),c);
 assert.equal(vm.runInContext('orderTrendData.length',c),coverage.total);
});
test('page rendering, filters and ownership work with the supplemental entries',()=>{
 const elements=new Map(),storage=new Map([['orderTrendOwned',JSON.stringify({'1':true})]]);
 const make=()=>({style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},children:[],addEventListener(type,fn){this[type]=fn;},setAttribute(){},appendChild(child){this.children.push(child);},innerHTML:''});
 const element=id=>{if(!elements.has(id))elements.set(id,make());return elements.get(id);};
 const c=vm.createContext({console,Map,Set,document:{body:make(),documentElement:make(),getElementById:element,querySelector(){return null;},querySelectorAll(){return [];},createElement:make},window:{matchMedia(){return {matches:false};}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},icon:()=>'',currencyIcon:k=>`[${k}]`,maybeStartPageTutorial(){}});
 for(const f of ['js/data-order-trend.js','js/data-order-trend-apk.js','js/order-trend.js'])vm.runInContext(src(f),c);
 assert.equal((element('otContent').innerHTML.match(/class="ot-card /g)||[]).length,coverage.total-6);
 vm.runInContext(`otSearchKeyword='ベロア・ゾウフード';renderOtContent();`,c);
 let content=element('otContent').innerHTML;
 assert.equal((content.match(/class="ot-card /g)||[]).length,1);
 assert.doesNotMatch(content,/参考価格/);assert.match(content,/images\/000\.PNG/);
 const id=vm.runInContext(`orderTrendData.find(x=>x.staticId===11141000).id`,c);
 element('otContent').click({target:{closest:()=>({getAttribute:()=>id})}});
 assert.equal(JSON.parse(storage.get('orderTrendOwned'))[id],true);
 assert.equal(JSON.parse(storage.get('orderTrendOwned'))['1'],true);
 vm.runInContext(`otSearchKeyword='パンダ柄';setOtSeason('doubutsu_rinjin_season');`,c);
 assert.ok((element('otContent').innerHTML.match(/class="ot-card /g)||[]).length>=2);
 vm.runInContext(`setOtCategory('furniture');`,c);
 assert.match(element('otContent').innerHTML,/該当するアイテムがありません/);
 vm.runInContext(`otSearchKeyword='';setOtCategory('all');setOtSeason('doubutsu_rinjin_season');`,c);
 assert.equal((element('otContent').innerHTML.match(/class="ot-card /g)||[]).length,205);
 assert.match(element('otContent').innerHTML,/images\/000\.PNG/);
 const placeholderId=vm.runInContext(`orderTrendData.find(x=>x.season==='doubutsu_rinjin_season').id`,c);
 element('otContent').click({target:{closest:()=>({getAttribute:()=>placeholderId})}});
 assert.equal(JSON.parse(storage.get('orderTrendOwned'))[placeholderId],true);
});

test('No Image entries retain order information, search and season filters',()=>{
 const {c,after}=data();
 const placeholders=after.filter(x=>x.imageMissing);
 assert.ok(placeholders.every(x=>x.img==='./images/000.PNG'));
 assert.equal(vm.runInContext('orderTrendSeasons.yukimi_onsen.label',c),'雪見温泉');
 assert.equal(vm.runInContext(`Object.keys(orderTrendSeasons).sort((a,b)=>(orderTrendSeasons[a].order||0)-(orderTrendSeasons[b].order||0))[0]`,c),'yukimi_onsen');
 const html=src('order-trend.html');
 assert.equal((html.match(/data-i18n="order_trend_help_details_body"/g)||[]).length,1);
 assert.ok(html.indexOf('order_trend_help_details_body')<html.indexOf('id="otSearch"'));
 assert.equal(after.filter(x=>x.season==='yukimi_onsen').length,77);
 assert.ok(after.filter(x=>x.name.includes('名称未照合')).every(x=>x.name.includes('注文ID:')));
 for(const item of placeholders)assert.ok(item.name&&item.price!=null&&item.stampsRequired&&item.arrivalDays);
});
