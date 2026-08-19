// js/music-editor.js
// 「楽譜」ページ（music.html）のエディター
// 譜面の手入力（音程・臨時記号・オクターブ・音の長さ・拍子）、演奏をそのまま録音する入力、
// LocalStorageへの保存、練習（なぞり）モード（可変速自動再生／停止中のタップ先取り／
// 押した長さで音が鳴る簡易合成音）を扱う

const DRAFT_KEY = "hatopiMusic_currentDraft";
const SAVED_SCORES_KEY = "hatopiMusic_savedScores";

let pageMode = "edit"; // "edit" | "practice" | "follow"
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

// はじめての案内（①楽器→②テンポ→③録音か手入力か）。録音前のテンポ確認案内は、
// この案内を1回でも見た後、あるいは実際にテンポ・拍子を変更した後は出さない
const ONBOARDING_SEEN_KEY = "hatopiMusic_onboardingSeen";
let onboardStep = 1;
let onboardInstrumentId = "piano";
let tempoWarningDismissed = false;

let soundEnabled = true;
let audioCtx = null;
let sustainedTones = new Map(); // pointerId -> {osc, gain}（和音対応：同時に複数鳴らせる）

let isPlaying = false;
let playSpeed = 1.0;
let cursor = -1; // tokens内のインデックス。-1=未開始
let playTimer = null;

// 区間リピート：苦手な部分だけを選んで繰り返し練習・再生できる（練習モード・追従モード共通）
let loopStart = null; // ループ区間の開始インデックス（tokens内）
let loopEnd = null; // ループ区間の終了インデックス
let loopEnabled = false; // ループ再生のON/OFF（区間は選んだままON/OFFだけ切り替えられる）
let loopSelecting = false; // 譜面をタップして区間を選んでいる最中かどうか

// 個別の音の手直し：編集モードで譜面の音を1つタップすると選択状態になり、
// 次に演奏ボタンを弾くとその音が置き換わる（末尾からの「最後を削除」しかなかった
// 操作を、途中の音1つだけの修正でも使えるようにする）
let selectedTokenIndex = null; // 選択中の音のtokensインデックス（null=未選択）
// ハミングから自動変換された直後の音のうち、まだ確認・修正していないもの。
// 認識精度が完璧ではないため、どれが自動検出かひと目で分かるようにし、
// 手直しした音から順にマークが消えていく
let humReviewIndexes = new Set();

// 演奏ボタンの「押す・離す」（和音対応）。同時に押されている指をactiveHoldsで管理し、
// 最初の1本目が押された時点から全ての指が離れるまでを「1つの和音グループ」とする
let activeHolds = new Map(); // pointerId -> {note, btn, startTime}
let currentGroupNotes = []; // 現在の和音グループに含まれる音（離しても消えない。確定時にクリア）
let groupStartTime = 0;

// 演奏ボタンの拡大率・位置は端末や個人の感覚差が大きいため、ユーザー自身が調整モードで
// 拡大縮小・移動でき、その結果をlocalStorageに保存して端末ごとに記憶する
const MUSIC_CALIB_KEY = "hatopiMusic_stageCalib";
const MUSIC_CALIB_DEFAULT = { scale: 1.05, offsetX: 0, offsetY: -0.6 }; // offsetは vh 単位
const MUSIC_CALIB_SCALE_MIN = 0.5;
const MUSIC_CALIB_SCALE_MAX = 2.5;
const MUSIC_CALIB_SNAP_THRESHOLD = 1.2; // 中央からこの範囲内（%）に入ると吸着する
let calib = { ...MUSIC_CALIB_DEFAULT };
let calibActive = false;
let calibBackup = null; // 調整モードに入った時点の値。ロックせずに終了した場合はこれに戻す
let calibPointers = new Map(); // pointerId -> {x, y}（画面座標px）
let calibPanStart = null; // {x, y, offsetX, offsetY}（1本指ドラッグ用）
let calibPinchStart = null; // {dist, scale}（2本指ピンチ用）
let calibBgObjectUrl = null;

// ── 初期化 ──
function initMusicEditor() {
  loadSavedScores();

  const draft = loadDraft();
  if (draft && Array.isArray(draft.tokens)) {
    tokens = normalizeTokens(draft.tokens);
    currentInstrumentId = draft.instrumentId || "piano";
    // 配置(15鍵2列/22キーなど)・半音表示は「保存している譜面のスタイル」として引き継ぐ。
    // 練習モードに切り替えた時、これに合わせて鍵盤を自動設定する
    currentLayoutId = draft.layoutId || defaultLayoutIdFor(currentInstrumentId);
    semitoneEnabled = !!draft.semitoneEnabled;
    bpm = draft.bpm || DEFAULT_BPM;
    timeSignatureId = draft.timeSignatureId || DEFAULT_TIME_SIGNATURE_ID;
    scoreName = draft.name || "";
    currentScoreId = draft.scoreId || null;
  } else {
    currentLayoutId = defaultLayoutIdFor(currentInstrumentId);
  }

  const savedSound = localStorage.getItem("hatopiMusic_soundEnabled");
  if (savedSound !== null) soundEnabled = savedSound === "1";

  calib = loadCalibration();

  document.getElementById("musicPracticeExitBtn").innerHTML = icon("close", { size: 18 });
  document.getElementById("musicFollowExitBtn").innerHTML = icon("close", { size: 18 });
  document.getElementById("musicRotatePromptIcon").innerHTML = icon("rotateDevice", { size: 32 });
  document.getElementById("musicCalibToggleBtn").innerHTML = icon("wrench", { size: 15 });

  renderInstrumentSelector();
  renderDurationOptions();
  renderTimeSignatureOptions();
  renderLayoutSelector();
  renderInstrumentGrid();
  renderScoreDisplay();
  renderScoreMeta();
  updateLoopUI();
  updateSoundToggleUI();
  updateModeUI();
  updateRecordingUI();
  bindControls();
  bindOnboardingControls();
  bindHumControls();
  maybeShowOnboarding();
}

