// js/music-editor.js
// 「楽譜」ページ（music.html）のエディター
// 譜面の手入力（音程・臨時記号・オクターブ・音の長さ・小節区切り）、LocalStorageへの保存、
// 練習（なぞり）モード（可変速自動再生／停止中のタップ先取り／簡易合成音）を扱う

const DRAFT_KEY = "hatopiMusic_currentDraft";
const SAVED_SCORES_KEY = "hatopiMusic_savedScores";

let pageMode = "edit"; // "edit" | "practice"
let currentInstrumentId = "piano";
let tokens = []; // {type:"note", degree, accidental, octave, beats} | {type:"bar"}
let selectedDurationId = "quarter";
let bpm = DEFAULT_BPM;
let scoreName = "";
let currentScoreId = null;
let savedScores = [];

let soundEnabled = true;
let audioCtx = null;

let isPlaying = false;
let playSpeed = 1.0;
let cursor = -1; // tokens内のインデックス。-1=未開始
let playTimer = null;

// ── 初期化 ──
function initMusicEditor() {
  loadSavedScores();

  const draft = loadDraft();
  if (draft && Array.isArray(draft.tokens)) {
    tokens = draft.tokens;
    currentInstrumentId = draft.instrumentId || "piano";
    bpm = draft.bpm || DEFAULT_BPM;
    scoreName = draft.name || "";
    currentScoreId = draft.scoreId || null;
  }

  const savedSound = localStorage.getItem("hatopiMusic_soundEnabled");
  if (savedSound !== null) soundEnabled = savedSound === "1";

  renderInstrumentSelector();
  renderDurationOptions();
  renderInstrumentGrid();
  renderScoreDisplay();
  renderScoreMeta();
  updateSoundToggleUI();
  updateModeUI();
  bindControls();
}

// ── 楽器の切り替え ──
function renderInstrumentSelector() {
  const el = document.getElementById("musicInstrumentButtons");
  el.innerHTML = INSTRUMENTS.map(
    (inst) => `
    <button class="music-instrument-btn${inst.id === currentInstrumentId ? " active" : ""}" data-instrument="${inst.id}">
      ${T(inst.nameKey, inst.nameFallback)}
    </button>
  `
  ).join("");
  el.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => selectInstrument(btn.dataset.instrument));
  });
}

function selectInstrument(id) {
  currentInstrumentId = id;
  renderInstrumentSelector();
  renderInstrumentGrid();
  saveDraftDebounced();
}

// ── 楽器の演奏ボタン（実機の配置を再現） ──
function renderInstrumentGrid() {
  const el = document.getElementById("musicInstrumentGrid");
  const inst = getInstrument(currentInstrumentId);
  el.innerHTML = inst.grid
    .map(
      (row) => `
      <div class="music-instrument-row">
        ${row
          .map((note) => {
            const label = noteDisplayDigit(note);
            return `<button class="music-note-btn${note.accidental ? " accidental" : ""}" data-note='${JSON.stringify(note)}'>
              <span class="music-note-digit">${label}</span>
              <span class="music-note-kana">${DEGREE_LABELS[note.degree]}</span>
            </button>`;
          })
          .join("")}
      </div>
    `
    )
    .join("");
  el.querySelectorAll(".music-note-btn").forEach((btn) => {
    const note = JSON.parse(btn.dataset.note);
    btn.addEventListener("click", () => handleInstrumentTap(note));
  });
}

function handleInstrumentTap(note) {
  const beats = pageMode === "edit" ? getDuration(selectedDurationId).beats : cursorTapBeats(note);
  playTone(noteFrequency(note), (60 / bpm) * beats);
  if (pageMode === "edit") {
    addNoteToken(note);
  } else {
    tryAdvancePractice(note);
  }
}

function cursorTapBeats(note) {
  const idx = nextNoteIndex(cursor);
  if (idx !== null && notesEqual(tokens[idx], note)) return tokens[idx].beats;
  return 1; // 期待している音と違う場合も、タップの手応え用に4分音符ぶんだけ鳴らす
}

