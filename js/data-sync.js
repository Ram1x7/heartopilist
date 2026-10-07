// js/data-sync.js
// 「バックアップ・端末移行」モーダル（index.html）用：サイト全体のlocalStorageデータを
// JSONファイルとして書き出し・読み込みする、手動バックアップ機能。
// 自動的な端末間同期は行わない（サーバーには一切送信しない、ローカルのファイル入出力のみ）。

// 端末固有のため同期対象から除外するキー
// fcmToken: Firebase Cloud Messagingの端末別登録トークン。他端末に持ち込むと
//           通知の送信先が食い違うため対象外にする。
const DATA_SYNC_EXCLUDED_KEYS = ["fcmToken"];

function exportAllData(){
  const data = {};

  for(const key of Object.keys(localStorage)){
    if(DATA_SYNC_EXCLUDED_KEYS.includes(key)) continue;
    const raw = localStorage.getItem(key);
    try{
      data[key] = JSON.parse(raw);
    }catch(e){
      data[key] = raw;
    }
  }

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `hatopi-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// 読み込み待ちのバックアップ内容（確認モーダルでユーザーが選択するまで保持する）
let _pendingImportBackup = null;

// このアプリが対応しているバックアップファイルのバージョン
// （exportAllData()が書き出すversionと一致。将来形式を変える場合はここに追加していく）
const DATA_SYNC_SUPPORTED_VERSIONS = [1];

function isValidBackupStructure(backup){
  return (
    backup !== null &&
    typeof backup === "object" &&
    DATA_SYNC_SUPPORTED_VERSIONS.includes(backup.version) &&
    backup.data !== null &&
    typeof backup.data === "object" &&
    !Array.isArray(backup.data)
  );
}

// ファイル選択時：まず形式・対応バージョン・必須構造を検証する。
// ここで不正と判定した場合は、確認すら出さずに既存データを一切変更しない
async function importAllData(event){
  const file = event.target.files[0];
  if(!file) return;

  let backup;
  try{
    const text = await file.text();
    backup = JSON.parse(text);
  }catch(e){
    console.error(e);
    alert(T("data_sync_invalid_format","バックアップファイルの形式が違います。"));
    event.target.value = "";
    return;
  }

  if(!isValidBackupStructure(backup)){
    alert(T("data_sync_invalid_format","バックアップファイルの形式が違います。"));
    event.target.value = "";
    return;
  }

  // ファイル自体は妥当と確認できたので、ここで初めて上書きの確認を出す
  _pendingImportBackup = backup;
  event.target.value = "";
  document.getElementById("dataSyncImportConfirmModal").style.display = "block";
}

// 確認モーダル：「バックアップしてから読み込む」
function confirmImportWithBackup(){
  if(!_pendingImportBackup) return;
  exportAllData();
  applyPendingImport();
}

// 確認モーダル：「そのまま読み込む」
function confirmImportProceed(){
  if(!_pendingImportBackup) return;
  applyPendingImport();
}

// 確認モーダル：「キャンセル」。既存データは一切変更しない
function cancelPendingImport(){
  _pendingImportBackup = null;
  document.getElementById("dataSyncImportConfirmModal").style.display = "none";
}

function applyPendingImport(){
  const backup = _pendingImportBackup;
  if(!backup) return;

  Object.keys(backup.data).forEach(key => {
    if(DATA_SYNC_EXCLUDED_KEYS.includes(key)) return;
    const value = backup.data[key];
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  });

  _pendingImportBackup = null;
  document.getElementById("dataSyncImportConfirmModal").style.display = "none";
  alert(T("data_sync_import_done","バックアップを読み込みました。"));
  location.reload();
}

function closeDataSyncModal(){
  const modal = document.getElementById("dataSyncModal");
  if(modal) modal.style.display = "none";
}