// ── はじめての案内（①楽器を選ぶ→②テンポを決める→③録音か手入力かを選ぶ） ──
// 初期状態のまま何も作られていない、本当にはじめての訪問時にだけ出す。
// 一度でも見た（またはスキップした）らlocalStorageに記録し、二度と自動表示しない
function maybeShowOnboarding() {
  if (localStorage.getItem(ONBOARDING_SEEN_KEY)) return;
  if (tokens.length > 0) {
    // 既に何か作られている（下書きが残っている）状態は「はじめて」ではないので、
    // 案内は出さずそのまま既読扱いにする
    localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
    return;
  }
  openOnboarding();
}

function openOnboarding() {
  onboardStep = 1;
  onboardInstrumentId = currentInstrumentId;
  renderOnboardStep();
  document.getElementById("musicOnboardingModal").style.display = "block";
}

function closeOnboarding(markSeen) {
  document.getElementById("musicOnboardingModal").style.display = "none";
  if (markSeen) localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
}

function renderOnboardStep() {
  document.getElementById("musicOnboardStep1").style.display = onboardStep === 1 ? "" : "none";
  document.getElementById("musicOnboardStep2").style.display = onboardStep === 2 ? "" : "none";
  document.getElementById("musicOnboardStep3").style.display = onboardStep === 3 ? "" : "none";
  document.querySelectorAll(".music-onboarding-dot").forEach((dot) => {
    dot.classList.toggle("active", Number(dot.dataset.step) === onboardStep);
  });
  document.getElementById("musicOnboardNextBtn").style.display = onboardStep === 3 ? "none" : "";
  document.getElementById("musicOnboardBackBtn").style.display = onboardStep === 1 ? "none" : "";

  if (onboardStep === 1) renderOnboardInstrumentButtons();
  if (onboardStep === 2) {
    document.getElementById("musicOnboardBpmInput").value = bpm;
    const sel = document.getElementById("musicOnboardTimeSigSelect");
    sel.innerHTML = TIME_SIGNATURES.map((t) => `<option value="${t.id}"${t.id === timeSignatureId ? " selected" : ""}>${t.label}</option>`).join("");
  }
}

function renderOnboardInstrumentButtons() {
  const el = document.getElementById("musicOnboardInstrumentButtons");
  el.innerHTML = INSTRUMENTS.map(
    (inst) => `<button class="music-onboard-instrument-btn${inst.id === onboardInstrumentId ? " active" : ""}" data-instrument="${inst.id}">${T(inst.nameKey, inst.nameFallback)}</button>`
  ).join("");
  el.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      onboardInstrumentId = btn.dataset.instrument;
      renderOnboardInstrumentButtons();
    });
  });
}

function onboardNext() {
  if (onboardStep === 1) {
    currentInstrumentId = onboardInstrumentId;
    currentLayoutId = defaultLayoutIdFor(currentInstrumentId);
    renderInstrumentSelector();
    renderLayoutSelector();
    renderInstrumentGrid();
  } else if (onboardStep === 2) {
    const bpmInput = document.getElementById("musicOnboardBpmInput");
    const bpmVal = Math.max(MIN_BPM, Math.min(MAX_BPM, Number(bpmInput.value) || DEFAULT_BPM));
    bpm = bpmVal;
    timeSignatureId = document.getElementById("musicOnboardTimeSigSelect").value;
    renderScoreMeta();
    renderScoreDisplay();
  }
  onboardStep++;
  renderOnboardStep();
}

function onboardBack() {
  onboardStep--;
  renderOnboardStep();
}

// ③のどちらを選んでも案内自体はそこで完了する（続けて確認するステップは無い）
function finishOnboarding(startRecording) {
  isRecording = startRecording;
  updateRecordingUI();
  // テンポのステップを実際に通過済みなので、直後に録音を始めても改めて確認しない
  tempoWarningDismissed = true;
  saveDraftDebounced();
  closeOnboarding(true);
}

