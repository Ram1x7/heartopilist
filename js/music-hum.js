// js/music-hum.js
// 「ハミングから作る」：録音またはアップロードした鼻歌から、Basic Pitch
// （Spotifyが公開しているオープンソースのピッチ検出モデル、TensorFlow.js版）を
// 使って音の高さ・発音タイミングを検出し、譜面（tokens）に自動変換する。
//
// TensorFlow.js本体とBasic Pitchのモデルはサイズが大きく、常時読み込むと
// エディター本体のオフライン起動が遅くなるため、この機能を実際に開いたときだけ
// CDNから遅延読み込みする（＝「ログイン不要・オフラインでも動く」というエディター
// 本体の価値はそのまま保たれる。この機能自体はネットワーク接続が必要）。
//
// 変換の要：検出したメロディの音域を、今選んでいる楽器・配置（例：ピアノ15鍵）が
// 実際に鳴らせる音域にオクターブ単位でまるごとシフトしてから、その楽器で実際に
// 選べる音（黒鍵の無い配置なら自然音だけ、など）に音ごとスナップする。
// キーの移動を利用者任せにせず自動で合わせるこの処理が、参考にした他アプリ
// （SkyScores等）との差別化ポイントになる。

// ── 音高変換（ここから下は音声処理を伴わない純粋な計算のみで、Node上でも単体テストできる） ──

// 度数・臨時記号・オクターブの組から絶対MIDI番号を求める（60 = 度数1・オクターブ0 = middle C相当）
function humNoteToMidi(note) {
  const semis = DEGREE_SEMITONES[note.degree] + (ACCIDENTAL_SEMITONE_OFFSET[note.accidental] || 0);
  return 60 + semis + note.octave * 12;
}

// 楽器・配置(layout)が実際に鳴らせる音の一覧を、MIDI番号の昇順で返す
// （22キーはchromaticGridも含めて半音まで対象にする。それ以外は自然音のみのgridで十分）
function buildHumInstrumentNoteMap(layout) {
  const grids = [layout.grid];
  if (layout.chromaticGrid) grids.push(layout.chromaticGrid);
  const byMidi = new Map();
  grids.forEach((rows) => {
    rows.forEach((row) => {
      row.forEach((note) => {
        const midi = humNoteToMidi(note);
        if (!byMidi.has(midi)) byMidi.set(midi, note);
      });
    });
  });
  return Array.from(byMidi.entries())
    .map(([midi, note]) => ({ midi, note }))
    .sort((a, b) => a.midi - b.midi);
}

// 指定したMIDI番号に一番近い、楽器で実際に選べる音を返す
function findClosestHumNote(midi, availableNotes) {
  let best = availableNotes[0];
  let bestDiff = Infinity;
  for (const entry of availableNotes) {
    const diff = Math.abs(entry.midi - midi);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = entry;
    }
  }
  return best.note;
}

// 検出したメロディ全体の音域の中心と、楽器が鳴らせる音域の中心が一致するように、
// オクターブ単位（12半音刻み）でシフトする量を求める
function computeHumOctaveShift(detectedMidis, availableNotes) {
  if (!detectedMidis.length || !availableNotes.length) return 0;
  const melodyMin = Math.min(...detectedMidis);
  const melodyMax = Math.max(...detectedMidis);
  const melodyCenter = (melodyMin + melodyMax) / 2;
  const instMin = availableNotes[0].midi;
  const instMax = availableNotes[availableNotes.length - 1].midi;
  const instCenter = (instMin + instMax) / 2;
  return Math.round((instCenter - melodyCenter) / 12) * 12;
}

