// js/music-editor.js
// 「楽譜」ページ（music.html）のエディター
// 譜面の手入力（音程・臨時記号・オクターブ・音の長さ・拍子）、演奏をそのまま録音する入力、
// LocalStorageへの保存、練習（なぞり）モード（可変速自動再生／停止中のタップ先取り／
// 押した長さで音が鳴る簡易合成音）を扱う

const DRAFT_KEY = "hatopiMusic_currentDraft";
const SAVED_SCORES_KEY = "hatopiMusic_savedScores";

let pageMode = "edit"; // "edit" | "practice"
let currentInstrumentId = "piano";
let currentLayoutId = "22key"; // 楽器ごとの配置（15鍵2列／15鍵3列／22キーなど）
let semitoneEnabled = false; // ピアノの「22キー」配置のみ、半音(♯)ボタンの表示有無を切り替える
let tokens = []; // {notes:[{degree, accidental, octave}, ...], beats}  ※1音だけでもnotesは配列
let selectedDurationId = "quarter";
let isRecording = false; // 編集モード：ONの間はボタンを押した長さがそのまま音の長さになる
let bpm = DEFAULT_BPM;
let timeSignatureId = DEFAULT_TIME_SIGNATURE_ID;
let scoreName = "";
let currentScoreId = null;
let savedScores = [];

let soundEnabled = true;
let audioCtx = null;
let sustainedTones = new Map(); // pointerId -> {osc, gain}（和音対応：同時に複数鳴らせる）

let isPlaying = false;
let playSpeed = 1.0;
let cursor = -1; // tokens内のインデックス。-1=未開始
let playTimer = null;

// 演奏ボタンの「押す・離す」（和音対応）。同時に押されている指をactiveHoldsで管理し、
// 最初の1本目が押された時点から全ての指が離れるまでを「1つの和音グループ」とする
let activeHolds = new Map(); // pointerId -> {note, btn, startTime}
let currentGroupNotes = []; // 現在の和音グループに含まれる音（離しても消えない。確定時にクリア）
let groupStartTime = 0;

// ── 初期化 ──
function initMusicEditor() {
  loadSavedScores();

  const draft = loadDraft();
  if (draft && Array.isArray(draft.tokens)) {
    tokens = normalizeTokens(draft.tokens);
    currentInstrumentId = draft.instrumentId || "piano";
    bpm = draft.bpm || DEFAULT_BPM;
    timeSignatureId = draft.timeSignatureId || DEFAULT_TIME_SIGNATURE_ID;
    scoreName = draft.name || "";
    currentScoreId = draft.scoreId || null;
  }
  currentLayoutId = defaultLayoutIdFor(currentInstrumentId);

  const savedSound = localStorage.getItem("hatopiMusic_soundEnabled");
  if (savedSound !== null) soundEnabled = savedSound === "1";

  renderInstrumentSelector();
  renderDurationOptions();
  renderTimeSignatureOptions();
  renderLayoutSelector();
  renderInstrumentGrid();
  renderScoreDisplay();
  renderScoreMeta();
  updateSoundToggleUI();
  updateModeUI();
  updateRecordingUI();
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
  currentLayoutId = defaultLayoutIdFor(id);
  semitoneEnabled = false;
  renderInstrumentSelector();
  renderLayoutSelector();
  renderInstrumentGrid();
  saveDraftDebounced();
}

// 楽器ごとの初期配置（ピアノは実機の初期選択に合わせ「22キー」、それ以外は先頭の配置）
function defaultLayoutIdFor(instrumentId) {
  const inst = getInstrument(instrumentId);
  if (instrumentId === "piano") return "22key";
  return inst.layouts[0].id;
}

