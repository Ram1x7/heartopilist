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

// ── キーボード演奏入力 ──
const KEY_LABEL_VISIBLE_KEY = "hatopiMusic_keyLabelVisible";
let keyLabelsVisible = true; // 演奏ボタンに対応キーを表示するかどうか（既定はON）
let activeKeyboardKeys = new Set(); // 今押下中の物理キー（小文字）。キーリピートの二重処理防止用

let isPlaying = false;
let playSpeed = 1.0;
let cursor = -1; // tokens内のインデックス。-1=未開始
let playTimer = null;

// 練習モードの「流れる譜面」欄：一度に表示するのは10個ずつのブロック単位とし、
// 今いるブロックの先頭インデックスを覚えておく（ブロックが変わった瞬間だけ
// 切り替わりアニメーションを付けるため。-1は「まだ練習モードで一度も描画していない」印）
const PRACTICE_SCORE_BLOCK_SIZE = 10;
let practiceScoreBlockStart = -1;

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

// ── Undo/Redo：譜面編集の履歴管理 ──
// コマンドパターン（操作ごとに逆操作を持つ）ではなく、編集が完了するたびに
// 譜面データ全体をスナップショットとして積む方式を採る。対象operationの種類が多く
// （音符追加・削除・置換・BPM・拍子・楽器変更・ループ範囲変更など）、どれも
// 「以下のフィールド群のうちどれかを書き換える」という共通の形をしているため。
// 曲名(scoreName)・currentScoreIdは対象操作の一覧に含まれておらず、曲名は
// input（1文字ごとに発火）のため含めると打鍵のたびに履歴が積まれてしまうので
// 意図的に対象外とする
const UNDO_MAX_HISTORY = 50;
let scoreHistory = [];
let scoreHistoryIndex = -1;
let historySavedIndex = -1; // 直近でsaveCurrentAsScore()が成功した時点のscoreHistoryIndex
let isApplyingHistory = false; // 巻き戻し適用中に誤って新しい履歴を積まないためのガード

function captureScoreSnapshot() {
  return {
    tokens: JSON.parse(JSON.stringify(tokens)),
    bpm,
    timeSignatureId,
    scoreFreeTiming,
    scoreReferenceBpm,
    currentInstrumentId,
    currentLayoutId,
    semitoneEnabled,
    loopStart,
    loopEnd,
    loopEnabled,
  };
}

// 新しい譜面を開いた・作った・変換ツールで生成した直後など、「ここより前には
// 戻れない基準点」を作る。以後の編集はここからのUndo/Redo対象になる
function resetHistory() {
  scoreHistory = [captureScoreSnapshot()];
  scoreHistoryIndex = 0;
  historySavedIndex = 0;
  updateUndoRedoUI();
}

// 1つの編集操作が完了するたびに呼ぶ。以降のRedo履歴は破棄する
function commitHistory() {
  if (isApplyingHistory) return;
  scoreHistory = scoreHistory.slice(0, scoreHistoryIndex + 1);
  scoreHistory.push(captureScoreSnapshot());
  scoreHistoryIndex++;
  if (scoreHistory.length > UNDO_MAX_HISTORY) {
    const overflow = scoreHistory.length - UNDO_MAX_HISTORY;
    scoreHistory.splice(0, overflow);
    scoreHistoryIndex -= overflow;
    historySavedIndex -= overflow;
  }
  updateUndoRedoUI();
}

function applyScoreSnapshot(snap) {
  isApplyingHistory = true;
  stopPlayback();
  cursor = -1;
  tokens = JSON.parse(JSON.stringify(snap.tokens));
  bpm = snap.bpm;
  timeSignatureId = snap.timeSignatureId;
  scoreFreeTiming = snap.scoreFreeTiming;
  scoreReferenceBpm = snap.scoreReferenceBpm;
  currentInstrumentId = snap.currentInstrumentId;
  currentLayoutId = snap.currentLayoutId;
  semitoneEnabled = snap.semitoneEnabled;
  loopStart = snap.loopStart;
  loopEnd = snap.loopEnd;
  loopEnabled = snap.loopEnabled;
  loopSelecting = false;
  // Undo/Redoでインデックスがずれる可能性があるため、選択中の音・未確認マークは
  // 巻き戻り後に持ち越さず解除する（不整合な参照を避ける安全側の選択）
  selectedTokenIndex = null;
  humReviewIndexes = new Set();
  renderInstrumentSelector();
  renderLayoutSelector();
  renderInstrumentGrid();
  renderScoreMeta();
  renderFreeTimingUI();
  updateLoopUI();
  renderScoreDisplay();
  saveDraftDebounced();
  isApplyingHistory = false;
  updateUndoRedoUI();
}

function undoEdit() {
  if (scoreHistoryIndex <= 0) return;
  scoreHistoryIndex--;
  applyScoreSnapshot(scoreHistory[scoreHistoryIndex]);
}

function redoEdit() {
  if (scoreHistoryIndex >= scoreHistory.length - 1) return;
  scoreHistoryIndex++;
  applyScoreSnapshot(scoreHistory[scoreHistoryIndex]);
}

function updateUndoRedoUI() {
  const undoBtn = document.getElementById("musicUndoBtn");
  const redoBtn = document.getElementById("musicRedoBtn");
  if (undoBtn) undoBtn.disabled = scoreHistoryIndex <= 0;
  if (redoBtn) redoBtn.disabled = scoreHistoryIndex >= scoreHistory.length - 1;
  const unsavedEl = document.getElementById("musicUnsavedIndicator");
  if (unsavedEl) unsavedEl.style.display = scoreHistoryIndex !== historySavedIndex ? "" : "none";
}