// Basic Pitchのノートイベント[{pitchMidi, startTimeSeconds, durationSeconds}, ...]を
// tokens形式（[{notes:[{degree,accidental,octave}], beats}, ...]）に変換する。
// 音同士の間に一定以上の無音があれば休符を挟む
function convertHumNotesToTokens(noteEvents, layout, bpmValue, opts) {
  const options = opts || {};
  const minDurationSec = options.minDurationSec != null ? options.minDurationSec : 0.08; // 短すぎる誤検出を除外
  const restGapSec = options.restGapSec != null ? options.restGapSec : 0.12; // これより長い無音は休符にする

  const filtered = noteEvents
    .filter((n) => n.durationSeconds >= minDurationSec)
    .slice()
    .sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);

  if (!filtered.length) return [];

  const availableNotes = buildHumInstrumentNoteMap(layout);
  const detectedMidis = filtered.map((n) => Math.round(n.pitchMidi));
  const shift = computeHumOctaveShift(detectedMidis, availableNotes);

  const beatSec = 60 / bpmValue;
  const result = [];
  let cursorTime = filtered[0].startTimeSeconds;

  filtered.forEach((n) => {
    const gap = n.startTimeSeconds - cursorTime;
    if (gap >= restGapSec) {
      result.push({ notes: [], beats: snapBeatsToPreset(gap / beatSec) });
    }
    const shiftedMidi = Math.round(n.pitchMidi) + shift;
    const note = findClosestHumNote(shiftedMidi, availableNotes);
    result.push({
      notes: [{ degree: note.degree, accidental: note.accidental || null, octave: note.octave }],
      beats: snapBeatsToPreset(n.durationSeconds / beatSec),
    });
    cursorTime = Math.max(cursorTime, n.startTimeSeconds + n.durationSeconds);
  });

  return result;
}

// ── ここから下はブラウザAPI（マイク・CDN読み込み・TensorFlow.js）に依存する部分 ──
//
// @spotify/basic-pitch（npm実パッケージを取得して仕様を確認済み）は<script>タグで
// そのまま読み込めるUMD版を配布しておらず、CommonJS/ESM形式でのみ配布されている。
// そのためscriptタグでの読み込みではなく、jsdelivrの動的ESM変換（+esm）を使って
// import()で読み込む。これにより依存の@tensorflow/tfjs（basic-pitch側のpackage.json
// が要求するバージョン）もjsdelivr側で自動的に解決されるため、tfjs本体を別途
// 読み込む必要はない
const BASIC_PITCH_ESM_URL = "https://cdn.jsdelivr.net/npm/@spotify/basic-pitch@1.0.1/+esm";
// モデル本体はbasic-pitchのnpmパッケージに同梱されており（model/model.json +
// model/group1-shard1of1.bin）、jsdelivrはnpmパッケージ内の任意のファイルパスを
// そのまま配信できるため、このURLでモデルの重みファイルまで正しく取得できる
const BASIC_PITCH_MODEL_URL = "https://cdn.jsdelivr.net/npm/@spotify/basic-pitch@1.0.1/model/model.json";
// basic-pitchのevaluateModelは、この値と異なるサンプルレートの音声を渡すと
// 例外を投げて解析全体が失敗する（「解析に失敗しました」の主な原因だった）
const BASIC_PITCH_SAMPLE_RATE = 22050;

let basicPitchLoaded = false;
let basicPitchModel = null;
let basicPitchLib = null; // { BasicPitch, outputToNotesPoly, addPitchBendsToNoteEvents, noteFramesToTime }
let humRecorder = null;
let humRecordedChunks = [];
let humRecordingStartTime = 0;
let humRecordingTimer = null;
let humSourceBlob = null;

async function ensureBasicPitchLoaded(onStatus) {
  if (basicPitchLoaded) return;
  if (onStatus) onStatus(T("music_hum_progress_loading_model", "モデルを読み込み中…"));
  basicPitchLib = await import(/* webpackIgnore: true */ BASIC_PITCH_ESM_URL);
  basicPitchModel = new basicPitchLib.BasicPitch(BASIC_PITCH_MODEL_URL);
  basicPitchLoaded = true;
}

