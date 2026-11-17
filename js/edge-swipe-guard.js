/**
 * edge-swipe-guard.js
 * iOS SafariでPWA（ホーム画面に追加＝standalone表示）として開いた場合、
 * WKWebViewが持つ「画面端からのスワイプで戻る」ネイティブジェスチャーは、
 * 通常のSafariタブの戻るスワイプとは別の仕組みで実装されているため、
 * CSSのtouch-action（css/style.css側でbodyに指定済み）だけでは
 * 抑止しきれないことがある。
 *
 * そのため、standalone表示のときだけ、画面の左右どちらかの端付近から始まったタッチが
 * はっきり横方向に動いた（＝戻るスワイプらしい）時点でpreventDefault()し、
 * WKWebView側に「このタッチはページ側が処理する」と伝えて発動を抑える。
 * ただの タップや縦スクロールには反応しないよう、動きの向き・量で判定する
 * （tap取りこぼし防止のため、touchstart自体では何もpreventDefaultしない）。
 */
(function(){
  var isStandalone = window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
  if(!isStandalone) return;

  var EDGE_PX = 24;
  var tracking = false;
  var startX = 0;
  var startY = 0;

  document.addEventListener("touchstart", function(e){
    if(e.touches.length !== 1){ tracking = false; return; }
    var t = e.touches[0];
    // 左端・右端どちらも対象にする（右端からのスワイプは「進む」だが、
    // 同じネイティブジェスチャーの仕組みなので同様に抑える）
    tracking = t.clientX <= EDGE_PX || t.clientX >= window.innerWidth - EDGE_PX;
    startX = t.clientX;
    startY = t.clientY;
  }, { passive: true });

  document.addEventListener("touchmove", function(e){
    if(!tracking || e.touches.length !== 1) return;
    var t = e.touches[0];
    var dx = t.clientX - startX;
    var dy = t.clientY - startY;
    if(Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)){
      e.preventDefault();
      tracking = false;
    }
  }, { passive: false });

  document.addEventListener("touchend", function(){ tracking = false; });
  document.addEventListener("touchcancel", function(){ tracking = false; });
})();