// ── 配置(15鍵2列／15鍵3列／22キーなど)の切り替え ──
function renderLayoutSelector() {
  const el = document.getElementById("musicLayoutButtons");
  const inst = getInstrument(currentInstrumentId);
  if (inst.layouts.length <= 1) {
    el.innerHTML = "";
    el.style.display = "none";
    updateSemitoneToggleVisibility();
    return;
  }
  el.style.display = "";
  el.innerHTML = inst.layouts
    .map(
      (l) => `<button class="music-layout-btn${l.id === currentLayoutId ? " active" : ""}" data-layout="${l.id}">${T(l.labelKey, l.labelFallback)}</button>`
    )
    .join("");
  el.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => selectLayout(btn.dataset.layout));
  });
  updateSemitoneToggleVisibility();
}

function selectLayout(id) {
  currentLayoutId = id;
  renderLayoutSelector();
  renderInstrumentGrid();
  saveDraftDebounced();
}

// ピアノの「22キー」配置の時だけ、半音(♯)表示のON/OFFトグルを見せる
function updateSemitoneToggleVisibility() {
  const row = document.getElementById("musicSemitoneRow");
  if (!row) return;
  const layout = getLayout(getInstrument(currentInstrumentId), currentLayoutId);
  const show = !!layout.chromaticGrid;
  row.style.display = show ? "" : "none";
  const toggle = document.getElementById("musicSemitoneToggle");
  if (toggle) toggle.checked = semitoneEnabled;
}

function toggleSemitone() {
  semitoneEnabled = !semitoneEnabled;
  renderInstrumentGrid();
}

// ── 楽器の演奏ボタン（実機の配置を再現。押している間だけ音が鳴る） ──
function renderInstrumentGrid() {
  const el = document.getElementById("musicInstrumentGrid");
  const inst = getInstrument(currentInstrumentId);
  const layout = getLayout(inst, currentLayoutId);
  const grid = semitoneEnabled && layout.chromaticGrid ? layout.chromaticGrid : layout.grid;
  el.innerHTML = grid
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
    bindNoteButtonHold(btn, note);
  });
  applyPracticeGridSizing();
}

// 練習モードのボタンサイズ：実機は配置(何鍵配置か)ごとに、1番ボタン数が多い行が
// 画面幅にちょうど収まるサイズで表示される（＝配置によってボタンの大きさが変わる）。
// 画面幅に対する一律の割合(vw)で縮めると、実機よりボタンが小さくなり指の感覚が合わないため、
// 「現在の配置の最大行のボタン数」から実機と同じ考え方でボタン1個分の幅を逆算する
const MUSIC_BTN_GAP = 6; // .music-instrument-row の gap と合わせる
const MUSIC_BTN_MIN = 44; // タップ可能な最小サイズ
const MUSIC_BTN_MAX = 100; // 疎な配置(オカリナ等)で際限なく大きくならないための上限

function applyPracticeGridSizing() {
  const el = document.getElementById("musicInstrumentGrid");
  if (!el || pageMode !== "practice") return;
  const inst = getInstrument(currentInstrumentId);
  const layout = getLayout(inst, currentLayoutId);
  const grid = semitoneEnabled && layout.chromaticGrid ? layout.chromaticGrid : layout.grid;
  const maxRowLen = Math.max(...grid.map((row) => row.length));
  const available = el.clientWidth;
  if (!available || !maxRowLen) return;
  const raw = (available - (maxRowLen - 1) * MUSIC_BTN_GAP) / maxRowLen;
  const size = Math.max(MUSIC_BTN_MIN, Math.min(MUSIC_BTN_MAX, raw));
  el.style.setProperty("--music-btn-w", `${size}px`);
}