// テキスト入力欄・textarea・select・contenteditableにフォーカスがある間は、
// Undo/Redo・演奏キーボード入力のどちらも「通常の文字入力」を優先して発火しない
// ようにする（Ctrl+Z等のブラウザ標準の編集操作、IME入力等と衝突させないため）
// チェックボックス・range(スライダー)等は文字を「打つ」対象ではなく、
// クリック後もフォーカスが残るだけで演奏キー入力まで塞いでしまうと不便なため、
// 実際に文字入力を伴うinput種別だけをテキスト入力欄として扱う
const NON_TEXT_INPUT_TYPES = new Set(["checkbox", "radio", "range", "button", "submit", "reset", "color", "file", "image"]);
function isEditableFocusTarget(target) {
  if (!target) return false;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return true;
  if (tag === "INPUT") return !NON_TEXT_INPUT_TYPES.has((target.type || "text").toLowerCase());
  return false;
}

function handleHistoryKeydown(e) {
  if (pageMode !== "edit") return;
  if (isEditableFocusTarget(e.target)) return;
  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return;
  const key = e.key.toLowerCase();
  if (key === "z" && !e.shiftKey) {
    e.preventDefault();
    undoEdit();
  } else if (key === "y" || (key === "z" && e.shiftKey)) {
    e.preventDefault();
    redoEdit();
  }
}

// ── キーボードでの演奏入力（keydown/keyup） ──
// Pointer Eventsと同じpressNote/releaseNoteを、pointerIdの代わりに
// "kbd:"+キー という文字列IDで呼ぶことで、和音判定・正解/ミス判定・
// 音声再生・譜面への追加(finalizeGroup)を完全に共有する
function handleMusicKeydown(e) {
  if (pageMode !== "edit" && pageMode !== "practice") return;
  if (isEditableFocusTarget(e.target)) return;
  // Ctrl/Cmd/Alt併用時は演奏キーとして扱わない（Undo/Redo・ブラウザショートカットを優先）
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.isComposing) return; // IME変換中の誤入力を防ぐ
  const key = e.key.toLowerCase();
  if (!activeKeymap.has(key)) return; // 割り当てが無いキー（Tab/Escape/矢印キー等も含む）は素通りする
  if (e.repeat || activeKeyboardKeys.has(key)) return; // OSのキーリピート・二重keydownを防ぐ
  const note = activeKeymap.get(key);
  const btn = noteButtonMap.get(noteKey(note));
  if (!btn) return; // 現在描画されているボタンに該当が無ければ何もしない
  e.preventDefault();
  activeKeyboardKeys.add(key);
  pressNote("kbd:" + key, note, btn);
}

function handleMusicKeyup(e) {
  const key = e.key.toLowerCase();
  if (!activeKeyboardKeys.has(key)) return;
  activeKeyboardKeys.delete(key);
  releaseNote("kbd:" + key);
}

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
    // 保存済み譜面の読込(loadScore)と同じ正規化を使う。古い形式の下書き（ループ情報が
    // 無い）・音符数が減って範囲が不正になった下書きのどちらも安全にフォールバックする
    restoreLoopFromScore(draft, tokens.length);
  } else {
    currentLayoutId = defaultLayoutIdFor(currentInstrumentId);
  }

  const savedSound = localStorage.getItem("hatopiMusic_soundEnabled");
  if (savedSound !== null) soundEnabled = savedSound === "1";
  const savedKeyLabelVisible = localStorage.getItem(KEY_LABEL_VISIBLE_KEY);
  if (savedKeyLabelVisible !== null) keyLabelsVisible = savedKeyLabelVisible === "1";
  document.getElementById("musicKeyLabelToggle").checked = keyLabelsVisible;

  calib = loadCalibration();
  updateCalibIndicator();

  document.getElementById("musicPracticeExitBtn").innerHTML = icon("close", { size: 18 });
  document.getElementById("musicFollowExitBtn").innerHTML = icon("close", { size: 18 });
  document.getElementById("musicRotatePromptIcon").innerHTML = icon("rotateDevice", { size: 32 });
  document.getElementById("musicCalibToggleBtn").innerHTML = icon("wrench", { size: 15 });
  document.getElementById("musicUndoBtn").innerHTML = icon("undo", { size: 16 });
  document.getElementById("musicRedoBtn").innerHTML = icon("redo", { size: 16 });

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
  resetHistory();
  document.addEventListener("keydown", handleHistoryKeydown);
  document.addEventListener("keydown", handleMusicKeydown);
  document.addEventListener("keyup", handleMusicKeyup);
  // タブ切替・ウィンドウ非アクティブ化で押しっぱなしのキーが残ると、音が鳴り
  // 続けたり和音状態が壊れたりするため、そのタイミングで強制的に解除する
  window.addEventListener("blur", releaseAllHolds);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseAllHolds();
  });
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
  resetHistory();
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
    <button class="music-instrument-btn${inst.id === currentInstrumentId ? " active" : ""}" data-instrument="${inst.id}" aria-pressed="${inst.id === currentInstrumentId}">
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
  commitHistory();
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
      (l) => `<button class="music-layout-btn${l.id === currentLayoutId ? " active" : ""}" data-layout="${l.id}" aria-pressed="${l.id === currentLayoutId}">${T(l.labelKey, l.labelFallback)}</button>`
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
  commitHistory();
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
  saveDraftDebounced();
  commitHistory();
}

