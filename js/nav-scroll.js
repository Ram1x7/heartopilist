/**
 * nav-scroll.js
 * 上部のナビバー（.site-nav）はタブ数が多く横スクロールが必要なため、
 * ページ読み込み時のスクロール位置によっては選択中のタブ（.site-nav-item.active）
 * が画面外に隠れてしまうことがある。ページを開いた瞬間に、選択中のタブが
 * 見える位置まで（必要な分だけ）自動でスクロールする。
 *
 * Element.scrollIntoView()は使わない。あれはナビバー自身の横スクロールだけ
 * でなく、ページ全体の縦スクロール位置まで動かしてしまうことがあるため、
 * ナビバーのscrollLeftだけを直接計算して動かす（他の要素には一切影響しない）
 */
(function(){
  var nav = document.querySelector(".site-nav");
  if(!nav) return;
  const petLink = nav.querySelector('a[href="./pet.html"]');
  if(petLink && !nav.querySelector('a[href="./card-maker.html"]')){
    const link = document.createElement("a");
    link.href = "./card-maker.html";
    link.className = "site-nav-item";
    link.dataset.i18n = "nav_profile_card";
    link.textContent = "カード";
    petLink.before(link);
  }
  var active = nav.querySelector(".site-nav-item.active");
  if(!active) return;

  var navRect = nav.getBoundingClientRect();
  var activeRect = active.getBoundingClientRect();

  if(activeRect.left < navRect.left){
    nav.scrollLeft -= (navRect.left - activeRect.left);
  }else if(activeRect.right > navRect.right){
    nav.scrollLeft += (activeRect.right - navRect.right);
  }
})();