// ── 音の長さ選択（編集モード用） ──
function renderDurationOptions() {
  const el = document.getElementById("musicDurationOptions");
  el.innerHTML = DURATION_PRESETS.map(
    (d) => `<button class="music-duration-btn${d.id === selectedDurationId ? " active" : ""}" data-duration="${d.id}">${T(d.labelKey, d.labelFallback)}</button>`
  ).join("");
  el.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedDurationId = btn.dataset.duration;
      renderDurationOptions();
    });
  });
}

// ── 譜面の編集 ──
function addNoteToken(note) {
  tokens.push({ type: "note", degree: note.degree, accidental: note.accidental || null, octave: note.octave, beats: getDuration(selectedDurationId).beats });
  renderScoreDisplay();
  saveDraftDebounced();
}

function addBarToken() {
  if (!tokens.length || tokens[tokens.length - 1].type === "bar") return;
  tokens.push({ type: "bar" });
  renderScoreDisplay();
  saveDraftDebounced();
}

function deleteLastToken() {
  tokens.pop();
  renderScoreDisplay();
  saveDraftDebounced();
}

function clearScore() {
  if (!tokens.length) return;
  if (!confirm(T("music_confirm_clear", "譜面をすべて消去しますか？"))) return;
  tokens = [];
  renderScoreDisplay();
  saveDraftDebounced();
}

// ── 譜面の表示（編集中のプレビュー／練習モードのハイライト共通） ──
function renderScoreDisplay() {
  const el = document.getElementById("musicScoreDisplay");
  if (!tokens.length) {
    el.innerHTML = `<div class="music-score-empty">${T("music_score_empty", "まだ音が入力されていません")}</div>`;
    return;
  }
  el.innerHTML = tokens
    .map((tok, i) => {
      if (tok.type === "bar") return `<span class="music-chip music-chip-bar"></span>`;
      const current = pageMode === "practice" && i === cursor;
      return `<span class="music-chip${current ? " current" : ""}" data-index="${i}">
        <span class="music-note-digit">${noteDisplayDigit(tok)}</span>
        <span class="music-note-kana">${DEGREE_LABELS[tok.degree]}</span>
      </span>`;
    })
    .join("");

  if (pageMode === "practice" && cursor >= 0) {
    const cur = el.querySelector(".music-chip.current");
    if (cur) cur.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }
}

function renderScoreMeta() {
  document.getElementById("musicScoreNameInput").value = scoreName;
  document.getElementById("musicBpmInput").value = bpm;
}

// ── モード切り替え(編集/練習) ──
function setPageMode(mode) {
  if (pageMode === mode) return;
  stopPlayback();
  pageMode = mode;
  cursor = -1;
  updateModeUI();
  renderScoreDisplay();
}

function updateModeUI() {
  document.getElementById("musicModeEditBtn").classList.toggle("active", pageMode === "edit");
  document.getElementById("musicModePracticeBtn").classList.toggle("active", pageMode === "practice");
  document.getElementById("musicEditControls").style.display = pageMode === "edit" ? "" : "none";
  document.getElementById("musicScoreEditRow").style.display = pageMode === "edit" ? "" : "none";
  document.getElementById("musicPracticeControls").style.display = pageMode === "practice" ? "" : "none";
  // 練習モードでは、画面幅に合わせて縮めず実機に近い固定サイズで表示する
  // （はみ出す分は横スクロール。編集モードは今まで通り画面幅に収める）
  document.getElementById("musicInstrumentGrid").classList.toggle("practice-size", pageMode === "practice");
}

// ── 練習(なぞり)モード：再生 ──
function nextNoteIndex(fromIdx) {
  for (let i = fromIdx + 1; i < tokens.length; i++) {
    if (tokens[i].type === "note") return i;
  }
  return null;
}

function tryAdvancePractice(note) {
  const idx = nextNoteIndex(cursor);
  if (idx === null) return;
  if (!notesEqual(tokens[idx], note)) return;
  cursor = idx;
  renderScoreDisplay();
  if (isPlaying) {
    clearTimeout(playTimer);
    scheduleNextTick();
  }
  if (nextNoteIndex(cursor) === null) stopPlayback();
}

function togglePlayback() {
  if (isPlaying) pausePlayback();
  else startPlayback();
}

function startPlayback() {
  if (isPlaying) return;
  if (nextNoteIndex(cursor) === null) cursor = -1; // 最後まで行っていたら最初から
  isPlaying = true;
  updatePlaybackUI();
  tick();
}