// 演奏ボタンの「押す・離す」を扱う（和音対応）。最初の1本目が押されてから
// 全ての指が離れるまでを1つの和音グループとして扱う
function bindNoteButtonHold(btn, note) {
  const start = (e) => {
    e.preventDefault();
    try {
      btn.setPointerCapture(e.pointerId);
    } catch (err) {}
    btn.classList.add("pressed");
    if (activeHolds.size === 0) {
      currentGroupNotes = [];
      groupStartTime = performance.now();
    }
    activeHolds.set(e.pointerId, { note, btn, startTime: performance.now() });
    currentGroupNotes.push(note);
    startSustainedTone(e.pointerId, noteFrequency(note));
    if (pageMode === "practice") tryAdvancePracticeChord();
  };
  const end = (e) => {
    const held = activeHolds.get(e.pointerId);
    if (!held) return;
    held.btn.classList.remove("pressed");
    activeHolds.delete(e.pointerId);
    stopSustainedTone(e.pointerId);
    if (activeHolds.size === 0) finalizeGroup();
  };
  btn.addEventListener("pointerdown", start);
  btn.addEventListener("pointerup", end);
  btn.addEventListener("pointercancel", end);
}

// 和音グループの全ての指が離れた時点で確定する（編集モードのみ譜面に追加。
// 練習モードは押した時点で既に先取り判定済みのため、ここでは何もしない）
function finalizeGroup() {
  if (!currentGroupNotes.length) return;
  const notes = dedupeNotes(currentGroupNotes);
  if (pageMode === "edit") {
    if (isRecording) {
      const rawBeats = (performance.now() - groupStartTime) / 1000 / (60 / bpm);
      addChordToken(notes, snapBeatsToPreset(rawBeats));
    } else {
      addChordToken(notes, getDuration(selectedDurationId).beats);
    }
  }
  currentGroupNotes = [];
}

function dedupeNotes(notes) {
  const seen = new Set();
  const result = [];
  notes.forEach((n) => {
    const k = noteKey(n);
    if (!seen.has(k)) {
      seen.add(k);
      result.push(n);
    }
  });
  return result;
}

function snapBeatsToPreset(rawBeats) {
  let best = DURATION_PRESETS[0].beats;
  let bestDiff = Infinity;
  DURATION_PRESETS.forEach((d) => {
    const diff = Math.abs(d.beats - rawBeats);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = d.beats;
    }
  });
  return best;
}

// ── 音の長さ選択（編集モード・非録音時用） ──
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

// ── 拍子選択 ──
function renderTimeSignatureOptions() {
  const el = document.getElementById("musicTimeSigSelect");
  el.innerHTML = TIME_SIGNATURES.map((t) => `<option value="${t.id}"${t.id === timeSignatureId ? " selected" : ""}>${t.label}</option>`).join("");
}

// ── 録音トグル ──
function toggleRecording() {
  isRecording = !isRecording;
  updateRecordingUI();
}

function updateRecordingUI() {
  const toggle = document.getElementById("musicRecordToggle");
  if (toggle) toggle.checked = isRecording;
  document.getElementById("musicDurationOptions").classList.toggle("disabled", isRecording);
  document.getElementById("musicRecordHint").style.display = isRecording ? "" : "none";
}

