// マップデータ（heartopia.guide/map より許可を得て移植、座標はmap.webp基準の%位置）
// x/y は画像に対する左上原点のパーセント位置（0-100）

const mapImage = "images/map/map.webp";

const mapLandmarks = [
  { key:"Forest Island", name:"森の島", nameI18n:{"ja":"森の島","en":"Forest Island","zh-CN":"","zh-TW":"","ko":"","th":""}, x:93.96, y:33.72 },
  { key:"Lighthouse", name:"灯台", nameI18n:{"ja":"灯台","en":"Lighthouse","zh-CN":"","zh-TW":"","ko":"","th":""}, x:38.4, y:76.17 },
  { key:"Purple Light Beach", name:"パープルビーチ", nameI18n:{"ja":"パープルビーチ","en":"Purple Light Beach","zh-CN":"","zh-TW":"","ko":"","th":""}, x:21.97, y:73.16 },
  { key:"Suburbs", name:"郊外", nameI18n:{"ja":"郊外","en":"Suburbs","zh-CN":"","zh-TW":"","ko":"","th":""}, x:36, y:56 },
  { key:"Stone Cliff", name:"石海岸の崖", nameI18n:{"ja":"石海岸の崖","en":"Stone Cliff","zh-CN":"","zh-TW":"","ko":"","th":""}, x:58.47, y:17.97 },
  { key:"Whale Mountain", name:"クジラ山", nameI18n:{"ja":"クジラ山","en":"Whale Mountain","zh-CN":"","zh-TW":"","ko":"","th":""}, x:19.63, y:39.54 },
  { key:"Windmill Flower Field", name:"風車の花畑", nameI18n:{"ja":"風車の花畑","en":"Windmill Flower Field","zh-CN":"","zh-TW":"","ko":"","th":""}, x:19.78, y:60.25 },
  { key:"Spirit Oak Pine Forest", name:"不思議な松林", nameI18n:{"ja":"不思議な松林","en":"Spirit Oak Pine Forest","zh-CN":"","zh-TW":"","ko":"","th":""}, x:80.88, y:51.66 },
  { key:"Deer Tower", name:"コジカ塔", nameI18n:{"ja":"コジカ塔","en":"Deer Tower","zh-CN":"","zh-TW":"","ko":"","th":""}, x:78.78, y:38.67 },
  { key:"Ruins", name:"遺跡", nameI18n:{"ja":"遺跡","en":"Ruins","zh-CN":"","zh-TW":"","ko":"","th":""}, x:29.52, y:18.34 },
  { key:"Onsen", name:"温泉", nameI18n:{"ja":"温泉","en":"Onsen","zh-CN":"","zh-TW":"","ko":"","th":""}, x:53.11, y:20.08 },
  { key:"Rosy River", name:"霞川", nameI18n:{"ja":"霞川","en":"Rosy River","zh-CN":"","zh-TW":"","ko":"","th":""}, x:30.26, y:32.69 },
  { key:"Tranquil River", name:"静川", nameI18n:{"ja":"静川","en":"Tranquil River","zh-CN":"","zh-TW":"","ko":"","th":""}, x:38.02, y:66.02 },
  { key:"Giantwood River", name:"巨木の川", nameI18n:{"ja":"巨木の川","en":"Giantwood River","zh-CN":"","zh-TW":"","ko":"","th":""}, x:63.35, y:68.36 },
  { key:"Shallow River", name:"浅水川", nameI18n:{"ja":"浅水川","en":"Shallow River","zh-CN":"","zh-TW":"","ko":"","th":""}, x:67.47, y:32.81 },
  { key:"Jump Puzzle", name:"ジャンプステージ", nameI18n:{"ja":"ジャンプステージ","en":"Jump Puzzle","zh-CN":"","zh-TW":"","ko":"","th":""}, x:78.99, y:67.78 },
  { key:"East Pier Fishing Village", name:"漁村東桟橋", nameI18n:{"ja":"漁村東桟橋","en":"East Pier Fishing Village","zh-CN":"","zh-TW":"","ko":"","th":""}, x:58.33, y:74 },
  { key:"Wharf", name:"波止場", nameI18n:{"ja":"波止場","en":"Wharf","zh-CN":"","zh-TW":"","ko":"","th":""}, x:42.26, y:68.96 },
  { key:"Home Plots", name:"ホーム", nameI18n:{"ja":"ホーム","en":"Home Plots","zh-CN":"","zh-TW":"","ko":"","th":""}, x:30.09, y:52.14 },
  { key:"Whale Sea", name:"クジラ海", nameI18n:{"ja":"クジラ海","en":"Whale Sea","zh-CN":"","zh-TW":"","ko":"","th":""}, x:14, y:49.44 },
  { key:"Zephyr Sea", name:"そよ風の海", nameI18n:{"ja":"そよ風の海","en":"Zephyr Sea","zh-CN":"","zh-TW":"","ko":"","th":""}, x:50.06, y:76.29 },
  { key:"East Sea", name:"東海", nameI18n:{"ja":"東海","en":"East Sea","zh-CN":"","zh-TW":"","ko":"","th":""}, x:90.66, y:51.04 },
  { key:"Old Sea", name:"旧海", nameI18n:{"ja":"旧海","en":"Old Sea","zh-CN":"","zh-TW":"","ko":"","th":""}, x:50, y:5 },
  { key:"Central Square", name:"大広場", nameI18n:{"ja":"大広場","en":"Central Square","zh-CN":"","zh-TW":"","ko":"","th":""}, x:49.69, y:52.63 },
  { key:"Fishing Village Square", name:"漁村広場", nameI18n:{"ja":"漁村広場","en":"Fishing Village Square","zh-CN":"","zh-TW":"","ko":"","th":""}, x:53.11, y:69.41 },
  { key:"Residential Street", name:"住宅街", nameI18n:{"ja":"住宅街","en":"Residential Street","zh-CN":"","zh-TW":"","ko":"","th":""}, x:46.26, y:44.77 },
  { key:"Garden Street", name:"花園街", nameI18n:{"ja":"花園街","en":"Garden Street","zh-CN":"","zh-TW":"","ko":"","th":""}, x:55.44, y:49.1 },
  { key:"Art Street", name:"アート街", nameI18n:{"ja":"アート街","en":"Art Street","zh-CN":"","zh-TW":"","ko":"","th":""}, x:43.76, y:49.58 },
  { key:"Crater Lake", name:"火山湖", nameI18n:{"ja":"火山湖","en":"Crater Lake","zh-CN":"","zh-TW":"","ko":"","th":""}, x:37.71, y:18.08 },
  { key:"Suburban Lake", name:"郊外の湖", nameI18n:{"ja":"郊外の湖","en":"Suburban Lake","zh-CN":"","zh-TW":"","ko":"","th":""}, x:50.08, y:59.76 },
  { key:"Forest Lake", name:"森の湖", nameI18n:{"ja":"森の湖","en":"Forest Lake","zh-CN":"","zh-TW":"","ko":"","th":""}, x:76.1, y:49.66 },
  { key:"Meadow Lake", name:"草原の湖", nameI18n:{"ja":"草原の湖","en":"Meadow Lake","zh-CN":"","zh-TW":"","ko":"","th":""}, x:23.6, y:53.66 },
  { key:"Onsen Mountain Lake", name:"温泉山の湖", nameI18n:{"ja":"温泉山の湖","en":"Onsen Mountain Lake","zh-CN":"","zh-TW":"","ko":"","th":""}, x:53.76, y:25.99 },
  // 以下4件は heartopia.guide のデータには無い広域ゾーン名（ユーザーがゲーム内マップの実機画像で確認）。
  // 座標はdata-map-areas.jsの対応する大エリアの重心と同じ値にしている。
  { key:"Forest", name:"森林", nameI18n:{"ja":"森林","en":"Forest","zh-CN":"","zh-TW":"","ko":"","th":""}, x:79.04, y:52.48 },
  { key:"Flower Field", name:"花畑", nameI18n:{"ja":"花畑","en":"Flower Field","zh-CN":"","zh-TW":"","ko":"","th":""}, x:20.84, y:55.02 },
  { key:"Onsen Mountain", name:"温泉山", nameI18n:{"ja":"温泉山","en":"Onsen Mountain","zh-CN":"","zh-TW":"","ko":"","th":""}, x:46.33, y:19.71 },
  { key:"Fishing Village", name:"漁村", nameI18n:{"ja":"漁村","en":"Fishing Village","zh-CN":"","zh-TW":"","ko":"","th":""}, x:48.84, y:71.76 },
];

