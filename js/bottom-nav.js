/**
 * bottom-nav.js
 * モバイル用ボトムナビゲーション（🏠ホーム/📖図鑑/🛠ツール/⭐マイページ/☰その他）。
 * まずindex.htmlのみで有効化し、他ページは今後のフェーズで順次追加する。
 * PC幅（design-system.cssの @media (min-width:900px)）では自動的に非表示になる。
 */

const BOTTOM_NAV_ITEMS = [
  { key: "home",   href: "./index.html#todayDashboard",  icon: "home", labelKey: "bottomnav_home",   labelFallback: "ホーム" },
  { key: "zukan",  href: "./index.html",  icon: "book", labelKey: "bottomnav_zukan",  labelFallback: "図鑑" },
  { key: "tools",  href: "./art-create.html", icon: "wrench", labelKey: "bottomnav_tools", labelFallback: "ツール" },
  { key: "mypage", href: "./index.html#dashCompletionCard", icon: "star", labelKey: "bottomnav_mypage", labelFallback: "マイページ" },
  { key: "other",  href: "./faq.html",    icon: "menu", labelKey: "bottomnav_other",  labelFallback: "その他" },
];

function renderBottomNav(activeKey){
  if(document.getElementById("dsBottomNav")) return;

  const nav = document.createElement("nav");
  nav.id = "dsBottomNav";
  nav.className = "ds-bottom-nav";

  nav.innerHTML = BOTTOM_NAV_ITEMS.map(item => `
    <a class="ds-bottom-nav-item${item.key === activeKey ? " active" : ""}" href="${item.href}">
      ${typeof icon === "function" ? icon(item.icon, {size:20}) : ""}
      <span data-i18n="${item.labelKey}">${item.labelFallback}</span>
    </a>
  `).join("");

  document.body.appendChild(nav);
  document.body.classList.add("has-bottom-nav");
}

window.renderBottomNav = renderBottomNav;