function bindOnboardingControls() {
  document.getElementById("musicOnboardNextBtn").addEventListener("click", onboardNext);
  document.getElementById("musicOnboardBackBtn").addEventListener("click", onboardBack);
  document.getElementById("musicOnboardSkipBtn").addEventListener("click", () => closeOnboarding(true));
  document.getElementById("musicOnboardChoiceRecord").addEventListener("click", () => finishOnboarding(true));
  document.getElementById("musicOnboardChoiceManual").addEventListener("click", () => finishOnboarding(false));
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
  const wrapper = document.getElementById("musicAdvancedSettings");
  const inst = getInstrument(currentInstrumentId);
  if (inst.layouts.length <= 1) {
    el.innerHTML = "";
    el.style.display = "none";
    // 配置が1つしかない楽器（オカリナ等）は「詳細設定」の中身が空になるため、
    // 折りたたみ自体を隠す（開いても何も出ない空欄を見せないため）
    if (wrapper) wrapper.style.display = "none";
    updateSemitoneToggleVisibility();
    return;
  }
  if (wrapper) wrapper.style.display = "";
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
// 編集モードは画面幅に合わせて伸縮するボタン行、練習モードは実機の座標を
// そのまま絶対配置で再現する（指の感覚を実機と揃えるため）。表示方法が
// 大きく異なるため、現在のページモードに応じてどちらかを描画する
function renderInstrumentGrid() {
  if (pageMode === "practice") {
    renderPracticeStageGrid();
  } else {
    renderEditGrid();
  }
}

function renderEditGrid() {
  const el = document.getElementById("musicInstrumentGrid");
  const inst = getInstrument(currentInstrumentId);
  const layout = getLayout(inst, currentLayoutId);
  const grid = semitoneEnabled && layout.chromaticGrid ? layout.chromaticGrid : layout.grid;
  el.className = "music-instrument-grid";
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
}

// 実機の演奏画面スクリーンショット(1600×1118px)を基準にした絶対座標で、
// ボタンの位置・大きさを実機と同じ相対比になるよう再現する。
// アスペクト比を保ったまま画面に収める(レターボックス)ため、
// CSS側で aspect-ratio + コンテナクエリ(cqh)を使って自動的にフィットさせている
function renderPracticeStageGrid() {
  const el = document.getElementById("musicInstrumentGrid");
  const inst = getInstrument(currentInstrumentId);
  const layout = getLayout(inst, currentLayoutId);
  const mainPositions = layout.positions || [];
  const accidentalPositions = (semitoneEnabled && layout.accidentalPositions) || [];
  const allPositions = [...mainPositions, ...accidentalPositions];
  el.className = "music-instrument-grid practice-size";
  el.innerHTML = `<div class="music-stage-frame" id="musicStageFrame">${allPositions
    .map((p) => {
      const note = { degree: p.degree, accidental: p.accidental, octave: p.octave };
      const label = noteDisplayDigit(note);
      const accidentalClass = p.size === "accidental" ? " accidental" : "";
      return `<button class="music-note-btn music-stage-btn${accidentalClass}" style="left:${p.xPct}%; top:${p.yPct}%;" data-note='${JSON.stringify(note)}'>
        <span class="music-note-digit">${label}</span>
        <span class="music-note-kana">${DEGREE_LABELS[note.degree]}</span>
      </button>`;
    })
    .join("")}</div>`;
  el.querySelectorAll(".music-stage-btn").forEach((btn) => {
    const note = JSON.parse(btn.dataset.note);
    bindNoteButtonHold(btn, note);
  });
  applyCalibTransform();
}

// ── 演奏ボタンの拡大率・位置調整（端末ごとにlocalStorageへ記憶） ──
function loadCalibration() {
  try {
    const raw = localStorage.getItem(MUSIC_CALIB_KEY);
    if (!raw) return { ...MUSIC_CALIB_DEFAULT };
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.scale === "number" &&
      typeof parsed.offsetX === "number" &&
      typeof parsed.offsetY === "number"
    ) {
      return parsed;
    }
  } catch (e) {
    // 壊れた値が入っていた場合はデフォルトにフォールバック
  }
  return { ...MUSIC_CALIB_DEFAULT };
}

function saveCalibration() {
  localStorage.setItem(MUSIC_CALIB_KEY, JSON.stringify(calib));
}

function applyCalibTransform() {
  const frame = document.getElementById("musicStageFrame");
  if (!frame) return;
  frame.style.transform = `translate(${calib.offsetX}vh, ${calib.offsetY}vh) scale(${calib.scale})`;
}

function toggleCalibMode() {
  if (calibActive) {
    cancelCalibMode();
  } else {
    enterCalibMode();
  }
}

function enterCalibMode() {
  calibActive = true;
  calibBackup = { ...calib };
  document.getElementById("musicPracticeStage").classList.add("calibrating");
  document.getElementById("musicCalibToggleBtn").classList.add("active");
  const catcher = document.getElementById("musicCalibCatcher");
  catcher.addEventListener("pointerdown", onCalibPointerDown);
  catcher.addEventListener("pointermove", onCalibPointerMove);
  catcher.addEventListener("pointerup", onCalibPointerUpOrCancel);
  catcher.addEventListener("pointercancel", onCalibPointerUpOrCancel);
}

function exitCalibModeUI() {
  calibActive = false;
  calibPointers.clear();
  calibPanStart = null;
  calibPinchStart = null;
  clearCalibGuides();
  document.getElementById("musicPracticeStage").classList.remove("calibrating");
  document.getElementById("musicCalibToggleBtn").classList.remove("active");
  const catcher = document.getElementById("musicCalibCatcher");
  catcher.removeEventListener("pointerdown", onCalibPointerDown);
  catcher.removeEventListener("pointermove", onCalibPointerMove);
  catcher.removeEventListener("pointerup", onCalibPointerUpOrCancel);
  catcher.removeEventListener("pointercancel", onCalibPointerUpOrCancel);
  clearCalibBgImage();
}

// ロックせずに調整モードを終える場合は、入る前の状態に戻す
function cancelCalibMode() {
  if (calibBackup) {
    calib = { ...calibBackup };
    applyCalibTransform();
  }
  calibBackup = null;
  exitCalibModeUI();
}