// ── 譜面の編集 ──
function addChordToken(notes, beats) {
  tokens.push({
    notes: notes.map((n) => ({ degree: n.degree, accidental: n.accidental || null, octave: n.octave })),
    beats,
  });
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

// ── 譜面の表示（編集中のプレビュー／練習モードのハイライト共通）。
// 小節線は保存せず、拍子(timeSignature)をもとに毎回その場で計算して表示する ──
function renderScoreDisplay() {
  const el = document.getElementById("musicScoreDisplay");
  if (!tokens.length) {
    el.innerHTML = `<div class="music-score-empty">${T("music_score_empty", "まだ音が入力されていません")}</div>`;
    return;
  }
  const beatsPerBar = getTimeSignature(timeSignatureId).beatsPerBar;
  let html = "";
  let beatsSinceBar = 0;
  tokens.forEach((tok, i) => {
    if (i > 0 && beatsSinceBar >= beatsPerBar) {
      html += `<span class="music-chip music-chip-bar"></span>`;
      beatsSinceBar = 0;
    }
    const current = pageMode === "practice" && i === cursor;
    const isChord = tok.notes.length > 1;
    const digits = tok.notes.map((n) => `<span class="music-note-digit">${noteDisplayDigit(n)}</span>`).join("");
    const kana = isChord ? "" : `<span class="music-note-kana">${DEGREE_LABELS[tok.notes[0].degree]}</span>`;
    html += `<span class="music-chip${isChord ? " chord" : ""}${current ? " current" : ""}" data-index="${i}">${digits}${kana}</span>`;
    beatsSinceBar += tok.beats;
  });
  el.innerHTML = html;

  if (pageMode === "practice" && cursor >= 0) {
    const cur = el.querySelector(".music-chip.current");
    if (cur) cur.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }
}

function renderScoreMeta() {
  document.getElementById("musicScoreNameInput").value = scoreName;
  document.getElementById("musicBpmInput").value = bpm;
  const timeSigSelect = document.getElementById("musicTimeSigSelect");
  if (timeSigSelect) timeSigSelect.value = timeSignatureId;
}

// ── モード切り替え(編集/練習) ──
function setPageMode(mode) {
  if (pageMode === mode) return;
  releaseAllHolds();
  stopPlayback();
  pageMode = mode;
  cursor = -1;
  updateModeUI();
  renderScoreDisplay();
}

// 押しっぱなしの指を全て強制的に離した扱いにする（モード切り替え時などの後始末）
function releaseAllHolds() {
  activeHolds.forEach((held) => held.btn.classList.remove("pressed"));
  activeHolds.clear();
  currentGroupNotes = [];
  stopAllSustainedTones();
}

function updateModeUI() {
  document.getElementById("musicModeEditBtn").classList.toggle("active", pageMode === "edit");
  document.getElementById("musicModePracticeBtn").classList.toggle("active", pageMode === "practice");
  document.getElementById("musicEditControls").style.display = pageMode === "edit" ? "" : "none";
  document.getElementById("musicScoreEditRow").style.display = pageMode === "edit" ? "" : "none";
  document.getElementById("musicPracticeControls").style.display = pageMode === "practice" ? "" : "none";
  // 練習モードでは、画面幅に合わせて縮めず実機に近いサイズで表示する
  // （はみ出す分は横スクロール。編集モードは今まで通り画面幅に収める）
  document.getElementById("musicInstrumentGrid").classList.toggle("practice-size", pageMode === "practice");
  applyPracticeGridSizing();
}

// ── 練習(なぞり)モード：再生 ──
function nextNoteIndex(fromIdx) {
  return fromIdx + 1 < tokens.length ? fromIdx + 1 : null;
}

function tryAdvancePracticeChord() {
  const idx = nextNoteIndex(cursor);
  if (idx === null) return;
  if (!notesSetEqual(currentGroupNotes, tokens[idx].notes)) return;
  cursor = idx;
  renderScoreDisplay();
  if (isPlaying) {
    clearTimeout(playTimer);
    scheduleNextTick();
  }
  if (nextNoteIndex(cursor) === null) stopPlayback();
}

function notesSetEqual(a, b) {
  const aKeys = dedupeNotes(a).map(noteKey).sort();
  const bKeys = dedupeNotes(b).map(noteKey).sort();
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k, i) => k === bKeys[i]);
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
  const tok = tokens[idx];
  const durSec = (60 / bpm) * tok.beats / playSpeed;
  tok.notes.forEach((n) => playTone(noteFrequency(n), durSec));
  playTimer = setTimeout(tick, durSec * 1000);
}