// ── 楽器の演奏ボタン（実機の配置を再現。押している間だけ音が鳴る） ──
// 編集モードは画面幅に合わせて伸縮するボタン行、練習モードは実機の座標を
// そのまま絶対配置で再現する（指の感覚を実機と揃えるため）。表示方法が
// 大きく異なるため、現在のページモードに応じてどちらかを描画する
// ── キーボード演奏入力：キー⇔音の対応 ──
// activeKeymap: 押されたキー(小文字)→音。noteToKeyLabel: 音→表示用キー文字列。
// どちらも「現在の楽器・配置」だけに依存し、半音表示のON/OFFでは変わらない
// （半音ボタンはキー割り当ての対象外のため）。noteButtonMapは逆に
// 「今実際に描画されているボタンDOM」に依存するため、描画のたびに作り直す
let activeKeymap = new Map();
let noteToKeyLabel = new Map();
let noteButtonMap = new Map();

function rebuildActiveKeymap() {
  activeKeymap = new Map();
  noteToKeyLabel = new Map();
  const inst = getInstrument(currentInstrumentId);
  const layout = getLayout(inst, currentLayoutId);
  const flatNotes = layout.grid.flat();
  const keys = getKeymapForLayout(currentInstrumentId, currentLayoutId);
  const n = Math.min(flatNotes.length, keys.length);
  for (let i = 0; i < n; i++) {
    activeKeymap.set(keys[i].toLowerCase(), flatNotes[i]);
    noteToKeyLabel.set(noteKey(flatNotes[i]), keys[i].toUpperCase());
  }
}

