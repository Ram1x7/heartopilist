import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
const src=p=>fs.readFileSync(new URL(p,root),'utf8');
const expected=JSON.parse(src('tests/fixtures/order-trend-reviewed.json'));
function load(){
 const elements=new Map(),storage=new Map();
 const make=()=>({style:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},children:[],addEventListener(type,fn){this[type]=fn;},setAttribute(){},appendChild(child){this.children.push(child);},innerHTML:''});
 const element=id=>{if(!elements.has(id))elements.set(id,make());return elements.get(id);};
 const c=vm.createContext({console,Map,Set,document:{body:make(),documentElement:make(),getElementById:element,querySelector(){return null;},querySelectorAll(){return [];},createElement:make},window:{matchMedia(){return {matches:false};}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},icon:()=>'',currencyIcon:()=>'',maybeStartPageTutorial(){}});
 for(const p of ['js/data-order-trend.js','js/data-order-trend-apk.js'])vm.runInContext(src(p),c);
 const before=JSON.parse(vm.runInContext('JSON.stringify(orderTrendData)',c));
 vm.runInContext(src('js/data-order-trend-reviewed.js'),c);
 const after=JSON.parse(vm.runInContext('JSON.stringify(orderTrendData)',c));
 vm.runInContext(src('js/order-trend.js'),c);
 return {c,before,after,element,storage};
}
test('retains all identities, prices, images and omitted records',()=>{
 const {before,after}=load();assert.equal(after.length,905);
 for(const old of before){
  const item=after.find(x=>x.id===old.id);assert.ok(item);
  for(const key of Object.keys(old))if(!['name','nameI18n','category','displayOrder'].includes(key))assert.deepEqual(item[key],old[key],`${old.id}.${key}`);
 }
 for(const id of expected.omitted)assert.ok(after.some(x=>x.id===id));
 assert.equal(expected.omitted.length,156);
});
test('matches the edited worksheet names, categories and physical row order',()=>{
 const {c,after}=load();
 for(const row of expected.renamed){const item=after.find(x=>x.id===row.id);assert.equal(item.name,row.name);assert.equal(item.nameI18n.ja,row.name);}
 for(const group of expected.groups){
  const ids=JSON.parse(vm.runInContext(`otCategory=${JSON.stringify(group.category)};JSON.stringify(sortOtItems(orderTrendData.filter(x=>x.season===${JSON.stringify(group.season)}&&x.category===otCategory)).map(x=>x.id))`,c));
  assert.deepEqual(ids.slice(0,group.ids.length),group.ids,`${group.season}/${group.category}`);
 }
});
test('keeps ownership sorting and saving with reviewed names and order',()=>{
 const {c,element,storage}=load();const group=expected.groups[0],id=group.ids[0];
 element('otContent').click({target:{closest:()=>({getAttribute:()=>id})}});
 assert.equal(JSON.parse(storage.get('orderTrendOwned'))[id],true);
 const ids=JSON.parse(vm.runInContext(`otCategory=${JSON.stringify(group.category)};JSON.stringify(sortOtItems(orderTrendData.filter(x=>x.season===${JSON.stringify(group.season)}&&x.category===otCategory)).map(x=>x.id))`,c));
 assert.equal(ids.at(-1),id);
 vm.runInContext(src('js/data-order-trend-reviewed.js'),c);assert.equal(vm.runInContext('orderTrendData.length',c),905);
});
test('hides only the six user-confirmed entries from listing and search',()=>{
 const {c,after,element,storage}=load();
 const hidden=[606,759,760,761,828,829];
 assert.deepEqual(after.filter(x=>x.hidden).map(x=>x.id).sort(),hidden.toSorted());
 assert.equal((element('otContent').innerHTML.match(/class="ot-card /g)||[]).length,899);
 for(const id of hidden){
  assert.doesNotMatch(element('otContent').innerHTML,new RegExp(`data-ot-check="${id}"`));
  assert.equal(vm.runInContext(`otMatchesFilters(orderTrendData.find(x=>x.id===${JSON.stringify(id)}))`,c),false);
 }
 assert.equal(after.filter(x=>x.season==='ogon_sangaku'&&!x.hidden).length,77);
 assert.equal(after.filter(x=>x.season==='amanogawa'&&!x.hidden).length,79);
 vm.runInContext(`otSearchKeyword='新春・行商人雑貨箱';renderOtContent();`,c);
 assert.match(element('otContent').innerHTML,/該当するアイテムがありません/);
 // A previously saved check remains even though its product is no longer listed.
 vm.runInContext(`otOwned['apk-order-5001']=true;saveOtOwned();renderOtContent();`,c);
 assert.equal(JSON.parse(storage.get('orderTrendOwned'))['apk-order-5001'],true);
 assert.equal(vm.runInContext('orderTrendData.length',c),905);
});