const mapNpcs = [
  { key:"bob", name:"bob", x:50.15, y:46.8 },
  { key:"atara", name:"atara", x:49.55, y:52.5 },
  { key:"collector", name:"collector", x:46.6, y:48.2 },
  { key:"dorothee", name:"dorothee", x:48.95, y:47.05 },
  { key:"massimo", name:"massimo", x:48.6, y:44.2 },
  { key:"ka-ching", name:"ka-ching", x:41.85, y:41.4 },
  { key:"andrew", name:"andrew", x:59.05, y:40.0 },
  { key:"eric", name:"eric", x:51.45, y:25.75 },
  { key:"vanya", name:"vanya", x:54.85, y:45.4 },
  { key:"naniwa", name:"naniwa", x:59.2, y:50.4 },
  { key:"mrs-joan", name:"mrs-joan", x:52.35, y:49.9 },
  { key:"will", name:"will", x:41.95, y:79.75 },
  { key:"patty", name:"patty", x:82.7, y:35.5 },
  { key:"vernie", name:"vernie", x:21.3, y:65.8 },
  { key:"annie", name:"annie", x:49.05, y:49.75 },
  { key:"bailey-j", name:"bailey-j", x:53.0, y:50.05 },
  { key:"bill", name:"bill", x:44.5, y:73.05 },
  { key:"doris", name:"doris", x:41.2, y:50.8 },
  { key:"blanc", name:"blanc", x:56.85, y:53.5 },
  { key:"azure", name:"azure", x:45.6, y:17.7 },
];

