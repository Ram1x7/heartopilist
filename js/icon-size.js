// js/icon-size.js
// 図鑑アイテムのアイコン/カードの表示サイズ（小/中/大）を、ページをまたいで
// 共通の設定として保存・適用する。対応するページにこのファイルを読み込み、
// 「小」「大」ボタンにid="sz_small"/"sz_large"を付けるだけで使える
// （既定の「中」は現状のグリッド見た目そのままなので、専用のCSSは持たない）

const ICON_SIZE_KEY = "hatopiIconSize";
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

setIconSize(localStorage.getItem(ICON_SIZE_KEY) || "medium");
