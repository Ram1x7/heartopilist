// js/data-sync.js
// 「データ同期」モーダル（index.html）用：サイト全体のlocalStorageデータを
// JSONファイルとして書き出し・読み込みする、手動バックアップ機能。
// サーバーには一切送信しない（ローカルのファイル入出力のみ）。

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

async function importAllData(event){
  const file = event.target.files[0];
  if(!file) return;

  if(!confirm(T("data_sync_confirm_overwrite","現在のデータをバックアップで上書きしますか？"))){
    event.target.value = "";
    return;
  }

  try{
    const text = await file.text();
    const backup = JSON.parse(text);

    if(!backup.version || !backup.data){
      alert(T("data_sync_invalid_format","バックアップファイルの形式が違います。"));
      event.target.value = "";
      return;
    }

    Object.keys(backup.data).forEach(key => {
      if(DATA_SYNC_EXCLUDED_KEYS.includes(key)) return;
      const value = backup.data[key];
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    });

    event.target.value = "";
    alert(T("data_sync_import_done","バックアップを読み込みました。"));
    location.reload();

  }catch(e){
    console.error(e);
    alert(T("data_sync_import_failed","読み込みに失敗しました。"));
    event.target.value = "";
  }
}

function closeDataSyncModal(){
  const modal = document.getElementById("dataSyncModal");
  if(modal) modal.style.display = "none";
}
