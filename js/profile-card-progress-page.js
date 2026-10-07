// js/profile-card-progress-page.js
// 進捗確認ページ（星5・認証）専用スクリプト。
// 旧プロフィールカードメーカー内にあった「詳細進捗」セクションを独立ページ化したもの。
// プロフィールカードメーカー本体（card-maker.html／js/profile-card.js）とは別物で、
// 依存するのは js/profile-card-progress.js の集計ロジックと各種data-*.jsのみ。

(function () {
  "use strict";

  // ── ダークモード（他の単体ページと同じパターン。main.js非読み込みのため独立実装） ──
  const darkToggle = document.getElementById("darkToggle");
  const savedDark = localStorage.getItem("darkMode");
  if (savedDark === "true") document.body.classList.add("dark");
  else if (savedDark === null && window.matchMedia("(prefers-color-scheme: dark)").matches)
    document.body.classList.add("dark");
  document.documentElement.classList.toggle("dark", document.body.classList.contains("dark"));
  function forceRepaint() {
    document.body.style.display = "none";
    void document.body.offsetHeight;
    document.body.style.display = "";
  }
  function updateDarkButton() {
    darkToggle.innerHTML = document.body.classList.contains("dark") ? icon("sun") : icon("moon");
  }
  if (document.body.classList.contains("dark")) forceRepaint();
  updateDarkButton();
  darkToggle.onclick = () => {
    document.body.classList.toggle("dark");
    document.documentElement.classList.toggle("dark", document.body.classList.contains("dark"));
    localStorage.setItem("darkMode", document.body.classList.contains("dark"));
    updateDarkButton();
    forceRepaint();
  };

  function progressBarHTML(label, s) {
    const pct = Math.round(profileCardPct({ done: s.done, total: s.total }));
    return `
      <div class="pc-detail-progress-bar">
        <span class="pc-detail-progress-bar-label">${label}</span>
        <div class="pc-detail-progress-track"><div class="pc-detail-progress-fill" style="width:${pct}%"></div></div>
        <span class="pc-detail-progress-count">${s.done} / ${s.total}</span>
      </div>
    `;
  }
  function authBarHTML(s) {
    const pct = Math.round(profileCardPct({ done: s.done, total: s.total }));
    return `
      <div class="pc-detail-progress-bar">
        <span class="pc-detail-progress-bar-label">${icon("medal", { size: 12 })}認証</span>
        <div class="pc-detail-progress-track"><div class="pc-detail-progress-fill pc-detail-progress-fill-auth" style="width:${pct}%"></div></div>
        <span class="pc-detail-progress-count">${s.done} / ${s.total}</span>
      </div>
    `;
  }

  // ── 総合（全カテゴリー合算）の星5・認証進捗。ページの一番上に常時表示する ──
  const totalEl = document.getElementById("pcDetailProgressTotal");
  function renderTotalProgress() {
    const detailed = computeProfileCardStatsDetailed();
    const total = PROFILE_CARD_CATEGORIES.reduce((acc, def) => {
      const s = detailed[def.id] || { starDone: 0, starTotal: 0, authDone: 0, authTotal: 0 };
      acc.starDone += s.starDone; acc.starTotal += s.starTotal;
      acc.authDone += s.authDone; acc.authTotal += s.authTotal;
      return acc;
    }, { starDone: 0, starTotal: 0, authDone: 0, authTotal: 0 });

    const bars = [
      progressBarHTML("星5", { done: total.starDone, total: total.starTotal }),
      authBarHTML({ done: total.authDone, total: total.authTotal }),
    ];
    totalEl.innerHTML = `
      <div class="pc-detail-progress-label">${icon("trophy", { size: 15 })}<span>総合</span></div>
      <div class="pc-detail-progress-bars">${bars.join("")}</div>
    `;
  }

  // ── カテゴリー別の星5・認証進捗 ──
  const detailProgressListEl = document.getElementById("pcDetailProgressList");
  function renderDetailProgress() {
    const detailed = computeProfileCardStatsDetailed();
    detailProgressListEl.innerHTML = PROFILE_CARD_CATEGORIES.map(def => {
      const s = detailed[def.id] || { starDone: 0, starTotal: 0, authDone: 0, authTotal: 0 };
      const bars = [progressBarHTML(def.starLabel || "星5", { done: s.starDone, total: s.starTotal })];
      if (s.authTotal > 0) bars.push(authBarHTML({ done: s.authDone, total: s.authTotal }));
      return `
        <div class="pc-detail-progress-row">
          <div class="pc-detail-progress-label">${icon(def.icon, { size: 15 })}<span>${def.label}</span></div>
          <div class="pc-detail-progress-bars">${bars.join("")}</div>
        </div>
      `;
    }).join("");
  }

  function renderAll() {
    renderTotalProgress();
    renderDetailProgress();
  }
  renderAll();

  document.querySelectorAll(".pc-section-head").forEach(head => {
    head.addEventListener("click", () => {
      head.closest(".pc-section").classList.toggle("collapsed");
    });
  });

  document.addEventListener("langchange", renderAll);
})();