function renderInstrumentGrid() {
  rebuildActiveKeymap();
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
  const showKeyLabels = keyLabelsVisible;
  el.className = "music-instrument-grid";
  el.innerHTML = grid
    .map(
      (row) => `
      <div class="music-instrument-row">
        ${row
          .map((note) => {
            const label = noteDisplayDigit(note);
            const keyLabel = showKeyLabels ? noteToKeyLabel.get(noteKey(note)) : null;
            const keySpan = keyLabel ? `<span class="music-note-key">${keyLabel}</span>` : "";
            return `<button class="music-note-btn${note.accidental ? " accidental" : ""}" data-note='${JSON.stringify(note)}'>
              ${keySpan}
              <span class="music-note-digit">${label}</span>
              <span class="music-note-kana">${DEGREE_LABELS[note.degree]}</span>
            </button>`;
          })
          .join("")}
      </div>
    `
    )
    .join("");
  noteButtonMap = new Map();
  el.querySelectorAll(".music-note-btn").forEach((btn) => {
    const note = JSON.parse(btn.dataset.note);
    noteButtonMap.set(noteKey(note), btn);
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
      const keyLabel = keyLabelsVisible ? noteToKeyLabel.get(noteKey(note)) : null;
      const keySpan = keyLabel ? `<span class="music-note-key">${keyLabel}</span>` : "";
      return `<button class="music-note-btn music-stage-btn${accidentalClass}" style="left:${p.xPct}%; top:${p.yPct}%;" data-note='${JSON.stringify(note)}'>
        ${keySpan}
        <span class="music-note-digit">${label}</span>
        <span class="music-note-kana">${DEGREE_LABELS[note.degree]}</span>
      </button>`;
    })
    .join("")}</div>`;
  noteButtonMap = new Map();
  el.querySelectorAll(".music-stage-btn").forEach((btn) => {
    const note = JSON.parse(btn.dataset.note);
    noteButtonMap.set(noteKey(note), btn);
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

// ボタンにデフォルト値と異なる調整値が保存されているかどうかを、小さな印で常時示す
// （「調整モード中」を示す.activeとは別に、「既に調整済み」を示す状態）
function updateCalibIndicator() {
  const isDefault = calib.scale === MUSIC_CALIB_DEFAULT.scale && calib.offsetX === MUSIC_CALIB_DEFAULT.offsetX && calib.offsetY === MUSIC_CALIB_DEFAULT.offsetY;
  const btn = document.getElementById("musicCalibToggleBtn");
  if (btn) btn.classList.toggle("has-custom", !isDefault);
}

const MUSIC_CALIB_HINT_SEEN_KEY = "hatopiMusic_calibHintSeen";
let calibHintTimer = null;

// 練習モードに初めて入った時だけ、ボタン調整機能の存在を一度だけ吹き出しで知らせる
function maybeShowCalibHint() {
  if (localStorage.getItem(MUSIC_CALIB_HINT_SEEN_KEY)) return;
  const bubble = document.getElementById("musicCalibHintBubble");
  if (!bubble) return;
  bubble.classList.add("show");
  clearTimeout(calibHintTimer);
  calibHintTimer = setTimeout(dismissCalibHint, 5000);
}

function dismissCalibHint() {
  clearTimeout(calibHintTimer);
  calibHintTimer = null;
  const bubble = document.getElementById("musicCalibHintBubble");
  if (bubble) bubble.classList.remove("show");
  localStorage.setItem(MUSIC_CALIB_HINT_SEEN_KEY, "1");
}

function applyCalibTransform() {
  const frame = document.getElementById("musicStageFrame");
  if (!frame) return;
  frame.style.transform = `translate(${calib.offsetX}vh, ${calib.offsetY}vh) scale(${calib.scale})`;
}

function toggleCalibMode() {
  dismissCalibHint();
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
  document.getElementById("musicCalibToggleBtn").setAttribute("aria-pressed", "true");
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
  document.getElementById("musicCalibToggleBtn").setAttribute("aria-pressed", "false");
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
  updateCalibIndicator();
  exitCalibModeUI();
}

function resetCalibration() {
  calib = { ...MUSIC_CALIB_DEFAULT };
  applyCalibTransform();
  showToast(T("music_toast_calib_reset", "リセットしました"));
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
// ボタンを押した時の共通処理（Pointer Events・キーボードのどちらから呼ばれても
// 同じ判定・演奏処理になるよう、入力方式に依存する部分(pointerId等)は
// 呼び出し側(bindNoteButtonHold／キーボードハンドラ)に残し、ここには
// 「idという文字列で1本の指(または1つのキー)を識別する」という前提のみ持ち込む
function pressNote(id, note, btn) {
  btn.classList.add("pressed");
  if (activeHolds.size === 0) {
    currentGroupNotes = [];
    groupStartTime = performance.now();
  }
  activeHolds.set(id, { note, btn, startTime: performance.now() });
  currentGroupNotes.push(note);
  startSustainedTone(id, noteFrequency(note));
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
}

function releaseNote(id) {
  const held = activeHolds.get(id);
  if (!held) return;
  held.btn.classList.remove("pressed");
  activeHolds.delete(id);
  stopSustainedTone(id);
  if (activeHolds.size === 0) finalizeGroup();
}

function bindNoteButtonHold(btn, note) {
  const start = (e) => {
    e.preventDefault();
    try {
      btn.setPointerCapture(e.pointerId);
    } catch (err) {}
    pressNote(e.pointerId, note, btn);
  };
  const end = (e) => releaseNote(e.pointerId);
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
    (d) => `<button class="music-duration-btn${d.id === selectedDurationId ? " active" : ""}" data-duration="${d.id}" aria-pressed="${d.id === selectedDurationId}">${T(d.labelKey, d.labelFallback)}</button>`
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
  commitHistory();
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
  commitHistory();
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
  commitHistory();
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
  commitHistory();
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
  commitHistory();
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
  // 練習モードの「流れる譜面」欄は、曲が長いと全部並べると見づらいため
  // 10個ずつのブロックに区切り、今のブロックだけを表示する。ブロックの終わりまで
  // 弾き終えたら次のブロックへ自動的に切り替わる（＝自動スクロール）
  const isPracticeBlockView = pageMode === "practice";
  const activeIdx = Math.max(cursor, 0);
  const blockStart = isPracticeBlockView ? Math.floor(activeIdx / PRACTICE_SCORE_BLOCK_SIZE) * PRACTICE_SCORE_BLOCK_SIZE : 0;
  const blockEnd = isPracticeBlockView ? Math.min(blockStart + PRACTICE_SCORE_BLOCK_SIZE, tokens.length) : tokens.length;
  let html = "";
  let beatsSinceBar = 0;
  tokens.forEach((tok, i) => {
    const inBlock = !isPracticeBlockView || (i >= blockStart && i < blockEnd);
    // 小節線は、手入力（キーボード演奏入力等）で作った拍子ベースの譜面でのみ表示する。
    // フリーテンポ譜面（MIDI/音源/動画/ハミングからの自動変換は全てこちら）は
    // 実時間の長さ(durationMs)しか持たず、小節線の位置はあくまで基準テンポからの
    // 近似でしかないため、不正確な位置に表示して誤解を招くより、そもそも表示しない
    if (!scoreFreeTiming && i > 0 && beatsSinceBar >= beatsPerBar) {
      if (inBlock) html += `<span class="music-chip music-chip-bar"></span>`;
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
    if (inBlock) {
      const gridHtml = buildChipGridHTML(tok);
      const cls = ["music-chip", isRest && "rest", isChord && "chord", current && "current", inLoop && "in-loop", outOfLoop && "out-of-loop", pendingLoopStart && "loop-pending", isSelected && "selected", needsReview && "hum-review"].filter(Boolean).join(" ");
      html += `<span class="${cls}" data-index="${i}" aria-label="${isRest ? T("music_note_rest_label", "休符") : tok.notes.map((n) => noteDisplayDigit(n)).join("・")}">${gridHtml}</span>`;
    }
    beatsSinceBar += tokenApproxBeats(tok);
  });
  el.innerHTML = html;

  if (isPracticeBlockView) {
    // 前回描画時と違うブロックへ切り替わった瞬間だけ、次のブロックへ
    // 自動的に流れ込んだことが分かるよう軽い演出を付ける（練習モードに
    // 入り直した直後の最初の描画では演出しない）
    if (practiceScoreBlockStart !== -1 && practiceScoreBlockStart !== blockStart) {
      el.classList.remove("block-enter");
      void el.offsetWidth; // reflowでアニメーションを再始動させる
      el.classList.add("block-enter");
      el.addEventListener("animationend", () => el.classList.remove("block-enter"), { once: true });
    }
    practiceScoreBlockStart = blockStart;
  }

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
      updateLoopUI();
      renderScoreDisplay();
      saveDraftDebounced();
      commitHistory();
      return;
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
  saveDraftDebounced();
  commitHistory();
}

function clearLoop() {
  loopStart = null;
  loopEnd = null;
  loopEnabled = false;
  loopSelecting = false;
  updateLoopUI();
  renderScoreDisplay();
  saveDraftDebounced();
  commitHistory();
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

// 保存された譜面からループ区間を復元する。古い形式（フィールド自体が無い）・
// 譜面編集後に音符数が変わって範囲外になったデータのどちらも、値が不正なら
// resetLoop()と同じ「丸ごと初期化」で安全側に倒す（部分的な補正はしない。
// deleteLastToken()が範囲外になった時に採る既存の方針と揃える）
function restoreLoopFromScore(score, tokenCount) {
  const start = score.loopStart;
  const end = score.loopEnd;
  const isValidRange = Number.isInteger(start) && Number.isInteger(end) && start >= 0 && start <= end && end < tokenCount;
  if (!isValidRange) {
    resetLoop();
    return;
  }
  loopStart = start;
  loopEnd = end;
  loopEnabled = !!score.loopEnabled;
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
    practiceScoreBlockStart = -1;
    skipLeadingRests();
    resetPracticeAccuracy();
    maybeShowCalibHint();
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
  const prepareBtn = document.getElementById("musicEditTabPrepareBtn");
  const createBtn = document.getElementById("musicEditTabCreateBtn");
  prepareBtn.classList.toggle("active", tab === "prepare");
  createBtn.classList.toggle("active", tab === "create");
  prepareBtn.setAttribute("aria-selected", String(tab === "prepare"));
  createBtn.setAttribute("aria-selected", String(tab === "create"));
  document.getElementById("musicTabPanelPrepare").style.display = tab === "prepare" ? "" : "none";
  document.getElementById("musicTabPanelCreate").style.display = tab === "create" ? "" : "none";
}

// 押しっぱなしの指を全て強制的に離した扱いにする（モード切り替え時などの後始末）
function releaseAllHolds() {
  activeHolds.forEach((held) => held.btn.classList.remove("pressed"));
  activeHolds.clear();
  currentGroupNotes = [];
  stopAllSustainedTones();
  activeKeyboardKeys.clear();
}

function updateModeUI() {
  document.getElementById("musicModeEditBtn").classList.toggle("active", pageMode === "edit");
  document.getElementById("musicModePracticeBtn").classList.toggle("active", pageMode === "practice");
  document.getElementById("musicModeFollowBtn").classList.toggle("active", pageMode === "follow");
  document.getElementById("musicModeEditBtn").setAttribute("aria-selected", String(pageMode === "edit"));
  document.getElementById("musicModePracticeBtn").setAttribute("aria-selected", String(pageMode === "practice"));
  document.getElementById("musicModeFollowBtn").setAttribute("aria-selected", String(pageMode === "follow"));
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

// 演奏ボタンに対応キーラベルを表示するかどうか（PCでの利便性のため既定はON）。
// 半音ボタンにはそもそもキー割り当てが無いため、ラベル自体が出ない
function toggleKeyLabels() {
  keyLabelsVisible = document.getElementById("musicKeyLabelToggle").checked;
  localStorage.setItem(KEY_LABEL_VISIBLE_KEY, keyLabelsVisible ? "1" : "0");
  renderInstrumentGrid();
}

function updateSoundToggleUI() {
  ["musicSoundToggleBtn", "musicSoundToggleBtnStage", "musicSoundToggleBtnFollow"].forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.innerHTML = icon(soundEnabled ? "volumeOn" : "volumeOff", { size: 18 });
    btn.classList.toggle("muted", !soundEnabled);
    btn.setAttribute("aria-pressed", String(!soundEnabled));
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
      loopStart,
      loopEnd,
      loopEnabled,
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

// ── 名前を付けて保存した譜面の一覧管理（譜面ライブラリ） ──
// 一意なIDを新規発行する。saveCurrentAsScore（初回保存）・duplicateScore（複製）・
// saveTokensAsNewScore（MIDI/音源/動画/ハミングのプレビューから新規保存）の
// すべてがこの1箇所を通ることで、同一IDの発行を防ぐ
function generateScoreId() {
  return "score-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

function loadSavedScores() {
  try {
    const raw = localStorage.getItem(SAVED_SCORES_KEY);
    savedScores = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(savedScores)) savedScores = [];
  } catch (e) {
    savedScores = [];
  }
  // createdAt・idが無い旧形式の保存譜面（この機能を追加する前に保存されたもの）を
  // メモリ上でだけ補完する。localStorageへの書き戻しはユーザーが実際に何か
  // 操作した時（保存・複製・名前変更・削除）だけ行い、読み込んだだけで
  // 既存データを一括して書き換えることはしない
  savedScores.forEach((s) => {
    if (!s.id) s.id = generateScoreId();
    if (s.createdAt == null) s.createdAt = s.updatedAt != null ? s.updatedAt : Date.now();
    if (s.updatedAt == null) s.updatedAt = s.createdAt;
  });
}

// 失敗しうる操作（localStorageの容量超過等）として扱い、成功したかどうかを返す。
// 呼び出し側は戻り値を見て、失敗時はユーザーに分かるメッセージを表示する
function persistSavedScores() {
  try {
    localStorage.setItem(SAVED_SCORES_KEY, JSON.stringify(savedScores));
    return true;
  } catch (e) {
    console.error("failed to persist saved scores", e);
    return false;
  }
}

// MIDI変換・音源/動画/ハミング変換のプレビューから、現在編集中の譜面(tokens)には
// 一切触れずに新しい譜面として保存済み一覧に追加する共通処理。
// 各プレビュー機能はこの関数を呼ぶだけでよく、保存済み譜面の形（フィールド構成）は
// ここに1箇所だけ定義される
function saveTokensAsNewScore(fields) {
  const now = Date.now();
  const score = {
    id: generateScoreId(),
    name: fields.name,
    instrumentId: fields.instrumentId,
    layoutId: fields.layoutId,
    semitoneEnabled: !!fields.semitoneEnabled,
    bpm: fields.bpm,
    timeSignatureId: fields.timeSignatureId,
    freeTiming: !!fields.freeTiming,
    referenceBpm: fields.referenceBpm,
    loopStart: null,
    loopEnd: null,
    loopEnabled: false,
    tokens: fields.tokens.slice(),
    createdAt: now,
    updatedAt: now,
  };
  savedScores.push(score);
  if (!persistSavedScores()) {
    savedScores.pop();
    return null;
  }
  return score;
}

function saveCurrentAsScore() {
  scoreName = document.getElementById("musicScoreNameInput").value.trim();
  const existing = savedScores.find((s) => s.id === currentScoreId);
  if (existing) {
    // 保存に失敗した場合に元へ戻せるよう、書き換える前の状態を控えておく
    const backup = { ...existing };
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
    existing.loopStart = loopStart;
    existing.loopEnd = loopEnd;
    existing.loopEnabled = loopEnabled;
    existing.tokens = tokens.slice();
    existing.updatedAt = Date.now();
    if (!persistSavedScores()) {
      Object.assign(existing, backup);
      showToast(T("music_toast_save_failed", "保存に失敗しました。空き容量を確認してもう一度お試しください"));
      return;
    }
    historySavedIndex = scoreHistoryIndex;
    updateUndoRedoUI();
    showToast(T("music_toast_updated", "更新しました"));
    return;
  }
  const now = Date.now();
  const score = {
    id: generateScoreId(),
    name: scoreName || T("music_default_score_name", "譜面"),
    instrumentId: currentInstrumentId,
    layoutId: currentLayoutId,
    semitoneEnabled,
    bpm,
    timeSignatureId,
    freeTiming: scoreFreeTiming,
    referenceBpm: scoreReferenceBpm,
    loopStart,
    loopEnd,
    loopEnabled,
    tokens: tokens.slice(),
    createdAt: now,
    updatedAt: now,
  };
  savedScores.push(score);
  if (!persistSavedScores()) {
    savedScores.pop();
    showToast(T("music_toast_save_failed", "保存に失敗しました。空き容量を確認してもう一度お試しください"));
    return;
  }
  currentScoreId = score.id;
  saveDraft();
  historySavedIndex = scoreHistoryIndex;
  updateUndoRedoUI();
  showToast(T("music_toast_saved", "保存しました"));
}

// 現在の譜面(tokens)を変更せず、指定した保存済み譜面を複製する。
// 複製先は「元の名前 - コピー」で区別し、作成/更新日時は複製した時点にする
function duplicateScore(id) {
  const source = savedScores.find((s) => s.id === id);
  if (!source) return;
  const now = Date.now();
  const sourceName = source.nameKey ? T(source.nameKey, source.name) : source.name;
  const copy = {
    ...source,
    id: generateScoreId(),
    name: T("music_duplicate_name_format", "{name} - コピー", { name: sourceName }),
    createdAt: now,
    updatedAt: now,
    tokens: source.tokens.slice(),
  };
  delete copy.nameKey;
  savedScores.push(copy);
  if (!persistSavedScores()) {
    savedScores.pop();
    showToast(T("music_toast_save_failed", "保存に失敗しました。空き容量を確認してもう一度お試しください"));
    return;
  }
  renderSavedList();
  showToast(T("music_toast_duplicated", "複製しました"));
}

const MUSIC_SCORE_NAME_MAX_LENGTH = 60;

// 譜面名の変更。前後の空白を取り除き、空文字・文字数上限超過を弾く。
// 保存に失敗した場合は元の名前のまま変更しない
function renameScore(id, rawName) {
  const trimmed = (rawName || "").trim();
  if (!trimmed) {
    showToast(T("music_toast_name_required", "譜面名を入力してください"));
    return false;
  }
  if (trimmed.length > MUSIC_SCORE_NAME_MAX_LENGTH) {
    showToast(T("music_toast_name_too_long", "譜面名が長すぎます（{max}文字まで）", { max: MUSIC_SCORE_NAME_MAX_LENGTH }));
    return false;
  }
  const score = savedScores.find((s) => s.id === id);
  if (!score) return false;
  const backupName = score.name;
  const backupNameKey = score.nameKey;
  score.name = trimmed;
  delete score.nameKey;
  score.updatedAt = Date.now();
  if (!persistSavedScores()) {
    score.name = backupName;
    if (backupNameKey) score.nameKey = backupNameKey;
    showToast(T("music_toast_save_failed", "保存に失敗しました。空き容量を確認してもう一度お試しください"));
    return false;
  }
  if (id === currentScoreId) scoreName = trimmed;
  return true;
}

// 直近の保存（saveCurrentAsScore成功時）以降に、Undo履歴が進んでいるかどうか。
// 譜面ライブラリでの「新規作成」「別の譜面を開く」時に、未保存の変更を
// 誤って破棄してしまわないかの判定に使う（Undo/Redoの追跡をそのまま流用する）
function hasUnsavedChanges() {
  return scoreHistoryIndex !== historySavedIndex;
}

// 新規作成：譜面の種類（拍子あり／フリーテンポ）を選ぶモーダルを開く。
// 実際のリセット処理はchooseNewScoreTypeで行う（キャンセルした場合は何もしない）
function newScore() {
  if (hasUnsavedChanges() && !confirm(T("music_confirm_new", "編集中の譜面を破棄して新規作成しますか？"))) return;
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
  resetHistory();
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
  commitHistory();
  showToast(T("music_toast_converted_to_bar", "拍子ベースの譜面に変換しました"));
}

function openSavedListModal() {
  renamingScoreId = null;
  renderSavedList();
  document.getElementById("musicSavedListModal").style.display = "block";
}

function closeSavedListModal() {
  renamingScoreId = null;
  document.getElementById("musicSavedListModal").style.display = "none";
}

// 譜面ライブラリ：名前変更中の譜面ID（1件のみ。他の項目を開く・削除する等の
// 操作をすると解除される）
let renamingScoreId = null;

// 作成/更新日時の表示（言語横断でi18n化の必要が無いよう、閲覧者のブラウザの
// ロケール・タイムゾーンにそのまま従うIntl.DateTimeFormatを使う）
function formatScoreLibraryDate(ts) {
  if (!ts) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
  } catch (e) {
    return new Date(ts).toLocaleString();
  }
}

function renderSavedList() {
  const el = document.getElementById("musicSavedList");
  const hasDraft = currentScoreId === null && tokens.length > 0;
  const draftHtml = hasDraft
    ? `
    <div class="music-saved-item music-saved-item-draft">
      <div class="music-saved-info">
        <div class="music-saved-name">${escapeHtml(scoreName || T("music_default_score_name", "譜面"))} <span class="music-saved-badge music-saved-badge-draft">${T("music_status_draft", "下書き")}</span></div>
        <div class="music-saved-meta">${tokens.length}${T("music_note_count_suffix", "音")}</div>
      </div>
      <div class="music-saved-actions">
        <button onclick="openLibrarySaveDraftShortcut()">${T("music_save", "保存する")}</button>
      </div>
    </div>
  `
    : "";

  if (!savedScores.length && !hasDraft) {
    el.innerHTML = `<div class="music-saved-empty">${T("music_saved_empty", "保存した譜面はまだありません")}<button class="music-header-btn" id="musicSavedEmptyNewBtn">${T("music_saved_empty_new", "新しい譜面を作成")}</button></div>`;
    const btn = document.getElementById("musicSavedEmptyNewBtn");
    if (btn) btn.addEventListener("click", () => { closeSavedListModal(); newScore(); });
    return;
  }

  const sorted = savedScores.slice().sort((a, b) => b.updatedAt - a.updatedAt);
  el.innerHTML =
    draftHtml +
    sorted
      .map((s) => {
        const inst = getInstrument(s.instrumentId);
        // 楽器に配置が複数ある場合（ピアノ・ギター等）は、同じ楽器名の項目が並んでも
        // どの配置(2列/3列/22キー等)の譜面か一覧だけで見分けられるよう配置名も添える
        const layoutLabel = inst.layouts.length > 1 ? ` ・ ${T(getLayout(inst, s.layoutId).labelKey, getLayout(inst, s.layoutId).labelFallback)}` : "";
        const tempoLabel = s.freeTiming ? T("music_freetiming_badge_label", "フリーテンポ") : `${s.bpm || DEFAULT_BPM}BPM ・ ${getTimeSignature(s.timeSignatureId).label}`;
        const displayName = escapeHtml(s.nameKey ? T(s.nameKey, s.name) : s.name);
        const nameOrRenameHtml =
          s.id === renamingScoreId
            ? `<input type="text" class="music-saved-rename-input" id="musicSavedRenameInput-${s.id}" value="${escapeHtml(s.nameKey ? T(s.nameKey, s.name) : s.name)}" maxlength="${MUSIC_SCORE_NAME_MAX_LENGTH}">`
            : `<div class="music-saved-name">${displayName}</div>`;
        const actionsHtml =
          s.id === renamingScoreId
            ? `
          <button onclick="submitRenameScore('${s.id}')">${T("music_rename_confirm", "確認")}</button>
          <button class="music-btn-secondary" onclick="cancelRenameScore()">${T("music_rename_cancel", "キャンセル")}</button>
        `
            : `
          <button onclick="loadScore('${s.id}')">${T("music_open", "開く")}</button>
          <button class="music-btn-secondary" onclick="duplicateScore('${s.id}')">${T("music_duplicate", "複製")}</button>
          <button class="music-btn-secondary" onclick="startRenameScore('${s.id}')">${T("music_rename", "名前を変更")}</button>
          <button class="music-btn-danger" onclick="deleteScore('${s.id}')">${T("music_delete", "削除")}</button>
        `;
        return `
    <div class="music-saved-item${s.id === currentScoreId ? " current" : ""}">
      <div class="music-saved-info">
        ${nameOrRenameHtml}
        <div class="music-saved-meta">${T("music_status_saved", "保存済み")} ・ ${T(inst.nameKey, inst.nameFallback)}${layoutLabel} ・ ${s.tokens.length}${T("music_note_count_suffix", "音")} ・ ${tempoLabel}</div>
        <div class="music-saved-meta music-saved-dates">${T("music_created_at", "作成")}: ${formatScoreLibraryDate(s.createdAt)} ・ ${T("music_updated_at", "更新")}: ${formatScoreLibraryDate(s.updatedAt)}</div>
      </div>
      <div class="music-saved-actions">
        ${actionsHtml}
      </div>
    </div>
  `;
      })
      .join("");
}

function startRenameScore(id) {
  renamingScoreId = id;
  renderSavedList();
  const input = document.getElementById(`musicSavedRenameInput-${id}`);
  if (input) {
    input.focus();
    input.select();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitRenameScore(id);
      if (e.key === "Escape") cancelRenameScore();
    });
  }
}

function cancelRenameScore() {
  renamingScoreId = null;
  renderSavedList();
}

function submitRenameScore(id) {
  const input = document.getElementById(`musicSavedRenameInput-${id}`);
  if (!input) return;
  if (renameScore(id, input.value)) {
    renamingScoreId = null;
  }
  renderSavedList();
}

// ライブラリの下書きカードから「保存する」を押した時のショートカット：
// モーダルを閉じ、曲名を入力する「準備」タブへ移動してから入力欄へフォーカスする
// （実際の保存操作自体はsaveCurrentAsScoreへの通常の導線をそのまま使う）
function openLibrarySaveDraftShortcut() {
  closeSavedListModal();
  setEditTab("prepare");
  const input = document.getElementById("musicScoreNameInput");
  if (input) input.focus();
}

function loadScore(id) {
  const score = savedScores.find((s) => s.id === id);
  if (!score) return;
  if (hasUnsavedChanges() && !confirm(T("music_confirm_open_discard", "編集中の譜面には保存していない変更があります。破棄して開きますか？"))) return;
  try {
    // 壊れたデータで現在編集中の譜面を巻き込まないよう、いったんローカル変数に
    // 組み立ててから検証し、問題なければまとめて現在の状態へ反映する
    const normalized = normalizeTokens(score.tokens);
    // 「元データに何らかの音符情報があったはずなのに、正規化後は1つも残らなかった」
    // 場合だけをエラー扱いにする。tokensが最初から空配列([])の譜面は、
    // 単に空の譜面として正常に読み込む（エラーではない）
    const hadSomeTokenData = score.tokens != null && (!Array.isArray(score.tokens) || score.tokens.length > 0);
    if (hadSomeTokenData && normalized.length === 0) {
      showToast(T("music_toast_load_failed", "読み込みに失敗しました。データが壊れている可能性があります"));
      return;
    }
    tokens = normalized;
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
    restoreLoopFromScore(score, tokens.length);
    selectedTokenIndex = null;
    humReviewIndexes = new Set();
    renderInstrumentSelector();
    renderLayoutSelector();
    renderInstrumentGrid();
    renderScoreMeta();
    renderFreeTimingUI();
    renderScoreDisplay();
    saveDraft();
    resetHistory();
    closeSavedListModal();
  } catch (e) {
    console.error("failed to load score", e);
    showToast(T("music_toast_load_failed", "読み込みに失敗しました。データが壊れている可能性があります"));
  }
}

function deleteScore(id) {
  const score = savedScores.find((s) => s.id === id);
  if (!score) return;
  const label = score.nameKey ? T(score.nameKey, score.name) : score.name;
  if (!confirm(T("music_confirm_delete_named", "「{name}」を削除しますか？", { name: label }))) return;
  const backup = savedScores;
  savedScores = savedScores.filter((s) => s.id !== id);
  if (!persistSavedScores()) {
    savedScores = backup;
    showToast(T("music_toast_delete_failed", "削除に失敗しました。もう一度お試しください"));
    return;
  }
  if (currentScoreId === id) currentScoreId = null;
  renderSavedList();
  showToast(T("music_toast_deleted", "削除しました"));
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
  const result = [];
  rawTokens.forEach((t) => {
    // 壊れたデータ（null・オブジェクトでない要素等）はページをクラッシュさせず読み飛ばす
    if (!t || typeof t !== "object") return;
    if (Array.isArray(t.notes)) {
      const notes = t.notes
        .filter((n) => n && typeof n.degree === "number")
        .map((n) => ({ degree: n.degree, accidental: n.accidental || null, octave: typeof n.octave === "number" ? n.octave : 0 }));
      if (typeof t.durationMs === "number") {
        result.push({ notes, durationMs: t.durationMs });
      } else {
        result.push({ notes, beats: typeof t.beats === "number" ? t.beats : 1 });
      }
      return;
    }
    if (typeof t.degree === "number") {
      result.push({ notes: [{ degree: t.degree, accidental: t.accidental || null, octave: typeof t.octave === "number" ? t.octave : 0 }], beats: typeof t.beats === "number" ? t.beats : 1 });
    }
  });
  return result;
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
  document.getElementById("musicUndoBtn").addEventListener("click", undoEdit);
  document.getElementById("musicRedoBtn").addEventListener("click", redoEdit);
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
    commitHistory();
  });
  document.getElementById("musicTimeSigSelect").addEventListener("change", (e) => {
    timeSignatureId = e.target.value;
    tempoWarningDismissed = true;
    renderScoreDisplay();
    saveDraftDebounced();
    commitHistory();
  });

  document.getElementById("musicRecordToggle").addEventListener("change", toggleRecording);
  document.getElementById("musicSemitoneToggle").addEventListener("change", toggleSemitone);
  document.getElementById("musicKeyLabelToggle").addEventListener("change", toggleKeyLabels);

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
