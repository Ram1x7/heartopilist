import {validateGrid} from './build-rules.mjs';

export function initFreePlacement({getState,commit,chooseTool}) {
  const toolbar=document.getElementById('buildEditToolbar');
  const selectButton=document.createElement('button');
  selectButton.type='button'; selectButton.id='buildToolSelectBtn'; selectButton.className='build-tool-btn'; selectButton.textContent='選択・自由配置';
  selectButton.addEventListener('click',()=>{chooseTool('select');panel.open=true;});
  toolbar.append(selectButton);
  const panel=document.createElement('details');
  panel.id='buildFreePlacement'; panel.style.cssText='padding:12px;margin:12px 0;border:1px solid var(--border);border-radius:12px;';
  panel.innerHTML=`<summary>支柱の自由配置・角度調整</summary>
    <p>「選択・自由配置」で支柱をタップして選びます。選択なしでも、座標を入力して空中に追加できます。位置は回転前の支柱の左下手前が基準です。</p>
    <p>X・Zは床マス、Yは低い壁1枚の高さが単位です。角度は支柱の中心を軸に回転します。重ね配置できます。ゲーム側でも各自由配置設定を有効にしてください。</p>
    <p id="buildFreeSelected">未選択：選択中の建材を追加できます</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;">${[['x','X（床マス）'],['y','Y（高さ）'],['z','Z（床マス）'],['rx','X軸角度（°）'],['ry','Y軸角度（°）'],['rz','Z軸角度（°）']].map(([key,label])=>`<label>${label}<input id="buildFree_${key}" type="number" step="any" value="0" style="display:block;width:110px;" ${key.startsWith('r')?'min="-360" max="360"':''}></label>`).join('')}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">
      <button type="button" id="buildFreeApply">選んだ支柱に適用</button>
      <button type="button" id="buildFreeAdd">この位置に追加</button>
      <button type="button" id="buildFreeDeselect">選択を解除</button>
    </div><p id="buildFreeStatus" role="status" aria-live="polite"></p>`;
  toolbar.after(panel);
  let selected=null;
  const keys=['x','y','z','rx','ry','rz'];
  const field=k=>panel.querySelector('#buildFree_'+k);
  const status=panel.querySelector('#buildFreeStatus');
  const buttons=[...panel.querySelectorAll('button')];
  function refresh() {
    const state=getState(), visible=['solid','pillar-wall'].includes(state.mode) && !!state.items;
    panel.style.display=visible?'':'none'; selectButton.style.display=visible?'':'none'; selectButton.disabled=!state.editable;
    if(!state.items?.includes(selected)) selected=null;
    panel.querySelector('#buildFreeSelected').textContent=selected?'選択中：'+selected.name:'未選択：選択中の建材を追加できます';
    buttons.forEach(b=>b.disabled=!state.editable);
    panel.querySelector('#buildFreeApply').disabled=!state.editable || !selected;
  }
  function select(v) {
    selected=v; status.textContent='';
    if(v) {for(const k of keys) field(k).value=String((v[k]||0)/(k==='x'||k==='z'?4:1));panel.open=true;}
    refresh();
  }
  function apply(add) {
    const state=getState(); if(!state.editable || !['solid','pillar-wall'].includes(state.mode) || !state.items || (!add && !selected)) return;
    try {
      const values=Object.fromEntries(keys.map(k=>{
        if(!field(k).value.trim()) throw new Error('位置と角度をすべて入力してください');
        return [k,Number(field(k).value)*(k==='x'||k==='z'?4:1)];
      }));
      const source=add?state.material:selected;
      if(!source) throw new Error('建材を選んでください');
      const piece={...source,...values,freePlacement:true};
      const items=add?[...state.items,piece]:state.items.map(v=>v===selected?piece:v);
      validateGrid(items,state.dims,'solid');
      commit(items); selected=piece; refresh();
      status.textContent=add?'支柱を1本追加しました。重なった場合も1本として数えます。':'位置と角度を変更しました。';
    } catch(error) {status.textContent=error.message;}
  }
  panel.querySelector('#buildFreeApply').addEventListener('click',()=>apply(false));
  panel.querySelector('#buildFreeAdd').addEventListener('click',()=>apply(true));
  panel.querySelector('#buildFreeDeselect').addEventListener('click',()=>select(null));
  refresh();
  return {select,refresh,clear(){selected=null;status.textContent='';refresh();}};
}
