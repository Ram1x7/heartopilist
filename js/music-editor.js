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
// フリーテンポ譜面：拍子の量子化を持たず、各tokenが beats の代わりに
// 実時間の長さ durationMs(ミリ秒) を持つ（排他的。両方持つtokenは存在しない）。
// MIDI・音源・動画からの自動生成は既定でこちらになる（js/music-midi-import.js、
// js/music-hum.js）。拍子の入力欄は小節線の目安表示にしか使わないが、
// テンポ(bpm)は「基準テンポ(scoreReferenceBpm)に対する再生速度の倍率」として
// 実際に働く（動画の再生速度を変えるのと同じ考え方。音同士の相対的な長さの
// 比率は変えず、全体の速さだけを変える）
let scoreFreeTiming = false;
// フリーテンポ譜面のtokensのdurationMsが「もともとどのテンポで記録されたか」。
// bpmがこの値と一致していれば等倍速で再生される。MIDI取り込み時はファイル自身の
// テンポ、音源/動画取り込み時はその時点のエディタのテンポをそのまま採用する
let scoreReferenceBpm = DEFAULT_BPM;
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

// ── 再生シークバー：曲全体を実時間の連続バーとして扱うためのタイムライン ──
// playbackTimeline[i] = token iの再生開始時刻（曲の先頭からの秒数、tokenDurationSec basis）。
// tokens・bpm・scoreReferenceBpmが変わるたびrebuildPlaybackTimeline()で作り直す
let playbackTimeline = [];
let playbackTotalDurationSec = 0;
// 一時停止中（またはシーク直後でまだ再生していない間）の再生位置。cursorは
// あくまでハイライト対象トークンの特定に使い、シークバーの位置計算は常にこちらを使う
let pausedElapsedSec = 0;
// 自動再生中の現在tickの開始時刻(performance.now())と、そのtokenの曲内での長さ(秒)。
// rAFの毎フレーム、この2つから「今まさに鳴っている位置」を逆算する
let playbackTickStartWallClock = 0;
let playbackTickDurSec = 0;
let playbackClockRaf = null;
// シークバーをドラッグ中は自動更新で位置を上書きしない
let isSeekDragging = false;

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

// 練習モードの正解/ミス回数（メモリ内のみ。譜面データやlocalStorageには保存しない。
// 練習モードに入り直すたびに0にリセットする） ──
let practiceCorrectCount = 0;
let practiceMissCount = 0;

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
  seedDefaultPresetScores();

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
    scoreFreeTiming = !!draft.freeTiming; // 古い形式の下書きにはfreeTimingが無いため、その場合は拍子ベース(false)として扱う
    // 古い形式の下書きにはreferenceBpmが無いため、その場合は保存されていたbpmを
    // そのまま基準テンポとして扱う（＝読み込み直後は等倍速で再生される）
    scoreReferenceBpm = draft.referenceBpm != null ? draft.referenceBpm : bpm;
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
  renderFreeTimingUI();
  updateLoopUI();
  updateSoundToggleUI();
  updateModeUI();
  updateRecordingUI();
  bindControls();
  bindOnboardingControls();
  bindHumControls();
  bindMidiImportControls();
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
  // 案内完了後は、実際に音を入力する「作る」タブへ自動的に移動する
  // （①楽器→②テンポは「準備」タブ、③録音/手入力の選択は「作る」タブの内容に対応するため）
  setEditTab("create");
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
    if (pageMode === "practice") {
      // 和音の途中経過（まだ他の指が揃っていないだけ）は不正解として数えない。
      // 「そもそも次の音に含まれていない音」を押した場合だけミスとして数える
      if (!isExpectedPracticeNote(note)) {
        practiceMissCount++;
        updatePracticeAccuracyBadge();
        flashPracticeMissHighlight(btn);
      }
      const advancedIdx = tryAdvancePracticeChord();
      // 正しく押せて先へ進んだ場合だけ、その和音の全ボタンを強く光らせる
      // （先読みハイライトとは別クラス。押した瞬間の一時的なフィードバック）
      if (advancedIdx !== null) {
        practiceCorrectCount++;
        updatePracticeAccuracyBadge();
        flashPracticeCorrectHighlight(tokens[advancedIdx].notes);
      }
    }
  };
  const end = (e) => {
    const held = activeHolds.get(e.pointerId);
    if (!held) return;
    held.btn.classList.remove("pressed");
    activeHolds.delete(e.pointerId);
    stopSustainedTone(e.pointerId);
    if (activeHolds.size === 0) finalizeGroup();
  };
  // pointerdown/up/cancelはpointerId単位で個別に管理しているため、複数指の
  // 同時押しもそれぞれ独立して処理される（マウス由来のtouchstart/touchend単一
  // 想定の問題は元々ない）。pointerdownはデフォルトでpassiveではないため
  // {passive:false}を明示しなくてもpreventDefault()は効くが、念のため明示しておく
  btn.addEventListener("pointerdown", start, { passive: false });
  btn.addEventListener("pointerup", end);
  btn.addEventListener("pointercancel", end);
  // CSS(touch-action:none / -webkit-touch-callout:none / user-select:none)だけでは
  // 機種・ブラウザによって長押し時のコンテキストメニュー（コピー等）が出てしまう
  // ことがあるため、JS側でも確実に抑止する
  btn.addEventListener("contextmenu", (e) => e.preventDefault());
}

