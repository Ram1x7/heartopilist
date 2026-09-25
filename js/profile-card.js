// js/profile-card.js
// プロフィールカードメーカーのメイン：フォーム⇔状態の同期、アバター編集（ドラッグ/ピンチ/スライダー）、
// Canvasプレビューの再描画、PNG保存、Web Share API共有を担当する。

(function () {
  "use strict";

  // ── ダークモード（他ページと同じパターン。main.js非読み込みのため独立実装） ──
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

  const PLAY_STYLE_PRESETS = ["まったり", "建築メイン", "収集メイン", "釣り好き", "園芸好き", "料理好き", "写真好き", "交流好き", "夜更かし", "初心者"];
  const TAG_PRESETS = ["まったり", "建築メイン", "収集メイン", "釣り好き", "園芸好き", "料理好き", "写真好き", "交流好き", "夜更かし", "初心者"];
  const MAX_TAGS = 5;

  let state = loadProfileCardState();
  let avatarImg = null;       // 現在表示中のアバターHTMLImageElement（Object URL）
  let avatarObjectUrl = null;
  let mascotImg = new Image();
  mascotImg.src = "./apple-touch-icon.png?v=10";
  let bgImgCache = new Map(); // key: `${theme}_${layout}` -> Promise<HTMLImageElement>
  let medalFrameImgCache = new Map(); // key: theme -> Promise<HTMLImageElement>（横型・縦型で共通）
  let profilePartsImgCache = new Map(); // key: theme -> Promise<{avatarFrame,infoId,infoLevel,infoStyle,tagFrame: HTMLImageElement}>
  let renderPending = false;
  let renderRaf = null;

  const canvas = document.getElementById("pcPreviewCanvas");
  const ctx = canvas.getContext("2d");
  const loadingEl = document.getElementById("pcPreviewLoading");
  const errorEl = document.getElementById("pcPreviewError");
  const actionStatusEl = document.getElementById("pcActionStatus");

  function showPreviewError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    console.error("[profile-card]", msg);
  }
  function clearPreviewError() {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  function getThemeBackgroundImage(themeId, layoutKey) {
    const key = `${themeId}_${layoutKey}`;
    if (bgImgCache.has(key)) return bgImgCache.get(key);
    const src = PROFILE_CARD_THEMES[themeId].backgrounds[layoutKey];
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(src));
      img.src = src;
    });
    bgImgCache.set(key, promise);
    return promise;
  }

  function getThemeMedalFrameImage(themeId) {
    if (medalFrameImgCache.has(themeId)) return medalFrameImgCache.get(themeId);
    const src = PROFILE_CARD_THEMES[themeId].medalFrame;
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(src));
      img.src = src;
    });
    medalFrameImgCache.set(themeId, promise);
    return promise;
  }

  function loadImg(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(src));
      img.src = src;
    });
  }

  // 中央メダルの％数字専用フォント（Noto Serif JP 900、数字0-9と%のみを含む自己ホスト
  // サブセット、OFLライセンス）をプロジェクト内のWOFF2からFontFace APIで読み込む。
  // 外部CDNへ常時依存させないため、フォントファイルはfonts/配下へ同梱している。
  // 読み込み前の代替フォントでCanvas画像が生成されないよう、renderNow()側でこの完了を待つ。
  // 失敗時はfalseを返し、呼び出し側はCSSフォントスタックのフォールバック（システム明朝体）へ
  // 自然に委ねる（中央メダルの配置ロジックは実測ベースのため、フォールバック時も破綻しない）
  let medalDigitFontPromise = null;
  function loadMedalDigitFont() {
    if (medalDigitFontPromise) return medalDigitFontPromise;
    if (typeof FontFace === "undefined") {
      medalDigitFontPromise = Promise.resolve(false);
      return medalDigitFontPromise;
    }
    const face = new FontFace("NotoSerifJPDigits900", "url(./fonts/NotoSerifJP-Digits-900.woff2) format('woff2')", { weight: "900" });
    medalDigitFontPromise = face.load()
      .then(loaded => { document.fonts.add(loaded); return true; })
      .catch(e => {
        console.warn("[profile-card] メダル数字フォントを読み込めませんでした。代替フォントで描画します", e);
        return false;
      });
    return medalDigitFontPromise;
  }

  // 中央メダル下部「達成数」バッジの動的数値（例："492 / 600"）専用フォント
  // （Noto Serif JP 800、数字0-9・スラッシュ・半角スペースのみの自己ホストサブセット、
  // OFLライセンス=fonts/OFL-NotoSerifJP.txt）。参考画像実測で幅700は太すぎ、700は細すぎたため
  // 800を採用。読み込み前の代替フォントでCanvas画像が生成されないよう、renderNow()側で待つ。
  // 失敗時はfalseを返し、呼び出し側はCSSフォントスタックのフォールバックへ委ねる
  let achievementValueFontPromise = null;
  function loadAchievementValueFont() {
    if (achievementValueFontPromise) return achievementValueFontPromise;
    if (typeof FontFace === "undefined") {
      achievementValueFontPromise = Promise.resolve(false);
      return achievementValueFontPromise;
    }
    const face = new FontFace("NotoSerifJPAchievementValue800", "url(./fonts/NotoSerifJP-AchievementValue-800.woff2) format('woff2')", { weight: "800" });
    achievementValueFontPromise = face.load()
      .then(loaded => { document.fonts.add(loaded); return true; })
      .catch(e => {
        console.warn("[profile-card] 達成数フォントを読み込めませんでした。代替フォントで描画します", e);
        return false;
      });
    return achievementValueFontPromise;
  }

  // カテゴリカード下部「達成数/総数」専用フォント（Noto Serif JP 700、数字0-9・半角スペースのみの
  // 自己ホストサブセット、OFLライセンス=fonts/OFL-NotoSerifJP.txt）。参考画像実測で700/800を比較し、
  // より細い700の方が参考画像の細身の明朝数字に近かったため採用（達成数バッジの800とは別サブセット）。
  // 読み込み前の代替フォントでCanvas画像が生成されないよう、renderNow()側でこの完了を待つ
  let categoryCountFontPromise = null;
  function loadCategoryCountFont() {
    if (categoryCountFontPromise) return categoryCountFontPromise;
    if (typeof FontFace === "undefined") {
      categoryCountFontPromise = Promise.resolve(false);
      return categoryCountFontPromise;
    }
    const face = new FontFace("NotoSerifJPCategoryCount700", "url(./fonts/NotoSerifJP-CategoryCount-700.woff2) format('woff2')", { weight: "700" });
    categoryCountFontPromise = face.load()
      .then(loaded => { document.fonts.add(loaded); return true; })
      .catch(e => {
        console.warn("[profile-card] カテゴリ達成数フォントを読み込めませんでした。代替フォントで描画します", e);
        return false;
      });
    return categoryCountFontPromise;
  }

  // 右下ブランドロゴ（透過PNG、紺×金、4テーマ共通・白ピル背景なし）。第一候補のslim版を本番で使用する。
  // 補助アセットのため、読み込み失敗時はnullのままrendererへ渡し、従来のCanvas手描きへフォールバックする
  let brandLogoImgPromise = null;
  function getBrandLogoImage() {
    if (brandLogoImgPromise) return brandLogoImgPromise;
    brandLogoImgPromise = loadImg("./images/profile-card/parts/common/branding/hatopi-zukan-logo-slim.png");
    return brandLogoImgPromise;
  }

  // プレイヤー名(700)・ひとこと(600)で使うShippori MinchoはCSS(<link>)経由のWebフォントで
  // FontFace APIではなくdocument.fonts.load()で明示的に該当ウェイトを読み込む。
  // DOM側でこの2ウェイトを使う要素が無い場合、document.fonts.readyだけでは
  // 該当ウェイトの読み込みが保証されない（Canvas描画時にフォールバック書体へ落ちる原因になる）ため、
  // 明示的にロードしてから待つ
  let shipporiMinchoFontPromise = null;
  function loadShipporiMinchoFonts() {
    if (shipporiMinchoFontPromise) return shipporiMinchoFontPromise;
    if (typeof document === "undefined" || !document.fonts || typeof document.fonts.load !== "function") {
      shipporiMinchoFontPromise = Promise.resolve(false);
      return shipporiMinchoFontPromise;
    }
    shipporiMinchoFontPromise = Promise.all([
      document.fonts.load("700 68px 'Shippori Mincho'"),
      document.fonts.load("600 40px 'Shippori Mincho'"),
    ]).then(() => true).catch(e => {
      console.warn("[profile-card] Shippori Minchoを読み込めませんでした。代替フォントで描画します", e);
      return false;
    });
    return shipporiMinchoFontPromise;
  }

  // 正式プロフィールパーツ（アバター枠・ID/開拓者レベル/プレイスタイルバッジ・タグ枠）を
  // テーマ単位でまとめて読み込む。1枚でも失敗したら全体をnullにし、
  // renderer側のCanvas手描きフォールバックへ委ねる（一部だけ差し替わる中途半端な状態を避ける）
  function getThemeProfilePartsImages(themeId) {
    if (profilePartsImgCache.has(themeId)) return profilePartsImgCache.get(themeId);
    const parts = PROFILE_CARD_THEMES[themeId].profileParts;
    const keys = ["avatarFrame", "infoId", "infoLevel", "infoStyle", "tagFrame", "panel"];
    const promise = Promise.all(keys.map(k => loadImg(parts[k].src)))
      .then(imgs => Object.fromEntries(keys.map((k, i) => [k, imgs[i]])));
    profilePartsImgCache.set(themeId, promise);
    return promise;
  }

  // カテゴリ進捗カードのPNG（豪華版・4テーマ共通・横型/縦型共通の1セット）。
  // プロフィールパーツとは異なり、1枚読み込みに失敗してもそのカテゴリだけ
  // renderer側でCanvas手描きにフォールバックさせたいため、Promise.allSettled相当で
  // カテゴリごとに独立して読み込み、失敗したものはnullのまま返す（全体を巻き込まない）
  const PC_CATEGORY_IMAGE_FILES = { fish: "fish", bug: "insect", bird: "bird", shell: "shell", food: "cooking", garden: "gardening", snow: "snow-statue", sand: "sand-statue" };
  let categoryImgPromise = null; // Promise<{fish,bug,bird,shell,food,garden: HTMLImageElement|null}>
  function getCommonCategoryImages() {
    if (categoryImgPromise) return categoryImgPromise;
    const ids = Object.keys(PC_CATEGORY_IMAGE_FILES);
    categoryImgPromise = Promise.all(ids.map(id => {
      const src = `./images/profile-card/parts/common/categories/${PC_CATEGORY_IMAGE_FILES[id]}.png`;
      return loadImg(src)
        .then(img => [id, img])
        .catch(e => {
          console.warn(`[profile-card] カテゴリカード画像を読み込めませんでした（${id}）。このカテゴリのみ手描きにフォールバックします`, e);
          return [id, null];
        });
    })).then(entries => Object.fromEntries(entries));
    return categoryImgPromise;
  }

  // ============================================================
  // 再描画（フォント読み込み・背景画像読み込みを待ってから描画する）
  // ============================================================
  function scheduleRender() {
    if (renderRaf) cancelAnimationFrame(renderRaf);
    renderRaf = requestAnimationFrame(() => { renderRaf = null; renderNow(); });
  }

  async function renderNow() {
    if (renderPending) return;
    renderPending = true;
    loadingEl.hidden = false;
    clearPreviewError();
    try {
      try { await loadMedalDigitFont(); } catch (e) { /* フォールバックフォントで続行 */ }
      try { await loadAchievementValueFont(); } catch (e) { /* フォールバックフォントで続行 */ }
      try { await loadCategoryCountFont(); } catch (e) { /* フォールバックフォントで続行 */ }
      try { await loadShipporiMinchoFonts(); } catch (e) { /* フォールバックフォントで続行 */ }
      try { await document.fonts.ready; } catch (e) { /* Safari等で失敗しても続行 */ }
      const layout = PROFILE_CARD_LAYOUTS[state.layout];
      canvas.width = layout.width;
      canvas.height = layout.height;

      let bgImg;
      try {
        bgImg = await getThemeBackgroundImage(state.theme, state.layout);
      } catch (e) {
        showPreviewError(`背景画像を読み込めませんでした（${e.message}）。ファイルの配置をご確認ください。`);
        loadingEl.hidden = true;
        renderPending = false;
        return;
      }

      // メダル枠画像は補助アセットのため、読み込みに失敗してもカード全体は表示する
      // （renderer側にCanvas手描画のフォールバックがある）
      let medalFrameImg = null;
      try {
        medalFrameImg = await getThemeMedalFrameImage(state.theme);
      } catch (e) {
        console.warn("[profile-card] メダル枠画像を読み込めませんでした。手描画にフォールバックします", e);
      }

      // プロフィールパーツ（アバター枠・ID等バッジ・タグ枠）も補助アセット扱い。
      // 読み込み失敗時はnullのままrendererへ渡し、Canvas手描きフォールバックを使わせる
      let profileParts = null;
      try {
        profileParts = await getThemeProfilePartsImages(state.theme);
      } catch (e) {
        console.warn("[profile-card] プロフィールパーツ画像を読み込めませんでした。手描画にフォールバックします", e);
      }

      // カテゴリ進捗カード画像（4テーマ共通・横型/縦型共通の1セット）。getCommonCategoryImages自体は
      // 各カテゴリを個別にcatchしてnullへ落とすため、ここが失敗するのは
      // 予期しない例外の場合のみ（その場合は6枚すべてCanvas手描きへフォールバック）
      let categoryImages = null;
      try {
        categoryImages = await getCommonCategoryImages();
      } catch (e) {
        console.warn("[profile-card] カテゴリカード画像の読み込みで予期しないエラーが発生しました。手描画にフォールバックします", e);
      }

      // ブランドロゴも補助アセット。読み込み失敗時はnullのままrendererへ渡し、
      // 従来のCanvas手描き（白ピル＋文字）へフォールバックする
      let brandLogoImg = null;
      try {
        brandLogoImg = await getBrandLogoImage();
      } catch (e) {
        console.warn("[profile-card] ブランドロゴ画像を読み込めませんでした。手描画にフォールバックします", e);
      }

      const stats = computeProfileCardStats();
      renderProfileCard(ctx, state, { bgImg, avatarImg, mascotImg, medalFrameImg, profileParts, categoryImages, brandLogoImg }, stats);
    } catch (e) {
      showPreviewError("カードの描画中にエラーが発生しました。" + (e && e.message ? e.message : ""));
    } finally {
      loadingEl.hidden = true;
      renderPending = false;
    }
  }

  // ============================================================
  // フォーム ⇔ state 同期
  // ============================================================
  function persist() {
    saveProfileCardState(state);
  }

  function bindText(id, key, opts = {}) {
    const el = document.getElementById(id);
    el.value = state[key] || (opts.isNumber ? 1 : "");
    el.addEventListener("input", () => {
      state[key] = opts.isNumber ? (parseInt(el.value, 10) || 1) : el.value;
      persist();
      scheduleRender();
    });
  }
  bindText("pcPlayerName", "playerName");
  bindText("pcPlayerId", "playerId");
  bindText("pcLevel", "level", { isNumber: true });
  bindText("pcServer", "server");
  bindText("pcActivityTime", "activityTime");
  bindText("pcSnsX", "snsX");
  bindText("pcSnsTiktok", "snsTiktok");
  bindText("pcSnsYoutube", "snsYoutube");

  const bioEl = document.getElementById("pcBio");
  const bioCountEl = document.getElementById("pcBioCount");
  bioEl.value = state.bio || "";
  function updateBioCount() {
    const len = bioEl.value.length;
    bioCountEl.textContent = `${len} / 60`;
    bioCountEl.classList.toggle("pc-char-count-over", len >= 60);
  }
  updateBioCount();
  bioEl.addEventListener("input", () => {
    state.bio = bioEl.value;
    updateBioCount();
    persist();
    scheduleRender();
  });

  function bindToggle(id, key) {
    const el = document.getElementById(id);
    el.checked = !!state[key];
    el.addEventListener("change", () => {
      state[key] = el.checked;
      persist();
      scheduleRender();
    });
  }
  bindToggle("pcToggleSiteUrl", "showSiteUrl");
  bindToggle("pcToggleSns", "showSns");
  bindToggle("pcToggleDate", "showDate");

  const totalScopeEl = document.getElementById("pcTotalScope");
  totalScopeEl.value = state.totalScope;
  totalScopeEl.addEventListener("change", () => {
    state.totalScope = totalScopeEl.value;
    persist();
    scheduleRender();
  });

  // ── プレイスタイル（単一選択） ──
  const playStyleRow = document.getElementById("pcPlayStyleRow");
  PLAY_STYLE_PRESETS.forEach(label => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pc-tag-chip";
    btn.textContent = label;
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      state.playStyle = state.playStyle === label ? "" : label;
      renderPlayStyleRow();
      persist();
      scheduleRender();
    });
    playStyleRow.appendChild(btn);
  });
  function renderPlayStyleRow() {
    [...playStyleRow.children].forEach(btn => {
      const active = btn.textContent === state.playStyle;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }
  renderPlayStyleRow();

  // ── プロフィールタグ（複数選択＋自由入力） ──
  const tagRow = document.getElementById("pcTagRow");
  function renderTagRow() {
    tagRow.innerHTML = "";
    const allTags = [...new Set([...TAG_PRESETS, ...state.tags])];
    allTags.forEach(label => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pc-tag-chip";
      btn.textContent = label;
      const active = state.tags.includes(label);
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
      btn.addEventListener("click", () => {
        if (state.tags.includes(label)) {
          state.tags = state.tags.filter(t => t !== label);
        } else {
          if (state.tags.length >= MAX_TAGS) {
            showToastIfAvailable(`タグは最大${MAX_TAGS}個までです`);
            return;
          }
          state.tags = [...state.tags, label];
        }
        renderTagRow();
        persist();
        scheduleRender();
      });
      tagRow.appendChild(btn);
    });
  }
  renderTagRow();

  function showToastIfAvailable(msg) {
    if (typeof showToast === "function") showToast(msg);
    else actionStatusEl.textContent = msg;
  }

  const tagCustomInput = document.getElementById("pcTagCustomInput");
  document.getElementById("pcTagCustomAdd").addEventListener("click", () => {
    const v = tagCustomInput.value.trim();
    if (!v) return;
    if (state.tags.includes(v)) { tagCustomInput.value = ""; return; }
    if (state.tags.length >= MAX_TAGS) {
      showToastIfAvailable(`タグは最大${MAX_TAGS}個までです`);
      return;
    }
    state.tags = [...state.tags, v];
    tagCustomInput.value = "";
    renderTagRow();
    persist();
    scheduleRender();
  });

  // ── カテゴリー選択（8枠、重複不可） ──
  const categoryGridEl = document.getElementById("pcCategoryGrid");
  const categorySelects = [];
  for (let i = 0; i < 8; i++) {
    const wrap = document.createElement("div");
    wrap.className = "pc-category-slot";
    const select = document.createElement("select");
    select.setAttribute("aria-label", `カテゴリー枠${i + 1}`);
    select.dataset.slot = String(i);
    wrap.appendChild(select);
    categoryGridEl.appendChild(wrap);
    categorySelects.push(select);
    select.addEventListener("change", () => {
      const ids = categorySelects.map(s => s.value).filter(Boolean);
      // 同じカテゴリーの重複選択は直前の選択を優先して除去する
      const seen = new Set();
      const deduped = [];
      ids.forEach(id => { if (!seen.has(id)) { seen.add(id); deduped.push(id); } });
      state.categoryIds = deduped;
      renderCategorySelects();
      persist();
      scheduleRender();
    });
  }
  function renderCategorySelects() {
    const chosen = state.categoryIds || [];
    categorySelects.forEach((select, i) => {
      const current = chosen[i] || "";
      select.innerHTML = "";
      const noneOpt = document.createElement("option");
      noneOpt.value = "";
      noneOpt.textContent = "（非表示）";
      select.appendChild(noneOpt);
      PROFILE_CARD_CATEGORIES.forEach(def => {
        const usedElsewhere = chosen.includes(def.id) && current !== def.id;
        const opt = document.createElement("option");
        opt.value = def.id;
        opt.textContent = def.label;
        opt.disabled = usedElsewhere;
        select.appendChild(opt);
      });
      select.value = current;
    });
  }
  renderCategorySelects();

  // ── レイアウト・テーマ ──
  const layoutBtns = {
    landscape: document.getElementById("pcLayoutLandscape"),
    portrait: document.getElementById("pcLayoutPortrait"),
  };
  function renderLayoutButtons() {
    Object.entries(layoutBtns).forEach(([key, btn]) => btn.classList.toggle("active", state.layout === key));
  }
  layoutBtns.landscape.addEventListener("click", () => { state.layout = "landscape"; renderLayoutButtons(); persist(); scheduleRender(); });
  layoutBtns.portrait.addEventListener("click", () => { state.layout = "portrait"; renderLayoutButtons(); persist(); scheduleRender(); });
  renderLayoutButtons();

  const themeRow = document.getElementById("pcThemeRow");
  PROFILE_CARD_THEME_IDS.forEach(themeId => {
    const theme = PROFILE_CARD_THEMES[themeId];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pc-swatch";
    btn.style.background = `linear-gradient(135deg, ${theme.gold}, ${theme.indigo})`;
    btn.setAttribute("aria-label", theme.label);
    btn.title = theme.label;
    btn.addEventListener("click", () => { state.theme = themeId; renderThemeRow(); persist(); scheduleRender(); });
    themeRow.appendChild(btn);
  });
  function renderThemeRow() {
    [...themeRow.children].forEach((btn, i) => btn.classList.toggle("active", PROFILE_CARD_THEME_IDS[i] === state.theme));
  }
  renderThemeRow();

  // ============================================================
  // セクション折りたたみ
  // ============================================================
  document.querySelectorAll(".pc-section-head").forEach(head => {
    head.addEventListener("click", () => {
      head.closest(".pc-section").classList.toggle("collapsed");
    });
  });

  // ============================================================
  // アバター編集（ドラッグ・ピンチ・スライダー）
  // ============================================================
  const avatarStage = document.getElementById("pcAvatarStage");
  const avatarImgEl = document.getElementById("pcAvatarImgEl");
  const avatarEmptyEl = document.getElementById("pcAvatarEmpty");
  const avatarZoomEl = document.getElementById("pcAvatarZoom");
  const avatarInput = document.getElementById("pcAvatarInput");
  const avatarErrorEl = document.getElementById("pcAvatarError");
  const STAGE_SIZE = 200;

  function showAvatarError(msg) {
    avatarErrorEl.textContent = msg;
    avatarErrorEl.hidden = false;
  }
  function clearAvatarError() { avatarErrorEl.hidden = true; }

  function avatarNaturalSize() {
    return avatarImg ? { w: avatarImg.naturalWidth, h: avatarImg.naturalHeight } : null;
  }

  function clampAvatarOffsets() {
    const size = avatarNaturalSize();
    if (!size) return;
    const zoom = Math.max(1, state.avatar.zoom || 1);
    const baseScale = Math.max(STAGE_SIZE / size.w, STAGE_SIZE / size.h) * zoom;
    const dw = size.w * baseScale, dh = size.h * baseScale;
    const minOffX = STAGE_SIZE / (2 * dw), maxOffX = 1 - minOffX;
    const minOffY = STAGE_SIZE / (2 * dh), maxOffY = 1 - minOffY;
    state.avatar.offsetX = Math.min(maxOffX, Math.max(minOffX, state.avatar.offsetX));
    state.avatar.offsetY = Math.min(maxOffY, Math.max(minOffY, state.avatar.offsetY));
  }

  function renderAvatarStage() {
    if (!avatarImg) {
      avatarImgEl.hidden = true;
      avatarEmptyEl.hidden = false;
      return;
    }
    avatarEmptyEl.hidden = true;
    avatarImgEl.hidden = false;
    const size = avatarNaturalSize();
    const zoom = Math.max(1, state.avatar.zoom || 1);
    const baseScale = Math.max(STAGE_SIZE / size.w, STAGE_SIZE / size.h) * zoom;
    const dw = size.w * baseScale, dh = size.h * baseScale;
    const dx = STAGE_SIZE / 2 - state.avatar.offsetX * dw;
    const dy = STAGE_SIZE / 2 - state.avatar.offsetY * dh;
    avatarImgEl.style.width = `${dw}px`;
    avatarImgEl.style.height = `${dh}px`;
    avatarImgEl.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  avatarZoomEl.addEventListener("input", () => {
    if (!avatarImg) return;
    state.avatar.zoom = parseFloat(avatarZoomEl.value);
    clampAvatarOffsets();
    renderAvatarStage();
    persist();
    scheduleRender();
  });

  document.getElementById("pcAvatarRecenter").addEventListener("click", () => {
    state.avatar = { offsetX: 0.5, offsetY: 0.5, zoom: 1 };
    avatarZoomEl.value = "1";
    renderAvatarStage();
    persist();
    scheduleRender();
  });

  document.getElementById("pcAvatarDelete").addEventListener("click", async () => {
    avatarImg = null;
    if (avatarObjectUrl) { URL.revokeObjectURL(avatarObjectUrl); avatarObjectUrl = null; }
    state.avatar = { offsetX: 0.5, offsetY: 0.5, zoom: 1 };
    avatarZoomEl.value = "1";
    try { await deleteAvatarBlob(); } catch (e) { /* no-op */ }
    renderAvatarStage();
    persist();
    scheduleRender();
  });

  const MAX_AVATAR_DIMENSION = 1600;
  const MAX_AVATAR_FILE_BYTES = 15 * 1024 * 1024; // 15MB（縮小前の入力上限。ここより大きい画像処理は端末負荷が大きいため事前に断る）

  async function downscaleImageFile(file) {
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) throw new Error("画像を読み込めませんでした");
    const scale = Math.min(1, MAX_AVATAR_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale), h = Math.round(bitmap.height * scale);
    const off = document.createElement("canvas");
    off.width = w; off.height = h;
    const octx = off.getContext("2d");
    octx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close && bitmap.close();
    return new Promise((resolve, reject) => {
      off.toBlob(blob => blob ? resolve(blob) : reject(new Error("画像の変換に失敗しました")), "image/png", 0.92);
    });
  }

  async function handleAvatarFile(file) {
    clearAvatarError();
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      showAvatarError(
        file.type === "image/heic" || file.type === "image/heif" || !file.type
          ? "HEIC形式の画像はこのページで直接処理できません。JPEGまたはPNGに変換してから選択してください。"
          : `対応していない画像形式です（${file.type || "不明"}）。JPEG・PNG・WebPをご利用ください。`
      );
      return;
    }
    if (file.size > MAX_AVATAR_FILE_BYTES) {
      showAvatarError("画像ファイルが大きすぎます（15MBまで）。サイズを小さくしてから選択してください。");
      return;
    }
    try {
      const blob = await downscaleImageFile(file);
      await saveAvatarBlob(blob);
      loadAvatarFromBlob(blob);
      state.avatar = { offsetX: 0.5, offsetY: 0.5, zoom: 1 };
      avatarZoomEl.value = "1";
      persist();
    } catch (e) {
      showAvatarError("画像の処理に失敗しました。別の画像でお試しください。");
      console.error("[profile-card] avatar processing failed", e);
    }
  }

  function loadAvatarFromBlob(blob) {
    if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    avatarObjectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      avatarImg = img;
      avatarImgEl.src = avatarObjectUrl;
      clampAvatarOffsets();
      renderAvatarStage();
      scheduleRender();
    };
    img.onerror = () => {
      showAvatarError("保存済みのアバター画像を読み込めませんでした");
    };
    img.src = avatarObjectUrl;
  }

  avatarInput.addEventListener("change", () => {
    const file = avatarInput.files && avatarInput.files[0];
    handleAvatarFile(file);
    avatarInput.value = "";
  });

  // ドラッグ／タッチ／ピンチ（Pointer Eventsで統一。iOS Safari 13+対応）
  const activePointers = new Map(); // pointerId -> {x,y}
  let dragLastCenter = null;
  let pinchStartDist = null;
  let pinchStartZoom = null;

  function pointerPos(e) {
    const rect = avatarStage.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  avatarStage.addEventListener("pointerdown", (e) => {
    if (!avatarImg) return;
    avatarStage.setPointerCapture(e.pointerId);
    activePointers.set(e.pointerId, pointerPos(e));
    if (activePointers.size === 1) {
      dragLastCenter = pointerPos(e);
    } else if (activePointers.size === 2) {
      const pts = [...activePointers.values()];
      pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStartZoom = state.avatar.zoom || 1;
    }
  });

  avatarStage.addEventListener("pointermove", (e) => {
    if (!avatarImg || !activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, pointerPos(e));

    if (activePointers.size === 2 && pinchStartDist) {
      const pts = [...activePointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const nextZoom = Math.min(3, Math.max(1, pinchStartZoom * (dist / pinchStartDist)));
      state.avatar.zoom = nextZoom;
      avatarZoomEl.value = String(nextZoom);
      clampAvatarOffsets();
      renderAvatarStage();
      return;
    }

    if (activePointers.size === 1 && dragLastCenter) {
      const pos = pointerPos(e);
      const size = avatarNaturalSize();
      const zoom = Math.max(1, state.avatar.zoom || 1);
      const baseScale = Math.max(STAGE_SIZE / size.w, STAGE_SIZE / size.h) * zoom;
      const dw = size.w * baseScale, dh = size.h * baseScale;
      const dxPx = pos.x - dragLastCenter.x;
      const dyPx = pos.y - dragLastCenter.y;
      state.avatar.offsetX -= dxPx / dw;
      state.avatar.offsetY -= dyPx / dh;
      clampAvatarOffsets();
      renderAvatarStage();
      dragLastCenter = pos;
    }
  });

  function endPointer(e) {
    activePointers.delete(e.pointerId);
    if (activePointers.size < 2) { pinchStartDist = null; pinchStartZoom = null; }
    if (activePointers.size === 0) {
      dragLastCenter = null;
      persist();
      scheduleRender();
    } else if (activePointers.size === 1) {
      dragLastCenter = [...activePointers.values()][0];
    }
  }
  avatarStage.addEventListener("pointerup", endPointer);
  avatarStage.addEventListener("pointercancel", endPointer);
  avatarStage.addEventListener("pointerleave", (e) => {
    if (e.buttons === 0) endPointer(e);
  });

  // メインプレビューCanvas上でも同じ操作でアバター位置を調整できるようにする
  let canvasDragLastCenter = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (!avatarImg) return;
    const layout = PROFILE_CARD_LAYOUTS[state.layout];
    const rect = canvas.getBoundingClientRect();
    const scaleX = layout.width / rect.width;
    const scaleY = layout.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const av = layout.avatar;
    if (Math.hypot(px - av.cx, py - av.cy) > av.r) return; // アバター円の外は無視
    canvas.setPointerCapture(e.pointerId);
    canvasDragLastCenter = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!canvasDragLastCenter || !avatarImg) return;
    const layout = PROFILE_CARD_LAYOUTS[state.layout];
    const rect = canvas.getBoundingClientRect();
    const scaleX = layout.width / rect.width;
    const scaleY = layout.height / rect.height;
    const size = avatarNaturalSize();
    const zoom = Math.max(1, state.avatar.zoom || 1);
    const baseScale = Math.max((layout.avatar.r * 2) / size.w, (layout.avatar.r * 2) / size.h) * zoom;
    const dw = size.w * baseScale, dh = size.h * baseScale;
    const dxPx = (e.clientX - canvasDragLastCenter.x) * scaleX;
    const dyPx = (e.clientY - canvasDragLastCenter.y) * scaleY;
    state.avatar.offsetX -= dxPx / dw;
    state.avatar.offsetY -= dyPx / dh;
    clampAvatarOffsets();
    scheduleRender();
    renderAvatarStage();
    canvasDragLastCenter = { x: e.clientX, y: e.clientY };
  });
  function endCanvasDrag() {
    if (canvasDragLastCenter) { canvasDragLastCenter = null; persist(); }
  }
  canvas.addEventListener("pointerup", endCanvasDrag);
  canvas.addEventListener("pointercancel", endCanvasDrag);

  // ============================================================
  // PNG保存・SNS共有
  // ============================================================
  function sanitizeFileNamePart(s) {
    return (s || "player").normalize("NFKC").replace(/[\\/:*?"<>|]+/g, "").trim() || "player";
  }
  function buildFileName() {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const name = sanitizeFileNamePart(state.playerName);
    return `hatopi-profile-${name}-${ymd}-${state.layout}.png`;
  }

  let saveBusy = false;
  async function canvasToBlob() {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("PNGの生成に失敗しました")), "image/png");
    });
  }

  document.getElementById("pcSaveBtn").addEventListener("click", async () => {
    if (saveBusy) return;
    saveBusy = true;
    actionStatusEl.textContent = "保存中…";
    try {
      await renderNow();
      const blob = await canvasToBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = buildFileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      actionStatusEl.textContent = "保存しました";
    } catch (e) {
      actionStatusEl.textContent = "";
      showPreviewError("PNGの保存に失敗しました。" + (e && e.message ? e.message : ""));
    } finally {
      saveBusy = false;
    }
  });

  document.getElementById("pcShareBtn").addEventListener("click", async () => {
    if (saveBusy) return;
    saveBusy = true;
    actionStatusEl.textContent = "共有準備中…";
    try {
      await renderNow();
      const blob = await canvasToBlob();
      const file = new File([blob], buildFileName(), { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        try {
          await navigator.share({
            files: [file],
            title: "ハートピア プロフィールカード",
            text: "はとぴ図鑑でプロフィールカードを作りました！",
          });
          actionStatusEl.textContent = "共有しました";
        } catch (shareErr) {
          if (shareErr && shareErr.name === "AbortError") {
            actionStatusEl.textContent = ""; // ユーザーによるキャンセルはエラー表示しない
          } else {
            throw shareErr;
          }
        }
      } else {
        // 非対応環境はPNG保存へフォールバック
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = buildFileName();
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        actionStatusEl.textContent = "SNS共有に対応していない環境のため、PNGを保存しました";
      }
    } catch (e) {
      actionStatusEl.textContent = "";
      showPreviewError("共有に失敗しました。" + (e && e.message ? e.message : ""));
    } finally {
      saveBusy = false;
    }
  });

  document.getElementById("pcResetBtn").addEventListener("click", async () => {
    if (!confirm("入力内容をすべて初期化します。よろしいですか？（図鑑・料理・園芸・実績のデータは削除されません）")) return;
    clearProfileCardState();
    try { await deleteAvatarBlob(); } catch (e) { /* no-op */ }
    location.reload();
  });

  // ============================================================
  // 初期化
  // ============================================================
  async function init() {
    try {
      const blob = await loadAvatarBlob();
      if (blob) loadAvatarFromBlob(blob);
    } catch (e) {
      console.warn("[profile-card] 保存済みアバターの読み込みに失敗しました（IndexedDB未対応の可能性があります）", e);
    }
    avatarZoomEl.value = String(state.avatar.zoom || 1);
    renderAvatarStage();
    scheduleRender();
  }
  init();

  window.addEventListener("i18n:ready", scheduleRender);
})();