// decodeAudioDataは音声コンテナ（wav/mp3/m4a等）専用で、.mov等の動画コンテナを
// 直接デコードできず例外を投げることがある。その場合のフォールバックとして、
// <video>要素に実際に読み込ませてcaptureStream()で音声トラックだけを取り出し、
// MediaRecorderで録音し直すことで、ブラウザが再生さえできればコンテナ形式を
// 問わず音声データを取得できる（動画ファイルからの譜面生成に対応するため）
async function humExtractAudioFromVideoBlob(blob) {
  const url = URL.createObjectURL(blob);
  const video = document.createElement("video");
  try {
    video.src = url;
    video.muted = true; // ミュートしておけばユーザー操作なしの自動再生がブラウザに許可され、
    video.volume = 0; // captureStream()で取れる音声トラック自体には影響しない
    video.playsInline = true;
    video.preload = "auto";

    await new Promise((resolve, reject) => {
      video.addEventListener("loadedmetadata", resolve, { once: true });
      video.addEventListener("error", () => reject(new Error("video load failed")), { once: true });
    });

    const captureFn = video.captureStream || video.mozCaptureStream || video.webkitCaptureStream;
    if (!captureFn) throw new Error("captureStream not supported");
    const audioTracks = captureFn.call(video).getAudioTracks();
    if (!audioTracks.length) throw new Error("no audio track in video");

    const audioStream = new MediaStream(audioTracks);
    const recorder = new MediaRecorder(audioStream);
    const chunks = [];
    recorder.addEventListener("dataavailable", (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    });
    const stopped = new Promise((resolve) => recorder.addEventListener("stop", resolve, { once: true }));

    recorder.start();
    await video.play();
    await new Promise((resolve) => {
      video.addEventListener("ended", resolve, { once: true });
      // "ended"が発火しない環境向けの保険（動画の長さ+数秒で強制的に打ち切る）
      const durationMs = isFinite(video.duration) && video.duration > 0 ? video.duration * 1000 : 60000;
      setTimeout(resolve, durationMs + 3000);
    });
    recorder.stop();
    await stopped;

    return new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

// basic-pitchはモノラル・22050Hzの音声しか受け付けない（それ以外だと例外を投げる）。
// 録音・アップロードされる音声は端末やファイルによってサンプルレート・チャンネル数が
// バラバラなため、デコード後にOfflineAudioContextで必ずこの形式へリサンプルし直す
async function humDecodeAudioToBuffer(blob, onStatus) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let decoded;
  try {
    try {
      decoded = await ctx.decodeAudioData(await blob.arrayBuffer());
    } catch (directErr) {
      if (onStatus) onStatus(T("music_hum_progress_extracting_video", "動画から音声を取り出し中…"));
      const audioBlob = await humExtractAudioFromVideoBlob(blob);
      decoded = await ctx.decodeAudioData(await audioBlob.arrayBuffer());
    }
  } finally {
    ctx.close();
  }
  if (decoded.sampleRate === BASIC_PITCH_SAMPLE_RATE && decoded.numberOfChannels === 1) {
    return decoded;
  }
  const offlineCtx = new OfflineAudioContext(1, Math.ceil(decoded.duration * BASIC_PITCH_SAMPLE_RATE), BASIC_PITCH_SAMPLE_RATE);
  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  // ステレオ→モノラルへのダウンミックスは、宛先のチャンネル数がソースより少ない場合の
  // Web Audio API標準の自動ミックス（左右chを合成）でそのまま行われる
  source.connect(offlineCtx.destination);
  source.start(0);
  return await offlineCtx.startRendering();
}

// basic-pitchの標準的な使い方：evaluateModelにAudioBufferを渡し、フレーム単位の
// 予測結果(frames/onsets/contours)をコールバックで受け取り、basic-pitch側の
// ノート変換ユーティリティ（outputToNotesPoly→addPitchBendsToNoteEvents→
// noteFramesToTime）で実際の音符イベント列に変換する
async function runBasicPitchAnalysis(audioBuffer, onProgress) {
  const frames = [];
  const onsets = [];
  const contours = [];
  await basicPitchModel.evaluateModel(
    audioBuffer,
    (f, o, c) => {
      frames.push(...f);
      onsets.push(...o);
      contours.push(...c);
    },
    (percent) => {
      if (onProgress) onProgress(percent);
    }
  );
  const rawNotes = basicPitchLib.noteFramesToTime(
    basicPitchLib.addPitchBendsToNoteEvents(contours, basicPitchLib.outputToNotesPoly(frames, onsets, 0.25, 0.25, 5))
  );
  return rawNotes.map((n) => ({
    pitchMidi: n.pitchMidi,
    startTimeSeconds: n.startTimeSeconds,
    durationSeconds: n.durationSeconds,
  }));
}

// ── リアルタイム音程表示（録音中に今どの音を歌っているか確認できるようにする） ──
// Basic Pitchは録音全体をまとめて解析する重いモデルのため、録音中フレームごとの
// リアルタイムフィードバックには使えない。そのため録音中だけは別途AnalyserNodeで
// 波形を取り出し、自己相関法（autocorrelation）で基本周波数を推定する軽量な方式を
// 使う（Web上のチューナー実装で広く使われている定番の手法）。この結果は表示のみに
// 使い、実際の譜面変換は引き続きBasic Pitchの解析結果を使う
let humPitchAudioCtx = null;
let humPitchAnalyser = null;
let humPitchDataArray = null;
let humPitchRafId = null;

const HUM_PITCH_CHROMATIC_NAMES = ["ド", "ド♯", "レ", "レ♯", "ミ", "ファ", "ファ♯", "ソ", "ソ♯", "ラ", "ラ♯", "シ"];

// 時間波形データ(-1〜1)から自己相関により基本周波数(Hz)を推定する。
// 無音・ノイズと判断した場合は-1を返す
function detectPitchAutocorrelate(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // 音量が小さすぎる（無音・環境ノイズ）

  // 波形の前後にある無音に近い部分を切り詰めてから相関を取る
  const threshold = 0.2;
  let r1 = 0, r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) >= threshold) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) >= threshold) { r2 = SIZE - i; break; }
  }
  const trimmed = buf.slice(r1, r2);
  const n = trimmed.length;
  if (n < 8) return -1;

  const c = new Array(n).fill(0);
  for (let lag = 0; lag < n; lag++) {
    for (let i = 0; i < n - lag; i++) c[lag] += trimmed[i] * trimmed[i + lag];
  }

  // 最初の下り坂を飛ばして、そのあとの最大値（＝周期のずれ幅）を探す
  let d = 0;
  while (d < n - 1 && c[d] > c[d + 1]) d++;
  let maxVal = -1, maxPos = -1;
  for (let i = d; i < n; i++) {
    if (c[i] > maxVal) { maxVal = c[i]; maxPos = i; }
  }
  if (maxPos <= 0) return -1;

  // 前後の値との放物線補間で、サンプル単位より細かい精度を出す
  let period = maxPos;
  const x1 = c[maxPos - 1] ?? c[maxPos];
  const x2 = c[maxPos];
  const x3 = c[maxPos + 1] ?? c[maxPos];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) period -= b / (2 * a);

  return period > 0 ? sampleRate / period : -1;
}