// 和音グループの全ての指が離れた時点で確定する（編集モードのみ譜面に追加。
// 練習モードは押した時点で既に先取り判定済みのため、ここでは何もしない）
function finalizeGroup() {
  if (!currentGroupNotes.length) return;
  const notes = dedupeNotes(currentGroupNotes);
  if (pageMode === "edit") {
    const durationValue = computeHeldDurationValue();
    // 譜面の音を選択中なら、末尾に追加するのではなくその音をまるごと置き換える
    if (selectedTokenIndex !== null) {
      replaceTokenAt(selectedTokenIndex, notes, durationValue);
    } else {
      addChordToken(notes, durationValue);
    }
  }
  currentGroupNotes = [];
}

// 演奏ボタンを押していた実時間から、現在のモードに応じたtokenの長さを求める。
// 拍子ベース：録音中は一番近い長さプリセットへスナップ、非録音時は選んでいる
// 長さプリセットをそのまま使う（従来通り）。
// フリーテンポ：録音中は押していた実時間(ms)を「今のbpmで録音したものが、
// 基準テンポ(scoreReferenceBpm)でも同じ実時間で再生されるように」bpm/scoreReferenceBpm倍
// して保存する（tokenDurationSecはscoreReferenceBpm/bpm倍して再生するため、
// 今と同じbpmのままなら録音した通りの長さで鳴る）。非録音時は選んでいる
// 長さプリセットの拍数を、基準テンポでの実時間(ms)に変換する
function computeHeldDurationValue() {
  const heldSec = (performance.now() - groupStartTime) / 1000;
  if (scoreFreeTiming) {
    return {
      durationMs: isRecording
        ? heldSec * 1000 * (bpm / scoreReferenceBpm)
        : presetBeatsToApproxMs(getDuration(selectedDurationId).beats),
    };
  }
  return { beats: isRecording ? snapBeatsToPreset(heldSec / (60 / bpm)) : getDuration(selectedDurationId).beats };
}