function lockCalibration() {
  saveCalibration();
  calibBackup = null;
  exitCalibModeUI();
}

function resetCalibration() {
  calib = { ...MUSIC_CALIB_DEFAULT };
  applyCalibTransform();
}

function calibDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clearCalibGuides() {
  document.getElementById("musicCalibGuideV").classList.remove("snapped");
}

function onCalibPointerDown(e) {
  e.preventDefault();
  calibPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (calibPointers.size === 1) {
    calibPanStart = { x: e.clientX, y: e.clientY, offsetX: calib.offsetX, offsetY: calib.offsetY };
    calibPinchStart = null;
  } else if (calibPointers.size === 2) {
    const pts = [...calibPointers.values()];
    calibPinchStart = { dist: calibDistance(pts[0], pts[1]), scale: calib.scale };
    calibPanStart = null;
    clearCalibGuides();
  }
}

function onCalibPointerMove(e) {
  if (!calibPointers.has(e.pointerId)) return;
  e.preventDefault();
  calibPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const stage = document.getElementById("musicPracticeStage");
  const stageH = stage.getBoundingClientRect().height || 1;

  if (calibPointers.size === 2 && calibPinchStart) {
    const pts = [...calibPointers.values()];
    const dist = calibDistance(pts[0], pts[1]);
    const nextScale = calibPinchStart.scale * (dist / calibPinchStart.dist);
    calib.scale = Math.min(MUSIC_CALIB_SCALE_MAX, Math.max(MUSIC_CALIB_SCALE_MIN, nextScale));
    applyCalibTransform();
  } else if (calibPointers.size === 1 && calibPanStart) {
    const dxPct = ((e.clientX - calibPanStart.x) / stageH) * 100;
    const dyPct = ((e.clientY - calibPanStart.y) / stageH) * 100;
    const rawX = calibPanStart.offsetX + dxPct;
    // 縦位置（offsetY）は端末や好みによって中央からずらすのが正しい場合が多いため、
    // スナップ対象は左右中央（offsetX）のみとする
    const snapX = Math.abs(rawX) < MUSIC_CALIB_SNAP_THRESHOLD;
    calib.offsetX = snapX ? 0 : rawX;
    calib.offsetY = calibPanStart.offsetY + dyPct;
    document.getElementById("musicCalibGuideV").classList.toggle("snapped", snapX);
    applyCalibTransform();
  }
}

function onCalibPointerUpOrCancel(e) {
  calibPointers.delete(e.pointerId);
  if (calibPointers.size === 1) {
    // ピンチから1本指ドラッグに戻った場合、その時点の指位置を新しい起点にする
    const [, pt] = [...calibPointers.entries()][0];
    calibPanStart = { x: pt.x, y: pt.y, offsetX: calib.offsetX, offsetY: calib.offsetY };
    calibPinchStart = null;
  } else if (calibPointers.size === 0) {
    calibPanStart = null;
    calibPinchStart = null;
    clearCalibGuides();
  }
}

// 実機のスクリーンショットを調整の目安として背景に薄く表示する（保存はせず、その場限り）
function onCalibBgFileChosen(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  clearCalibBgImage();
  calibBgObjectUrl = URL.createObjectURL(file);
  const img = document.getElementById("musicCalibBgImage");
  img.src = calibBgObjectUrl;
  img.style.display = "block";
  e.target.value = "";
}