function pausePlayback() {
  isPlaying = false;
  clearTimeout(playTimer);
  updatePlaybackUI();
}

function stopPlayback() {
  isPlaying = false;
  clearTimeout(playTimer);
  updatePlaybackUI();
}

function tick() {
  const idx = nextNoteIndex(cursor);
  if (idx === null) {
    stopPlayback();
    return;
  }
  cursor = idx;
  renderScoreDisplay();
  const note = tokens[idx];
  const durSec = (60 / bpm) * note.beats / playSpeed;
  playTone(noteFrequency(note), durSec);
  playTimer = setTimeout(tick, durSec * 1000);
}

function scheduleNextTick() {
  const idx = nextNoteIndex(cursor);
  if (idx === null) {
    stopPlayback();
    return;
  }
  const note = tokens[cursor];
  const durSec = (60 / bpm) * note.beats / playSpeed;
  playTimer = setTimeout(tick, durSec * 1000);
}

function updatePlaybackUI() {
  const btn = document.getElementById("musicPlayPauseBtn");
  btn.innerHTML = icon(isPlaying ? "pause" : "play", { size: 18 });
}

function setPlaySpeed(v) {
  playSpeed = Math.max(0.1, Math.min(1, Number(v)));
  document.getElementById("musicSpeedLabel").textContent = `${playSpeed.toFixed(2)}${T("music_speed_suffix", "倍")}`;
}

// ── 簡易合成音 ──
function ensureAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function playTone(freq, durationSec) {
  if (!soundEnabled) return;
  try {
    const ctx = ensureAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    const attack = 0.01;
    const release = Math.min(0.25, durationSec * 0.4);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.22, now + attack);
    gain.gain.setValueAtTime(0.22, now + Math.max(attack, durationSec - release));
    gain.gain.linearRampToValueAtTime(0, now + durationSec);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);
  } catch (e) {
    // Web Audio非対応環境では無音のまま無視する
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  updateSoundToggleUI();
  localStorage.setItem("hatopiMusic_soundEnabled", soundEnabled ? "1" : "0");
}

function updateSoundToggleUI() {
  const btn = document.getElementById("musicSoundToggleBtn");
  if (!btn) return;
  btn.innerHTML = icon(soundEnabled ? "volumeOn" : "volumeOff", { size: 18 });
  btn.classList.toggle("muted", !soundEnabled);
}

// ── 下書きの自動保存 ──
function saveDraft() {
  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({ tokens, instrumentId: currentInstrumentId, bpm, name: scoreName, scoreId: currentScoreId })
  );
}

let saveTimer = null;
function saveDraftDebounced() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveDraft, 500);
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// ── 名前を付けて保存した譜面の一覧管理 ──
function loadSavedScores() {
  try {
    const raw = localStorage.getItem(SAVED_SCORES_KEY);
    savedScores = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(savedScores)) savedScores = [];
  } catch (e) {
    savedScores = [];
  }
}

function persistSavedScores() {
  localStorage.setItem(SAVED_SCORES_KEY, JSON.stringify(savedScores));
}

function saveCurrentAsScore() {
  scoreName = document.getElementById("musicScoreNameInput").value.trim();
  const existing = savedScores.find((s) => s.id === currentScoreId);
  if (existing) {
    existing.name = scoreName || T("music_default_score_name", "譜面");
    existing.instrumentId = currentInstrumentId;
    existing.bpm = bpm;
    existing.tokens = tokens.slice();
    existing.updatedAt = Date.now();
    persistSavedScores();
    showToast(T("music_toast_updated", "更新しました"));
    return;
  }
  const score = {
    id: "score-" + Date.now(),
    name: scoreName || T("music_default_score_name", "譜面"),
    instrumentId: currentInstrumentId,
    bpm,
    tokens: tokens.slice(),
    updatedAt: Date.now(),
  };
  savedScores.push(score);
  persistSavedScores();
  currentScoreId = score.id;
  saveDraft();
  showToast(T("music_toast_saved", "保存しました"));
}

function newScore() {
  if (tokens.length && !confirm(T("music_confirm_new", "編集中の譜面を破棄して新規作成しますか？"))) return;
  tokens = [];
  scoreName = "";
  currentScoreId = null;
  bpm = DEFAULT_BPM;
  renderScoreMeta();
  renderScoreDisplay();
  saveDraft();
}