// 選んでいる長さプリセットから、現在のモードに応じたtokenの長さを求める
// （休符追加など、実際に演奏ボタンを押さずに長さを決める場合に使う）
function selectedDurationValue() {
  const beats = getDuration(selectedDurationId).beats;
  return scoreFreeTiming ? { durationMs: presetBeatsToApproxMs(beats) } : { beats };
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

// ── フリーテンポ譜面のtokenの長さ変換（beats/durationMsは排他的） ──
// 再生時に実際に待つ秒数。フリーテンポのdurationMsは「基準テンポ(scoreReferenceBpm)で
// 記録された実時間」なので、bpmが基準テンポからどれだけ変わったかの比率
// (scoreReferenceBpm/bpm)をかけて実際の待ち時間にする（動画の再生速度を変えるのと
// 同じ考え方：bpmを基準テンポの2倍にすれば再生は半分の時間で終わる）。
// bpmが基準テンポと同じままなら、この比率は1倍＝記録した通りの長さのまま
function tokenDurationSec(tok) {
  if (tok.durationMs != null) return (tok.durationMs / 1000) * (scoreReferenceBpm / bpm);
  return (60 / bpm) * tok.beats;
}

// 小節線の表示位置の計算専用。durationMsを持つtokenは、基準テンポ(scoreReferenceBpm)を
// 使って「その音が本来何拍ぶんの長さか」に変換する。現在のbpm（再生速度）が
// 変わっても、この「本来の長さ」自体は変わらないため、テンポを変えるたびに
// 小節線の位置がぶれることはない（正確である必要はなく、あくまで小節線を
// だいたいの位置に表示するためだけの値）
function tokenApproxBeats(tok) {
  if (tok.beats != null) return tok.beats;
  return tok.durationMs / 1000 / (60 / scoreReferenceBpm);
}

// 長さプリセットの拍数(beats)を、基準テンポ(scoreReferenceBpm)での実時間(ms)に
// 変換する（フリーテンポ譜面での手動入力・休符追加用。目安の値でよい）
function presetBeatsToApproxMs(beats) {
  return beats * (60000 / scoreReferenceBpm);
}

// ── 再生シークバー：タイムライン基盤 ──
// tokensが変わるたび（またはbpm/scoreReferenceBpmが変わり各tokenの実時間の長さが
// 変わるたび）に呼び直し、各tokenの開始秒・曲全体の合計秒を計算し直す。
// renderScoreDisplay()はtokens変更の全経路（追加・削除・読み込み等）で必ず
// 呼ばれる箇所なので、そこから呼ぶことで個別に呼び忘れる心配をなくしている
function rebuildPlaybackTimeline() {
  playbackTimeline = [];
  let t = 0;
  tokens.forEach((tok, i) => {
    playbackTimeline[i] = t;
    t += tokenDurationSec(tok);
  });
  playbackTotalDurationSec = t;
  if (!isSeekDragging) updateSeekBarUI();
}

// 実時間位置(秒)に対応するtokensインデックスを探す（曲が長くてもドラッグの
// 追従性能が落ちないよう、線形探索ではなく二分探索にしてある）。
// playbackTimelineは開始時刻の昇順なので、「開始時刻がsec以下である最後のtoken」を返す
function findTokenIndexAtSec(sec) {
  if (!tokens.length) return -1;
  let lo = 0;
  let hi = tokens.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (playbackTimeline[mid] <= sec) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

function formatSeekTime(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

// 「今まさに再生している位置」を曲内の経過秒数として返す。再生中はperformance.now()と
// 直前tick()開始時刻の差にplaySpeedを掛けて、setTimeoutの発火を待たずに滑らかな
// 値を得る。停止・一時停止中はpausedElapsedSec（一時停止・シーク時に確定させた
// 位置）をそのまま返す
function getCurrentElapsedSec() {
  if (!isPlaying) return cursor >= 0 ? pausedElapsedSec : 0;
  if (cursor < 0 || !tokens[cursor]) return 0;
  const startSec = playbackTimeline[cursor] || 0;
  const wallElapsedSec = (performance.now() - playbackTickStartWallClock) / 1000;
  const partial = Math.min(playbackTickDurSec, Math.max(0, wallElapsedSec * playSpeed));
  return startSec + partial;
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
// durationValueは{beats}または{durationMs}（排他的。フリーテンポ譜面かどうかで
// 呼び出し側が使い分ける。computeHeldDurationValue/selectedDurationValueが作る）
function addChordToken(notes, durationValue) {
  tokens.push({
    notes: notes.map((n) => ({ degree: n.degree, accidental: n.accidental || null, octave: n.octave })),
    ...durationValue,
  });
  renderScoreDisplay();
  saveDraftDebounced();
}

// 休符（notes:[]の音）を、選んでいる長さで譜面の最後に追加する
function addRestToken() {
  addChordToken([], selectedDurationValue());
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

// 選択中の音を、次に弾いた音(notes)・長さ(durationValue:{beats}または{durationMs})でそのまま置き換える
function replaceTokenAt(index, notes, durationValue) {
  if (index < 0 || index >= tokens.length) return;
  tokens[index] = {
    notes: notes.map((n) => ({ degree: n.degree, accidental: n.accidental || null, octave: n.octave })),
    ...durationValue,
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

// 1マス分の「ミニ鍵盤ドット」を組み立てる。今選んでいる楽器・配置の
// 演奏ボタンと同じ行×列で、実際に押す音の位置だけを点灯させる
// （参考画像のグリッド譜と同じ考え方）
function buildChipGridHTML(tok) {
  const inst = getInstrument(currentInstrumentId);
  const layout = getLayout(inst, currentLayoutId);
  const grid = semitoneEnabled && layout.chromaticGrid ? layout.chromaticGrid : layout.grid;
  const rows = grid
    .map((row) => {
      const dots = row
        .map((gridNote) => {
          const isActive = tok.notes.some((n) => notesEqual(n, gridNote));
          return `<span class="chip-dot${isActive ? " active" : ""}"></span>`;
        })
        .join("");
      return `<span class="chip-dot-row">${dots}</span>`;
    })
    .join("");
  return `<span class="music-chip-grid">${rows}</span>`;
}

// ── 譜面の表示（編集中のプレビュー／練習モードのハイライト共通）。
// 小節線は保存せず、拍子(timeSignature)をもとに毎回その場で計算して表示する ──
function renderScoreDisplay() {
  const el = document.getElementById("musicScoreDisplay");
  rebuildPlaybackTimeline();
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
    const gridHtml = buildChipGridHTML(tok);
    const cls = ["music-chip", isRest && "rest", isChord && "chord", current && "current", inLoop && "in-loop", outOfLoop && "out-of-loop", pendingLoopStart && "loop-pending", isSelected && "selected", needsReview && "hum-review"].filter(Boolean).join(" ");
    html += `<span class="${cls}" data-index="${i}" aria-label="${isRest ? T("music_note_rest_label", "休符") : tok.notes.map((n) => noteDisplayDigit(n)).join("・")}">${gridHtml}</span>`;
    beatsSinceBar += tokenApproxBeats(tok);
  });
  el.innerHTML = html;

  if (pageMode === "practice" && cursor >= 0) {
    const cur = el.querySelector(".music-chip.current");
    if (cur) cur.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }
  if (pageMode === "follow") renderFollowDisplay();
  if (pageMode === "practice") updatePracticeGuideHighlight();
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
  // 練習モードの冒頭が休符の場合、対応するボタン操作が存在しないため自動で読み飛ばす。
  // 正解/ミス回数は保存対象ではないため、練習モードに入り直すたびに0へ戻す
  if (pageMode === "practice") {
    skipLeadingRests();
    resetPracticeAccuracy();
  }
  updateModeUI();
  renderScoreDisplay();
}

// ── 編集モードのサブタブ（準備／作る） ──
// 常時見えるコントロールを最小限にするため、「楽器選択・曲の管理」と
// 「自動生成・手入力/録音」をタブで分けて表示する。譜面表示・区間リピート・
// 演奏グリッドはどちらのタブでも常に必要な操作のため、タブの外に常時表示する
let editTab = "prepare"; // "prepare" | "create"

function setEditTab(tab) {
  editTab = tab;
  document.getElementById("musicEditTabPrepareBtn").classList.toggle("active", tab === "prepare");
  document.getElementById("musicEditTabCreateBtn").classList.toggle("active", tab === "create");
  document.getElementById("musicTabPanelPrepare").style.display = tab === "prepare" ? "" : "none";
  document.getElementById("musicTabPanelCreate").style.display = tab === "create" ? "" : "none";
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
  } else {
    // 編集モードでも、入力した譜面をその場で再生して確認・微調整できるようにする
    document.getElementById("musicPlaybackAnchorEdit").appendChild(playbackRow);
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
  document.getElementById("musicPracticeStageName").textContent = name;

  // 参考画像の左下パネルと同じ考え方で、曲名・楽器/配置・テンポ・長さをまとめて表示する
  const info = document.getElementById("musicPracticeSongInfo");
  if (info) {
    const total = playbackTotalDurationSec || 0;
    info.innerHTML = `
      <div class="music-practice-song-title">${name}${loopBadgeText()}</div>
      <div class="music-practice-song-meta">${instLabel}${layoutLabel}</div>
      <div class="music-practice-song-meta">${T("music_bpm_label", "テンポ")} ${bpm} BPM</div>
      <div class="music-practice-song-meta">${formatSeekTime(total)}</div>
    `;
  }
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
// previewIdxを渡すと、実際のcursorではなくそのインデックスを表示する
// （シークバーのドラッグ中プレビュー用。省略時は通常通りcursorを使う）
function renderFollowDisplay(previewIdx) {
  const el = document.getElementById("musicFollowDisplay");
  if (!el) return;
  if (!tokens.length) {
    el.innerHTML = `<div class="music-follow-empty">${T("music_score_empty", "まだ音が入力されていません")}</div>`;
    return;
  }
  const idx = previewIdx != null ? previewIdx : cursor >= 0 ? cursor : 0;
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

// 戻り値：先取りが成立して進んだ場合はその音のtokensインデックス、
// 成立しなかった場合はnull（正解ハイライトを出すかどうかの判定に使う）
function tryAdvancePracticeChord() {
  const idx = nextNoteIndex(cursor);
  if (idx === null) return null;
  if (!notesSetEqual(currentGroupNotes, tokens[idx].notes)) return null;
  cursor = idx;
  skipLeadingRests();
  renderScoreDisplay();
  if (isPlaying) {
    clearTimeout(playTimer);
    scheduleNextTick();
  }
  if (nextNoteIndex(cursor) === null) stopPlayback();
  return idx;
}

// ── 練習モードのキー点灯（先読みガイド＋正解フィードバック） ──
// 次に弾くべき音（nextNoteIndex(cursor)のtoken）に対応する演奏ボタンを薄く
// 光らせる。再生停止中のタップ先取りでも表示されたままにする（renderScoreDisplay
// から毎回呼ばれるため、cursorが動かない限りは同じ状態を維持し続けるだけになる）
// 演奏ボタンのうち、tokens[idx]の音に対応するものへclassNameを付け外しする共通処理。
// 先読みガイド(practice-guide)とシークバーのドラッグプレビュー(seek-preview)の
// どちらも「あるtokenインデックスの音に対応するボタンを光らせる」という点で
// 同じロジックなので、対象クラス名だけを引数にして共有している
function applyGuideHighlightForIndex(idx, className) {
  const frame = document.getElementById("musicStageFrame");
  if (!frame) return;
  frame.querySelectorAll(`.music-note-btn.${className}`).forEach((b) => b.classList.remove(className));
  if (idx == null || idx < 0) return;
  const tok = tokens[idx];
  if (!tok || !tok.notes.length) return;
  const keys = new Set(tok.notes.map(noteKey));
  frame.querySelectorAll(".music-note-btn").forEach((btn) => {
    const note = JSON.parse(btn.dataset.note);
    if (keys.has(noteKey(note))) btn.classList.add(className);
  });
}

function updatePracticeGuideHighlight() {
  // 自動再生中は、cursorがちょうど「今まさに鳴っている音」を指している
  // （tick()がcursor=idxを代入した直後にrenderScoreDisplay経由でここが呼ばれるため）ので、
  // それをそのまま光らせる。停止中のタップ先取りでは、まだ何も鳴っていないため
  // 「次に弾くべき音」(nextNoteIndex(cursor))を光らせる。isPlaying基準で分けないと、
  // 自動再生中は常に1つ先の音が光ってしまい、鳴っている音とずれて見える
  const idx = isPlaying ? cursor : nextNoteIndex(cursor);
  applyGuideHighlightForIndex(idx, "practice-guide");
}

// 正しく押せた瞬間、和音内の全ボタンを一瞬強く光らせてフェードアウトさせる
// （CSS側の@keyframesで見た目を作る。同じボタンを連打された場合でもアニメーションが
// 再生し直されるよう、一度クラスを外してから付け直す）
function flashPracticeCorrectHighlight(notes) {
  const frame = document.getElementById("musicStageFrame");
  if (!frame) return;
  const keys = new Set(notes.map(noteKey));
  frame.querySelectorAll(".music-note-btn").forEach((btn) => {
    const note = JSON.parse(btn.dataset.note);
    if (!keys.has(noteKey(note))) return;
    btn.classList.remove("practice-correct");
    void btn.offsetWidth; // reflowでアニメーションを再始動させる
    btn.classList.add("practice-correct");
    btn.addEventListener("animationend", () => btn.classList.remove("practice-correct"), { once: true });
  });
}

function notesSetEqual(a, b) {
  const aKeys = dedupeNotes(a).map(noteKey).sort();
  const bKeys = dedupeNotes(b).map(noteKey).sort();
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k, i) => k === bKeys[i]);
}

// 押した瞬間のボタンだけを短く光らせる、不正解フィードバック
// （flashPracticeCorrectHighlightとは別に、押した1つのボタンにだけ適用する）
function flashPracticeMissHighlight(btn) {
  btn.classList.remove("practice-miss");
  void btn.offsetWidth; // reflowでアニメーションを再始動させる
  btn.classList.add("practice-miss");
  btn.addEventListener("animationend", () => btn.classList.remove("practice-miss"), { once: true });
}

// 次に押すべき音（休符はスキップ済みの前提）にnoteが含まれているかどうか。
// 和音の場合、まだ他の指が揃っていないだけの「正しい途中経過」と、
// そもそも期待されていない音を区別するために使う（tryAdvancePracticeChordは
// 和音全体が揃わないと成立しないため、これだけでは判定できない）
function isExpectedPracticeNote(note) {
  const idx = nextNoteIndex(cursor);
  if (idx === null) return true; // 曲の終端では判定しない
  const tok = tokens[idx];
  if (!tok || !tok.notes.length) return true; // 休符は対象外（自動スキップ済みのはず）
  const key = noteKey(note);
  return tok.notes.some((n) => noteKey(n) === key);
}

// 練習モードに入り直すたびに正解/ミス回数を0に戻す（保存はしない、セッション限りの値）
function resetPracticeAccuracy() {
  practiceCorrectCount = 0;
  practiceMissCount = 0;
  updatePracticeAccuracyBadge();
}

function updatePracticeAccuracyBadge() {
  const el = document.getElementById("musicPracticeAccuracy");
  if (!el) return;
  const correctLabel = T("music_practice_correct_label", "正解");
  const missLabel = T("music_practice_miss_label", "ミス");
  el.innerHTML =
    `<span class="music-practice-accuracy-correct">✓ ${practiceCorrectCount}</span>` +
    `<span class="music-practice-accuracy-miss">✗ ${practiceMissCount}</span>`;
  el.setAttribute("aria-label", `${correctLabel} ${practiceCorrectCount}、${missLabel} ${practiceMissCount}`);
}

function togglePlayback() {
  if (isPlaying) pausePlayback();
  else startPlayback();
}

function startPlayback() {
  if (isPlaying) return;
  if (loopEnabled && loopStart !== null && loopEnd !== null) {
    // ループ区間の外から再生を始めたら、区間の頭から始める
    if (cursor < loopStart - 1 || cursor > loopEnd) {
      cursor = loopStart - 1;
      pausedElapsedSec = cursor >= 0 ? (playbackTimeline[cursor] || 0) + tokenDurationSec(tokens[cursor]) : 0;
    }
  } else if (nextNoteIndex(cursor) === null) {
    cursor = -1; // 最後まで行っていたら最初から
    pausedElapsedSec = 0;
  }
  isPlaying = true;
  updatePlaybackUI();
  startPlaybackClock();
  resumeFromCurrentPosition();
}

// 一時停止・シークの位置から再生を再開する。pausedElapsedSecがcursorトークンの
// 途中を指している場合（シークで曲の途中に移動した直後など）は、そのtokenの音を
// 再度鳴らし直さず、残り時間ぶんだけ無音で待ってから通常のtick()チェーンに合流する
// （tick()はnextNoteIndex(cursor)から次の音を鳴らすため、続きから自然につながる）
function resumeFromCurrentPosition() {
  if (cursor < 0 || !tokens[cursor]) {
    tick();
    return;
  }
  const tok = tokens[cursor];
  const tokStartSec = playbackTimeline[cursor] || 0;
  const tokSongDurSec = tokenDurationSec(tok);
  const elapsedInTokSec = Math.max(0, Math.min(tokSongDurSec, pausedElapsedSec - tokStartSec));
  const remainingSongSec = Math.max(0, tokSongDurSec - elapsedInTokSec);
  playbackTickStartWallClock = performance.now() - (elapsedInTokSec / playSpeed) * 1000;
  playbackTickDurSec = tokSongDurSec;
  playTimer = setTimeout(tick, (remainingSongSec / playSpeed) * 1000);
}

function pausePlayback() {
  pausedElapsedSec = getCurrentElapsedSec(); // isPlayingをfalseにする前に、今の位置を確定させる
  isPlaying = false;
  clearTimeout(playTimer);
  stopPlaybackClock();
  updatePlaybackUI();
  // isPlayingがfalseになった時点で先読みガイドを「次に弾くべき音」表示へ
  // 切り替える（そのままにすると、直前に鳴っていた音の点灯が停止後も残り続ける）
  updatePracticeGuideHighlight();
  updateSeekBarUI();
}

function stopPlayback() {
  pausedElapsedSec = getCurrentElapsedSec();
  isPlaying = false;
  clearTimeout(playTimer);
  stopPlaybackClock();
  updatePlaybackUI();
  // 曲の終わりまで自動再生した場合、tick()側はrenderScoreDisplay()を呼ばずに
  // ここへ来るため、最後に鳴っていた音の先読みガイドが点灯したまま残らないようにする
  updatePracticeGuideHighlight();
  updateSeekBarUI();
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
  const songDurSec = tokenDurationSec(tok);
  const durSec = songDurSec / playSpeed;
  playbackTickStartWallClock = performance.now();
  playbackTickDurSec = songDurSec;
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
  const songDurSec = tokenDurationSec(tok);
  const durSec = songDurSec / playSpeed;
  playbackTickStartWallClock = performance.now();
  playbackTickDurSec = songDurSec;
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

// ── 再生シークバー：再生中の見た目の更新(rAF)・ドラッグ操作 ──
// setTimeoutチェーン(tick)は音を鳴らすタイミングの管理に専念させ、シークバーの
// つまみ・時刻表示だけは別途requestAnimationFrameで毎フレーム滑らかに更新する
function startPlaybackClock() {
  if (playbackClockRaf != null) return;
  const step = () => {
    updateSeekBarUI();
    playbackClockRaf = requestAnimationFrame(step);
  };
  playbackClockRaf = requestAnimationFrame(step);
}

function stopPlaybackClock() {
  if (playbackClockRaf != null) cancelAnimationFrame(playbackClockRaf);
  playbackClockRaf = null;
}

function updateSeekBarUI() {
  const slider = document.getElementById("musicSeekSlider");
  const label = document.getElementById("musicSeekTimeLabel");
  if (!slider || !label) return;
  if (isSeekDragging) return; // ドラッグ中はユーザー操作を優先し、自動更新で上書きしない
  const total = playbackTotalDurationSec;
  const elapsed = Math.min(getCurrentElapsedSec(), total);
  slider.max = String(Math.max(1, Math.round(total * 1000)));
  slider.value = String(Math.round(elapsed * 1000));
  label.textContent = formatSeekOrPercentLabel(elapsed, total);
}

// 練習ステージでは参考画像と同じ「進捗％」、それ以外(編集/追従)では従来通り
// 「経過時間 / 合計時間」を、同じ表示欄(#musicSeekTimeLabel)に出し分ける
function formatSeekOrPercentLabel(elapsedSec, totalSec) {
  if (pageMode === "practice") {
    const pct = totalSec > 0 ? (elapsedSec / totalSec) * 100 : 0;
    return `${Math.max(0, Math.min(100, pct)).toFixed(1)}%`;
  }
  return `${formatSeekTime(elapsedSec)} / ${formatSeekTime(totalSec)}`;
}

// シークバーをドラッグ中：実際の再生位置は動かさず、その時点で鳴る（鳴る予定の）
// 音をプレビュー表示するだけにとどめる（音は鳴らさない）
function onSeekInputPreview(e) {
  isSeekDragging = true;
  const sec = Number(e.target.value) / 1000;
  const label = document.getElementById("musicSeekTimeLabel");
  if (label) label.textContent = formatSeekOrPercentLabel(sec, playbackTotalDurationSec);
  const idx = findTokenIndexAtSec(sec);
  updateSeekPreviewHighlight(idx);
}

function updateSeekPreviewHighlight(idx) {
  if (pageMode === "practice") {
    applyGuideHighlightForIndex(idx, "seek-preview");
  } else if (pageMode === "follow") {
    renderFollowDisplay(idx);
  } else {
    const el = document.getElementById("musicScoreDisplay");
    if (!el) return;
    el.querySelectorAll(".music-chip.seek-preview").forEach((c) => c.classList.remove("seek-preview"));
    const chip = idx != null && idx >= 0 ? el.querySelector(`.music-chip[data-index="${idx}"]`) : null;
    if (chip) chip.classList.add("seek-preview");
  }
}

function clearSeekPreviewHighlight() {
  const frame = document.getElementById("musicStageFrame");
  if (frame) frame.querySelectorAll(".music-note-btn.seek-preview").forEach((b) => b.classList.remove("seek-preview"));
  const el = document.getElementById("musicScoreDisplay");
  if (el) el.querySelectorAll(".music-chip.seek-preview").forEach((c) => c.classList.remove("seek-preview"));
  if (pageMode === "follow") renderFollowDisplay();
}

// シークバーを離した時点で、実際にその実時間位置へ再生位置をジャンプさせる
function onSeekCommit(e) {
  const sec = Number(e.target.value) / 1000;
  isSeekDragging = false;
  clearSeekPreviewHighlight();
  seekPlaybackTo(sec);
}

// トークン途中の位置へシークした場合、そのtokenの音を再度鳴らし直すことはせず、
// 残り時間ぶん無音のまま経過させてから次のtokenの通常再生を再開する（要件通り）。
// 一時停止中にシークした場合は、再生ボタンでその位置から再開できるよう
// pausedElapsedSecに反映するだけにとどめる
function seekPlaybackTo(sec) {
  if (!tokens.length) return;
  const clamped = Math.max(0, Math.min(sec, playbackTotalDurationSec));
  cursor = findTokenIndexAtSec(clamped);
  pausedElapsedSec = clamped;
  clearTimeout(playTimer);
  renderScoreDisplay(); // ハイライトをジャンプ後の位置に即座に反映する
  if (isPlaying) resumeFromCurrentPosition();
  updateSeekBarUI();
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
      freeTiming: scoreFreeTiming,
      referenceBpm: scoreReferenceBpm,
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
    // サンプル譜面を上書き保存したら、以後はユーザー自身の名前として固定する
    // （nameKeyが残ったままだと、次回表示時に翻訳し直されて上の行の名前が
    // 無視されてしまうため）
    delete existing.nameKey;
    existing.instrumentId = currentInstrumentId;
    existing.layoutId = currentLayoutId;
    existing.semitoneEnabled = semitoneEnabled;
    existing.bpm = bpm;
    existing.timeSignatureId = timeSignatureId;
    existing.freeTiming = scoreFreeTiming;
    existing.referenceBpm = scoreReferenceBpm;
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
    freeTiming: scoreFreeTiming,
    referenceBpm: scoreReferenceBpm,
    tokens: tokens.slice(),
    updatedAt: Date.now(),
  };
  savedScores.push(score);
  persistSavedScores();
  currentScoreId = score.id;
  saveDraft();
  showToast(T("music_toast_saved", "保存しました"));
}

// 新規作成：譜面の種類（拍子あり／フリーテンポ）を選ぶモーダルを開く。
// 実際のリセット処理はchooseNewScoreTypeで行う（キャンセルした場合は何もしない）
function newScore() {
  if (tokens.length && !confirm(T("music_confirm_new", "編集中の譜面を破棄して新規作成しますか？"))) return;
  document.getElementById("musicNewScoreTypeModal").style.display = "block";
}

function closeNewScoreTypeModal() {
  document.getElementById("musicNewScoreTypeModal").style.display = "none";
}

function chooseNewScoreType(freeTiming) {
  cursor = -1;
  stopPlayback();
  tokens = [];
  scoreName = "";
  currentScoreId = null;
  bpm = DEFAULT_BPM;
  scoreReferenceBpm = DEFAULT_BPM;
  timeSignatureId = DEFAULT_TIME_SIGNATURE_ID;
  scoreFreeTiming = freeTiming;
  resetLoop();
  selectedTokenIndex = null;
  humReviewIndexes = new Set();
  renderScoreMeta();
  renderFreeTimingUI();
  renderScoreDisplay();
  saveDraft();
  closeNewScoreTypeModal();
}

// ── フリーテンポ譜面：拍子入力欄の「目安」表示、拍子ベースへの変換 ──
// テンポ(bpm)は実際に再生速度を左右する（scoreReferenceBpmとの比率）ため、
// 「目安」バッジは付けない。拍子は小節線の目安表示専用のままなので付ける
function renderFreeTimingUI() {
  const show = scoreFreeTiming;
  document.getElementById("musicTimeSigApproxBadge").style.display = show ? "" : "none";
  document.getElementById("musicFreeTimingHint").style.display = show ? "" : "none";
  // 譜面が空でも変換ボタン自体は出す（押しても何も無ければ何も起きないだけで害はなく、
  // 音を1つ追加するたびに毎回renderFreeTimingUIを呼び直す必要が無くなる）
  document.getElementById("musicFreeTimingConvertRow").style.display = show ? "" : "none";
}

// フリーテンポ譜面を、現在のテンポ・拍子をもとに拍子ベースの譜面へ変換する
// （既存の量子化ロジック(snapBeatsToPreset)をそのまま流用する）。
// tokenApproxBeatsは基準テンポ(scoreReferenceBpm)を使って「本来の長さ」を
// 求めるが、変換後のtokens(beats)は現在のbpmで再生されるため、結果的に
// 「現在のテンポで聞こえていた速さ」がそのまま拍子ベース譜面に引き継がれる
// （逆方向(拍子ベース→フリーテンポ)は用意しない）
function convertFreeTimingScoreToBarBased() {
  if (!scoreFreeTiming || !tokens.length) return;
  if (!confirm(T("music_confirm_convert_to_bar", "現在のテンポ・拍子をもとに、拍子ベースの譜面に変換します。よろしいですか？"))) return;
  tokens = tokens.map((t) => ({ notes: t.notes, beats: snapBeatsToPreset(tokenApproxBeats(t)) }));
  scoreFreeTiming = false;
  resetLoop();
  selectedTokenIndex = null;
  renderFreeTimingUI();
  renderScoreDisplay();
  saveDraftDebounced();
  showToast(T("music_toast_converted_to_bar", "拍子ベースの譜面に変換しました"));
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
    .map((s) => {
      const inst = getInstrument(s.instrumentId);
      // 楽器に配置が複数ある場合（ピアノ・ギター等）は、同じ楽器名の項目が並んでも
      // どの配置(2列/3列/22キー等)の譜面か一覧だけで見分けられるよう配置名も添える
      const layoutLabel = inst.layouts.length > 1 ? ` ・ ${T(getLayout(inst, s.layoutId).labelKey, getLayout(inst, s.layoutId).labelFallback)}` : "";
      return `
    <div class="music-saved-item${s.id === currentScoreId ? " current" : ""}">
      <div class="music-saved-info">
        <div class="music-saved-name">${escapeHtml(s.nameKey ? T(s.nameKey, s.name) : s.name)}</div>
        <div class="music-saved-meta">${T(inst.nameKey, inst.nameFallback)}${layoutLabel} ・ ${s.tokens.length}${T("music_note_count_suffix", "音")}</div>
      </div>
      <div class="music-saved-actions">
        <button onclick="loadScore('${s.id}')">${T("music_open", "開く")}</button>
        <button class="music-btn-danger" onclick="deleteScore('${s.id}')">${T("music_delete", "削除")}</button>
      </div>
    </div>
  `;
    })
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
  scoreFreeTiming = !!score.freeTiming; // 古い形式で保存された譜面にはfreeTimingが無いため、拍子ベース(false)として扱う
  scoreReferenceBpm = score.referenceBpm != null ? score.referenceBpm : bpm;
  // サンプル譜面(nameKey付き)は表示言語に合わせてその都度翻訳し直す。
  // ユーザー自身が付けた名前(nameKeyなし)はそのまま使う
  scoreName = score.nameKey ? T(score.nameKey, score.name) : score.name;
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
  renderFreeTimingUI();
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
// 現在の形式（{notes:[...], beats}または{notes:[...], durationMs}）に変換する。
// 和音対応前の古い形式は常にbeatsを持っていた（durationMs・フリーテンポの概念が
// 存在しなかったため）ので、そのまま素通ししてよい。新しい形式（notesが配列）の
// tokenはbeats/durationMsのどちらか一方を既に持っているため、freeTimingスコアに
// 対してbeatsを強制することはない
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
  document.getElementById("musicEditTabPrepareBtn").addEventListener("click", () => setEditTab("prepare"));
  document.getElementById("musicEditTabCreateBtn").addEventListener("click", () => setEditTab("create"));
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

  document.getElementById("musicNewScoreTypeBarBtn").addEventListener("click", () => chooseNewScoreType(false));
  document.getElementById("musicNewScoreTypeFreeBtn").addEventListener("click", () => chooseNewScoreType(true));
  document.getElementById("musicNewScoreTypeCloseBtn").addEventListener("click", closeNewScoreTypeModal);
  document.getElementById("musicConvertToBarBtn").addEventListener("click", convertFreeTimingScoreToBarBased);

  document.getElementById("musicScoreNameInput").addEventListener("input", (e) => {
    scoreName = e.target.value;
    saveDraftDebounced();
  });
  document.getElementById("musicBpmInput").addEventListener("change", (e) => {
    bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, Number(e.target.value) || DEFAULT_BPM));
    e.target.value = bpm;
    tempoWarningDismissed = true; // テンポを自分で確認・変更したので、録音前の確認案内はもう不要
    // フリーテンポ譜面は、基準テンポ(scoreReferenceBpm)からの比率で実際の再生速度が
    // 変わる（tokenDurationSec）。小節線は基準テンポ側で計算するため表示は変わらず、
    // 再生中の場合は次の音から新しい速度が反映される（譜面自体の再描画は不要）。
    // ただし各tokenの実時間の長さ・曲全体の合計時間はbpmに応じて変わるため、
    // シークバーのタイムラインだけは作り直す
    rebuildPlaybackTimeline();
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
  document.getElementById("musicSeekSlider").addEventListener("input", onSeekInputPreview);
  document.getElementById("musicSeekSlider").addEventListener("change", onSeekCommit);

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