// 周波数(Hz)を「音名＋オクターブ＋セント（半音の何%ずれているか）」に変換する。
// 譜面の度数（1=ド 2=レ…）は録音全体の音域が分かってから決まる（オクターブを
// まるごとシフトして楽器に合わせるため）ので、録音中はまだ度数化できない。
// そのため録音中の表示だけは絶対音名（A4=440Hz基準）で示す
function hzToJaNoteLabel(freq) {
  if (!freq || freq <= 0) return null;
  const midi = 69 + 12 * Math.log2(freq / 440);
  const rounded = Math.round(midi);
  const cents = Math.round((midi - rounded) * 100);
  return {
    name: HUM_PITCH_CHROMATIC_NAMES[((rounded % 12) + 12) % 12],
    octave: Math.floor(rounded / 12) - 1,
    cents,
    freq,
  };
}

function startHumPitchMonitor(stream) {
  try {
    humPitchAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = humPitchAudioCtx.createMediaStreamSource(stream);
    humPitchAnalyser = humPitchAudioCtx.createAnalyser();
    humPitchAnalyser.fftSize = 2048;
    humPitchDataArray = new Float32Array(humPitchAnalyser.fftSize);
    source.connect(humPitchAnalyser);
    document.getElementById("musicHumPitchRow").style.display = "";
    updateHumPitchDisplay();
  } catch (e) {
    // リアルタイム表示だけ諦めて、録音自体はそのまま続行する
    console.warn("hum pitch monitor init failed", e);
  }
}

