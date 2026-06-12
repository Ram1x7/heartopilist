// 野鳥
const birdData = [
{
 name:"コマドリ",
 level:1,
 price:7,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"中心街",
 img:"birds/001.PNG"
},
{
 name:"シジュウカラ",
 level:1,
 price:7,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山",
 img:"birds/002.PNG"
},
{
 name:"ミソサザイ",
 level:1,
 price:7,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"森林",
 img:"birds/003.PNG"
},
{
 name:"ウソ",
 level:1,
 price:7,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"郊外",
 img:"birds/004.PNG"
},
{
 name:"ズアオアトリ",
 level:1,
 price:7,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"花畑",
 img:"birds/005.PNG"
},
{
 name:"ルリコンゴウインコ",
 level:1,
 price:7,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"巣ごもりクエスト",
 img:"birds/006.PNG"
},
{
 name:"ヒメモリバト",
 level:1,
 price:10,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"中心街",
 img:"birds/007.PNG"
},
{
 name:"シラコバト",
 level:1,
 price:10,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"ホーム",
 img:"birds/008.PNG"
},
{
 name:"ソデグロバト",
 level:1,
 price:10,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"漁村",
 img:"birds/009.PNG"
},
{
 name:"オオフラミンゴ",
 level:1,
 price:15,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"水辺",
 img:"birds/010.PNG"
},
{
 name:"インドクジャク",
 level:1,
 price:10,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"巣ごもりクエスト",
 img:"birds/011.PNG"
},
{
 name:"マガモ",
 level:1,
 price:12,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"湖",
 img:"birds/012.PNG"
},
{
 name:"エナガ",
 level:2,
 price:2,
 star5:"全天気 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"ブランクの頭上",
 img:"birds/013.PNG"
},
{
 name:"ゴジュウカラ",
 level:2,
 price:10,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"漁村",
 img:"birds/014.PNG"
},
{
 name:"ヒゲガラ",
 level:2,
 price:10,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山",
 img:"birds/015.PNG"
},
{
 name:"ズアカモズ",
 level:2,
 price:10,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"郊外",
 img:"birds/016.PNG"
},
{
 name:"ウォンガバト",
 level:2,
 price:15,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"森林",
 img:"birds/017.PNG"
},
{
 name:"コアオバト",
 level:2,
 price:15,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"花畑",
 img:"birds/018.PNG"
},
{
 name:"ヒドリガモ",
 level:2,
 price:17,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"川",
 img:"birds/019.PNG"
},
{
 name:"カモメ",
 level:2,
 price:17,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"海辺",
 img:"birds/020.PNG"
},
{
 name:"ニシコウライウグイス",
 level:3,
 price:15,
 star5:"虹 / 6〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"ホーム",
 img:"birds/021.PNG"
},
{
 name:"カノコスズメ",
 level:3,
 price:10,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"漁村-灯台",
 img:"birds/022.PNG"
},
{
 name:"シマエナガ",
 level:3,
 price:10,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"森林-ジャンプステージ",
 img:"birds/023.PNG"
},
{
 name:"ベニコンゴウインコ",
 level:3,
 price:10,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"巣ごもりクエスト",
 img:"birds/024.PNG"
},
{
 name:"アカツクシガモ",
 level:3,
 price:17,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"郊外の湖街",
 img:"birds/025.PNG"
},
{
 name:"ケワタガモ",
 level:3,
 price:17,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"川",
 img:"birds/026.PNG"
},
{
 name:"オデュアンカモメ",
 level:3,
 price:17,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"クジラ海の海辺",
 img:"birds/027.PNG"
},
{
 name:"ヨーロッパヒメウ",
 level:3,
 price:17,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"海",
 img:"birds/028.PNG"
},
{
 name:"タイリクハクセキレイ",
 level:4,
 price:15,
 star5:"虹 / 6〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"花畑-パープルビーチ",
 img:"birds/029.PNG"
},
{
 name:"ハイズキンダルマエナガ",
 level:4,
 price:15,
 star5:"虹 / 6〜0",
 weather:["晴れ","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"漁村-漁村広場",
 img:"birds/030.PNG"
},
{
 name:"ギンザンマシコ",
 level:4,
 price:15,
 star5:"虹 / 6〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"森林-森の島",
 img:"birds/031.PNG"
},
{
 name:"フウチョウモドキ",
 level:4,
 price:15,
 star5:"虹 / 6〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"森林-不思議な松林",
 img:"birds/032.PNG"
},
{
 name:"キンミノヒメアオバト",
 level:4,
 price:17,
 star5:"雨・虹 /全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"花畑-風車の花畑",
 img:"birds/033.PNG"
},
{
 name:"ギンケイ",
 level:4,
 price:17,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山-遺跡",
 img:"birds/034.PNG"
},
{
 name:"ミコアイサ",
 level:4,
 price:22,
 star5:"虹 / 6〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"森の湖",
 img:"birds/035.PNG"
},
{
 name:"キバラメジロハエトリ",
 level:5,
 price:15,
 star5:"虹 / 6〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"漁村-波止場",
 img:"birds/036.PNG"
},
{
 name:"ヨーロッパハチクイ",
 level:5,
 price:22,
 star5:"虹 / 6〜0",
 weather:["雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山の湖畔",
 img:"birds/037.PNG"
},
{
 name:"ヒワコンゴウインコ",
 level:5,
 price:15,
 star5:"虹 / 6〜0",
 weather:["晴れ","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"巣ごもりクエスト",
 img:"birds/038.PNG"
},
{
 name:"オリーブバト",
 level:5,
 price:27,
 star5:"虹 / 6〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山-温泉",
 img:"birds/039.PNG"
},
{
 name:"コフラミンゴ",
 level:5,
 price:27,
 star5:"虹 / 6〜0",
 weather:["雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"森の湖畔",
 img:"birds/040.PNG"
},
{
 name:"クロアジサシ",
 level:5,
 price:22,
 star5:"虹 / 6〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"旧海の海辺",
 img:"birds/041.PNG"
},
{
 name:"シメ",
 level:6,
 price:15,
 star5:"虹 / 6〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山-火山湖",
 img:"birds/042.PNG"
},
{
 name:"キンムネバト",
 level:6,
 price:27,
 star5:"虹 / 6〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"漁村-漁村東桟橋",
 img:"birds/043.PNG"
},
{
 name:"チシマウガラス",
 level:6,
 price:22,
 star5:"虹 / 6〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"旧海・クジラ海",
 img:"birds/044.PNG"
},
{
 name:"トラフズク",
 level:6,
 price:47,
 star5:"虹 / 6〜12, 18〜0",
 weather:["晴れ","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山-石海岸の崖",
 img:"birds/045.PNG"
},
{
 name:"ルリガラ",
 level:7,
 price:22,
 star5:"虹 / 6〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"花畑-風車の花畑",
 img:"birds/046.PNG"
},
{
 name:"スミレコンゴウインコ",
 level:7,
 price:22,
 star5:"虹 / 18〜0",
 weather:["雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"巣ごもりクエスト",
 img:"birds/047.PNG"
},
{
 name:"ボタンバト",
 level:7,
 price:27,
 star5:"虹 / 6〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"郊外",
 img:"birds/048.PNG"
},
{
 name:"アジサシ",
 level:7,
 price:35,
 star5:"虹 / 6〜18",
 weather:["虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"東海の海辺",
 img:"birds/049.PNG"
},
{
 name:"チョウゲンボウ",
 level:7,
 price:47,
 star5:"虹 / 6〜0",
 weather:["晴れ","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"森林-コジカ塔(木のてっぺん)",
 img:"birds/050.PNG"
},
{
 name:"ルリツグミ",
 level:8,
 price:30,
 star5:"虹 / 18〜0",
 weather:["雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"郊外",
 img:"birds/051.PNG"
},
{
 name:"ベニヒワ",
 level:8,
 price:22,
 star5:"虹 / 12〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"森林-不思議な松林",
 img:"birds/052.PNG"
},
{
 name:"モモイロバト",
 level:8,
 price:27,
 star5:"虹 / 12〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"花畑-クジラ山",
 img:"birds/053.PNG"
},
{
 name:"ハヤブサ",
 level:8,
 price:65,
 star5:"虹 / 18〜0 (6〜12？)",
 weather:["雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山-温泉(崖の上)",
 img:"birds/054.PNG"
},
{
 name:"ナナイロフウキンチョウ",
 level:9,
 price:30,
 star5:"虹 / 18〜0",
 weather:["虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"郊外",
 img:"birds/055.PNG"
},
{
 name:"ベニイロフラミンゴ",
 level:9,
 price:55,
 star5:"虹 / 12〜18",
 weather:["虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"花畑-パープルビーチ",
 img:"birds/056.PNG"
},
{
 name:"マクジャク",
 level:9,
 price:37,
 star5:"虹 / 12〜18 (18〜0？)",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"巣ごもりクエスト(追加段階)",
 img:"birds/057.PNG"
},
{
 name:"カオジロオタテガモ",
 level:9,
 price:45,
 star5:"虹 / 12〜18",
 weather:["雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山の湖",
 img:"birds/058.PNG"
},
{
 name:"インペリアルシャグ",
 level:9,
 price:45,
 star5:"虹 / 12〜18",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"東海・そよ風の海",
 img:"birds/059.PNG"
},
{
 name:"アゾレスウソ",
 level:10,
 price:30,
 star5:"虹 / 18〜0",
 weather:["虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"漁村-灯台",
 img:"birds/060.PNG"
},
{
 name:"ロクショウヒタキ",
 level:10,
 price:30,
 star5:"虹 / 18〜0",
 weather:["虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"森林-ジャンプステージ",
 img:"birds/061.PNG"
},
{
 name:"アカアシチョウゲンボウ",
 level:10,
 price:65,
 star5:"虹 / 18〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山-遺跡(崖の上)",
 img:"birds/062.PNG"
},
{
 name:"ワシミミズク",
 level:10,
 price:65,
 star5:"虹 / 18〜0",
 weather:["雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"森林-コジカ塔(木のてっぺん)",
 img:"birds/063.PNG"
}, 
{
 name:"コムクドリ",
 level:11,
 star5:"虹 / 18〜0",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"花畑-風車の花畑",
 img:"images/000.PNG"
}, 
{
 name:"クロヒゲバト",
 level:11,
 star5:"虹 / 12〜0",
 weather:["晴れ","虹"],
 time:["12-18","18-0","0-6"],
 location:"郊外",
 img:"images/000.PNG"
}, 
{
 name:"シロクジャク",
 level:11,
 star5:"虹 / 12〜18",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"巣ごもりクエスト(追加段階)",
 img:"images/000.PNG"
}, 
{
 name:"トモエガモ",
 level:11,
 star5:"虹 / 12〜18",
 weather:["虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山-火山湖",
 img:"images/000.PNG"
}, 
{
 name:"インカアジサシ",
 level:11,
 star5:"虹 / 6〜18",
 weather:["雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"旧海の海辺",
 img:"images/000.PNG"
},
{
 name:"ニシツノメドリ",
 level:12,
 star5:"虹 / 6〜12",
 weather:["晴れ","虹"],
 time:["6-12","18-0","0-6"],
 location:"クジラ海の海辺",
 img:"images/000.PNG"
},
{
 name:"フヨウチョウ",
 level:12,
 star5:"虹 / 18〜0",
 weather:["虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山",
 img:"images/000.PNG"
},
{
 name:"アオアシカツオドリ",
 level:12,
 star5:"虹 / 12〜18",
 weather:["雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"そよ風の海の海辺",
 img:"images/000.PNG"
},
{
 name:"シロフクロウ",
 level:12,
 star5:"虹 / 18〜0",
 weather:["晴れ","雨","虹"],
 time:["12-18","18-0"],
 location:"森林-不思議な松林",
 img:"images/000.PNG"
},
{
 name:"オオハクチョウ",
 level:13,
 star5:"虹 / 12〜18",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"郊外の湖",
 img:"images/000.PNG"
},
{
 name:"コクチョウ",
 level:13,
 star5:"虹 / 12〜18",
 weather:["雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"郊外の湖",
 img:"images/000.PNG"
},
{
 name:"クロクジャク",
 level:13,
 star5:"虹 / 12〜18",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"巣ごもりクエスト(追加段階)",
 img:"images/000.PNG"
},
{
 name:"ナベコウ",
 level:14,
 star5:"虹 / 12〜18",
 weather:["晴れ","雨","虹"],
 time:["12-18","18-0","0-6"],
 location:"草原の湖",
 img:"images/000.PNG"
},
{
 name:"メガネフクロウ",
 level:14,
 star5:"虹 / 6〜12",
 weather:["晴れ","雨","虹"],
 time:["6-12","0-6"],
 location:"森林-ジャンプステージ",
 img:"images/000.PNG"
},
{
 name:"積み木スズメ(ピンク)",
 level:1,
 price:10,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山-石海岸の崖",
 img:"birds/1001.PNG"
},
{
 name:"積み木スズメ(青)",
 level:1,
 price:10,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山-温泉",
 img:"birds/1002.PNG"
},
{
 name:"積み木スズメ(緑)",
 level:1,
 price:10,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山-火山湖",
 img:"birds/1003.PNG"
},
{
 name:"積み木スズメ(紫)",
 level:1,
 price:10,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"温泉山-遺跡",
 img:"birds/1004.PNG"
},
{
 name:"積み木スズメ(虹)",
 level:1,
 price:15,
 star5:"雨・虹 / 全時間",
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"特殊積み木鳥クエスト",
 img:"birds/1005.PNG"
}
 // ここに追加していく
].map((c,i) => ({
  ...c,
  type:"bird",
  bookIndex:i
}));