function openSavedListModal() {
  renderSavedList();
  document.getElementById("musicSavedListModal").style.display = "block";
}

function closeSavedListModal() {
  document.getElementById("musicSavedListModal").style.display = "none";
}

function renderSavedList() {
  const el = document.getElementById("musicSavedList");
  if (!savedScores.length) {
    el.innerHTML = `<div class="music-saved-empty">${T("music_saved_empty", "保存した譜面はまだありません")}</div>`;
    return;
  }
  const sorted = savedScores.slice().sort((a, b) => b.updatedAt - a.updatedAt);
  el.innerHTML = sorted
    .map(
      (s) => `
    <div class="music-saved-item${s.id === currentScoreId ? " current" : ""}">
      <div class="music-saved-info">
        <div class="music-saved-name">${escapeHtml(s.name)}</div>
        <div class="music-saved-meta">${T(getInstrument(s.instrumentId).nameKey, getInstrument(s.instrumentId).nameFallback)} ・ ${s.tokens.filter((t) => t.type === "note").length}${T("music_note_count_suffix", "音")}</div>
      </div>
      <div class="music-saved-actions">
        <button onclick="loadScore('${s.id}')">${T("music_open", "開く")}</button>
        <button onclick="deleteScore('${s.id}')">${T("music_delete", "削除")}</button>
      </div>
    </div>
  `
    )
    .join("");
}

function loadScore(id) {
  const score = savedScores.find((s) => s.id === id);
  if (!score) return;
  tokens = score.tokens.slice();
  currentInstrumentId = score.instrumentId;
  bpm = score.bpm || DEFAULT_BPM;
  scoreName = score.name;
  currentScoreId = score.id;
  cursor = -1;
  stopPlayback();
  renderInstrumentSelector();
  renderInstrumentGrid();
  renderScoreMeta();
  renderScoreDisplay();
  saveDraft();
  closeSavedListModal();
}

function deleteScore(id) {
  if (!confirm(T("music_confirm_delete", "この譜面を削除しますか？"))) return;
  savedScores = savedScores.filter((s) => s.id !== id);
  persistSavedScores();
  if (currentScoreId === id) currentScoreId = null;
  renderSavedList();
}

// ── ヘルプモーダル ──
function openHelpModal() {
  document.getElementById("helpModal").style.display = "block";
}
function closeHelpModal() {
  document.getElementById("helpModal").style.display = "none";
}

// ── ユーティリティ ──
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function showToast(msg) {
  const t = document.getElementById("musicToast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

// ── イベント結線 ──
function bindControls() {
  document.getElementById("musicModeEditBtn").addEventListener("click", () => setPageMode("edit"));
  document.getElementById("musicModePracticeBtn").addEventListener("click", () => setPageMode("practice"));

  document.getElementById("musicNewBtn").addEventListener("click", newScore);
  document.getElementById("musicSaveBtn").addEventListener("click", saveCurrentAsScore);
  document.getElementById("musicOpenListBtn").addEventListener("click", openSavedListModal);

  document.getElementById("musicScoreNameInput").addEventListener("input", (e) => {
    scoreName = e.target.value;
    saveDraftDebounced();
  });
  document.getElementById("musicBpmInput").addEventListener("change", (e) => {
    bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, Number(e.target.value) || DEFAULT_BPM));
    e.target.value = bpm;
    saveDraftDebounced();
  });

  document.getElementById("musicAddBarBtn").addEventListener("click", addBarToken);
  document.getElementById("musicDeleteLastBtn").addEventListener("click", deleteLastToken);
  document.getElementById("musicClearBtn").addEventListener("click", clearScore);

  document.getElementById("musicPlayPauseBtn").addEventListener("click", togglePlayback);
  document.getElementById("musicSpeedSlider").addEventListener("input", (e) => setPlaySpeed(e.target.value));

  document.getElementById("musicSoundToggleBtn").addEventListener("click", toggleSound);
}

document.addEventListener("langchange", () => {
  renderInstrumentSelector();
  renderDurationOptions();
  renderInstrumentGrid();
  renderScoreDisplay();
  if (document.getElementById("musicSavedListModal").style.display !== "none") renderSavedList();
});

initMusicEditor();