const mapShops = [
  { key:"clothes-store", name:"洋服屋", x:48.7, y:47.2 },
  { key:"furniture-store", name:"家具屋", x:50.3, y:47.4 },
  { key:"pets-store", name:"ペットショップ", x:52.05, y:49.65 },
  { key:"books-store", name:"本屋", x:46.7, y:44.0 },
];

const mapBusStops = [
  { x:34.0, y:53.3 },
  { x:63.9, y:51.9 },
  { x:47.9, y:65.4 },
  { x:21.8, y:53.2 },
  { x:44.75, y:19.35 },
  { x:48.0, y:37.3 },
  { x:50.8, y:50.8 },
  { x:79.8, y:50.0 },
];

const mapAnimals = [
  { key:"panda", name:"パンダ", x:77.9, y:69.4 },
  { key:"capybara", name:"カピバラ", x:30.95, y:18.7 },
  { key:"bunny", name:"うさぎ", x:35.65, y:53.75 },
  { key:"fox", name:"きつね", x:20.25, y:63.95 },
  { key:"sea-otter", name:"ラッコ", x:50.85, y:73.4 },
  { key:"ferret", name:"フェレット", x:28.0, y:34.15 },
  { key:"silka-deer", name:"シカ", x:80.5, y:53.1 },
  { key:"llama", name:"ラマ", x:23.85, y:69.1 },
  { key:"penguin", name:"ペンギン", x:46.05, y:14.4 },
];

const mapEvents = [
  { key:"sea-fishing", name:"海釣り", x:44.3, y:73.25 },
  { key:"bubble-machine-challenge", name:"バブルマシンチャレンジ", x:27.25, y:74.55 },
  { key:"yellow-duck-jump-puzzle", name:"イエローダックジャンプパズル", x:22.8, y:75.1 },
  { key:"bait-the-insects", name:"虫寄せ", x:50.5, y:23.0 },
  { key:"nest-of-hundreds", name:"巣ごもり", x:47.25, y:68.8 },
  { key:"snow-weekend-concert", name:"雪の週末コンサート", x:51.9, y:10.3 },
  { key:"frostspore-fish", name:"氷晶の魚", x:32.5, y:10.05 },
  { key:"frostspore-butterfly-event", name:"氷晶の蝶", x:81.45, y:36.0 },
];