function scheduleNextTick() {
  const idx = nextNoteIndex(cursor);
  if (idx === null) {
    stopPlayback();
    return;
  }
  const tok = tokens[cursor];
  const durSec = (60 / bpm) * tok.beats / playSpeed;
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

// 一定の長さだけ自動で鳴らす（自動再生用）
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

// 押している間だけ鳴らし続ける（練習モード・録音入力用）。和音対応のため
// 指(pointerId)ごとに個別の音源を持ち、複数同時に鳴らせるようにする
function startSustainedTone(pointerId, freq) {
  if (!soundEnabled) return;
  try {
    stopSustainedTone(pointerId);
    const ctx = ensureAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    // 和音で複数同時に鳴る想定のため、単音時より少し音量を抑える
    gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    sustainedTones.set(pointerId, { osc, gain });
  } catch (e) {
    // Web Audio非対応環境では無音のまま無視する
  }
}

function stopSustainedTone(pointerId) {
  const t = sustainedTones.get(pointerId);
  if (!t) return;
  try {
    const ctx = ensureAudioCtx();
    const now = ctx.currentTime;
    t.gain.gain.cancelScheduledValues(now);
    t.gain.gain.setValueAtTime(t.gain.gain.value, now);
    t.gain.gain.linearRampToValueAtTime(0, now + 0.05);
    t.osc.stop(now + 0.08);
  } catch (e) {}
  sustainedTones.delete(pointerId);
}

function stopAllSustainedTones() {
  [...sustainedTones.keys()].forEach(stopSustainedTone);
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
    JSON.stringify({ tokens, instrumentId: currentInstrumentId, bpm, timeSignatureId, name: scoreName, scoreId: currentScoreId })
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
    existing.timeSignatureId = timeSignatureId;
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
    timeSignatureId,
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
  timeSignatureId = DEFAULT_TIME_SIGNATURE_ID;
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
        <div class="music-saved-meta">${T(getInstrument(s.instrumentId).nameKey, getInstrument(s.instrumentId).nameFallback)} ・ ${s.tokens.length}${T("music_note_count_suffix", "音")}</div>
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
  tokens = normalizeTokens(score.tokens);
  currentInstrumentId = score.instrumentId;
  currentLayoutId = defaultLayoutIdFor(currentInstrumentId);
  semitoneEnabled = false;
  bpm = score.bpm || DEFAULT_BPM;
  timeSignatureId = score.timeSignatureId || DEFAULT_TIME_SIGNATURE_ID;
  scoreName = score.name;
  currentScoreId = score.id;
  cursor = -1;
  stopPlayback();
  renderInstrumentSelector();
  renderLayoutSelector();
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
// 和音対応前（{degree,accidental,octave,beats}）に保存された譜面を
// 現在の形式（{notes:[...], beats}）に変換する
function normalizeTokens(rawTokens) {
  if (!Array.isArray(rawTokens)) return [];
  return rawTokens.map((t) => {
    if (Array.isArray(t.notes)) return t;
    return { notes: [{ degree: t.degree, accidental: t.accidental || null, octave: t.octave }], beats: t.beats };
  });
}

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
  document.getElementById("musicTimeSigSelect").addEventListener("change", (e) => {
    timeSignatureId = e.target.value;
    renderScoreDisplay();
    saveDraftDebounced();
  });

  document.getElementById("musicRecordToggle").addEventListener("change", toggleRecording);
  document.getElementById("musicSemitoneToggle").addEventListener("change", toggleSemitone);

  document.getElementById("musicDeleteLastBtn").addEventListener("click", deleteLastToken);
  document.getElementById("musicClearBtn").addEventListener("click", clearScore);

  document.getElementById("musicPlayPauseBtn").addEventListener("click", togglePlayback);
  document.getElementById("musicSpeedSlider").addEventListener("input", (e) => setPlaySpeed(e.target.value));

  document.getElementById("musicSoundToggleBtn").addEventListener("click", toggleSound);

  // 画面回転・リサイズ時にも練習モードのボタンサイズを再計算する
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyPracticeGridSizing, 150);
  });
}

document.addEventListener("langchange", () => {
  renderInstrumentSelector();
  renderDurationOptions();
  renderLayoutSelector();
  renderInstrumentGrid();
  renderScoreDisplay();
  if (document.getElementById("musicSavedListModal").style.display !== "none") renderSavedList();
});

initMusicEditor();
