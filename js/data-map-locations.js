// 図鑑の location 文字列 -> マップ座標(%) のリンクデータ
// heartopia.guide/map のランドマーク名と直接対応が取れるものだけ先に登録済み。
// null のものは対応するマップ上の地点が未登録（今後、座標登録ツールで追加予定）。
// クエスト名（「」や『追加段階』を含むもの）は固定の場所を持たないため基本null。

const mapLocationLinks = {
  "「アクターバト」クエスト(追加段階)": null,
  "「スクリプター・ビー」クエスト(追加段階)": null,
  "「氷晶の蝶」クエスト(追加段階)": null,
  "そよ風の海": { x:50.3, y:78.85 }, // landmarks:Zephyr Sea
  "そよ風の海の海辺": { x:50.3, y:78.85 }, // landmarks:Zephyr Sea
  "エアーミツバチ虫寄せ装置": { x:50.5, y:23.0 }, // events:bait-the-insects
  "ガーパイククエスト(追加段階)": null,
  "クジラ海": { x:12.45, y:56.2 }, // landmarks:Whale Sea
  "クジラ海の海辺": { x:12.45, y:56.2 }, // landmarks:Whale Sea
  "ニシキコウチュウクエスト(追加段階)": null,
  "ブランクの頭上": { x:56.85, y:53.5 }, // npcs:blanc
  "ホーム": { x:50.65, y:31.2 }, // landmarks:Home Plots
  "ヤツガシラクエスト(追加段階)": null,
  "中心街": { x:49.85, y:51.5 }, // landmarks:Central Square
  "冬季採録クエスト(追加段階)": null,
  "川": null,
  "川(青魚影)": null,
  "川辺": null,
  "巣ごもりクエスト": { x:47.25, y:68.8 }, // events:nest-of-hundreds
  "巣ごもりクエスト(追加段階)": { x:47.25, y:68.8 }, // events:nest-of-hundreds
  "巨木の川": { x:60.95, y:65.85 }, // landmarks:Giantwood River
  "旧海": { x:54.35, y:8.1 }, // landmarks:Old Sea
  "旧海の海辺": { x:54.35, y:8.1 }, // landmarks:Old Sea
  "旧海・クジラ海": { x:33.4, y:32.15 }, // 旧海とクジラ海の中間点（境界域のため近似）
  "東海": { x:92.5, y:57.5 }, // landmarks:East Sea
  "東海の海辺": { x:92.5, y:57.5 }, // landmarks:East Sea
  "東海・そよ風の海": { x:71.4, y:68.18 }, // 東海とそよ風の海の中間点（境界域のため近似）
  "森の湖": { x:76.35, y:59.9 }, // landmarks:Forest Lake
  "森の湖畔": { x:76.35, y:59.9 }, // landmarks:Forest Lake
  "森林": { x:82.39, y:50.25 }, // landmarks:Forest
  "森林-コジカ塔": { x:82.9, y:35.45 }, // landmarks:Deer Tower
  "森林-コジカ塔(木のてっぺん)": { x:82.9, y:35.45 }, // landmarks:Deer Tower
  "森林-ジャンプステージ": { x:80.45, y:66.95 }, // landmarks:Jump Puzzle
  "森林-不思議な松林": { x:78.0, y:54.15 }, // landmarks:Spirit Oak Pine Forest
  "森林-森の島": { x:94.25, y:34.8 }, // landmarks:Forest Island
  "水辺": null,
  "浅水川": { x:64.5, y:36.1 }, // landmarks:Shallow River
  "浅海の魚群クエスト(追加段階)": null,
  "海": null,
  "海(青魚影)": null,
  "海辺": null,
  "海釣りクエスト": { x:44.3, y:73.25 }, // events:sea-fishing
  "海釣りクエスト(金魚影)": { x:44.3, y:73.25 }, // events:sea-fishing
  "温泉山": { x:48.82, y:21.39 }, // landmarks:Onsen Mountain
  "温泉山-温泉": { x:52.1, y:20.25 }, // landmarks:Onsen
  "温泉山-温泉(崖の上)": { x:52.1, y:20.25 }, // landmarks:Onsen
  "温泉山-火山湖": { x:40.35, y:19.7 }, // landmarks:Crater Lake
  "温泉山-石海岸の崖": { x:65.75, y:23.65 }, // landmarks:Stone Cliff
  "温泉山-遺跡": { x:34.3, y:17.5 }, // landmarks:Ruins
  "温泉山-遺跡(崖の上)": { x:34.3, y:17.5 }, // landmarks:Ruins
  "温泉山の湖": { x:51.6, y:25.85 }, // landmarks:Onsen Mountain Lake
  "温泉山の湖畔": { x:51.6, y:25.85 }, // landmarks:Onsen Mountain Lake
  "湖": null,
  "漁村": { x:46.43, y:72.13 }, // landmarks:Fishing Village
  "漁村-波止場": { x:43.6, y:68.7 }, // landmarks:Wharf
  "漁村-漁村広場": { x:46.65, y:68.25 }, // landmarks:Fishing Village Square
  "漁村-漁村東桟橋": { x:53.05, y:72.2 }, // landmarks:East Pier Fishing Village
  "漁村-灯台": { x:42.4, y:79.35 }, // landmarks:Lighthouse
  "特殊積み木虫クエスト": null,
  "特殊積み木鳥クエスト": null,
  "花畑": { x:21.61, y:59.63 }, // landmarks:Flower Field
  "花畑-クジラ山": { x:18.7, y:46.65 }, // landmarks:Whale Mountain
  "花畑-パープルビーチ": { x:23.15, y:73.4 }, // landmarks:Purple Light Beach
  "花畑-風車の花畑": { x:20.9, y:65.0 }, // landmarks:Windmill Flower Field
  "草原の湖": { x:23.7, y:53.45 }, // landmarks:Meadow Lake
  "草原の湖畔": { x:23.7, y:53.45 }, // landmarks:Meadow Lake
  "虫クエスト（追加段階）": null,
  "虫コイコイクエスト": null,
  "虫コイコイクエスト-遺跡(追加段階)": { x:34.3, y:17.5 }, // landmarks:Ruins
  "郊外": { x:41.4, y:55.15 }, // landmarks:Suburbs
  "郊外の湖": { x:50.45, y:60.35 }, // landmarks:Suburban Lake
  "郊外の湖畔": { x:50.45, y:60.35 }, // landmarks:Suburban Lake
  "郊外の湖街": { x:50.45, y:60.35 }, // landmarks:Suburban Lake
  "郊外湖畔": { x:50.45, y:60.35 }, // landmarks:Suburban Lake
  "霞川": { x:34.95, y:33.05 }, // landmarks:Rosy River
  "静川": { x:38.8, y:65.25 }, // landmarks:Tranquil River
};