function clearCalibBgImage() {
  const img = document.getElementById("musicCalibBgImage");
  if (img) {
    img.style.display = "none";
    img.removeAttribute("src");
  }
  if (calibBgObjectUrl) {
    URL.revokeObjectURL(calibBgObjectUrl);
    calibBgObjectUrl = null;
  }
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
    const beats = isRecording ? snapBeatsToPreset((performance.now() - groupStartTime) / 1000 / (60 / bpm)) : getDuration(selectedDurationId).beats;
    // 譜面の音を選択中なら、末尾に追加するのではなくその音をまるごと置き換える
    if (selectedTokenIndex !== null) {
      replaceTokenAt(selectedTokenIndex, notes, beats);
    } else {
      addChordToken(notes, beats);
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
// テンポ・拍子が初期値のまま一度も変更されていない状態で録音を始めようとすると、
// 音の長さの自動判定に影響するため先に確認する（セッション中1回だけ）
function toggleRecording() {
  const toggle = document.getElementById("musicRecordToggle");
  const turningOn = toggle.checked;
  const tempoStillDefault = bpm === DEFAULT_BPM && timeSignatureId === DEFAULT_TIME_SIGNATURE_ID;
  if (turningOn && tempoStillDefault && !tempoWarningDismissed) {
    const ok = confirm(
      T("music_confirm_tempo_before_record", "テンポと拍子がまだ初期値のままです。録音した音の長さはテンポをもとに自動調整されるため、先にテンポ・拍子を確認することをおすすめします。このまま録音を始めますか？")
    );
    if (!ok) {
      toggle.checked = false;
      return;
    }
    tempoWarningDismissed = true;
  }
  isRecording = turningOn;
  updateRecordingUI();
}

function updateRecordingUI() {
  const toggle = document.getElementById("musicRecordToggle");
  if (toggle) toggle.checked = isRecording;
  document.getElementById("musicDurationOptions").classList.toggle("disabled", isRecording);
  document.getElementById("musicRecordHint").style.display = isRecording ? "" : "none";
  document.getElementById("musicDurationHint").style.display = isRecording ? "none" : "";
  // 録音中は長さの選択ができないのと同じ理由で、休符も追加できないようにする
  document.getElementById("musicAddRestBtn").disabled = isRecording;
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

// 休符（notes:[]の音）を、選んでいる長さで譜面の最後に追加する
function addRestToken() {
  addChordToken([], getDuration(selectedDurationId).beats);
}

function deleteLastToken() {
  tokens.pop();
  if (loopEnd !== null && loopEnd >= tokens.length) resetLoop();
  forgetTokenIndexesFrom(tokens.length);
  renderScoreDisplay();
  saveDraftDebounced();
}

function clearScore() {
  if (!tokens.length) return;
  if (!confirm(T("music_confirm_clear", "譜面をすべて消去しますか？"))) return;
  tokens = [];
  resetLoop();
  selectedTokenIndex = null;
  humReviewIndexes = new Set();
  renderScoreDisplay();
  saveDraftDebounced();
}

// 譜面の途中の音を1つだけタップして選び、置き換え・削除できるようにする
// （ハミングからの自動変換など、末尾からの「最後を削除」だけでは直しづらい
// 手直しのために追加）
function selectTokenForEdit(index) {
  selectedTokenIndex = selectedTokenIndex === index ? null : index;
  renderScoreDisplay();
}

function deselectToken() {
  if (selectedTokenIndex === null) return;
  selectedTokenIndex = null;
  renderScoreDisplay();
}

// 選択中の音を、次に弾いた音(notes)・長さ(beats)でそのまま置き換える
function replaceTokenAt(index, notes, beats) {
  if (index < 0 || index >= tokens.length) return;
  tokens[index] = {
    notes: notes.map((n) => ({ degree: n.degree, accidental: n.accidental || null, octave: n.octave })),
    beats,
  };
  humReviewIndexes.delete(index); // 手直し済みなので自動検出マークを消す
  selectedTokenIndex = null;
  renderScoreDisplay();
  saveDraftDebounced();
}

function deleteSelectedToken() {
  if (selectedTokenIndex === null) return;
  const index = selectedTokenIndex;
  tokens.splice(index, 1);
  // 削除した音より後ろのインデックスは1つずつ前へずれるため、
  // 区間ループ・自動検出マークもズレないよう作り直す
  resetLoop();
  const shifted = new Set();
  humReviewIndexes.forEach((i) => {
    if (i === index) return;
    shifted.add(i > index ? i - 1 : i);
  });
  humReviewIndexes = shifted;
  selectedTokenIndex = null;
  renderScoreDisplay();
  saveDraftDebounced();
}

// index以降を指すインデックスの記録(自動検出マークなど)を取り除く。
// 「最後を削除」で末尾の音が消えたときに、その音を指していた印を残さないため
function forgetTokenIndexesFrom(index) {
  humReviewIndexes.forEach((i) => {
    if (i >= index) humReviewIndexes.delete(i);
  });
}

// ── 譜面の表示（編集中のプレビュー／練習モードのハイライト共通）。
// 小節線は保存せず、拍子(timeSignature)をもとに毎回その場で計算して表示する ──
function renderScoreDisplay() {
  const el = document.getElementById("musicScoreDisplay");
  updateNoteToolbarUI();
  updateReviewBannerUI();
  if (!tokens.length) {
    el.innerHTML = `<div class="music-score-empty">${T("music_score_empty", "まだ音が入力されていません")}</div>`;
    if (pageMode === "follow") renderFollowDisplay();
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
    const isRest = tok.notes.length === 0;
    const isChord = tok.notes.length > 1;
    const inLoop = loopStart !== null && loopEnd !== null && i >= loopStart && i <= loopEnd;
    const outOfLoop = loopEnabled && loopStart !== null && !inLoop;
    // 区間の開始だけ選んだ直後（終了はまだタップしていない）は、その音を点滅表示して
    // 「今ここが開始として選ばれている」ことを分かりやすくする
    const pendingLoopStart = loopSelecting && loopStart !== null && loopEnd === null && i === loopStart;
    const isSelected = pageMode === "edit" && i === selectedTokenIndex;
    const needsReview = humReviewIndexes.has(i);
    const digits = isRest
      ? `<span class="music-note-digit">0</span>`
      : tok.notes.map((n) => `<span class="music-note-digit">${noteDisplayDigit(n)}</span>`).join("");
    const kana = isChord || isRest ? "" : `<span class="music-note-kana">${DEGREE_LABELS[tok.notes[0].degree]}</span>`;
    const cls = ["music-chip", isRest && "rest", isChord && "chord", current && "current", inLoop && "in-loop", outOfLoop && "out-of-loop", pendingLoopStart && "loop-pending", isSelected && "selected", needsReview && "hum-review"].filter(Boolean).join(" ");
    html += `<span class="${cls}" data-index="${i}">${digits}${kana}</span>`;
    beatsSinceBar += tok.beats;
  });
  el.innerHTML = html;

  if (pageMode === "practice" && cursor >= 0) {
    const cur = el.querySelector(".music-chip.current");
    if (cur) cur.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }
  if (pageMode === "follow") renderFollowDisplay();
}

// 譜面の音を1つ選んでいる間、置き換え・削除の操作パネルを出す
function updateNoteToolbarUI() {
  const toolbar = document.getElementById("musicNoteToolbar");
  const hint = document.getElementById("musicNoteToolbarHint");
  if (!toolbar || !hint) return;
  const show = pageMode === "edit" && selectedTokenIndex !== null && selectedTokenIndex < tokens.length;
  toolbar.style.display = show ? "" : "none";
  hint.style.display = show ? "" : "none";
  if (show) {
    document.getElementById("musicNoteToolbarLabel").textContent = T(
      "music_note_selected_label",
      `${selectedTokenIndex + 1}番目の音を選択中`,
      { n: selectedTokenIndex + 1 }
    );
  }
}

// ハミングからの自動変換直後、まだ確認していない音が残っていることを知らせる
function updateReviewBannerUI() {
  const banner = document.getElementById("musicReviewBanner");
  if (!banner) return;
  const count = humReviewIndexes.size;
  const show = pageMode === "edit" && count > 0;
  banner.style.display = show ? "" : "none";
  if (show) {
    document.getElementById("musicReviewBannerText").textContent = T(
      "music_hum_review_banner",
      `自動検出した音が${count}件残っています。タップして確認・修正できます`,
      { n: count }
    );
  }
}

function renderScoreMeta() {
  document.getElementById("musicScoreNameInput").value = scoreName;
  document.getElementById("musicBpmInput").value = bpm;
  const timeSigSelect = document.getElementById("musicTimeSigSelect");
  if (timeSigSelect) timeSigSelect.value = timeSignatureId;
}

// ── 区間リピート ──
// 「区間を選ぶ」ボタン：譜面の音を2つタップして開始・終了を選ぶモードに入る/出る
function toggleLoopSelect() {
  if (loopSelecting) {
    loopSelecting = false;
  } else {
    loopStart = null;
    loopEnd = null;
    loopEnabled = false;
    loopSelecting = true;
    selectedTokenIndex = null; // 区間選択と音の手直し選択が同時に表示されて紛らわしくならないようにする
  }
  updateLoopUI();
  renderScoreDisplay();
}

// 譜面の音がタップされたとき（区間選択中は開始・終了の指定、それ以外の編集モードでは
// 手直し対象としての選択・選択解除として扱う）
function handleScoreChipTap(index) {
  if (loopSelecting) {
    if (loopStart === null) {
      loopStart = index;
    } else {
      loopEnd = index;
      if (loopEnd < loopStart) [loopStart, loopEnd] = [loopEnd, loopStart];
      loopSelecting = false;
      loopEnabled = true;
    }
    updateLoopUI();
    renderScoreDisplay();
    return;
  }
  if (pageMode === "edit") selectTokenForEdit(index);
}

function toggleLoopEnabled() {
  loopEnabled = !loopEnabled;
  updateLoopUI();
  renderScoreDisplay();
}

function clearLoop() {
  loopStart = null;
  loopEnd = null;
  loopEnabled = false;
  loopSelecting = false;
  updateLoopUI();
  renderScoreDisplay();
}

function updateLoopUI() {
  const selectBtn = document.getElementById("musicLoopSelectBtn");
  selectBtn.classList.toggle("active", loopSelecting);
  selectBtn.textContent = loopSelecting ? T("music_loop_selecting", "選択をやめる") : T("music_loop_select", "区間を選ぶ");

  const hint = document.getElementById("musicLoopHint");
  hint.style.display = loopSelecting ? "" : "none";
  hint.textContent =
    loopSelecting && loopStart === null
      ? T("music_loop_select_hint", "譜面の音をタップして、開始の音を選んでください")
      : T("music_loop_select_hint_end", "譜面の音をタップして、終了の音を選んでください");

  const hasRange = loopStart !== null && loopEnd !== null;
  document.getElementById("musicLoopRangeLabel").style.display = hasRange ? "" : "none";
  document.getElementById("musicLoopToggleRow").style.display = hasRange ? "" : "none";
  document.getElementById("musicLoopClearBtn").style.display = hasRange ? "" : "none";
  if (hasRange) {
    document.getElementById("musicLoopRangeLabel").textContent = `${loopStart + 1} - ${loopEnd + 1}`;
    document.getElementById("musicLoopToggle").checked = loopEnabled;
  }
}

// 新しい譜面を開いたとき、前の譜面のインデックスに紐づいたループ区間を持ち越さない
function resetLoop() {
  loopStart = null;
  loopEnd = null;
  loopEnabled = false;
  loopSelecting = false;
  updateLoopUI();
}

// ── モード切り替え(編集/練習) ──
function setPageMode(mode) {
  if (pageMode === mode) return;
  if (calibActive) cancelCalibMode();
  releaseAllHolds();
  stopPlayback();
  pageMode = mode;
  cursor = -1;
  // 練習モードの冒頭が休符の場合、対応するボタン操作が存在しないため自動で読み飛ばす
  if (pageMode === "practice") skipLeadingRests();
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
  document.getElementById("musicModeFollowBtn").classList.toggle("active", pageMode === "follow");
  document.getElementById("musicEditControls").style.display = pageMode === "edit" ? "" : "none";
  document.getElementById("musicScoreEditRow").style.display = pageMode === "edit" ? "" : "none";

  // 練習モードは、譜面と演奏ボタンだけの全画面ステージに切り替える。編集用の楽器・配置選択は
  // 「保存している譜面のスタイル」をそのまま自動で使うため、練習中は表示しない。
  // 追従モードは、ボタンを出さず大きな数字譜だけの全画面ステージに切り替える
  // （実機の画面と分割画面で並べて使う想定のため、横画面には固定しない）
  const isPractice = pageMode === "practice";
  const isFollow = pageMode === "follow";
  document.getElementById("musicPracticeStage").classList.toggle("active", isPractice);
  document.getElementById("musicFollowStage").classList.toggle("active", isFollow);

  const scoreDisplay = document.getElementById("musicScoreDisplay");
  const grid = document.getElementById("musicInstrumentGrid");
  const playbackRow = document.getElementById("musicPlaybackRow");
  const scoreAnchor = document.getElementById(isPractice ? "musicScoreDisplayAnchorPractice" : "musicScoreDisplayAnchorEdit");
  const gridAnchor = document.getElementById(isPractice ? "musicInstrumentGridAnchorPractice" : "musicInstrumentGridAnchorEdit");
  scoreAnchor.appendChild(scoreDisplay);
  gridAnchor.appendChild(grid);

  if (isPractice) {
    document.getElementById("musicPlaybackAnchorPractice").appendChild(playbackRow);
    renderPracticeStageName();
  } else if (isFollow) {
    document.getElementById("musicPlaybackAnchorFollow").appendChild(playbackRow);
    renderFollowStageName();
    renderFollowDisplay();
  }

  // モードによって演奏ボタンの描画方法が異なる（編集＝伸縮するボタン行、
  // 練習＝実機座標の絶対配置）ため、モード切り替え時に描画し直す
  renderInstrumentGrid();
}

// 練習ステージ上部に、今使っている楽器・配置と曲名を表示する
// （楽器選択パネルを隠す代わりに、今どのスタイルで演奏しているか分かるようにする）
function renderPracticeStageName() {
  const inst = getInstrument(currentInstrumentId);
  const layout = getLayout(inst, currentLayoutId);
  const instLabel = T(inst.nameKey, inst.nameFallback);
  const layoutLabel = inst.layouts.length > 1 ? `・${T(layout.labelKey, layout.labelFallback)}` : "";
  const name = scoreName || T("music_default_score_name", "譜面");
  document.getElementById("musicPracticeStageName").textContent = `${name} ・ ${instLabel}${layoutLabel}${loopBadgeText()}`;
}

// 追従ステージ上部に曲名だけを表示する（ボタンが無いので楽器・配置は不要）
function renderFollowStageName() {
  const name = scoreName || T("music_default_score_name", "譜面");
  document.getElementById("musicFollowStageName").textContent = `${name}${loopBadgeText()}`;
}

// 練習・追従ステージの見出しに付け足す、ループ再生中であることを示す短い表示
function loopBadgeText() {
  if (!loopEnabled || loopStart === null || loopEnd === null) return "";
  return ` ・ ${T("music_loop_badge", "ループ")} ${loopStart + 1}-${loopEnd + 1}`;
}

// 追従モード：ボタンを出さず、今の音（と次の音のプレビュー）だけを大きく表示する。
// 実機の画面と並べて使う想定で、離れた位置からでも見やすいことを優先する
function renderFollowDisplay() {
  const el = document.getElementById("musicFollowDisplay");
  if (!el) return;
  if (!tokens.length) {
    el.innerHTML = `<div class="music-follow-empty">${T("music_score_empty", "まだ音が入力されていません")}</div>`;
    return;
  }
  const idx = cursor >= 0 ? cursor : 0;
  const cur = tokens[idx];
  const nextIdx = nextNoteIndex(idx);
  const next = nextIdx !== null ? tokens[nextIdx] : null;
  const renderDigits = (tok) => (tok.notes.length ? tok.notes.map((n) => `<span>${noteDisplayDigit(n)}</span>`).join("") : `<span>0</span>`);
  const curKana = cur.notes.length === 1 ? DEGREE_LABELS[cur.notes[0].degree] : "";

  el.innerHTML = `
    <div class="music-follow-current">
      <div class="music-follow-current-notes">${renderDigits(cur)}</div>
      ${curKana ? `<div class="music-follow-current-kana">${curKana}</div>` : ""}
    </div>
    ${
      next
        ? `<div class="music-follow-next">
        <span class="music-follow-next-label">${T("music_follow_next", "つぎ")}</span>
        <div class="music-follow-next-notes">${renderDigits(next)}</div>
      </div>`
        : ""
    }
  `;
}

// ── 練習(なぞり)モード：再生 ──
// ループ再生ON時は、区間の終わりに達したら区間の始まりに戻る（tapモード・自動再生共通）
function nextNoteIndex(fromIdx) {
  if (loopEnabled && loopStart !== null && loopEnd !== null && fromIdx >= loopEnd) {
    return loopStart;
  }
  return fromIdx + 1 < tokens.length ? fromIdx + 1 : null;
}

// 休符（notes:[]の音）は対応するボタン操作が存在しないため、タップでの先取り
// （停止中／再生中を問わず）では自動的に読み飛ばす。実際の間の長さは自動再生の
// tick()側でtok.beatsぶん待つことで表現される（休符は何も鳴らさないだけで、
// 進行自体はここでは早めない）
function isRestToken(tok) {
  return !tok || tok.notes.length === 0;
}

function skipLeadingRests() {
  let idx = nextNoteIndex(cursor);
  while (idx !== null && isRestToken(tokens[idx])) {
    cursor = idx;
    idx = nextNoteIndex(cursor);
  }
}

function tryAdvancePracticeChord() {
  const idx = nextNoteIndex(cursor);
  if (idx === null) return;
  if (!notesSetEqual(currentGroupNotes, tokens[idx].notes)) return;
  cursor = idx;
  skipLeadingRests();
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
  if (loopEnabled && loopStart !== null && loopEnd !== null) {
    // ループ区間の外から再生を始めたら、区間の頭から始める
    if (cursor < loopStart - 1 || cursor > loopEnd) cursor = loopStart - 1;
  } else if (nextNoteIndex(cursor) === null) {
    cursor = -1; // 最後まで行っていたら最初から
  }
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
  ["musicSoundToggleBtn", "musicSoundToggleBtnStage", "musicSoundToggleBtnFollow"].forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.innerHTML = icon(soundEnabled ? "volumeOn" : "volumeOff", { size: 18 });
    btn.classList.toggle("muted", !soundEnabled);
  });
}

