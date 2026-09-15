// js/icon-size.js
// 図鑑アイテムのアイコン/カードの表示サイズ（小/中/大）を、ページごとに
// 個別の設定として保存・適用する。対応するページにこのファイルを読み込み、
// 「小」「大」ボタンにid="sz_small"/"sz_large"を付けるだけで使える
// （既定の「中」は現状のグリッド見た目そのままなので、専用のCSSは持たない）

// 以前はページ間で共通のキー（hatopiIconSize）1つを共有しており、例えば
// 図鑑ページで「大」にすると料理ページなど他のページも一律で「大」に
// なってしまい不便だった。ページのファイル名ごとに別々のキーで保存する
function getIconSizePageKey(){
  let path = location.pathname.split("/").pop();
  if(!path) path = "index.html";
  return path.replace(/\.html$/, "");
}
const ICON_SIZE_KEY = "hatopiIconSize_" + getIconSizePageKey();
const ICON_SIZES = ["small", "medium", "large"];

function setIconSize(size) {
  if (ICON_SIZES.indexOf(size) === -1) size = "medium";
  document.body.dataset.iconSize = size;
  localStorage.setItem(ICON_SIZE_KEY, size);
  ICON_SIZES.forEach((s) => {
    const btn = document.getElementById("sz_" + s);
    if (btn) btn.classList.toggle("active", s === size);
  });
}

// 以前の共通キーに値が残っている場合は、初回のみそのページの初期値として
// 引き継ぐ（急に「中」へ戻ってしまうのを防ぐため）。以後はページごとの
// キーのみを使うので、他ページの変更に引きずられることはない
const OLD_SHARED_ICON_SIZE_KEY = "hatopiIconSize";
const initialIconSize =
  localStorage.getItem(ICON_SIZE_KEY) ||
  localStorage.getItem(OLD_SHARED_ICON_SIZE_KEY) ||
  "medium";
setIconSize(initialIconSize);
