// js/scroll-hint.js
// .scroll-hint-wrapで囲まれた横スクロール要素に対し、スクロールできることが
// わかるよう端のフェード＋矢印（.scroll-hint-left/.scroll-hint-right）を
// スクロール位置に応じて自動で付け外しする（ナビバー・各種フィルタータブ共通）。
// 対象はページ内に複数あってもよい（.site-nav、カテゴリタブなど）。

(function(){
  function initScrollHint(wrap){
    var target = wrap.firstElementChild;
    if(!target) return;

    function update(){
      var atStart = target.scrollLeft <= 1;
      var atEnd = target.scrollLeft + target.clientWidth >= target.scrollWidth - 1;
      wrap.classList.toggle("scroll-hint-left", !atStart);
      wrap.classList.toggle("scroll-hint-right", !atEnd);
    }

    target.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    // このスクリプトはページ末尾近くで読み込まれるが、対象のタブ自体は
    // 別スクリプトが後から動的に生成することが多い（例：オーダーチケットの
    // シーズンタブ、ペット選択タブ）。overflow-xで中身が隠れているだけの要素は
    // 子要素が増減してもscrollWidthしか変わらずResizeObserverは反応しないため、
    // 中身の増減自体を見るMutationObserverも併用する
    if(typeof MutationObserver === "function"){
      new MutationObserver(update).observe(target, { childList: true, subtree: true });
    }
    if(typeof ResizeObserver === "function"){
      new ResizeObserver(update).observe(target);
    }
  }

  document.querySelectorAll(".scroll-hint-wrap").forEach(initScrollHint);
})();