function updateHumPitchDisplay() {
  if (!humPitchAnalyser) return;
  humPitchAnalyser.getFloatTimeDomainData(humPitchDataArray);
  const freq = detectPitchAutocorrelate(humPitchDataArray, humPitchAudioCtx.sampleRate);
  const el = document.getElementById("musicHumLivePitch");
  if (el) {
    if (freq > 0) {
      const info = hzToJaNoteLabel(freq);
      const centsLabel = info.cents >= 0 ? `+${info.cents}` : `${info.cents}`;
      el.textContent = `${info.name}${info.octave}（${Math.round(freq)}Hz ${centsLabel}¢）`;
      el.classList.remove("is-silent");
    } else {
      el.textContent = T("music_hum_live_pitch_silent", "（無音）");
      el.classList.add("is-silent");
    }
  }
  humPitchRafId = requestAnimationFrame(updateHumPitchDisplay);
}

function stopHumPitchMonitor() {
  if (humPitchRafId) cancelAnimationFrame(humPitchRafId);
  humPitchRafId = null;
  humPitchAnalyser = null;
  humPitchDataArray = null;
  if (humPitchAudioCtx) {
    humPitchAudioCtx.close();
    humPitchAudioCtx = null;
  }
  document.getElementById("musicHumPitchRow").style.display = "none";
}

// ── 録音（マイク） ──
async function startHumRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  humRecordedChunks = [];
  humRecorder = new MediaRecorder(stream);
  humRecorder.addEventListener("dataavailable", (e) => {
    if (e.data && e.data.size > 0) humRecordedChunks.push(e.data);
  });
  humRecorder.start();
  humRecordingStartTime = performance.now();
  updateHumRecordingUI(true);
  humRecordingTimer = setInterval(updateHumRecordingClock, 200);
  startHumPitchMonitor(stream);
}

function stopHumRecording() {
  return new Promise((resolve) => {
    if (!humRecorder) {
      resolve(null);
      return;
    }
    const recorder = humRecorder;
    recorder.addEventListener("stop", () => {
      clearInterval(humRecordingTimer);
      stopHumPitchMonitor();
      const blob = new Blob(humRecordedChunks, { type: recorder.mimeType || "audio/webm" });
      resolve(blob);
    });
    recorder.stop();
    recorder.stream.getTracks().forEach((t) => t.stop());
    humRecorder = null;
  });
}

function updateHumRecordingUI(isRecording) {
  document.getElementById("musicHumRecordingRow").style.display = isRecording ? "" : "none";
  document.getElementById("musicHumRecordBtn").style.display = isRecording ? "none" : "";
}