// ── 下書きの自動保存 ──
function saveDraft() {
  localStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({
      tokens,
      instrumentId: currentInstrumentId,
      layoutId: currentLayoutId,
      semitoneEnabled,
      bpm,
      timeSignatureId,
      name: scoreName,
      scoreId: currentScoreId,
    })
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
    existing.layoutId = currentLayoutId;
    existing.semitoneEnabled = semitoneEnabled;
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
    layoutId: currentLayoutId,
    semitoneEnabled,
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
  resetLoop();
  selectedTokenIndex = null;
  humReviewIndexes = new Set();
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
  // 保存時の配置(15鍵2列/22キーなど)・半音表示をそのまま復元する
  currentLayoutId = score.layoutId || defaultLayoutIdFor(currentInstrumentId);
  semitoneEnabled = !!score.semitoneEnabled;
  bpm = score.bpm || DEFAULT_BPM;
  timeSignatureId = score.timeSignatureId || DEFAULT_TIME_SIGNATURE_ID;
  scoreName = score.name;
  currentScoreId = score.id;
  cursor = -1;
  stopPlayback();
  resetLoop();
  selectedTokenIndex = null;
  humReviewIndexes = new Set();
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
  document.getElementById("musicModeFollowBtn").addEventListener("click", () => setPageMode("follow"));
  document.getElementById("musicPracticeExitBtn").addEventListener("click", () => setPageMode("edit"));
  document.getElementById("musicFollowExitBtn").addEventListener("click", () => setPageMode("edit"));
  document.getElementById("musicSoundToggleBtnStage").addEventListener("click", toggleSound);
  document.getElementById("musicSoundToggleBtnFollow").addEventListener("click", toggleSound);

  document.getElementById("musicCalibToggleBtn").addEventListener("click", toggleCalibMode);
  document.getElementById("musicCalibResetBtn").addEventListener("click", resetCalibration);
  document.getElementById("musicCalibLockBtn").addEventListener("click", lockCalibration);
  document.getElementById("musicCalibBgInput").addEventListener("change", onCalibBgFileChosen);

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
    tempoWarningDismissed = true; // テンポを自分で確認・変更したので、録音前の確認案内はもう不要
    saveDraftDebounced();
  });
  document.getElementById("musicTimeSigSelect").addEventListener("change", (e) => {
    timeSignatureId = e.target.value;
    tempoWarningDismissed = true;
    renderScoreDisplay();
    saveDraftDebounced();
  });

  document.getElementById("musicRecordToggle").addEventListener("change", toggleRecording);
  document.getElementById("musicSemitoneToggle").addEventListener("change", toggleSemitone);

  document.getElementById("musicAddRestBtn").addEventListener("click", addRestToken);
  document.getElementById("musicDeleteLastBtn").addEventListener("click", deleteLastToken);
  document.getElementById("musicClearBtn").addEventListener("click", clearScore);

  document.getElementById("musicNoteDeleteBtn").addEventListener("click", deleteSelectedToken);
  document.getElementById("musicNoteDeselectBtn").addEventListener("click", deselectToken);
  document.getElementById("musicReviewClearBtn").addEventListener("click", () => {
    humReviewIndexes = new Set();
    renderScoreDisplay();
  });

  document.getElementById("musicLoopSelectBtn").addEventListener("click", toggleLoopSelect);
  document.getElementById("musicLoopToggle").addEventListener("change", toggleLoopEnabled);
  document.getElementById("musicLoopClearBtn").addEventListener("click", clearLoop);
  document.getElementById("musicScoreDisplay").addEventListener("click", (e) => {
    const chip = e.target.closest(".music-chip[data-index]");
    if (chip) handleScoreChipTap(Number(chip.dataset.index));
  });

  document.getElementById("musicPlayPauseBtn").addEventListener("click", togglePlayback);
  document.getElementById("musicSpeedSlider").addEventListener("input", (e) => setPlaySpeed(e.target.value));

  document.getElementById("musicSoundToggleBtn").addEventListener("click", toggleSound);
}

document.addEventListener("langchange", () => {
  renderInstrumentSelector();
  renderDurationOptions();
  renderLayoutSelector();
  renderInstrumentGrid();
  renderScoreDisplay();
  updateLoopUI();
  if (pageMode === "practice") renderPracticeStageName();
  if (pageMode === "follow") renderFollowStageName();
  if (document.getElementById("musicSavedListModal").style.display !== "none") renderSavedList();
});

initMusicEditor();
