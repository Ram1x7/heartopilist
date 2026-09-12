// 図鑑の location 文字列 -> マップ座標(%) のリンクデータ
// heartopia.guide/map のランドマーク名と直接対応が取れるものだけ先に登録済み。
// null のものは対応するマップ上の地点が未登録（今後、座標登録ツールで追加予定）。
// クエスト名（「」や『追加段階』を含むもの）は固定の場所を持たないため基本null。

const mapLocationLinks = {
  "「アクターバト」クエスト(追加段階)": null,
  "「スクリプター・ビー」クエスト(追加段階)": null,
  "「氷晶の蝶」クエスト(追加段階)": null,
  "そよ風の海": { x:48.69, y:79.15 }, // landmarks:Zephyr Sea
  "そよ風の海の海辺": { x:48.69, y:79.15 }, // landmarks:Zephyr Sea
  "エアーミツバチ虫寄せ装置": { x:50.5, y:23.0 }, // events:bait-the-insects
  "ガーパイククエスト(追加段階)": null,
  "クジラ海": { x:8.4, y:53.5 }, // landmarks:Whale Sea
  "クジラ海の海辺": { x:8.4, y:53.5 }, // landmarks:Whale Sea
  "ニシキコウチュウクエスト(追加段階)": null,
  "ブランクの頭上": { x:56.85, y:53.5 }, // npcs:blanc
  "ホーム": { x:30.09, y:52.14 }, // landmarks:Home Plots
  "ヤツガシラクエスト(追加段階)": null,
  "中心街": { x:49.31, y:53.33 }, // landmarks:Central Square
  "冬季採録クエスト(追加段階)": null,
  "川": null,
  "川辺": null,
  "巣ごもりクエスト": { x:47.25, y:68.8 }, // events:nest-of-hundreds
  "巣ごもりクエスト(追加段階)": { x:47.25, y:68.8 }, // events:nest-of-hundreds
  "巨木の川": { x:61.95, y:66.81 }, // landmarks:Giantwood River
  "旧海": { x:50, y:5 }, // landmarks:Old Sea
  "旧海の海辺": { x:50, y:5 }, // landmarks:Old Sea
  "旧海・クジラ海": { x:32.0, y:27.22 }, // 旧海とクジラ海の中間点（境界域のため近似）
  "東海": { x:97.7, y:52.42 }, // landmarks:East Sea
  "東海の海辺": { x:97.7, y:52.42 }, // landmarks:East Sea
  "東海・そよ風の海": { x:70.36, y:63.67 }, // 東海とそよ風の海の中間点（境界域のため近似）
  "森の湖": { x:76.1, y:49.66 }, // landmarks:Forest Lake
  "森の湖畔": { x:76.1, y:49.66 }, // landmarks:Forest Lake
  "森林": { x:79.4, y:51.5 }, // landmarks:Forest
  "森林-コジカ塔": { x:81.45, y:36.0 }, // landmarks:Deer Tower
  "森林-コジカ塔(木のてっぺん)": { x:81.45, y:36.0 }, // landmarks:Deer Tower
  "森林-ジャンプステージ": { x:77.78, y:68.92 }, // landmarks:Jump Puzzle
  "森林-不思議な松林": { x:80.11, y:53.21 }, // landmarks:Spirit Oak Pine Forest
  "森林-森の島": { x:93.82, y:33.8 }, // landmarks:Forest Island
  "水辺": null,
  "浅水川": { x:66.86, y:33.88 }, // landmarks:Shallow River
  "浅海の魚群クエスト(追加段階)": null,
  "海": null,
  "海辺": null,
  "海釣りクエスト": { x:44.3, y:73.25 }, // events:sea-fishing
  "温泉山": { x:49.1, y:19.8 }, // landmarks:Onsen Mountain
  "温泉山-温泉": { x:52.41, y:21.49 }, // landmarks:Onsen
  "温泉山-温泉(崖の上)": { x:52.41, y:21.49 }, // landmarks:Onsen
  "温泉山-火山湖": { x:38.38, y:17.93 }, // landmarks:Crater Lake
  "温泉山-石海岸の崖": { x:61.88, y:20.57 }, // landmarks:Stone Cliff
  "温泉山-遺跡": { x:29.3, y:18.25 }, // landmarks:Ruins
  "温泉山-遺跡(崖の上)": { x:29.3, y:18.25 }, // landmarks:Ruins
  "温泉山の湖": { x:53.76, y:25.99 }, // landmarks:Onsen Mountain Lake
  "温泉山の湖畔": { x:53.76, y:25.99 }, // landmarks:Onsen Mountain Lake
  "湖": null,
  "漁村": { x:46.5, y:67.7 }, // landmarks:Fishing Village
  "漁村-波止場": { x:41.4, y:68.09 }, // landmarks:Wharf
  "漁村-漁村広場": { x:51.66, y:69.53 }, // landmarks:Fishing Village Square
  "漁村-漁村東桟橋": { x:60.94, y:73.62 }, // landmarks:East Pier Fishing Village
  "漁村-灯台": { x:38.69, y:78 }, // landmarks:Lighthouse
  "特殊積み木虫クエスト": null,
  "特殊積み木鳥クエスト": null,
  "花畑": { x:18.5, y:53.1 }, // landmarks:Flower Field
  "花畑-クジラ山": { x:18.81, y:41.47 }, // landmarks:Whale Mountain
  "花畑-パープルビーチ": { x:21.6, y:72.75 }, // landmarks:Purple Light Beach
  "花畑-風車の花畑": { x:18.7, y:63.33 }, // landmarks:Windmill Flower Field
  "草原の湖": { x:22.4, y:53.86 }, // landmarks:Meadow Lake
  "草原の湖畔": { x:22.4, y:53.86 }, // landmarks:Meadow Lake
  "虫クエスト（追加段階）": null,
  "虫コイコイクエスト": null,
  "虫コイコイクエスト-遺跡(追加段階)": { x:29.3, y:18.25 }, // landmarks:Ruins
  "郊外": { x:36, y:56 }, // landmarks:Suburbs
  "郊外の湖": { x:50.08, y:59.76 }, // landmarks:Suburban Lake
  "郊外の湖畔": { x:50.08, y:59.76 }, // landmarks:Suburban Lake
  "郊外の湖街": { x:50.08, y:59.76 }, // landmarks:Suburban Lake
  "郊外湖畔": { x:50.08, y:59.76 }, // landmarks:Suburban Lake
  "霞川": { x:31.71, y:33.26 }, // landmarks:Rosy River
  "静川": { x:36.25, y:67.92 }, // landmarks:Tranquil River
};