function updateHumRecordingClock() {
  const sec = Math.floor((performance.now() - humRecordingStartTime) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const el = document.getElementById("musicHumRecordingTime");
  if (el) el.textContent = `${m}:${String(s).padStart(2, "0")}`;
}

// ── モーダルの開閉・操作結線 ──
function openHumModal() {
  humSourceBlob = null;
  document.getElementById("musicHumError").textContent = "";
  document.getElementById("musicHumRecordingRow").style.display = "none";
  document.getElementById("musicHumFileRow").style.display = "none";
  document.getElementById("musicHumProgressRow").style.display = "none";
  document.getElementById("musicHumRecordBtn").style.display = "";
  document.getElementById("musicHumFileInput").value = "";
  document.getElementById("musicHumAnalyzeBtn").disabled = true;
  document.getElementById("musicHumModal").style.display = "block";
}

function closeHumModal() {
  if (humRecorder) stopHumRecording();
  document.getElementById("musicHumModal").style.display = "none";
}

async function onHumRecordClick() {
  try {
    await startHumRecording();
  } catch (e) {
    document.getElementById("musicHumError").textContent = T(
      "music_hum_mic_error",
      "マイクを使用できませんでした。ブラウザの設定を確認するか、音声ファイルをアップロードしてください"
    );
  }
}

async function onHumStopClick() {
  const blob = await stopHumRecording();
  updateHumRecordingUI(false);
  if (blob && blob.size > 0) {
    humSourceBlob = blob;
    document.getElementById("musicHumFileRow").style.display = "";
    document.getElementById("musicHumFileName").textContent = T("music_hum_recorded_label", "録音した音声");
    document.getElementById("musicHumAnalyzeBtn").disabled = false;
  }
}

function onHumFileChosen(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  humSourceBlob = file;
  document.getElementById("musicHumFileRow").style.display = "";
  document.getElementById("musicHumFileName").textContent = file.name;
  document.getElementById("musicHumAnalyzeBtn").disabled = false;
}

async function onHumAnalyzeClick() {
  if (!humSourceBlob) return;
  const errorEl = document.getElementById("musicHumError");
  const progressRow = document.getElementById("musicHumProgressRow");
  const progressFill = document.getElementById("musicHumProgressFill");
  const progressLabel = document.getElementById("musicHumProgressLabel");
  const analyzeBtn = document.getElementById("musicHumAnalyzeBtn");
  errorEl.textContent = "";
  progressRow.style.display = "";
  progressFill.style.width = "0%";
  analyzeBtn.disabled = true;

  const setProgress = (pct, label) => {
    if (typeof pct === "number") progressFill.style.width = `${Math.round(pct * 100)}%`;
    if (label) progressLabel.textContent = label;
  };

  try {
    await ensureBasicPitchLoaded((label) => setProgress(0, label));
    setProgress(0.1, T("music_hum_progress_decoding", "音声を解析用に変換中…"));
    const audioBuffer = await humDecodeAudioToBuffer(humSourceBlob, (label) => setProgress(0.1, label));
    setProgress(0.2, T("music_hum_progress_detecting", "音の高さを検出中…"));
    const noteEvents = await runBasicPitchAnalysis(audioBuffer, (p) =>
      setProgress(0.2 + p * 0.7, T("music_hum_progress_detecting", "音の高さを検出中…"))
    );
    setProgress(0.95, T("music_hum_progress_converting", "譜面に変換中…"));

    const inst = getInstrument(currentInstrumentId);
    const layout = getLayout(inst, currentLayoutId);
    const newTokens = convertHumNotesToTokens(noteEvents, layout, bpm);

    if (!newTokens.length) {
      errorEl.textContent = T("music_hum_no_notes", "音を検出できませんでした。もう少しはっきり・ゆっくり歌ってみてください");
      analyzeBtn.disabled = false;
      progressRow.style.display = "none";
      return;
    }

    tokens = newTokens;
    resetLoop();
    // 認識精度が完璧ではないため、変換直後の音は全て「未確認」としてマークし、
    // 編集モードでタップして手直しした音から順にマークが消えるようにする
    humReviewIndexes = new Set(newTokens.map((_, i) => i));
    selectedTokenIndex = null;
    setPageMode("edit");
    renderScoreDisplay();
    saveDraftDebounced();
    closeHumModal();
    showToast(T("music_hum_done_toast", "譜面に変換しました。金色の枠の音は自動検出です。タップして手直しできます"));
  } catch (e) {
    console.error(e);
    errorEl.textContent = T("music_hum_analyze_error", "解析に失敗しました。別の音声で試すか、しばらくしてからもう一度お試しください");
    analyzeBtn.disabled = false;
    progressRow.style.display = "none";
  }
}

function bindHumControls() {
  document.getElementById("musicHumOpenBtn").addEventListener("click", openHumModal);
  document.getElementById("musicHumCloseBtn").addEventListener("click", closeHumModal);
  document.getElementById("musicHumRecordBtn").addEventListener("click", onHumRecordClick);
  document.getElementById("musicHumStopBtn").addEventListener("click", onHumStopClick);
  document.getElementById("musicHumFileInput").addEventListener("change", onHumFileChosen);
  document.getElementById("musicHumAnalyzeBtn").addEventListener("click", onHumAnalyzeClick);
}
