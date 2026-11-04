//isEvent: true

const foodsData = [
{
  name:"田園サラダ",
  nameI18n:{"ja":"田園サラダ","en":"Country Salad","zh-CN":"田园沙拉","zh-TW":"田園沙拉","ko":"베지 샐러드","th":"สลัดคันทรี"},
  image:"./images/foods/001.PNG",
  restore: [15,18,21,24,30],
  cost:20,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[90],
  materials:["野菜ならなんでもOK","野菜ならなんでもOK","",""],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:null },
    { image:null }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数
  auth:true
},
{
  name:"ミックスジャム",
  nameI18n:{"ja":"ミックスジャム","en":"Mixed Jam","zh-CN":"什锦果酱","zh-TW":"什錦果醬","ko":"믹스드 잼","th":"แยมรวมมิตร"},
  image:"./images/foods/002.PNG",
  restore: [22,26,31,35,44],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[160],
  materials:["ジャムの材料ならなんでもOK","ジャムの材料ならなんでもOK","ジャムの材料ならなんでもOK","ジャムの材料ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ラズベリージャム",
  nameI18n:{"ja":"ラズベリージャム","en":"Raspberry Jam","zh-CN":"树莓果酱","zh-TW":"樹莓果醬","ko":"라즈베리 잼","th":"แยมราสเบอร์รี่"},
  image:"./images/foods/003.PNG",
  restore: [30,36,42,48,60],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[250],
  materials:["ラズベリー","ラズベリー","ラズベリー","ラズベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/razuberi.jpg" },
    { image:"./images/materials/razuberi.jpg" },
    { image:"./images/materials/razuberi.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"トマトソース",
  nameI18n:{"ja":"トマトソース","en":"Tomato Sauce","zh-CN":"番茄酱","zh-TW":"番茄醬","ko":"케첩","th":"ซอสมะเขือเทศ"},
  image:"./images/foods/004.PNG",
  restore: [35,42,49,56,70],
  cost:40,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[180],
  materials:["トマト(種@10)","トマト(種@10)","トマト(種@10)","トマト(種@10)"],
  level:1,
  materials_image:[
    { image:"./images/materials/tomato.jpg" },
    { image:"./images/materials/tomato.jpg" },
    { image:"./images/materials/tomato.jpg" },
    { image:"./images/materials/tomato.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ブルーベリージャム",
  nameI18n:{"ja":"ブルーベリージャム","en":"Blueberry Jam","zh-CN":"蓝莓果酱","zh-TW":"藍莓果醬","ko":"블루베리 잼","th":"แยมบลูเบอร์รี่"},
  image:"./images/foods/005.PNG",
  restore: [22,26,31,35,44],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[170],
  materials:["ブルーベリー","ブルーベリー","ブルーベリー","ブルーベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/buruberi.jpg" },
    { image:"./images/materials/buruberi.jpg" },
    { image:"./images/materials/buruberi.jpg" },
    { image:"./images/materials/buruberi.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"リンゴジャム",
  nameI18n:{"ja":"リンゴジャム","en":"Apple Jam","zh-CN":"苹果酱","zh-TW":"蘋果醬","ko":"사과 잼","th":"แยมแอปเปิล"},
  image:"./images/foods/006.PNG",
  restore: [35,42,49,56,70],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[270],
  materials:["リンゴ","リンゴ","リンゴ","リンゴ"],
  level:1,
  materials_image:[
    { image:"./images/materials/ringo.jpg" },
    { image:"./images/materials/ringo.jpg" },
    { image:"./images/materials/ringo.jpg" },
    { image:"./images/materials/ringo.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"オレンジジャム",
  nameI18n:{"ja":"オレンジジャム","en":"Orange Jam","zh-CN":"橘子果酱","zh-TW":"橘子果醬","ko":"오렌지 잼","th":"แยมส้ม"},
  image:"./images/foods/007.PNG",
  restore: [35,42,49,56,70],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[270],
  materials:["オレンジ","オレンジ","オレンジ","オレンジ"],
  level:1,
  materials_image:[
    { image:"./images/materials/orange.jpg" },
    { image:"./images/materials/orange.jpg" },
    { image:"./images/materials/orange.jpg" },
    { image:"./images/materials/orange.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"不気味な食べ物",
  nameI18n:{"ja":"不気味な食べ物","en":"Creepy Food","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/009.PNG",
  restore: null, // 未確認
  cost:null, // 未確認（何の料理の失敗作かで材料費が変わるため固定値にできない）
  time:0,
  rarity: [true,false,false,false,false],
  prices:[30],
  materials:["食べ物の失敗作"],
  level:1,
  materials_image:[
    { image:null },
    { image:null },
    { image:null },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"不気味な飲み物",
  nameI18n:{"ja":"不気味な飲み物","en":"Creepy Drink","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/010.PNG",
  restore: null, // 未確認
  cost:null, // 未確認（何の料理の失敗作かで材料費が変わるため固定値にできない）
  time:0,
  rarity: [true,false,false,false,false],
  prices:[30],
  materials:["飲み物の失敗作"],
  level:1,
  materials_image:[
    { image:null },
    { image:null },
    { image:null },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"いちごジャム",
  nameI18n:{"ja":"いちごジャム","en":"Strawberry Jam","zh-CN":"草莓果酱","zh-TW":"草莓果醬","ko":"딸기 잼","th":"แยมสตรอว์เบอร์รี่"},
  image:"./images/foods/011.PNG",
  restore: [40,48,56,64,80],
  cost:500,
  time:360,
  rarity: [true,true,true,true,true],
  prices:[1580],
  materials:["いちご(種@125)","いちご(種@125)","いちご(種@125)","いちご(種@125)"],
  level:1,
  materials_image:[
    { image:"./images/materials/strawberry.jpg" },
    { image:"./images/materials/strawberry.jpg" },
    { image:"./images/materials/strawberry.jpg" },
    { image:"./images/materials/strawberry.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"パイナップルジャム",
  nameI18n:{"ja":"パイナップルジャム","en":"Pineapple Jam","zh-CN":"菠萝酱","zh-TW":"鳳梨醬","ko":"파인애플 잼","th":"แยมสับปะรด"},
  image:"./images/foods/012.PNG",
  restore: [40,48,56,64,80],
  cost:60,
  time:30,
  rarity: [true,true,true,true,true],
  prices:[280],
  materials:["パイナップル(種@15)","パイナップル(種@15)","パイナップル(種@15)","パイナップル(種@15)"],
  level:1,
  materials_image:[
    { image:"./images/materials/pineapple.jpg" },
    { image:"./images/materials/pineapple.jpg" },
    { image:"./images/materials/pineapple.jpg" },
    { image:"./images/materials/pineapple.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ブドウジャム",
  nameI18n:{"ja":"ブドウジャム","en":"Grape Jam","zh-CN":"葡萄酱","zh-TW":"葡萄醬","ko":"포도 잼","th":"แยมองุ่น"},
  image:"./images/foods/013.PNG",
  restore: [40,48,56,64,80],
  cost:640,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[2020],
  materials:["ブドウ(種@160)","ブドウ(種@160)","ブドウ(種@160)","ブドウ(種@160)"],
  level:1,
  materials_image:[
    { image:"./images/materials/grape.jpg" },
    { image:"./images/materials/grape.jpg" },
    { image:"./images/materials/grape.jpg" },
    { image:"./images/materials/grape.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"チョコソース",
  nameI18n:{"ja":"チョコソース","en":"Chocolate Sauce","zh-CN":"巧克力酱","zh-TW":"巧克力醬","ko":"초콜릿 소스","th":"ซอสช็อกโกแลต"},
  image:"./images/foods/068.PNG",
  restore: [80,96,112,128,160],
  cost:440,
  time:300,
  rarity: [true,true,true,true,true],
  prices:[1400],
  materials:["カカオ豆(種@110)","カカオ豆(種@110)","カカオ豆(種@110)","カカオ豆(種@110)"],
  level:1,
  materials_image:[
    { image:"./images/materials/cacao.jpg" },
    { image:"./images/materials/cacao.jpg" },
    { image:"./images/materials/cacao.jpg" },
    { image:"./images/materials/cacao.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},

{
  name:"スターフルーツジャム",
  nameI18n:{"ja":"スターフルーツジャム","en":"Starfruit Jam","zh-CN":"杨桃果酱","zh-TW":"楊桃果醬","ko":"스타프루트 잼","th":"แยมมะเฟือง"},
  image:"./images/foods/096.PNG",
  restore: [20,24,28,32,40],
  cost:40,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[200],
  materials:["スターフルーツ(種@10)","スターフルーツ(種@10)","スターフルーツ(種@10)","スターフルーツ(種@10)"],
  level:1,
  materials_image:[
    { image:"./images/materials/star_fruit.jpg" },
    { image:"./images/materials/star_fruit.jpg" },
    { image:"./images/materials/star_fruit.jpg" },
    { image:"./images/materials/star_fruit.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"フィッシュアンドチップス",
  nameI18n:{"ja":"フィッシュアンドチップス","en":"Fish and Chips","zh-CN":"炸鱼薯条","zh-TW":"炸魚薯條","ko":"피시 앤 칩스","th":"ฟิชแอนด์ชิปส์"},
  image:"./images/foods/008.PNG",
  restore: [40,48,56,64,80],
  cost:60,
  time:60,
  rarity: [true,true,true,true,true],
  prices:[310],
  materials:["魚ならなんでもOK","魚ならなんでもOK","じゃがいも(種@30)","じゃがいも(種@30)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_fish.jpg" },
    { image:"./images/materials/all_fish.jpg" },
    { image:"./images/materials/potato.jpg" },
    { image:"./images/materials/potato.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"チーズケーキ",
  nameI18n:{"ja":"チーズケーキ","en":"Cheesecake","zh-CN":"奶酪蛋糕","zh-TW":"奶酪蛋糕","ko":"치즈케이크","th":"ชีสเค้ก"},
  image:"./images/foods/014.PNG",
  restore: [50,60,70,80,100],
  cost:245,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[480],
  materials:["チーズ(@100)","牛乳(@50)","小麦(種@95)","小麦(種@95)"],
  level:1,
  materials_image:[
    { image:"./images/materials/cheese.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/wheat.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"オリジナルロールケーキ",
  nameI18n:{"ja":"オリジナルロールケーキ","en":"Original Roll Cake","zh-CN":"原味浮云卷","zh-TW":"原味浮雲捲","ko":"오리지널 롤케이크","th":"โรลเมฆรสดั้งเดิม"},
  image:"./images/foods/015.PNG",
  restore: [35,42,49,56,70],
  cost:450,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[550],
  materials:["卵(@100)","牛乳(@50)","虹色キャンディならなんでもOK","虹キャンディならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/all_candy.jpg" },
    { image:"./images/materials/all_candy.jpg" }
  ],
  authTarget: 270, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"赤いロールケーキ",
  nameI18n:{"ja":"赤いロールケーキ","en":"Red Roll Cake","zh-CN":"红色浮云卷","zh-TW":"紅色浮雲捲","ko":"레드 롤케이크","th":"โรลเมฆสีแดง"},
  image:"./images/foods/016.PNG",
  restore: [48,58,67,77,96],
  cost:550,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[670],
  materials:["卵(@100)","牛乳(@50)","赤いキャンディ(@200)","赤いキャンディ(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/red_candy.jpg" },
    { image:"./images/materials/red_candy.jpg" }
  ],
  authTarget: 90, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"オレンジのロールケーキ",
  nameI18n:{"ja":"オレンジのロールケーキ","en":"Orange Roll Cake","zh-CN":"橙色浮云卷","zh-TW":"橙色浮雲捲","ko":"오렌지 롤케이크","th":"โรลเมฆสีส้ม"},
  image:"./images/foods/017.PNG",
  restore: [48,58,67,77,96],
  cost:550,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[670],
  materials:["卵(@100)","牛乳(@50)","オレンジのキャンディ(@200)","オレンジのキャンディ(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/orange_candy.jpg" },
    { image:"./images/materials/orange_candy.jpg" }
  ],
  authTarget: 90, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"黄色いロールケーキ",
  nameI18n:{"ja":"黄色いロールケーキ","en":"Yellow Roll Cake","zh-CN":"黄色浮云卷","zh-TW":"黃色浮雲捲","ko":"옐로우 롤케이크","th":"โรลเมฆสีเหลือง"},
  image:"./images/foods/018.PNG",
  restore: [48,58,67,77,96],
  cost:550,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[670],
  materials:["卵(@100)","牛乳(@50)","黄色いキャンディ(@200)","黄色いキャンディ(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/yellow_candy.jpg" },
    { image:"./images/materials/yellow_candy.jpg" }
  ],
  authTarget: 90, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"紫のロールケーキ",
  nameI18n:{"ja":"紫のロールケーキ","en":"Purple Roll Cake","zh-CN":"紫色浮云卷","zh-TW":"紫色浮雲捲","ko":"퍼플 롤케이크","th":"โรลเมฆสีม่วง"},
  image:"./images/foods/019.PNG",
  restore: [48,58,67,77,96],
  cost:450,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[570],
  materials:["卵(@100)","牛乳(@50)","紫のキャンディ(@150)","紫のキャンディ(@150)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/purple_candy.jpg" },
    { image:"./images/materials/purple_candy.jpg" }
  ],
  authTarget: 270, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"緑のロールケーキ",
  nameI18n:{"ja":"緑のロールケーキ","en":"Green Roll Cake","zh-CN":"绿色浮云卷","zh-TW":"綠色浮雲捲","ko":"그린 롤케이크","th":"โรลเมฆสีเขียว"},
  image:"./images/foods/020.PNG",
  restore: [48,58,67,77,96],
  cost:550,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[670],
  materials:["卵(@100)","牛乳(@50)","緑のキャンディ(@200)","緑のキャンディ(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/green_candy.jpg" },
    { image:"./images/materials/green_candy.jpg" }
  ],
  authTarget: 90, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"水色ロールケーキ",
  nameI18n:{"ja":"水色ロールケーキ","en":"Light Blue Roll Cake","zh-CN":"青色浮云卷","zh-TW":"青色浮雲捲","ko":"스카이 롤케이크","th":"โรลเมฆสีเขียวแกมน้ำเงิน"},
  image:"./images/foods/021.PNG",
  restore: [48,58,67,77,96],
  cost:450,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[570],
  materials:["卵(@100)","牛乳(@50)","青のキャンディ(@150)","青のキャンディ(@150)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/water_candy.jpg" },
    { image:"./images/materials/water_candy.jpg" }
  ],
  authTarget: 270, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"青いロールケーキ",
  nameI18n:{"ja":"青いロールケーキ","en":"Blue Roll Cake","zh-CN":"蓝色浮云卷","zh-TW":"藍色浮雲捲","ko":"블루 롤케이크","th":"โรลเมฆสีฟ้า"},
  image:"./images/foods/022.PNG",
  restore: [48,58,67,77,96],
  cost:450,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[570],
  materials:["卵(@100)","牛乳(@50)","ブルーキャンディ(@150)","ブルーキャンディ(@150)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/blue_candy.jpg" },
    { image:"./images/materials/blue_candy.jpg" }
  ],
  authTarget: 270, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"キノコパイ",
  nameI18n:{"ja":"キノコパイ","en":"Mushroom Pie","zh-CN":"蘑菇派","zh-TW":"蘑菇派","ko":"버섯 파이","th":"พายเห็ด"},
  image:"./images/foods/023.PNG",
  restore: [35,42,49,56,70],
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[500],
  materials:["キノコならなんでもOK","キノコならなんでもOK","小麦(種@95)","卵(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_kinoko.jpg" },
    { image:"./images/materials/all_kinoko.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ヒラタケパイ",
  nameI18n:{"ja":"ヒラタケパイ","en":"Oyster Mushroom Pie","zh-CN":"平菇派","zh-TW":"平菇派","ko":"느타리버섯 파이","th":"พายเห็ดนางฟ้า"},
  image:"./images/foods/024.PNG",
  restore: [35,42,49,56,70],
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[500],
  materials:["ヒラタケ","ヒラタケ","小麦(種@95)","卵(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/hiratake.jpg" },
    { image:"./images/materials/hiratake.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"シイタケパイ",
  nameI18n:{"ja":"シイタケパイ","en":"Shiitake Pie","zh-CN":"香菇派","zh-TW":"香菇派","ko":"표고버섯 파이","th":"พายเห็ดหอม"},
  image:"./images/foods/025.PNG",
  restore: [35,42,49,56,70],
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[500],
  materials:["シイタケ","シイタケ","小麦(種@95)","卵(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/shitake.jpg" },
    { image:"./images/materials/shitake.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"マッシュルームパイ",
  nameI18n:{"ja":"マッシュルームパイ","en":"Button Mushroom Pie","zh-CN":"口蘑派","zh-TW":"洋菇派","ko":"양송이버섯 파이","th":"พายเห็ดแชมปิญอง"},
  image:"./images/foods/026.PNG",
  restore: [35,42,49,56,70],
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[500],
  materials:["マッシュルーム","マッシュルーム","小麦(種@95)","卵(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/mushroom.jpg" },
    { image:"./images/materials/mushroom.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ヤマドリタケパイ",
  nameI18n:{"ja":"ヤマドリタケパイ","en":"Porcini Pie","zh-CN":"牛肝菌派","zh-TW":"牛肝菌派","ko":"그물버섯 파이","th":"พายเห็ดพอร์ชินี"},
  image:"./images/foods/027.PNG",
  restore: [35,42,49,56,70],
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[500],
  materials:["ヤマドリタケ","ヤマドリタケ","小麦(種@95)","卵(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/yamadoritake.jpg" },
    { image:"./images/materials/yamadoritake.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"トリュフパイ",
  nameI18n:{"ja":"トリュフパイ","en":"Truffle Pie","zh-CN":"黑松露派","zh-TW":"黑松露派","ko":"검은 트러플 파이","th":"พายทรัฟเฟิลดำ"},
  image:"./images/foods/028.PNG",
  restore: [80,96,112,128,160],
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[830],
  materials:["トリュフ","トリュフ","小麦(種@95)","卵(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/truffle.jpg" },
    { image:"./images/materials/truffle.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" }
  ],
  authTarget: 480, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"焼きキノコ",
  nameI18n:{"ja":"焼きキノコ","en":"Grilled Mushrooms","zh-CN":"烤蘑菇","zh-TW":"烤蘑菇","ko":"구운 버섯","th":"เห็ดย่าง"},
  image:"./images/foods/029.PNG",
  restore: [15,18,21,24,30],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[180],
  materials:["キノコならなんでもOK","キノコならなんでもOK","キノコならなんでもOK","キノコならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_kinoko.jpg" },
    { image:"./images/materials/all_kinoko.jpg" },
    { image:"./images/materials/all_kinoko.jpg" },
    { image:"./images/materials/all_kinoko.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"焼きヒラタケ",
  nameI18n:{"ja":"焼きヒラタケ","en":"Grilled Oyster Mushroom","zh-CN":"烤平菇","zh-TW":"烤平菇","ko":"구운 느타리버섯","th":"เห็ดนางฟ้าย่าง"},
  image:"./images/foods/030.PNG",
  restore: [15,18,21,24,30],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[180],
  materials:["ヒラタケ","ヒラタケ","ヒラタケ","ヒラタケ"],
  level:1,
  materials_image:[
    { image:"./images/materials/hiratake.jpg" },
    { image:"./images/materials/hiratake.jpg" },
    { image:"./images/materials/hiratake.jpg" },
    { image:"./images/materials/hiratake.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"焼きシイタケ",
  nameI18n:{"ja":"焼きシイタケ","en":"Grilled Shiitake","zh-CN":"烤香菇","zh-TW":"烤香菇","ko":"구운 표고버섯","th":"เห็ดหอมย่าง"},
  image:"./images/foods/031.PNG",
  restore: [15,18,21,24,30],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[180],
  materials:["シイタケ","シイタケ","シイタケ","シイタケ"],
  level:1,
  materials_image:[
    { image:"./images/materials/shitake.jpg" },
    { image:"./images/materials/shitake.jpg" },
    { image:"./images/materials/shitake.jpg" },
    { image:"./images/materials/shitake.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"焼きマッシュルーム",
  nameI18n:{"ja":"焼きマッシュルーム","en":"Grilled Button Mushroom","zh-CN":"烤口蘑","zh-TW":"烤洋菇","ko":"구운 양송이버섯","th":"เห็ดแชมปิญองย่าง"},
  image:"./images/foods/032.PNG",
  restore: [15,18,21,24,30],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[180],
  materials:["マッシュルーム","マッシュルーム","マッシュルーム","マッシュルーム"],
  level:1,
  materials_image:[
    { image:"./images/materials/mushroom.jpg" },
    { image:"./images/materials/mushroom.jpg" },
    { image:"./images/materials/mushroom.jpg" },
    { image:"./images/materials/mushroom.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"焼きヤマドリタケ",
  nameI18n:{"ja":"焼きヤマドリタケ","en":"Grilled Porcini","zh-CN":"烤牛肝菌","zh-TW":"烤牛肝菌","ko":"구운 그물버섯","th":"เห็ดพอร์ชินีย่าง"},
  image:"./images/foods/033.PNG",
  restore: [15,18,21,24,30],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[180],
  materials:["ヤマドリタケ","ヤマドリタケ","ヤマドリタケ","ヤマドリタケ"],
  level:1,
  materials_image:[
    { image:"./images/materials/yamadoritake.jpg" },
    { image:"./images/materials/yamadoritake.jpg" },
    { image:"./images/materials/yamadoritake.jpg" },
    { image:"./images/materials/yamadoritake.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"温泉卵",
  nameI18n:{"ja":"温泉卵","en":"Onsen Egg","zh-CN":"温泉蛋","zh-TW":"溫泉蛋","ko":"온천란","th":"ไข่ออนเซ็น"},
  image:"./images/foods/056.PNG",
  restore: [15,18,21,24,30],
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[130],
  materials:["無菌卵(@100)","","",""],
  level:1,
  materials_image:[
    { image:"./images/materials/m_egg.jpg" },
    { image:null },
    { image:null },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"月餅",
  nameI18n:{"ja":"月餅","en":"Mooncake","zh-CN":"月饼","zh-TW":"月餅","ko":"월병","th":"ขนมไหว้พระจันทร์"},
  image:"./images/foods/111.PNG",
  restore: [45,54,63,72,90],
  cost:390,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[820],
  materials:["小麦(種@95)","小麦(種@95)","卵(@100)","月餅の食材ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"カスタード月餅",
  nameI18n:{"ja":"カスタード月餅","en":"Custard Mooncake","zh-CN":"奶黄流心大月饼","zh-TW":"奶黃流心大月餅","ko":"크리미 커스터드 월병","th":"ขนมไหว้พระจันทร์ไส้ครีมลาวา"},
  image:"./images/foods/112.PNG",
  restore: [55,66,77,88,110],
  cost:950,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[2610],
  materials:["月餅ならなんでもOK","月餅ならなんでもOK","月餅ならなんでもOK","乳製品ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/tsukimochi.jpg" },
    { image:"./images/materials/tsukimochi.jpg" },
    { image:"./images/materials/tsukimochi.jpg" },
    { image:"./images/materials/nyuseihin.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ウサギのスノースキン月餅",
  nameI18n:{"ja":"ウサギのスノースキン月餅","en":"Rabbit Snowskin Mooncake","zh-CN":"玉兔冰皮月饼","zh-TW":"玉兔冰皮月餅","ko":"옥토끼 아이스 월병","th":"ขนมไหว้พระจันทร์กระต่ายหยก"},
  image:"./images/foods/113.PNG",
  restore: [20,24,28,32,40],
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[250],
  materials:["米粉(@50)","米粉(@50)","牛乳(@50)","あずき(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/komeko.jpg" },
    { image:"./images/materials/komeko.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/azuki.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ウサギのスノースキン月餅・大",
  nameI18n:{"ja":"ウサギのスノースキン月餅・大","en":"Rabbit Snowskin Mooncake (Large)","zh-CN":"大份玉兔冰皮月饼","zh-TW":"大份玉兔冰皮月餅","ko":"대용량 옥토끼 아이스 월병","th":"ขนมไหว้พระจันทร์ กระต่ายหยกชุดใหญ่"},
  image:"./images/foods/114.PNG",
  restore: [25,30,35,40,50],
  cost:800,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[1100],
  materials:["ウサギのスノースキン月餅","ウサギのスノースキン月餅","ウサギのスノースキン月餅","ウサギのスノースキン月餅"],
  level:1,
  materials_image:[
    { image:"./images/materials/usa_tsuki.jpg" },
    { image:"./images/materials/usa_tsuki.jpg" },
    { image:"./images/materials/usa_tsuki.jpg" },
    { image:"./images/materials/usa_tsuki.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"チョコレート月餅",
  nameI18n:{"ja":"チョコレート月餅","en":"Chocolate Mooncake","zh-CN":"巧克力月饼","zh-TW":"巧克力月餅","ko":"초콜릿 월병","th":"ขนมไหว้พระจันทร์ช็อกโกแลต"},
  image:"./images/foods/117.PNG",
  restore: [75,90,105,120,150],
  cost:400,
  time:300,
  rarity: [true,true,true,true,true],
  prices:[1050],
  materials:["小麦(種@95)","小麦(種@95)","卵(@100)","カカオ豆(種@110)"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/cacao.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"チョコレート月餅・大",
  nameI18n:{"ja":"チョコレート月餅・大","en":"Chocolate Mooncake (Large)","zh-CN":"大份巧克力月饼","zh-TW":"大份巧克力月餅","ko":"대용량 초콜릿 월병","th":"ขนมไหว้พระจันทร์ช็อกโก แลตชุดใหญ่"},
  image:"./images/foods/118.PNG",
  restore: [80,96,112,128,160],
  cost:1250,
  time:300,
  rarity: [true,true,true,true,true],
  prices:[3300],
  materials:["チョコレート月餅(@400)","チョコレート月餅(@400)","チョコレート月餅(@400)","乳製品ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/choco_tsuki.jpg" },
    { image:"./images/materials/choco_tsuki.jpg" },
    { image:"./images/materials/choco_tsuki.jpg" },
    { image:"./images/materials/nyuseihin.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"復活のエッグ",
  nameI18n:{"ja":"復活のエッグ","en":"Egg of Revival","zh-CN":"复苏蛋","zh-TW":"復甦蛋","ko":"부활절 달걀","th":"ไข่คืนชีพ"},
  image:"./images/foods/058.PNG",
  restore: [20,24,28,32,40],
  cost:100,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[190],
  materials:["卵(@100)","復活のエッグの素材ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:null },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"復活祭の模様入り卵(紫)",
  nameI18n:{"ja":"復活祭の模様入り卵(紫)","en":"Easter Patterned Egg (Purple)","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/059.PNG",
  restore: [50,60,70,80,100],
  cost:260,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[620],
  materials:["卵(@100)","ブドウ(種@160)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/grape.jpg" },
    { image:null },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"復活祭の模様入り卵(緑)",
  nameI18n:{"ja":"復活祭の模様入り卵(緑)","en":"Easter Patterned Egg (Green)","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/060.PNG",
  restore: [50,60,70,80,100],
  cost:245,
  time:480,
  rarity: [true,true,true,true,true],
  prices:[570],
  materials:["卵(@100)","レタス(種@145)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lettuce.jpg" },
    { image:null },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"復活祭の模様入り卵(オレンジ)",
  nameI18n:{"ja":"復活祭の模様入り卵(オレンジ)","en":"Easter Patterned Egg (Orange)","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/061.PNG",
  restore: [20,24,28,32,40],
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[190],
  materials:["卵(@100)","リンゴ"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/ringo.jpg" },
    { image:null },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"復活祭のイースターエッグの宴",
  nameI18n:{"ja":"復活祭のイースターエッグの宴","en":"Easter Egg Feast","zh-CN":"复苏彩蛋宴","zh-TW":"復甦彩蛋宴","ko":"부활절 이스터에그 파티","th":"งานเลี้ยงไข่อีสเตอร์คืนชีพ"},
  image:"./images/foods/062.PNG",
  restore: [55,66,77,88,110],
  cost:755,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[1650],
  materials:["復活のエッグ","復活祭の模様入り卵(紫)","復活祭の模様入り卵(緑)","復活祭の模様入り卵(オレンジ)"],
  level:1,
  materials_image:[
    { image:"./images/materials/f_egg.jpg" },
    { image:"./images/materials/p_egg.jpg" },
    { image:"./images/materials/g_egg.jpg" },
    { image:"./images/materials/o_egg.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"三角の白米ちまき",
  nameI18n:{"ja":"三角の白米ちまき","en":"Triangular White Rice Zongzi","zh-CN":"三角白米粽","zh-TW":"三角白米粽","ko":"삼각 쌀 쫑즈","th":"บ๊ะจ่างข้าวสามเหลี่ยม"},
  image:"./images/foods/071.PNG",
  restore: [25,30,35,40,50],
  cost:162,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[240],
  materials:["ちまきの葉(@50)","稲(種@12)","ちまきの食材ならなんでもOK","ちまきの食材ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/timaki.jpg" },
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"三角のあずきちまき",
  nameI18n:{"ja":"三角のあずきちまき","en":"Triangular Red Bean Zongzi","zh-CN":"三角红豆粽","zh-TW":"三角紅豆粽","ko":"삼각 통팥 쫑즈","th":"บ๊ะจ่างถั่วแดงสามเหลี่ยม"},
  image:"./images/foods/072.PNG",
  restore: [25,30,35,40,50],
  cost:162,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[260],
  materials:["ちまきの葉(@50)","稲(種@12)","あずき(@50)","あずき(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/timaki.jpg" },
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/azuki.jpg" },
    { image:"./images/materials/azuki.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"三角の卵黄入り肉ちまき",
  nameI18n:{"ja":"三角の卵黄入り肉ちまき","en":"Triangular Meat & Egg Yolk Zongzi","zh-CN":"三角蛋黄肉粽","zh-TW":"三角蛋黃肉粽","ko":"삼각 노른자 고기 쫑즈","th":"บ๊ะจ่างหมูไข่แดงเค็มสามเหลี่ยม"},
  image:"./images/foods/073.PNG",
  restore: [40,48,56,64,80],
  cost:362,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[460],
  materials:["ちまきの葉(@50)","稲(種@12)","卵(@100)","肉(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/timaki.jpg" },
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/meat.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"枕型の白米ちまき",
  nameI18n:{"ja":"枕型の白米ちまき","en":"Pillow-shaped White Rice Zongzi","zh-CN":"枕形白米粽","zh-TW":"枕形白米粽","ko":"사각 쌀 쫑즈","th":"บ๊ะจ่างข้าวทรงหมอน"},
  image:"./images/foods/074.PNG",
  restore: [25,30,35,40,50],
  cost:162,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[240],
  materials:["ちまきの葉(@50)","稲(種@12)","ちまきの食材ならなんでもOK","ちまきの食材ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/timaki.jpg" },
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"枕型のこしあんちまき",
  nameI18n:{"ja":"枕型のこしあんちまき","en":"Pillow-shaped Red Bean Paste Zongzi","zh-CN":"枕形豆沙粽","zh-TW":"枕形豆沙粽","ko":"사각 팥소 쫑즈","th":"บ๊ะจ่างถั่วกวนทรงหมอน"},
  image:"./images/foods/075.PNG",
  restore: [25,30,35,40,50],
  cost:162,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[260],
  materials:["ちまきの葉(@50)","稲(種@12)","あずき(@50)","あずき(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/timaki.jpg" },
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/azuki.jpg" },
    { image:"./images/materials/azuki.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"枕型の卵黄入りちまき",
  nameI18n:{"ja":"枕型の卵黄入りちまき","en":"Pillow-shaped Egg Yolk Zongzi","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/076.PNG",
  restore: [40,48,56,64,80],
  cost:362,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[460],
  materials:["ちまきの葉(@50)","稲(種@12)","卵(@100)","肉(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/timaki.jpg" },
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/meat.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"巧果",
  nameI18n:{"ja":"巧果","en":"Pillow-shaped Egg Yolk Zongzi","zh-CN":"巧果","zh-TW":"巧果","ko":"은하수 과자","th":"ขนมทานาบาตะ"},
  image:"./images/foods/107.PNG",
  restore: [100,120,140,160,200],
  cost:390,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[830],
  materials:["小麦(種@95)","小麦(種@95)","卵(@100)","料理油(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/oil.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  // ハロウィンイベント「Trick or Treat」交換ショップでキャンディ500個と交換して入手予定のレシピ
  name:"白包帯ゴースト・飲み物",
  nameI18n:{"ja":"白包帯ゴースト・飲み物","en":"White Bandage Grimkin Drink","zh-CN":"白绷带奇灵饮料","zh-TW":"白繃帶奇靈飲料","ko":"흰 붕대 고스트 음료","th":"เครื่องดื่ม Grimkin ผ้าพันแผลขาว"},
  image:"./images/foods/1114.PNG",
  restore: [20,24,28,32,40],
  cost:200, // 牛乳50+キャンディ(最安値150：紫/ブルー/青のキャンディ)
  time:0,
  rarity: [true,true,true,true,true],
  prices:[280],
  materials:["牛乳(@50)","キャンディならなんでもOK","",""],
  level:1,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/all_candy.jpg" },
    { image:null },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  // 白包帯ゴースト・飲み物を一度調理した後、キャンディを紫のキャンディに変更して調理すると作成可能
  name:"黒包帯ゴースト・飲み物",
  nameI18n:{"ja":"黒包帯ゴースト・飲み物","en":"Black Bandage Grimkin Drink","zh-CN":"黑绷带奇灵饮料","zh-TW":"黑繃帶奇靈飲料","ko":"검은 붕대 고스트 음료","th":"เครื่องดื่ม Grimkin ผ้าพันแผลดำ"},
  image:"./images/foods/1115.PNG",
  restore: [20,24,28,32,40],
  cost:200, // 牛乳50+紫のキャンディ150
  time:0,
  rarity: [true,true,true,true,true],
  prices:[280],
  materials:["牛乳(@50)","紫のキャンディ(@150)","",""],
  level:1,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/purple_candy.jpg" },
    { image:null },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  // 白包帯ゴースト・飲み物を一度調理した後、キャンディを黄色いキャンディに変更して調理すると作成可能
  name:"ミイラの猫の飲み物",
  nameI18n:{"ja":"ミイラの猫の飲み物","en":"Mummy Cat Drink","zh-CN":"木乃伊猫饮料","zh-TW":"木乃伊貓飲料","ko":"미라 고양이 음료","th":"เครื่องดื่มแมวมัมมี่"},
  image:"./images/foods/1116.PNG",
  restore: [26,31,36,42,52],
  cost:250, // 牛乳50+黄色いキャンディ200
  time:0,
  rarity: [true,true,true,true,true],
  prices:[330],
  materials:["牛乳(@50)","黄色いキャンディ(@200)","",""],
  level:1,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/yellow_candy.jpg" },
    { image:null },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  // 10/30開始予定のハロウィンイベント交換ショップで入手予定のレシピ（キャンディ30個で交換）
  name:"ユラユラチーズかぼちゃパスタ",
  nameI18n:{"ja":"ユラユラチーズかぼちゃパスタ","en":"Ghost Cheesy Pumpkin Noodles","zh-CN":"幽幽芝士南瓜面","zh-TW":"幽幽芝士南瓜麵","ko":"유령 치즈 호박 누들","th":"บะหมี่ฟักทองชีสกุ๊กกู๋"},
  image:"./images/foods/1110.PNG",
  restore: [35,42,49,56,70],
  cost:220, // かぼちゃ10×2+チーズ100+料理油100
  time:15, // 素材の成長時間から算出：かぼちゃ15分（他はかぼちゃ以外の作物を使用しないため対象外）
  rarity: [true,true,true,true,true],
  prices:[310],
  materials:["かぼちゃ(種@10)","かぼちゃ(種@10)","チーズ(@100)","料理油(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kabotya.jpg" },
    { image:"./images/materials/kabotya.jpg" },
    { image:"./images/materials/cheese.jpg" },
    { image:"./images/materials/oil.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  // 10/30開始予定のハロウィンイベント交換ショップで入手予定のレシピ（キャンディ30個で交換）
  name:"かぼちゃニャンコクッキー",
  nameI18n:{"ja":"かぼちゃニャンコクッキー","en":"Pumpkin Cat Cookie","zh-CN":"南瓜喵曲奇","zh-TW":"南瓜喵曲奇","ko":"호박냥 쿠키","th":"คุกกี้แมวฟักทอง"},
  image:"./images/foods/1111.PNG",
  restore: [60,72,84,96,120],
  cost:355, // かぼちゃ10+バター150+小麦95+チーズ100
  time:240, // 素材の成長時間から算出：かぼちゃ15分・小麦240分→長い方の240分
  rarity: [true,true,true,true,true],
  prices:[670],
  materials:["かぼちゃ(種@10)","バター(@150)","小麦(種@95)","チーズ(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kabotya.jpg" },
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/cheese.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  // 10/30開始予定のハロウィンイベント交換ショップで入手予定のレシピ（キャンディ30個で交換）
  name:"不気味に笑うかぼちゃタルト",
  nameI18n:{"ja":"不気味に笑うかぼちゃタルト","en":"Spooky Pumpkin Tart","zh-CN":"怪笑南瓜挞","zh-TW":"怪笑南瓜撻","ko":"낄낄 호박 타르트","th":"ทาร์ตฟักทองยิ้มสยอง"},
  image:"./images/foods/1112.PNG",
  restore: [60,72,84,96,120],
  cost:305, // かぼちゃ10+牛乳50+バター150+小麦95
  time:240, // 素材の成長時間から算出：かぼちゃ15分・小麦240分→長い方の240分
  rarity: [true,true,true,true,true],
  prices:[620],
  materials:["かぼちゃ(種@10)","牛乳(@50)","バター(@150)","小麦(種@95)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kabotya.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/wheat.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  // 10/30開始予定のハロウィンイベント交換ショップで入手予定のレシピ（キャンディ30個で交換）
  name:"ユラユラかぼちゃチョコ",
  nameI18n:{"ja":"ユラユラかぼちゃチョコ","en":"Ghost Pumpkin Chocolate","zh-CN":"幽幽南瓜朱古力","zh-TW":"幽幽南瓜朱古力","ko":"유령 호박 초콜릿","th":"ช็อกโกแลตฟักทองกุ๊กกู๋"},
  image:"./images/foods/1113.PNG",
  restore: [100,120,140,160,200],
  cost:550, // かぼちゃ10+牛乳50×2+チョコソース440
  time:15, // 素材の成長時間から算出：かぼちゃ15分（他はかぼちゃ以外の作物を使用しないため対象外）
  rarity: [true,true,true,true,true],
  prices:[1610],
  materials:["かぼちゃ(種@10)","牛乳(@50)","牛乳(@50)","チョコソース(@440)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kabotya.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/choco_source.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"月うさぎのとろとろ月餅",
  nameI18n:{"ja":"月うさぎのとろとろ月餅","en":"Moon Rabbit Molten Mooncake","zh-CN":"玉兔流心月饼","zh-TW":"玉兔流心月餅","ko":"달토끼의 사르르 미니케이크","th":"ขนมไหว้พระจันทร์กระต่ายหยกไส้ลาวา"},
  image:"./images/foods/115.PNG",
  restore: [35,42,49,56,70],
  cost:300,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[350],
  materials:["米粉(@50)","米粉(@50)","無菌卵(@100)","キンモクセイジャム(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/komeko.jpg" },
    { image:"./images/materials/komeko.jpg" },
    { image:"./images/materials/m_egg.jpg" },
    { image:"./images/materials/jam_kinmokusei.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"キンモクセイのローストミルクティー",
  nameI18n:{"ja":"キンモクセイのローストミルクティー","en":"Roasted Osmanthus Milk Tea","zh-CN":"桂花烤奶茶","zh-TW":"桂花烤奶茶","ko":"계화 로스팅 밀크티","th":"ชานมคั่วดอกหอมหมื่นลี้"},
  image:"./images/foods/116.PNG",
  restore: [55,66,77,88,110],
  cost:250,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[570],
  materials:["牛乳(@50)","牛乳(@50)","あずき(@50)","キンモクセイジャム(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/azuki.jpg" },
    { image:"./images/materials/jam_kinmokusei.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"モルチーズカヌレ",
  nameI18n:{"ja":"モルチーズカヌレ","en":"Maltese Canelé","zh-CN":"马尔济斯可露丽","zh-TW":"馬爾濟斯可露麗","ko":"몰티즈 카눌레","th":"คานาเล่ Maltese"},
  image:"./images/foods/063.PNG",
  restore: [45,54,63,72,90],
  cost:370,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[910],
  materials:["卵(@100)","牛乳(@50)","小麦(種@95)","イチゴ(種@125)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/strawberry.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"レトリバーカヌレ",
  nameI18n:{"ja":"レトリバーカヌレ","en":"Retriever Canelé","zh-CN":"小金毛可露丽","zh-TW":"小金毛可露麗","ko":"리트리버 카눌레","th":"คานาเล่ Retriever"},
  image:"./images/foods/064.PNG",
  restore: [35,42,49,56,70],
  cost:295,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[590],
  materials:["卵(@100)","牛乳(@50)","小麦(種@95)","コーヒー豆(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/coffee.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"モルチーズコンパンナ",
  nameI18n:{"ja":"モルチーズコンパンナ","en":"Maltese Con Panna","zh-CN":"马尔济斯康宝蓝","zh-TW":"馬爾濟斯康寶藍","ko":"몰티즈 콘파나","th":"คัมโบแรน Maltese"},
  image:"./images/foods/065.PNG",
  restore: [45,54,63,72,90],
  cost:350,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[520],
  materials:["牛乳(@50)","牛乳(@50)","牛乳(@50)","コーヒー(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/r_coffee.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"レトリバーコンパンナ",
  nameI18n:{"ja":"レトリバーコンパンナ","en":"Retriever Con Panna","zh-CN":"小金毛康宝蓝","zh-TW":"小金毛康寶藍","ko":"리트리버 콘파나","th":"คัมโบแรน Retriever"},
  image:"./images/foods/066.PNG",
  restore: [45,54,63,72,90],
  cost:350,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[520],
  materials:["牛乳(@50)","牛乳(@50)","コーヒー豆(@50)","コーヒー(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/r_coffee.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ラブリーMALTESEコンパンナ",
  nameI18n:{"ja":"ラブリーMALTESEコンパンナ","en":"Lovely Maltese Con Panna","zh-CN":"爱心小狗康宝蓝","zh-TW":"愛心小狗康寶藍","ko":"하트 강아지","th":"คัมโบแรน Maltese"},
  image:"./images/foods/067.PNG",
  restore: [85,102,119,136,170],
  cost:500,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[1220],
  materials:["牛乳(@50)","牛乳(@50)","コーヒー(@200)","コーヒー(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/r_coffee.jpg" },
    { image:"./images/materials/r_coffee.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"若草のケーキ",
  nameI18n:{"ja":"若草のケーキ","en":"Spring Green Cake","zh-CN":"青草蛋糕","zh-TW":"青草蛋糕","ko":"잔디 케이크","th":"เค้กต้นหญ้า"},
  image:"./images/foods/057.PNG",
  restore: [50,60,70,80,100],
  cost:395,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[690],
  materials:["小麦(種@95)","牛乳(@50)","抹茶パウダー(@250)","雑草"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/mattya.jpg" },
    { image:"./images/materials/grass.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"虹のときめきグミ",
  nameI18n:{"ja":"虹のときめきグミ","en":"Rainbow Sparkle Gummy","zh-CN":"遇见彩虹心动软糖","zh-TW":"遇見彩虹心動軟糖","ko":"무지개 심쿵 젤리","th":"ลูกอมสายรุ้ง"},
  image:"./images/foods/070.PNG",
  restore: [20,24,28,32,40],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[170],
  materials:["果物ならなんでもOK","果物ならなんでもOK","果物ならなんでもOK","果物ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/all_fruit.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"虹のドキドキグミ",
  nameI18n:{"ja":"虹のドキドキグミ","en":"Rainbow Thrill Gummy","zh-CN":"吃定彩虹爱心软糖","zh-TW":"吃定彩虹愛心軟糖","ko":"무지개 하트 캔디","th":"ลูกอมสายรุ้งพิชิตใจ"},
  image:"./images/foods/069.PNG",
  restore: [20,24,28,32,40],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[170],
  materials:["果物ならなんでもOK","果物ならなんでもOK","果物ならなんでもOK","果物ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/all_fruit.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"バンチョおすすめエビフライ寿司",
  nameI18n:{"ja":"バンチョおすすめエビフライ寿司","en":"Fried Shrimp Sushi (Bancho's Pick)","zh-CN":"班乔力荐炸虾寿司","zh-TW":"班喬力薦炸蝦壽司","ko":"반쵸 추천 새우튀김 특초밥","th":"ซูชิกุ้งทอดสูตรเด็ดของ Bancho"},
  image:"./images/foods/105.PNG",
  restore: [45,54,63,72,90],
  cost:112,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[430],
  materials:["稲(種@12)","料理油(@100)","コウライエビ","ウミエビ"],
  level:1,
  materials_image:[
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/oil.jpg" },
    { image:"./images/materials/kouraiebi.jpg" },
    { image:"./images/materials/umiebi.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"バンチョおすすめ玉子丼",
  nameI18n:{"ja":"バンチョおすすめ玉子丼","en":"Egg Rice Bowl (Bancho's Pick)","zh-CN":"班乔力荐鸡蛋盖饭","zh-TW":"班喬力薦雞蛋蓋飯","ko":"반쵸 추천 바다포도 계란덮밥","th":"ข้าวหน้าไข่สูตรเด็ดของ Bancho"},
  image:"./images/foods/106.PNG",
  restore: [40,48,56,64,80],
  cost:124,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[310],
  materials:["稲(種@12)","稲(種@12)","卵(@100)","海ぶどう"],
  level:1,
  materials_image:[
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/umibudo.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"シナモロールのクレープ",
  nameI18n:{"ja":"シナモロールのクレープ","en":"Cinnamoroll Crepe","zh-CN":"大耳狗可丽饼","zh-TW":"大耳狗可麗餅","ko":"시나모롤 크레페","th":"เครป Cinnamoroll"},
  image:"./images/foods/102.PNG",
  restore: [80,96,112,128,160],
  cost:395,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[670],
  materials:["小麦(種@95)","バター(@150)","卵(@100)","コーヒー豆(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/coffee.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"クロミのクレープ",
  nameI18n:{"ja":"クロミのクレープ","en":"Kuromi Crepe","zh-CN":"酷洛米可丽饼","zh-TW":"酷洛米可麗餅","ko":"쿠로미 크레페","th":"เครป Kuromi"},
  image:"./images/foods/103.PNG",
  restore: [80,96,112,128,160],
  cost:345,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[670],
  materials:["小麦(種@95)","バター(@150)","卵(@100)","ラズベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"マイメロのクレープ",
  nameI18n:{"ja":"マイメロのクレープ","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/104.PNG",
  restore: [80,96,112,128,160],
  cost:395,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[670],
  materials:["小麦(種@95)","バター(@150)","卵(@100)","牛乳(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"7層バーガー",
  nameI18n:{"ja":"7層バーガー","en":"Septuple King Burger","zh-CN":"七层大皇堡","zh-TW":"七層大漢堡","ko":"육즙 폭발 7단 버거","th":"บิ๊กเบอร์เกอร์"},
  image:"./images/foods/108.PNG",
  restore: [100,120,140,160,200],
  cost:640, // 小麦95+極上ビーフ200×2+レタス145（既存レシピの単価から算出）
  time:480,
  rarity: [true,true,true,true,true],
  prices:[1220],
  materials:["小麦(種@95)","極上ビーフ(@200)","極上ビーフ(@200)","レタス(種@145)"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/g_beef.jpg" },
    { image:"./images/materials/g_beef.jpg" },
    { image:"./images/materials/lettuce.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サクサクソース手羽先",
  nameI18n:{"ja":"サクサクソース手羽先","en":"Saucy Crispy Chicken Wings","zh-CN":"酱酱脆鸡翅","zh-TW":"沾醬香雞翅","ko":"소스 듬뿍 크리스피 윙","th":"ปีกไก่กรอบ"},
  image:"./images/foods/109.PNG",
  restore: [50,60,70,80,100],
  cost:400, // 極上チキン100×3+調味油100（料理油と同単価として既存レシピから算出）
  time:0,
  rarity: [true,true,true,true,true],
  prices:[450],
  materials:["極上チキン(@100)","極上チキン(@100)","極上チキン(@100)","調味油(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/g_chicken.jpg" },
    { image:"./images/materials/g_chicken.jpg" },
    { image:"./images/materials/g_chicken.jpg" },
    { image:"./images/materials/oil.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ダブル肉厚チキンバーガー",
  nameI18n:{"ja":"ダブル肉厚チキンバーガー","en":"Double Chicken Burger","zh-CN":"双层厚鸡堡","zh-TW":"雙層雞排堡","ko":"더블 치킨버거","th":"เบอร์เกอร์ไก่กรอบ"},
  image:"./images/foods/110.PNG",
  restore: [100,120,140,160,200],
  cost:435, // 小麦95×2+極上チキン100+レタス145（既存レシピの単価から算出）
  time:480,
  rarity: [true,true,true,true,true],
  prices:[1210],
  materials:["小麦(種@95)","小麦(種@95)","極上チキン(@100)","レタス(種@145)"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/g_chicken.jpg" },
    { image:"./images/materials/lettuce.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"コーヒー",
  nameI18n:{"ja":"コーヒー","en":"Coffee","zh-CN":"咖啡","zh-TW":"咖啡","ko":"커피","th":"กาแฟ"},
  image:"./images/foods/034.PNG",
  restore: [40,48,56,64,80],
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[290],
  materials:["コーヒー豆(@50)","コーヒー豆(@50)","コーヒーの材料ならなんでもOK","コーヒーの材料ならなんでもOK"],
  level:2,
  materials_image:[
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"カフェラテ",
  nameI18n:{"ja":"カフェラテ","en":"Café Latte","zh-CN":"拿铁咖啡","zh-TW":"拿鐵咖啡","ko":"카페라떼","th":"กาแฟลาเต้"},
  image:"./images/foods/035.PNG",
  restore: [40,48,56,64,80],
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[300],
  materials:["コーヒー豆(@50)","コーヒー豆(@50)","牛乳(@50)","牛乳(@50)"],
  level:2,
  materials_image:[
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"スモークサーモンベーグル",
  nameI18n:{"ja":"スモークサーモンベーグル","en":"Smoked Salmon Bagel","zh-CN":"熏鱼贝果","zh-TW":"燻魚貝果","ko":"훈제 연어 베이글","th":"เบเกิลปลารมควัน"},
  image:"./images/foods/036.PNG",
  restore: [50,60,70,80,100],
  cost:205,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[520],
  materials:["魚ならなんでもOK","チーズ(@100)","野菜ならなんでもOK","小麦(種@95)"],
  level:2,
  materials_image:[
    { image:"./images/materials/all_fish.jpg" },
    { image:"./images/materials/cheese.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/wheat.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"海ぶどうとシイタケの茶碗蒸し",
  nameI18n:{"ja":"海ぶどうとシイタケの茶碗蒸し","en":"Sea Grape & Shiitake Chawanmushi","zh-CN":"海葡萄香菇茶碗蒸","zh-TW":"海葡萄香菇茶碗蒸","ko":"바다포도 표고버섯 달걀찜","th":"ไข่ตุ๋นเห็ดหอมองุ่นทะเล"},
  image:"./images/foods/097.PNG",
  restore: [35,42,49,56,70],
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[230],
  materials:["海ぶどう","海ぶどう","シイタケ","無菌卵(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/shitake.jpg" },
    { image:"./images/materials/m_egg.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ワカメと肉団子のスープ",
  nameI18n:{"ja":"ワカメと肉団子のスープ","en":"Wakame Meatball Soup","zh-CN":"裙带菜肉丸汤","zh-TW":"裙帶菜肉丸湯","ko":"미역 완자탕","th":"ซุปลูกชิ้นวากาเมะ"},
  image:"./images/foods/098.PNG",
  restore: [55,66,77,88,110],
  cost:400,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[500],
  materials:["ワカメ","ワカメ","肉(@200)","肉(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/meat.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"シーフードリゾット",
  nameI18n:{"ja":"シーフードリゾット","en":"Seafood Risotto","zh-CN":"海鲜烩饭","zh-TW":"海鮮燴飯","ko":"씨푸드 덮밥","th":"ข้าวผัดซีฟู้ด"},
  image:"./images/foods/037.PNG",
  restore: [40,48,56,64,80],
  cost:105,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[490],
  materials:["海鮮ならなんでもOK","海鮮ならなんでもOK","小麦(種@95)","トマト(種@10)"],
  level:3,
  materials_image:[
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tomato.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"カントリー風煮込み",
  nameI18n:{"ja":"カントリー風煮込み","en":"Country-style Stew","zh-CN":"乡村炖菜","zh-TW":"鄉村燉菜","ko":"컨트리 스튜","th":"ราตาตุย"},
  image:"./images/foods/038.PNG",
  restore: [60,72,84,96,120],
  cost:185,
  time:640,
  rarity: [true,true,true,true,true],
  prices:[640],
  materials:["トマト(種@10)","じゃがいも(種@30)","レタス(種@145)",""],
  level:3,
  materials_image:[
    { image:"./images/materials/tomato.jpg" },
    { image:"./images/materials/potato.jpg" },
    { image:"./images/materials/lettuce.jpg" },
    { image:null }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"トリュフのクリームパスタ",
  nameI18n:{"ja":"トリュフのクリームパスタ","en":"Truffle Cream Pasta","zh-CN":"黑松露奶油意面","zh-TW":"黑松露奶油義麵","ko":"검은 트러플 크림 파스타","th":"พาสตาครีมทรัฟเฟิลดำ"},
  image:"./images/foods/039.PNG",
  restore: [90,108,126,144,180],
  cost:240,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[900],
  materials:["トリュフ","小麦(種@95)","小麦(種@95)","牛乳(@50)"],
  level:3,
  materials_image:[
    { image:"./images/materials/truffle.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" }
  ],
  authTarget: 480, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"シーアスパラガスのエビチャーハン",
  nameI18n:{"ja":"シーアスパラガスのエビチャーハン","en":"Glasswort & Shrimp Fried Rice","zh-CN":"海芦笋虾仁炒饭","zh-TW":"海蘆筍蝦仁炒飯","ko":"바다 아스파라거스 새우 볶음밥","th":"ข้าวผัดกุ้งสาหร่ายทะเล"},
  image:"./images/foods/099.PNG",
  restore: [25,30,35,40,50],
  cost:12,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[160],
  materials:["稲(種@12)","シーアスパラガス","シーアスパラガス","ウミエビ"],
  level:1,
  materials_image:[
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/sea_asupara.jpg" },
    { image:"./images/materials/sea_asupara.jpg" },
    { image:"./images/materials/umiebi.jpg" }
  ],
  authTarget: 960, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"シーフードピザ",
  nameI18n:{"ja":"シーフードピザ","en":"Seafood Pizza","zh-CN":"海鲜披萨","zh-TW":"海鮮披薩","ko":"씨푸드 피자","th":"พิซซ่าทะเล"},
  image:"./images/foods/040.PNG",
  restore: [70,84,98,112,140],
  cost:235,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[780],
  materials:["チーズ(@100)","トマトソース(@40)","小麦(種@95)","魚ならなんでもOK"],
  level:4,
  materials_image:[
    { image:"./images/materials/cheese.jpg" },
    { image:"./images/materials/tomato_source.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/all_fish.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ミートソースパスタ",
  nameI18n:{"ja":"ミートソースパスタ","en":"Meat Sauce Pasta","zh-CN":"肉酱意面","zh-TW":"肉醬義大利麵","ko":"미트소스 파스타","th":"พาสตาซอสเนื้อ"},
  image:"./images/foods/041.PNG",
  restore: [80,96,112,128,160],
  cost:405,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[670],
  materials:["肉(@200)","小麦(種@95)","トマト(種@10)","チーズ(@100)"],
  level:4,
  materials_image:[
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tomato.jpg" },
    { image:"./images/materials/cheese.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"アップルパイ",
  nameI18n:{"ja":"アップルパイ","en":"Apple Pie","zh-CN":"苹果派","zh-TW":"蘋果派","ko":"애플파이","th":"พายแอปเปิล"},
  image:"./images/foods/042.PNG",
  restore: [70,84,98,112,140],
  cost:345,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[730],
  materials:["リンゴ","小麦(種@95)","卵(@100)","バター(@150)"],
  level:5,
  materials_image:[
    { image:"./images/materials/ringo.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/batter.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ニンジンケーキ",
  nameI18n:{"ja":"ニンジンケーキ","en":"Carrot Cake","zh-CN":"胡萝卜蛋糕","zh-TW":"胡蘿蔔蛋糕","ko":"당근 케이크","th":"เค้กแครอท"},
  image:"./images/foods/043.PNG",
  restore: [55,66,77,88,110],
  cost:245,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[840],
  materials:["ニンジン(種@25)","ニンジン(種@25)","卵(@100)","小麦(種@95)"],
  level:5,
  materials_image:[
    { image:"./images/materials/carrot.jpg" },
    { image:"./images/materials/carrot.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/wheat.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"コーンポタージュ",
  nameI18n:{"ja":"コーンポタージュ","en":"Corn Potage","zh-CN":"玉米浓汤","zh-TW":"玉米濃湯","ko":"콘수프","th":"ซุปข้าวโพด"},
  image:"./images/foods/044.PNG",
  restore: [80,96,112,128,160],
  cost:540,
  time:720,
  rarity: [true,true,true,true,true],
  prices:[1340],
  materials:["トウモロコシ(種@170)","トウモロコシ(種@170)","牛乳(@50)","バター(@150)"],
  level:5,
  materials_image:[
    { image:"./images/materials/corn.jpg" },
    { image:"./images/materials/corn.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/batter.jpg" }
  ],
  authTarget: 720, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"豪華海鮮盛り合わせ",
  nameI18n:{"ja":"豪華海鮮盛り合わせ","en":"Deluxe Seafood Platter","zh-CN":"豪华海鲜拼盘","zh-TW":"豪華海鮮拼盤","ko":"럭셔리 씨푸드 플래터","th":"จานทะเลรวมหรูหรา"},
  image:"./images/foods/045.PNG",
  restore: [65,78,91,104,130],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[410],
  materials:["北欧アカザエビ","北欧アカザエビ","魚ならなんでもOK","魚ならなんでもOK"],
  level:6,
  materials_image:[
    { image:"./images/materials/akaza.jpg" },
    { image:"./images/materials/akaza.jpg" },
    { image:"./images/materials/all_fish.jpg" },
    { image:"./images/materials/all_fish.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ティラミス",
  nameI18n:{"ja":"ティラミス","en":"Tiramisu","zh-CN":"提拉米苏","zh-TW":"提拉米蘇","ko":"티라미수","th":"ทีรามิสุ"},
  image:"./images/foods/046.PNG",
  restore: [65,78,91,104,130],
  cost:300,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[530],
  materials:["コーヒー豆(@50)","卵(@100)","牛乳(@50)","チーズ(@100)"],
  level:6,
  materials_image:[
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/cheese.jpg" }
  ],
  authTarget: 480, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"キャンプセット",
  nameI18n:{"ja":"キャンプセット","en":"Camping Set","zh-CN":"露营套餐","zh-TW":"露營套餐","ko":"캠핑 세트","th":"เซ็ตแคมป์ปิ้ง"},
  image:"./images/foods/047.PNG",
  restore: [100,120,140,160,200],
  cost:840,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[2260],
  materials:["コーヒー(@200)","シーフードピザ(@235)","アップルパイ(@345)","フィッシュアンドチップス(@60)"],
  level:7,
  materials_image:[
    { image:"./images/materials/r_coffee.jpg" },
    { image:"./images/materials/seafood_pizza.jpg" },
    { image:"./images/materials/apple_pie.jpg" },
    { image:"./images/materials/fish_Chips.jpg" }
  ],
  authTarget: 480, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"英式アフタヌーンティー",
  nameI18n:{"ja":"英式アフタヌーンティー","en":"English Afternoon Tea","zh-CN":"英式下午茶","zh-TW":"英式下午茶","ko":"잉글리시 애프터눈 티","th":"น้ำชายามบ่ายสไตล์อังกฤษ"},
  image:"./images/foods/048.PNG",
  restore: [25,30,35,40,50],
  cost:300,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[710],
  materials:["ティラミス(@300)","ジャムの材料ならなんでもOK","",""],
  level:7,
  materials_image:[
    { image:"./images/materials/teiramisu.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:null },
    { image:null }
  ],
  authTarget: 480, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ミートバーガー",
  nameI18n:{"ja":"ミートバーガー","en":"Meat Burger","zh-CN":"鲜肉汉堡","zh-TW":"鮮肉漢堡","ko":"미트버거","th":"แฮมเบอร์เกอร์เนื้อสด"},
  image:"./images/foods/049.PNG",
  restore: [75,90,105,120,150],
  cost:480,
  time:480,
  rarity: [true,true,true,true,true],
  prices:[1350],
  materials:["小麦(種@95)","肉(@200)","レタス(種@145)","トマトソース(@40)"],
  level:8,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/lettuce.jpg" },
    { image:"./images/materials/tomato_source.jpg" }
  ],
  authTarget: 480, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"アカザエビの前菜",
  nameI18n:{"ja":"アカザエビの前菜","en":"Norway Lobster Appetizer","zh-CN":"鳌虾冷盘","zh-TW":"螯蝦冷盤","ko":"랍스터 냉채","th":"กุ้งเครย์ฟิชเย็น"},
  image:"./images/foods/050.PNG",
  restore: [30,36,42,48,60],
  cost:145,
  time:480,
  rarity: [true,true,true,true,true],
  prices:[850],
  materials:["アカザエビならなんでもOK","アカザエビならなんでもOK","アカザエビならなんでもOK","レタス(種@145)"],
  level:8,
  materials_image:[
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/lettuce.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"北欧ブルーアカザエビの前菜",
  nameI18n:{"ja":"北欧ブルーアカザエビの前菜","en":"Nordic Blue Norway Lobster Appetizer","zh-CN":"蓝色北欧鳌虾冷盘","zh-TW":"藍色北歐螯蝦冷盤","ko":"북유럽파란가재 냉채","th":"กุ้งเครย์ฟิชนอร์สสีน้ำเงิน เย็น"},
  image:"./images/foods/051.PNG",
  restore: [60,72,84,96,120],
  cost:145,
  time:480,
  rarity: [true,true,true,true,true],
  prices:[1310],
  materials:["北欧ブルーアカザエビ","北欧ブルーアカザエビ","北欧ブルーアカザエビ","レタス(種@145)"],
  level:8,
  materials_image:[
    { image:"./images/materials/blue_akaza.jpg" },
    { image:"./images/materials/blue_akaza.jpg" },
    { image:"./images/materials/blue_akaza.jpg" },
    { image:"./images/materials/lettuce.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ナスとひき肉の炒め物",
  nameI18n:{"ja":"ナスとひき肉の炒め物","en":"Stir-fried Eggplant and Ground Meat","zh-CN":"肉酱焗茄子","zh-TW":"肉醬焗茄子","ko":"미트소스 가지 그라탱","th":"มะเขือม่วงอบซอสเนื้อ"},
  image:"./images/foods/052.PNG",
  restore: [75,90,105,120,150],
  cost:475,
  time:420,
  rarity: [true,true,true,true,true],
  prices:[1230],
  materials:["ナス(種@135)","肉(@200)","料理油(@100)","トマトソース(@40)"],
  level:10,
  materials_image:[
    { image:"./images/materials/eggplant.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/oil.jpg" },
    { image:"./images/materials/tomato_source.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"キャンドルディナー",
  nameI18n:{"ja":"キャンドルディナー","en":"Candlelight Dinner","zh-CN":"烛光晚餐","zh-TW":"燭光晚餐","ko":"캔들라이트 디너","th":"ดินเนอร์ใต้แสงเทียน"},
  image:"./images/foods/053.PNG",
  restore: [75,90,105,120,150],
  cost:630,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[1760],
  materials:["田園サラダ(@20)","スモークサーモンベーグル(@205)","シーフードリゾット(@105)","ティラミス(@300)"],
  level:9,
  materials_image:[
    { image:"./images/materials/salad.jpg" },
    { image:"./images/materials/salmon_bagel.jpg" },
    { image:"./images/materials/seafood_rizotto.jpg" },
    { image:"./images/materials/teiramisu.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"蒸しタラバガニ",
  nameI18n:{"ja":"蒸しタラバガニ","en":"Steamed King Crab","zh-CN":"清蒸帝王蟹","zh-TW":"清蒸帝王蟹","ko":"킹크랩찜","th":"เรดคิงแครบนึ่ง"},
  image:"./images/foods/054.PNG",
  restore: [90,108,126,144,180],
  cost:150,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[1990],
  materials:["タラバガニならなんでもOK","タラバガニならなんでもOK","タラバガニならなんでもOK","バター(@150)"],
  level:10,
  materials_image:[
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/batter.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"蒸し黄金タラバガニ",
  nameI18n:{"ja":"蒸し黄金タラバガニ","en":"Steamed Golden King Crab","zh-CN":"清蒸黄金帝王蟹","zh-TW":"清蒸黃金帝王蟹","ko":"황금 킹크랩찜","th":"เรดคิงแครบทองคำนึ่ง"},
  image:"./images/foods/055.PNG",
  restore: [100,120,140,160,200],
  cost:150,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[2980],
  materials:["黄金タラバガニ","黄金タラバガニ","黄金タラバガニ","バター(@150)"],
  level:10,
  materials_image:[
    { image:"./images/materials/gold_taraba.jpg" },
    { image:"./images/materials/gold_taraba.jpg" },
    { image:"./images/materials/gold_taraba.jpg" },
    { image:"./images/materials/batter.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"香る紅茶",
  nameI18n:{"ja":"香る紅茶","en":"Fragrant Black Tea","zh-CN":"醇香红茶饮","zh-TW":"醇香紅茶飲","ko":"진한 홍차","th":"ชาดำหอมกรุ่น"},
  image:"./images/foods/077.PNG",
  restore: [40,48,56,64,80],
  cost:600,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[840],
  materials:["紅茶(@250)","紅茶(@250)","紅茶の食材ならなんでもOK","紅茶の食材ならなんでもOK"],
  level:11,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"濃厚ミルクティー",
  nameI18n:{"ja":"濃厚ミルクティー","en":"Rich Milk Tea","zh-CN":"香浓奶茶","zh-TW":"香濃奶茶","ko":"밀크티","th":"ชานมหอมเข้มข้น"},
  image:"./images/foods/078.PNG",
  restore: [40,48,56,64,80],
  cost:600,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[840],
  materials:["紅茶(@250)","紅茶(@250)","牛乳(@50)","牛乳(@50)"],
  level:11,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ココアミルクティー",
  nameI18n:{"ja":"ココアミルクティー","en":"Cocoa Milk Tea","zh-CN":"可可奶茶","zh-TW":"可可奶茶","ko":"코코아 밀크티","th":"ชานมโกโก้"},
  image:"./images/foods/079.PNG",
  restore: [70,84,98,112,140],
  cost:660,
  time:300,
  rarity: [true,true,true,true,true],
  prices:[1120],
  materials:["紅茶(@250)","紅茶(@250)","牛乳(@50)","カカオ豆(種@110)"],
  level:11,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/cacao.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"シェイク",
  nameI18n:{"ja":"シェイク","en":"Shake","zh-CN":"奶昔","zh-TW":"奶昔","ko":"밀크셰이크","th":"มิลค์เชค"},
  image:"./images/foods/080.PNG",
  restore: [12,14,17,19,24],
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[400],
  materials:["牛乳(@50)","牛乳(@50)","シェイクの食材ならなんでもOK","シェイクの食材ならなんでもOK"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ココアシェイク",
  nameI18n:{"ja":"ココアシェイク","en":"Cocoa Shake","zh-CN":"可可奶昔","zh-TW":"可可奶昔","ko":"초코 밀크셰이크","th":"โกโก้มิลค์เชค"},
  image:"./images/foods/081.PNG",
  restore: [55,66,77,88,110],
  cost:320,
  time:300,
  rarity: [true,true,true,true,true],
  prices:[1120],
  materials:["牛乳(@50)","牛乳(@50)","カカオ豆(種@110)","カカオ豆(種@110)"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/cacao.jpg" },
    { image:"./images/materials/cacao.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ラズベリーシェイク",
  nameI18n:{"ja":"ラズベリーシェイク","en":"Raspberry Shake","zh-CN":"树莓奶昔","zh-TW":"樹莓奶昔","ko":"라즈베리 밀크셰이크","th":"ราสเบอร์รี่มิลค์เชค"},
  image:"./images/foods/082.PNG",
  restore: [15,18,21,24,30],
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[440],
  materials:["牛乳(@50)","牛乳(@50)","ラズベリー","ラズベリー"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/razuberi.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ブルーベリーシェイク",
  nameI18n:{"ja":"ブルーベリーシェイク","en":"Blueberry Shake","zh-CN":"蓝莓奶昔","zh-TW":"藍莓奶昔","ko":"블루베리 밀크셰이크","th":"บลูเบอร์รี่มิลค์เชค"},
  image:"./images/foods/083.PNG",
  restore: [12,14,17,19,24],
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[400],
  materials:["牛乳(@50)","牛乳(@50)","ブルーベリー","ブルーベリー"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/buruberi.jpg" },
    { image:"./images/materials/buruberi.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"リンゴシェイク",
  nameI18n:{"ja":"リンゴシェイク","en":"Apple Shake","zh-CN":"苹果奶昔","zh-TW":"蘋果奶昔","ko":"사과 밀크셰이크","th":"แอปเปิลมิลค์เชค"},
  image:"./images/foods/084.PNG",
  restore: [18,22,25,29,36],
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[450],
  materials:["牛乳(@50)","牛乳(@50)","リンゴ","リンゴ"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/ringo.jpg" },
    { image:"./images/materials/ringo.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"オレンジシェイク",
  nameI18n:{"ja":"オレンジシェイク","en":"Orange Shake","zh-CN":"橘子奶昔","zh-TW":"橘子奶昔","ko":"오렌지 밀크셰이크","th":"ส้มมิลค์เชค"},
  image:"./images/foods/085.PNG",
  restore: [18,22,25,29,36],
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[450],
  materials:["牛乳(@50)","牛乳(@50)","オレンジ","オレンジ"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/orange.jpg" },
    { image:"./images/materials/orange.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"パイナップルシェイク",
  nameI18n:{"ja":"パイナップルシェイク","en":"Pineapple Shake","zh-CN":"菠萝奶昔","zh-TW":"鳳梨奶昔","ko":"파인애플 밀크셰이크","th":"สับปะรดมิลค์เชค"},
  image:"./images/foods/086.PNG",
  restore: [15,18,21,24,30],
  cost:130,
  time:30,
  rarity: [true,true,true,true,true],
  prices:[440],
  materials:["牛乳(@50)","牛乳(@50)","パイナップル(種@15)","パイナップル(種@15)"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/pineapple.jpg" },
    { image:"./images/materials/pineapple.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"いちごシェイク",
  nameI18n:{"ja":"いちごシェイク","en":"Strawberry Shake","zh-CN":"草莓奶昔","zh-TW":"草莓奶昔","ko":"딸기 밀크셰이크","th":"สตรอว์เบอร์รี่มิลค์เชค"},
  image:"./images/foods/087.PNG",
  restore: [60,72,84,96,120],
  cost:250,
  time:360,
  rarity: [true,true,true,true,true],
  prices:[1090],
  materials:["牛乳(@50)","牛乳(@50)","いちご(種@125)","いちご(種@125)"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/strawberry.jpg" },
    { image:"./images/materials/strawberry.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ブドウシェイク",
  nameI18n:{"ja":"ブドウシェイク","en":"Grape Shake","zh-CN":"葡萄奶昔","zh-TW":"葡萄奶昔","ko":"포도 밀크셰이크","th":"องุ่นมิลค์เชค"},
  image:"./images/foods/088.PNG",
  restore: [70,84,98,112,140],
  cost:420,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[1300],
  materials:["牛乳(@50)","牛乳(@50)","ブドウ(種@160)","ブドウ(種@160)"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/grape.jpg" },
    { image:"./images/materials/grape.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"抹茶シェイク",
  nameI18n:{"ja":"抹茶シェイク","en":"Matcha Shake","zh-CN":"抹茶奶昔","zh-TW":"抹茶奶昔","ko":"말차 밀크셰이크","th":"มิลค์เชคชาเขียว"},
  image:"./images/foods/089.PNG",
  restore: [40,48,56,64,80],
  cost:600,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[840],
  materials:["牛乳(@50)","牛乳(@50)","抹茶パウダー(@250)","抹茶パウダー(@250)"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/mattya.jpg" },
    { image:"./images/materials/mattya.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"フレッシュ緑茶",
  nameI18n:{"ja":"フレッシュ緑茶","en":"Fresh Green Tea","zh-CN":"清新绿茶饮","zh-TW":"清新綠茶飲","ko":"상큼한 그린티","th":"ชาเขียวสดชื่น"},
  image:"./images/foods/090.PNG",
  restore: [25,30,35,40,50],
  cost:100,
  time:45,
  rarity: [true,true,true,true,true],
  prices:[500],
  materials:["茶葉(種@25)","茶葉(種@25)","緑茶の食材ならなんでもOK","緑茶の食材ならなんでもOK"],
  level:12,
  materials_image:[
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"フレッシュミルクティー",
  nameI18n:{"ja":"フレッシュミルクティー","en":"Fresh Milk Tea","zh-CN":"清新奶绿","zh-TW":"清新奶綠","ko":"상큼한 그린 밀크티","th":"ชาเขียวนมสดชื่น"},
  image:"./images/foods/091.PNG",
  restore: [25,30,35,40,50],
  cost:150,
  time:45,
  rarity: [true,true,true,true,true],
  prices:[500],
  materials:["茶葉(種@25)","茶葉(種@25)","牛乳(@50)","牛乳(@50)"],
  level:12,
  materials_image:[
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"抹茶ミルクティー",
  nameI18n:{"ja":"抹茶ミルクティー","en":"Matcha Milk Tea","zh-CN":"抹茶奶绿","zh-TW":"抹茶奶綠","ko":"말차 그린 밀크티","th":"ชาเขียวนม"},
  image:"./images/foods/092.PNG",
  restore: [35,42,49,56,70],
  cost:350,
  time:45,
  rarity: [true,true,true,true,true],
  prices:[700],
  materials:["茶葉(種@25)","茶葉(種@25)","牛乳(@50)","抹茶パウダー(@250)"],
  level:12,
  materials_image:[
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/mattya.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ヒナギクハーブティー",
  nameI18n:{"ja":"ヒナギクハーブティー","en":"Daisy Herbal Tea","zh-CN":"雏菊花茶","zh-TW":"雛菊花茶","ko":"국화차","th":"ชาดอกเดซี่"},
  image:"./images/foods/093.PNG",
  restore: [20,24,28,32,40],
  cost:110,
  time:1440,
  rarity: [true,true,true,true,true],
  prices:[600],
  materials:["茶葉(種@25)","茶葉(種@25)","白いヒナギク(種@30)","白いヒナギク(種@30)"],
  level:12,
  materials_image:[
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/hinagiku.jpg" },
    { image:"./images/materials/hinagiku.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"ローズティー",
  nameI18n:{"ja":"ローズティー","en":"Rose Tea","zh-CN":"玫瑰花茶","zh-TW":"玫瑰花茶","ko":"로즈티","th":"ชาดอกกุหลาบ"},
  image:"./images/foods/094.PNG",
  restore: [80,96,112,128,160],
  cost:650,
  time:4320,
  rarity: [true,true,true,true,true],
  prices:[1930],
  materials:["茶葉(種@25)","茶葉(種@25)","赤いバラ(種@300)","赤いバラ(種@300)"],
  level:12,
  materials_image:[
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/rose.jpg" },
    { image:"./images/materials/rose.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"アフターヌーンティー",
  nameI18n:{"ja":"アフターヌーンティー","en":"Afternoon Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/095.PNG",
  restore: [65,78,91,104,130],
  cost:1690,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[2970],
  materials:["チーズケーキ(@245)","チーズケーキ(@245)","香る紅茶(@600)","香る紅茶(@600)"],
  level:12,
  materials_image:[
    { image:"./images/materials/cheese_cake.jpg" },
    { image:"./images/materials/cheese_cake.jpg" },
    { image:"./images/materials/k_kotya.jpg" },
    { image:"./images/materials/k_kotya.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"エビのアボカドカップ詰め",
  nameI18n:{"ja":"エビのアボカドカップ詰め","en":"Shrimp-stuffed Avocado Cup","zh-CN":"鲜虾牛油果杯","zh-TW":"鮮蝦酪梨杯","ko":"새우 아보카도 컵","th":"ถ้วยอะโวคาโดกุ้งสด"},
  image:"./images/foods/100.PNG",
  restore: [80,96,112,128,160],
  cost:360,
  time:840,
  rarity: [true,true,true,true,true],
  prices:[1560],
  materials:["アカザエビならなんでもOK","アカザエビならなんでもOK","アボカド(種@180)","アボカド(種@180)"],
  level:13,
  materials_image:[
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/avocado.jpg" },
    { image:"./images/materials/avocado.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"チーズカニ爪フライ",
  nameI18n:{"ja":"チーズカニ爪フライ","en":"Fried Cheese Crab Claw","zh-CN":"芝士鲜虾炸蟹钳","zh-TW":"芝士鮮蝦炸蟹鉗","ko":"치즈 새우와 집게발 튀김","th":"ก้ามปูทอดชีสกุ้งสด"},
  image:"./images/foods/101.PNG",
  restore: [80,96,112,128,160],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[1440],
  materials:["タラバガニならなんでもOK","タラバガニならなんでもOK","アカザエビならなんでもOK","アカザエビならなんでもOK"],
  level:13,
  materials_image:[
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" }
  ],
  authTarget: 360, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:true
},
{
  name:"アイスカップコーヒー",
  nameI18n:{"ja":"アイスカップコーヒー","en":"Iced Cup Coffee","zh-CN":"冰杯咖啡","zh-TW":"冰杯咖啡","ko":"얼음컵 커피","th":"กาแฟแก้วน้ำแข็ง"},
  season:true,
  ended:true,
  image:"./images/foods/1001.PNG",
  restore: [20,24,28,32,40],
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[280],
  materials:["シュガー(@50)","コーヒー豆(@50)","コーヒーの材料ならなんでもOK","コーヒーの材料ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/sugar.jpg" },
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"アイスカップカフェラテ",
  nameI18n:{"ja":"アイスカップカフェラテ","en":"Iced Cup Café Latte","zh-CN":"冰杯拿铁","zh-TW":"冰杯拿鐵","ko":"얼음컵 라떼","th":"ลาเต้แก้วน้ำแข็ง"},
  season:true,
  ended:true,
  image:"./images/foods/1002.PNG",
  restore: [20,24,28,32,40],
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[280],
  materials:["シュガー(@50)","コーヒー豆(@50)","牛乳(@50)","牛乳(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/sugar.jpg" },
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"大根おろし肉",
  nameI18n:{"ja":"大根おろし肉","en":"Grated Daikon with Meat","zh-CN":"白萝卜泥肉","zh-TW":"白蘿蔔泥肉","ko":"갈은 무와 스테이크","th":"เนื้อผสมหัวไชเท้าบด"},
  season:true,
  ended:true,
  image:"./images/foods/1003.PNG",
  restore: [40,48,56,64,80],
  cost:560,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[630],
  materials:["肉(@200)","肉(@200)","バター(@150)","大根(種@10)"],
  level:1,
  materials_image:[
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/daikon.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"大根クリームポタージュ",
  nameI18n:{"ja":"大根クリームポタージュ","en":"Daikon Cream Potage","zh-CN":"白萝卜奶油浓汤","zh-TW":"白蘿蔔奶油濃湯","ko":"무 크림 수프","th":"ซุปครีมหัวไชเท้า"},
  season:true,
  ended:true,
  image:"./images/foods/1004.PNG",
  restore: [25,30,35,40,50],
  cost:220,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[340],
  materials:["牛乳(@50)","バター(@150)","大根(種@10)","大根(種@10)"],
  level:1,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/daikon.jpg" },
    { image:"./images/materials/daikon.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"シュガーパンケーキ(プレーン)",
  nameI18n:{"ja":"シュガーパンケーキ(プレーン)","en":"Sugar Pancake (Plain)","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:true,
  image:"./images/foods/1005.PNG",
  restore: [25,30,35,40,50],
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[330],
  materials:["卵(@100)","牛乳(@50)","シュガー(@50)","果物ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/sugar.jpg" },
    { image:"./images/materials/all_fruit.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"シュガーパンケーキ(ブルーベリー)",
  nameI18n:{"ja":"シュガーパンケーキ(ブルーベリー)","en":"Sugar Pancake (Blueberry)","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:true,
  image:"./images/foods/1006.PNG",
  restore: [25,30,35,40,50],
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[330],
  materials:["卵(@100)","牛乳(@50)","シュガー(@50)","ブルーベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/sugar.jpg" },
    { image:"./images/materials/buruberi.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"シュガーパンケーキ(ラズベリー)",
  nameI18n:{"ja":"シュガーパンケーキ(ラズベリー)","en":"Sugar Pancake (Raspberry)","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:true,
  image:"./images/foods/1007.PNG",
  restore: [25,30,35,40,50],
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[350],
  materials:["卵(@100)","牛乳(@50)","シュガー(@50)","ラズベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/sugar.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"シュガーパンケーキ(アップル)",
  nameI18n:{"ja":"シュガーパンケーキ(アップル)","en":"Sugar Pancake (Apple)","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:true,
  image:"./images/foods/1008.PNG",
  restore: [25,30,35,40,50],
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[360],
  materials:["卵(@100)","牛乳(@50)","シュガー(@50)","リンゴ"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/sugar.jpg" },
    { image:"./images/materials/ringo.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"シュガーパンケーキ(オレンジ)",
  nameI18n:{"ja":"シュガーパンケーキ(オレンジ)","en":"Sugar Pancake (Orange)","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:true,
  image:"./images/foods/1009.PNG",
  restore: [25,30,35,40,50],
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[360],
  materials:["卵(@100)","牛乳(@50)","シュガー(@50)","オレンジ"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/sugar.jpg" },
    { image:"./images/materials/orange.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"オーロラディナー",
  nameI18n:{"ja":"オーロラディナー","en":"Aurora Dinner","zh-CN":"极光晚宴","zh-TW":"極光晚宴","ko":"오로라 만찬","th":"งานเลี้ยงออโรร่า"},
  season:true,
  ended:true,
  image:"./images/foods/1010.PNG",
  restore: [40,48,56,64,80],
  cost:1180,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[1630],
  materials:["大根おろし肉(@560)","大根クリームポタージュ(@220)","アイスカップコーヒーの材料ならなんでもOK","シュガーパンケーキの料理ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/daikon_meat.jpg" },
    { image:"./images/materials/daikon_potage.jpg" },
    { image:"./images/materials/all_ice_coffee.jpg" },
    { image:"./images/materials/all_pancake.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"積み木ボウルフルーツかき氷",
  nameI18n:{"ja":"積み木ボウルフルーツかき氷","en":"Building Block Bowl Fruit Shaved Ice","zh-CN":"积木碗水果刨冰","zh-TW":"積木碗水果刨冰","ko":"브릭 그릇 프루티 빙수","th":"ตัวต่อชามน้ำแข็งไสผลไม้"},
  fes:true,
  ended:true,
  image:"./images/foods/1011.PNG",
  restore: [20,24,28,32,40],
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[210],
  materials:["練乳(@50)","積み木アイス(@50)","果物ならなんでもOK","果物ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/all_fruit.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"積み木ボウルリンゴかき氷",
  nameI18n:{"ja":"積み木ボウルリンゴかき氷","en":"Building Block Bowl Apple Shaved Ice","zh-CN":"积木碗苹果刨冰","zh-TW":"積木碗蘋果刨冰","ko":"브릭 그릇 사과 빙수","th":"ตัวต่อชามน้ำแข็งไสแอปเปิล"},
  fes:true,
  ended:true,
  image:"./images/foods/1012.PNG",
  restore: [25,30,35,40,50],
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[260],
  materials:["練乳(@50)","積み木アイス(@50)","リンゴ","リンゴ"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/ringo.jpg" },
    { image:"./images/materials/ringo.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"積み木ボウルオレンジかき氷",
  nameI18n:{"ja":"積み木ボウルオレンジかき氷","en":"Building Block Bowl Orange Shaved Ice","zh-CN":"积木碗橘子刨冰","zh-TW":"積木碗橘子刨冰","ko":"브릭 그릇 오렌지 빙수","th":"ตัวต่อชามน้ำแข็งไสส้ม"},
  fes:true,
  ended:true,
  image:"./images/foods/1013.PNG",
  restore: [25,30,35,40,50],
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[260],
  materials:["練乳(@50)","積み木アイス(@50)","オレンジ","オレンジ"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/orange.jpg" },
    { image:"./images/materials/orange.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"積み木ボウブルーベリーかき氷",
  nameI18n:{"ja":"積み木ボウブルーベリーかき氷","en":"Building Block Bowl Blueberry Shaved Ice","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1014.PNG",
  restore: [20,24,28,32,40],
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[220],
  materials:["練乳(@50)","積み木アイス(@50)","ブルーベリー","ブルーベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/buruberi.jpg" },
    { image:"./images/materials/buruberi.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"積み木ボウルラズベリーかき氷",
  nameI18n:{"ja":"積み木ボウルラズベリーかき氷","en":"Building Block Bowl Raspberry Shaved Ice","zh-CN":"积木碗树莓刨冰","zh-TW":"積木碗樹莓刨冰","ko":"브릭 그릇 라즈베리 빙수","th":"ตัวต่อชามน้ำแข็งไสราสเบอร์รี่"},
  fes:true,
  ended:true,
  image:"./images/foods/1015.PNG",
  restore: [25,30,35,40,50],
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[260],
  materials:["練乳(@50)","積み木アイス(@50)","ラズベリー","ラズベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/razuberi.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"積み木ボウルいちごかき氷",
  nameI18n:{"ja":"積み木ボウルいちごかき氷","en":"Building Block Bowl Strawberry Shaved Ice","zh-CN":"积木碗草莓刨冰","zh-TW":"積木碗草莓刨冰","ko":"브릭 그릇 딸기 빙수","th":"ตัวต่อชามน้ำแข็งไสสตรอว์เบอร์รี่"},
  fes:true,
  ended:true,
  image:"./images/foods/1016.PNG",
  restore: [65,78,91,104,130],
  cost:350,
  time:360,
  rarity: [true,true,true,true,true],
  prices:[900],
  materials:["練乳(@50)","積み木アイス(@50)","いちご(種@125)","いちご(種@125)"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/strawberry.jpg" },
    { image:"./images/materials/strawberry.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"積み木ボウルブドウかき氷",
  nameI18n:{"ja":"積み木ボウルブドウかき氷","en":"Building Block Bowl Grape Shaved Ice","zh-CN":"积木碗葡萄刨冰","zh-TW":"積木碗葡萄刨冰","ko":"브릭 그릇 포도 빙수","th":"ตัวต่อชามน้ำแข็งไสองุ่น"},
  fes:true,
  ended:true,
  image:"./images/foods/1017.PNG",
  restore: [80,96,112,128,160],
  cost:420,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[1110],
  materials:["練乳(@50)","積み木アイス(@50)","ブドウ(種@160)","ブドウ(種@160)"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/grape.jpg" },
    { image:"./images/materials/grape.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"積み木ボウルパイナップルかき氷",
  nameI18n:{"ja":"積み木ボウルパイナップルかき氷","en":"Building Block Bowl Pineapple Shaved Ice","zh-CN":"积木碗菠萝刨冰","zh-TW":"積木碗鳳梨刨冰","ko":"브릭 그릇 파인애플 빙수","th":"ตัวต่อชามน้ำแข็งไสสับปะรด"},
  fes:true,
  ended:true,
  image:"./images/foods/1018.PNG",
  restore: [25,30,35,40,50],
  cost:130,
  time:30,
  rarity: [true,true,true,true,true],
  prices:[520],
  materials:["練乳(@50)","積み木アイス(@50)","パイナップル(種@15)","パイナップル(種@15)"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/pineapple.jpg" },
    { image:"./images/materials/pineapple.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"フルーツバーベナテイスティーパイ",
  nameI18n:{"ja":"フルーツバーベナテイスティーパイ","en":"Fruit Verbena Tea Pie","zh-CN":"水果马鞭草风味派","zh-TW":"水果馬鞭草風味派","ko":"프루티 버베나 스페셜 파이","th":"พายรสผลไม้ผสมเวอร์บีนา"},
  fes:true,
  ended:true,
  image:"./images/foods/1019.PNG",
  restore: [30,36,42,48,60],
  cost:210,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[360],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","果物ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/all_fruit.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"リンゴバーベナテイスティーパイ",
  nameI18n:{"ja":"リンゴバーベナテイスティーパイ","en":"Apple Verbena Tea Pie","zh-CN":"苹果马鞭草风味派","zh-TW":"蘋果馬鞭草風味派","ko":"사과 버베나 스페셜 파이","th":"พายรสแอปเปิลผสมเวอร์บีน่า"},
  fes:true,
  ended:true,
  image:"./images/foods/1020.PNG",
  restore: [30,36,42,48,60],
  cost:210,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[390],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","リンゴ"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/ringo.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},{
  name:"オレンジバーベナテイスティーパイ",
  nameI18n:{"ja":"オレンジバーベナテイスティーパイ","en":"Orange Verbena Tea Pie","zh-CN":"橘子马鞭草风味派","zh-TW":"橘子馬鞭草風味派","ko":"오렌지 버베나 스페셜 파이","th":"พายรสส้มผสมเวอร์บีน่า"},
  fes:true,
  ended:true,
  image:"./images/foods/1021.PNG",
  restore: [30,36,42,48,60],
  cost:210,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[360],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","オレンジ"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/orange.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ブルーベリーバーベナテイスティーパイ",
  nameI18n:{"ja":"ブルーベリーバーベナテイスティーパイ","en":"Blueberry Verbena Tea Pie","zh-CN":"蓝莓马鞭草风味派","zh-TW":"藍莓馬鞭草風味派","ko":"블루베리 버베나 스페셜 파이","th":"พายรสบลูเบอร์รี่ผสมเวอร์บีน่า"},
  fes:true,
  ended:true,
  image:"./images/foods/1022.PNG",
  restore: [30,36,42,48,60],
  cost:210,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[360],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","ブルーベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/buruberi.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ラズベリーバーベナテイスティーパイ",
  nameI18n:{"ja":"ラズベリーバーベナテイスティーパイ","en":"Raspberry Verbena Tea Pie","zh-CN":"树莓马鞭草风味派","zh-TW":"樹莓馬鞭草風味派","ko":"라즈베리 버베나 스페셜 파이","th":"พายรสราสเบอร์รี่ผสมเวอร์บีน่า"},
  fes:true,
  ended:true,
  image:"./images/foods/1023.PNG",
  restore: [30,36,42,48,60],
  cost:210,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[380],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","ラズベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},{
  name:"いちごバーベナテイスティーパイ",
  nameI18n:{"ja":"いちごバーベナテイスティーパイ","en":"Strawberry Verbena Tea Pie","zh-CN":"草莓马鞭草风味派","zh-TW":"草莓馬鞭草風味派","ko":"딸기 버베나 스페셜 파이","th":"พายรสสตรอว์เบอร์รี่ผสมเวอร์บีน่า"},
  fes:true,
  ended:true,
  image:"./images/foods/1024.PNG",
  restore: [55,66,77,88,110],
  cost:335,
  time:360,
  rarity: [true,true,true,true,true],
  prices:[710],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","いちご(種@125)"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/strawberry.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ブドウバーベナテイスティーパイ",
  nameI18n:{"ja":"ブドウバーベナテイスティーパイ","en":"Grape Verbena Tea Pie","zh-CN":"葡萄马鞭草风味派","zh-TW":"葡萄馬鞭草風味派","ko":"포도 버베나 스페셜 파이","th":"พายรสองุ่นผสมเวอร์บีน่า"},
  fes:true,
  ended:true,
  image:"./images/foods/1025.PNG",
  restore: [60,72,84,96,120],
  cost:370,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[810],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","ブドウ(種@160)"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/grape.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"パイナップルバーベナテイスティーパイ",
  nameI18n:{"ja":"パイナップルバーベナテイスティーパイ","en":"Pineapple Verbena Tea Pie","zh-CN":"菠萝马鞭草风味派","zh-TW":"鳳梨馬鞭草風味派","ko":"파인애플 버베나 스페셜 파이","th":"พายรสสับปะรดผสมเวอร์บีน่า"},
  fes:true,
  ended:true,
  image:"./images/foods/1026.PNG",
  restore: [30,36,42,48,60],
  cost:225,
  time:30,
  rarity: [true,true,true,true,true],
  prices:[380],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","パイナップル(種@15)"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/pineapple.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"積み木パティキノコバーガー",
  nameI18n:{"ja":"積み木パティキノコバーガー","en":"Building Block Patty Mushroom Burger","zh-CN":"积木肉饼蘑菇堡","zh-TW":"積木肉餅蘑菇堡","ko":"브릭 패티 머쉬룸 버거","th":"ตัวต่อเบอร์เกอร์เนื้อเห็ด"},
  fes:true,
  ended:true,
  image:"./images/foods/1027.PNG",
  restore: [40,48,56,64,80],
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[450],
  materials:["小麦(種@95)","積み木パティ(@50)","キノコならなんでもOK","キノコならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tsumiki_meat.jpg" },
    { image:"./images/materials/all_kinoko.jpg" },
    { image:"./images/materials/all_kinoko.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"積み木パティヒラタケバーガー",
  nameI18n:{"ja":"積み木パティヒラタケバーガー","en":"Building Block Patty Oyster Mushroom Burger","zh-CN":"积木肉饼平菇堡","zh-TW":"積木肉餅平菇堡","ko":"브릭 패티 느타리버섯 버거","th":"ตัวต่อเบอร์เกอร์เนื้อเห็ดนางฟ้า"},
  fes:true,
  ended:true,
  image:"./images/foods/1028.PNG",
  restore: [40,48,56,64,80],
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[450],
  materials:["小麦(種@95)","積み木パティ(@50)","ヒラタケ","ヒラタケ"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tsumiki_meat.jpg" },
    { image:"./images/materials/hiratake.jpg" },
    { image:"./images/materials/hiratake.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},{
  name:"積み木パティシイタケバーガー",
  nameI18n:{"ja":"積み木パティシイタケバーガー","en":"Building Block Patty Shiitake Burger","zh-CN":"积木肉饼香菇堡","zh-TW":"積木肉餅香菇堡","ko":"브릭 패티 표고버섯 버거","th":"ตัวต่อเบอร์เกอร์เนื้อเห็ดหอม"},
  fes:true,
  ended:true,
  image:"./images/foods/1029.PNG",
  restore: [40,48,56,64,80],
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[450],
  materials:["小麦(種@95)","積み木パティ(@50)","シイタケ","シイタケ"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tsumiki_meat.jpg" },
    { image:"./images/materials/shitake.jpg" },
    { image:"./images/materials/shitake.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"積み木パティマッシュルームバーガー",
  nameI18n:{"ja":"積み木パティマッシュルームバーガー","en":"Building Block Patty Button Mushroom Burger","zh-CN":"积木肉饼口蘑堡","zh-TW":"積木肉餅口蘑堡","ko":"브릭 패티 양송이버섯 버거","th":"ตัวต่อเบอร์เกอร์เนื้อเห็ดแชมปิญอง"},
  fes:true,
  ended:true,
  image:"./images/foods/1030.PNG",
  restore: [40,48,56,64,80],
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[450],
  materials:["小麦(種@95)","積み木パティ(@50)","マッシュルーム","マッシュルーム"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tsumiki_meat.jpg" },
    { image:"./images/materials/mushroom.jpg" },
    { image:"./images/materials/mushroom.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"積み木パティヤマドリタケバーガー",
  nameI18n:{"ja":"積み木パティヤマドリタケバーガー","en":"Building Block Patty Porcini Burger","zh-CN":"积木肉饼牛肝菌堡","zh-TW":"積木肉餅牛肝菌堡","ko":"브릭 패티 그물버섯 버거","th":"ตัวต่อเบอร์เกอร์เนื้อเห็ดพอร์ชินี"},
  fes:true,
  ended:true,
  image:"./images/foods/1031.PNG",
  restore: [40,48,56,64,80],
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[450],
  materials:["小麦(種@95)","積み木パティ(@50)","ヤマドリタケ","ヤマドリタケ"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tsumiki_meat.jpg" },
    { image:"./images/materials/yamadoritake.jpg" },
    { image:"./images/materials/yamadoritake.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"積み木パティトリュフバーガー",
  nameI18n:{"ja":"積み木パティトリュフバーガー","en":"Building Block Patty Truffle Burger","zh-CN":"积木肉饼黑松露堡","zh-TW":"積木肉餅黑松露堡","ko":"브릭 패티 검은 트러플 버거","th":"ตัวต่อเบอร์เกอร์เนื้อทรัฟเฟิลดำ"},
  fes:true,
  ended:true,
  image:"./images/foods/1032.PNG",
  restore: [55,66,77,88,110],
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[780],
  materials:["小麦(種@95)","積み木パティ(@50)","トリュフ","トリュフ"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tsumiki_meat.jpg" },
    { image:"./images/materials/truffle.jpg" },
    { image:"./images/materials/truffle.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"積み木テーマセット",
  nameI18n:{"ja":"積み木テーマセット","en":"Building Block Theme Set","zh-CN":"积木趣味套餐","zh-TW":"積木趣味套餐","ko":"브릭 재미 세트","th":"ตัวต่อเซ็ตความอร่อย"},
  fes:true,
  ended:true,
  image:"./images/foods/1033.PNG",
  restore: [35,42,49,56,70],
  cost:455,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[1070],
  materials:["積み木ボウルフルーツかき氷ならなんでもOK(@100)","フルーツバーベナテイスティーパイならなんでもOK(@210)","積み木キノコバーガーならなんでもOK(@145)",""],
  level:1,
  materials_image:[
    { image:"./images/materials/tsumiki_kakigori.jpg" },
    { image:"./images/materials/verbena_pie.jpg" },
    { image:"./images/materials/tsumiki_burger.jpg" },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"塩味ポップコーンバケツ",
  nameI18n:{"ja":"塩味ポップコーンバケツ","en":"Salted Popcorn Bucket","zh-CN":"咸香爆米花桶","zh-TW":"鹹香爆米花桶","ko":"솔티 팝콘통","th":"ถังป๊อปคอร์นรสเค็ม"},
  fes:true,
  ended:true,
  image:"./images/foods/1034.PNG",
  restore: [60,72,84,96,120],
  cost:470,
  time:720,
  rarity: [true,true,true,true,true],
  prices:[900],
  materials:["トウモロコシ(種@170)","キノコならなんでもOK","バター(@150)","バター(@150)"],
  level:1,
  materials_image:[
    { image:"./images/materials/corn.jpg" },
    { image:"./images/materials/all_kinoko.jpg" },
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/batter.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"キャラメルポップコーンバケツ",
  nameI18n:{"ja":"キャラメルポップコーンバケツ","en":"Caramel Popcorn Bucket","zh-CN":"焦糖爆米花桶","zh-TW":"焦糖爆米花桶","ko":"캐러멜 팝콘통","th":"ถังป๊อปคอร์นคาราเมล"},
  fes:true,
  ended:true,
  image:"./images/foods/1035.PNG",
  restore: [50,60,70,80,100],
  cost:420,
  time:720,
  rarity: [true,true,true,true,true],
  prices:[820],
  materials:["トウモロコシ(種@170)","春のブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)","バター(@150)"],
  level:1,
  materials_image:[
    { image:"./images/materials/corn.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/batter.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サルサウェーブポテトチップス",
  nameI18n:{"ja":"サルサウェーブポテトチップス","en":"Salsa Wave Potato Chips","zh-CN":"莎莎酱波浪薯片","zh-TW":"莎莎醬波浪薯片","ko":"살사 벌집 감자칩","th":"มันฝรั่งทอดเวฟวี่ซอสซัลซ่า"},
  fes:true,
  ended:true,
  image:"./images/foods/1036.PNG",
  restore: [26,31,36,42,52],
  cost:110,
  time:60,
  rarity: [true,true,true,true,true],
  prices:[280],
  materials:["ジャガイモ(種@30)","ジャガイモ(種@30)","サルサソース(@50)",""],
  level:1,
  materials_image:[
    { image:"./images/materials/potato.jpg" },
    { image:"./images/materials/potato.jpg" },
    { image:"./images/materials/salsa_source.jpg" },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
}, 
{
  name:"塩味2種盛りバケツ",
  nameI18n:{"ja":"塩味2種盛りバケツ","en":"Salted Duo Bucket","zh-CN":"咸香双拼桶","zh-TW":"鹹香雙拼桶","ko":"솔티 듀얼 통","th":"ถังทูโทนรสเค็ม"},
  fes:true,
  ended:true,
  image:"./images/foods/1037.PNG",
  restore: [95,114,133,152,190],
  cost:580,
  time:720,
  rarity: [true,true,true,true,true],
  prices:[1230],
  materials:["塩味ポップコーンバケツ(@470)","サルサウェーブポテトチップス(@110)","",""],
  level:1,
  materials_image:[
    { image:"./images/materials/b_popcorn.jpg" },
    { image:"./images/materials/salsa_chips.jpg" },
    { image:null },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"甘口2種盛りバケツ",
  nameI18n:{"ja":"甘口2種盛りバケツ","en":"Sweet Duo Bucket","zh-CN":"甜蜜双拼桶","zh-TW":"甜蜜雙拼桶","ko":"스위트 듀얼 통","th":"ถังคู่รสหวาน"},
  fes:true,
  ended:true,
  image:"./images/foods/1038.PNG",
  restore: [90,108,126,144,180],
  cost:530,
  time:720,
  rarity: [true,true,true,true,true],
  prices:[1150],
  materials:["キャラメルポップコーンバケツ(@420)","サルサウェーブポテトチップス(@110)","",""],
  level:1,
  materials_image:[
    { image:"./images/materials/r_popcorn.jpg" },
    { image:"./images/materials/salsa_chips.jpg" },
    { image:null },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ロメインレタスタコス",
  nameI18n:{"ja":"ロメインレタスタコス","en":"Romaine Lettuce Taco","zh-CN":"萝蔓莴苣塔可","zh-TW":"蘿蔓萵苣塔可","ko":"로메인 타코","th":"ทาโก้ผักกาดโรเมน"},
  fes:true,
  ended:true,
  image:"./images/foods/1039.PNG",
  restore: [30,36,42,48,60],
  cost:120,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[260],
  materials:["ロメインレタス(種@10)","ロメインレタス(種@10)","サルサソース(@50)","卵(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/romeinn.jpg" },
    { image:"./images/materials/romeinn.jpg" },
    { image:"./images/materials/salsa_source.jpg" },
    { image:"./images/materials/egg.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"山菜レタスタコス",
  nameI18n:{"ja":"山菜レタスタコス","en":"Wild Vegetable Lettuce Taco","zh-CN":"野菜莴苣塔可","zh-TW":"野菜萵苣塔可","ko":"나물 로메인 타코","th":"ทาโก้ผักกาดหอม"},
  fes:true,
  ended:true,
  image:"./images/foods/1040.PNG",
  restore: [35,42,49,56,70],
  cost:120,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[330],
  materials:["野菜類ならなんでもOK","野菜類ならなんでもOK","ロメインレタスタコス(@120)",""],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege2.jpg" },
    { image:"./images/materials/all_vege2.jpg" },
    { image:"./images/materials/romeinn_takos.jpg" },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"野シダレタスタコス",
  nameI18n:{"ja":"野シダレタスタコス","en":"Wild Fern Lettuce Taco","zh-CN":"野蕨菜莴苣塔可","zh-TW":"野蕨菜萵苣塔可","ko":"야생 고사리 로메인 타코","th":"ทาโก้ผักกาดหอมเฟิร์นป่า"},
  fes:true,
  ended:true,
  image:"./images/foods/1041.PNG",
  restore: [35,42,49,56,70],
  cost:120,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[330],
  materials:["野シダ","野シダ","ロメインレタスタコス(@120)",""],
  level:1,
  materials_image:[
    { image:"./images/materials/noshida.jpg" },
    { image:"./images/materials/noshida.jpg" },
    { image:"./images/materials/romeinn_takos.jpg" },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"野ニンニクガラシレタスタコス",
  nameI18n:{"ja":"野ニンニクガラシレタスタコス","en":"Wild Garlic Mustard Lettuce Taco","zh-CN":"野蒜芥莴苣塔可","zh-TW":"野蒜芥萵苣塔可","ko":"산마늘 로메인 타코","th":"ทาโก้ผักกาดหอมต้นมัสตาร์ด"},
  fes:true,
  ended:true,
  image:"./images/foods/1042.PNG",
  restore: [35,42,49,56,70],
  cost:120,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[330],
  materials:["野ニンニクガラシ","野ニンニクガラシ","ロメインレタスタコス(@120)",""],
  level:1,
  materials_image:[
    { image:"./images/materials/noninniku.jpg" },
    { image:"./images/materials/noninniku.jpg" },
    { image:"./images/materials/romeinn_takos.jpg" },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"野ゴボウレタスタコス",
  nameI18n:{"ja":"野ゴボウレタスタコス","en":"Wild Burdock Lettuce Taco","zh-CN":"野牛蒡莴苣塔可","zh-TW":"野牛蒡萵苣塔可","ko":"산우엉 로메인 타코","th":"ทาโก้ผักกาดหอมโกโบป่า"},
  fes:true,
  ended:true,
  image:"./images/foods/1043.PNG",
  restore: [35,42,49,56,70],
  cost:120,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[330],
  materials:["野ゴボウ","野ゴボウ","ロメインレタスタコス(@120)",""],
  level:1,
  materials_image:[
    { image:"./images/materials/nogobou.jpg" },
    { image:"./images/materials/nogobou.jpg" },
    { image:"./images/materials/romeinn_takos.jpg" },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"野カラシナレタスタコス",
  nameI18n:{"ja":"野カラシナレタスタコス","en":"Wild Mustard Greens Lettuce Taco","zh-CN":"野芥菜莴苣塔可","zh-TW":"野芥菜萵苣塔可","ko":"산겨자 로메인 타코","th":"ทาโก้ผักกาดเขียวป่า"},
  fes:true,
  ended:true,
  image:"./images/foods/1044.PNG",
  restore: [35,42,49,56,70],
  cost:120,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[330],
  materials:["野カラシナ","野カラシナ","ロメインレタス(@110)",""],
  level:1,
  materials_image:[
    { image:"./images/materials/nokarashina.jpg" },
    { image:"./images/materials/nokarashina.jpg" },
    { image:"./images/materials/romeinn_takos.jpg" },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"春のフルーツティー",
  nameI18n:{"ja":"春のフルーツティー","en":"Spring Fruit Tea","zh-CN":"春日水果红茶","zh-TW":"春日水果紅茶","ko":"봄날 과일 홍차","th":"ชาดำผลไม้ใบไม้ผลิ"},
  fes:true,
  ended:true,
  image:"./images/foods/1045.PNG",
  restore: [45,54,63,72,90],
  cost:350,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[460],
  materials:["紅茶(@250)","果物ならなんでもOK","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},

{
  name:"春のアップルティー",
  nameI18n:{"ja":"春のアップルティー","en":"Spring Apple Tea","zh-CN":"春日苹果红茶","zh-TW":"春日蘋果紅茶","ko":"봄날 사과 홍차","th":"ชาดำแอปเปิลใบไม้ผลิ"},
  fes:true,
  ended:true,
  image:"./images/foods/1046.PNG",
  restore: [45,54,63,72,90],
  cost:350,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[480],
  materials:["紅茶(@250)","リンゴ","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/ringo.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"春のオレンジティー",
  nameI18n:{"ja":"春のオレンジティー","en":"Spring Orange Tea","zh-CN":"春日橘子红茶","zh-TW":"春日橘子紅茶","ko":"봄날 오렌지 홍차","th":"ชาดำส้มใบไม้ผลิ"},
  fes:true,
  ended:true,
  image:"./images/foods/1047.PNG",
  restore: [45,54,63,72,90],
  cost:350,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[480],
  materials:["紅茶(@250)","オレンジ","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/orange.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"春のブルーベリーティー",
  nameI18n:{"ja":"春のブルーベリーティー","en":"Spring Blueberry Tea","zh-CN":"春日蓝莓红茶","zh-TW":"春日藍莓紅茶","ko":"봄날 블루베리 홍차","th":"ชาดำบลูเบอร์รี่ใบไม้ผลิ"},
  fes:true,
  ended:true,
  image:"./images/foods/1048.PNG",
  restore: [45,54,63,72,90],
  cost:350,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[460],
  materials:["紅茶(@250)","ブルーベリー","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/buruberi.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"春のラズベリーティー",
  nameI18n:{"ja":"春のラズベリーティー","en":"Spring Raspberry Tea","zh-CN":"春日树莓红茶","zh-TW":"春日樹莓紅茶","ko":"봄날 라즈베리 홍차","th":"ชาดำราสเบอร์รี่ใบไม้ผลิ"},
  fes:true,
  ended:true,
  image:"./images/foods/1049.PNG",
  restore: [45,54,63,72,90],
  cost:350,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[480],
  materials:["紅茶(@250)","ラズベリー","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/razuberi.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"春のストロベリーティー",
  nameI18n:{"ja":"春のストロベリーティー","en":"Spring Strawberry Tea","zh-CN":"春日草莓红茶","zh-TW":"春日草莓紅茶","ko":"봄날 딸기 홍차","th":"ชาดำสตรอว์เบอร์รี่ใบไม้ผลิ"},
  fes:true,
  ended:true,
  image:"./images/foods/1050.PNG",
  restore: [60,72,84,96,120],
  cost:475,
  time:360,
  rarity: [true,true,true,true,true],
  prices:[800],
  materials:["紅茶(@250)","いちご(種@125)","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/strawberry.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"春のグレープティー",
  nameI18n:{"ja":"春のグレープティー","en":"Spring Grape Tea","zh-CN":"春日葡萄红茶","zh-TW":"春日葡萄紅茶","ko":"봄날 포도 홍차","th":"ชาดำองุ่นใบไม้ผลิ"},
  fes:true,
  ended:true,
  image:"./images/foods/1051.PNG",
  restore: [65,78,91,104,130],
  cost:510,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[910],
  materials:["紅茶(@250)","ブドウ(種@160)","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/grape.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"春のパイナップルティー",
  nameI18n:{"ja":"春のパイナップルティー","en":"Spring Pineapple Tea","zh-CN":"春日菠萝红茶","zh-TW":"春日鳳梨紅茶","ko":"봄날 파인애플 홍차","th":"ชาดำสับปะรดใบไม้ผลิ"},
  fes:true,
  ended:true,
  image:"./images/foods/1052.PNG",
  restore: [45,54,63,72,90],
  cost:365,
  time:30,
  rarity: [true,true,true,true,true],
  prices:[480],
  materials:["紅茶(@250)","パイナップル(種@15)","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/pineapple.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"カラフル映画鑑賞セット",
  nameI18n:{"ja":"カラフル映画鑑賞セット","en":"Colorful Movie Night Set","zh-CN":"缤纷观影套餐","zh-TW":"繽紛觀影套餐","ko":"디럭스 관람 세트","th":"เซ็ตดูหนังหลากสีสัน"},
  fes:true,
  ended:true,
  image:"./images/foods/1053.PNG",
  restore: [60,72,84,96,120],
  cost:1000,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[1960],
  materials:["春のフルーツティーならなんでもOK","甘口2種盛りバケツ(@530)","山菜レタスタコスならなんでもOK",""],
  level:1,
  materials_image:[
    { image:"./images/materials/spring_tea.jpg" },
    { image:"./images/materials/r_bucket.jpg" },
    { image:"./images/materials/sansai_takos.jpg" },
    { image:null }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"プレミアム映画鑑賞セット",
  nameI18n:{"ja":"プレミアム映画鑑賞セット","en":"Premium Movie Night Set","zh-CN":"至尊观影套餐","zh-TW":"至尊觀影套餐","ko":"프리미엄 관람 세트","th":"เซ็ตดูหนังพรีเมียม"},
  fes:true,
  ended:true,
  image:"./images/foods/1054.PNG",
  restore: [60,72,84,96,120],
  cost:1170,
  time:780,
  rarity: [true,true,true,true,true],
  prices:[2370],
  materials:["春のフルーツティーならなんでもOK","塩味2種盛りバケツ(@580)","山菜レタスタコスならなんでもOK","山菜レタスタコスならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/spring_tea.jpg" },
    { image:"./images/materials/b_bucket.jpg" },
    { image:"./images/materials/sansai_takos.jpg" },
    { image:"./images/materials/sansai_takos.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"オーシャンアイスドリンク",
  nameI18n:{"ja":"オーシャンアイスドリンク","en":"Ocean Iced Drink","zh-CN":"海洋冰饮","zh-TW":"海洋冰飲","ko":"오션 에이드","th":"สมูทตี้แห่งท้องทะเล"},
  season:true,
  ended:true,
  image:"./images/foods/1055.PNG",
  restore: [20,24,28,32,40],
  cost:120,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[190],
  materials:["藍藻パウダー(@50)","藍藻パウダー(@50)","スターフルーツ(種@10)","スターフルーツ(種@10)"],
  level:1,
  materials_image:[
    { image:"./images/materials/ransou.jpg" },
    { image:"./images/materials/ransou.jpg" },
    { image:"./images/materials/star_fruit.jpg" },
    { image:"./images/materials/star_fruit.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"海鮮トマトポタージュ",
  nameI18n:{"ja":"海鮮トマトポタージュ","en":"Tomato Seafood Soup","zh-CN":"番茄海鲜浓汤","zh-TW":"番茄海鮮濃湯","ko":"토마토 해산물 수프","th":"ซุปข้นซีฟู้ดมะเขือเทศ"},
  season:true,
  ended:true,
  image:"./images/foods/1056.PNG",
  restore: [40,48,56,64,80],
  cost:105,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[450],
  materials:["ウミエビ","トマト(種@10)","シーアスパラガス","小麦(種@95)"],
  level:1,
  materials_image:[
    { image:"./images/materials/umiebi.jpg" },
    { image:"./images/materials/tomato.jpg" },
    { image:"./images/materials/sea_asupara.jpg" },
    { image:"./images/materials/wheat.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ミニパールケーキ",
  nameI18n:{"ja":"ミニパールケーキ","en":"Seashell Pearl Cake","zh-CN":"贝壳珍珠小蛋糕","zh-TW":"貝殼珍珠小蛋糕","ko":"조개 진주 미니케이크","th":"มินิเค้กไข่มุก"},
  season:true,
  ended:true,
  image:"./images/foods/1057.PNG",
  restore: [45,54,63,72,90],
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[570],
  materials:["ホタテ","小麦(種@95)","牛乳(@50)","果物ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/hotate.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/all_fruit.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ミニスターフルーツパールケーキ",
  nameI18n:{"ja":"ミニスターフルーツパールケーキ","en":"Starfruit Pearl Cake","zh-CN":"杨桃珍珠小蛋糕","zh-TW":"楊桃珍珠小蛋糕","ko":"스타프루트 진주 미니케이크","th":"มินิเค้กไข่มุกมะเฟือง"},
  season:true,
  ended:true,
  image:"./images/foods/1058.PNG",
  restore: [45,54,63,72,90],
  cost:155,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[570],
  materials:["ホタテ","小麦(種@95)","牛乳(@50)","スターフルーツ(種@10)"],
  level:1,
  materials_image:[
    { image:"./images/materials/hotate.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/star_fruit.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},

{
  name:"ミニアップルパールケーキ",
  nameI18n:{"ja":"ミニアップルパールケーキ","en":"Apple Pearl Cake","zh-CN":"苹果珍珠小蛋糕","zh-TW":"蘋果珍珠小蛋糕","ko":"사과 진주 미니케이크","th":"มินิเค้กไข่มุกแอปเปิล"},
  season:true,
  ended:true,
  image:"./images/foods/1059.PNG",
  restore: [45,54,63,72,90],
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[590],
  materials:["ホタテ","小麦(種@95)","牛乳(@50)","リンゴ"],
  level:1,
  materials_image:[
    { image:"./images/materials/hotate.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/ringo.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ミニオレンジパールケーキ",
  nameI18n:{"ja":"ミニオレンジパールケーキ","en":"Mandarin Pearl Cake","zh-CN":"橘子珍珠小蛋糕","zh-TW":"橘子珍珠小蛋糕","ko":"오렌지 진주 미니케이크","th":"มินิเค้กไข่มุกส้ม"},
  season:true,
  ended:true,
  image:"./images/foods/1060.PNG",
  restore: [45,54,63,72,90],
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[590],
  materials:["ホタテ","小麦(種@95)","牛乳(@50)","オレンジ"],
  level:1,
  materials_image:[
    { image:"./images/materials/hotate.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/orange.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ミニブルーベリーパールケーキ",
  nameI18n:{"ja":"ミニブルーベリーパールケーキ","en":"Blueberry Pearl Cake","zh-CN":"蓝莓珍珠小蛋糕","zh-TW":"藍莓珍珠小蛋糕","ko":"블루베리 진주 미니케이크","th":"มินิเค้กไข่มุกบลูเบอร์รี่"},
  season:true,
  ended:true,
  image:"./images/foods/1061.PNG",
  restore: [45,54,63,72,90],
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[570],
  materials:["ホタテ","小麦(種@95)","牛乳(@50)","ブルーベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/hotate.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/buruberi.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ミニラズベリーパールケーキ",
  nameI18n:{"ja":"ミニラズベリーパールケーキ","en":"Raspberry Pearl Cake","zh-CN":"树莓珍珠小蛋糕","zh-TW":"樹莓珍珠小蛋糕","ko":"라즈베리 진주 미니케이크","th":"มินิเค้กไข่มุกราสเบอร์รี่"},
  season:true,
  ended:true,
  image:"./images/foods/1062.PNG",
  restore: [45,54,63,72,90],
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[590],
  materials:["ホタテ","小麦(種@95)","牛乳(@50)","ラズベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/hotate.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ジャム添えイカ焼き",
  nameI18n:{"ja":"ジャム添えイカ焼き","en":"Grilled Squid w/ Fruit Jam","zh-CN":"果酱烤鱿鱼","zh-TW":"果醬烤魷魚","ko":"잼 오징어구이","th":"ปลาหมึกย่างซอส"},
  season:true,
  ended:true,
  image:"./images/foods/1063.PNG",
  restore: [40,48,56,64,80],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[440],
  materials:["スルメイカ","海ぶどう","ワカメ","ジャムならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/surumeika.jpg" },
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/all_jam.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"リンゴジャム添えイカ焼き",
  nameI18n:{"ja":"リンゴジャム添えイカ焼き","en":"Grilled Squid w/ Apple Jam","zh-CN":"苹果酱烤鱿鱼","zh-TW":"蘋果醬烤魷魚","ko":"사과 잼 오징어구이","th":"ปลาหมึกย่างซอสแอปเปิล"},
  season:true,
  ended:true,
  image:"./images/foods/1064.PNG",
  restore: [45,54,63,72,90],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[550],
  materials:["スルメイカ","海ぶどう","ワカメ","リンゴジャム"],
  level:1,
  materials_image:[
    { image:"./images/materials/surumeika.jpg" },
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/jam_apple.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ブルーベリージャム添えイカ焼き",
  nameI18n:{"ja":"ブルーベリージャム添えイカ焼き","en":"Grilled Squid w/ Blueberry Jam","zh-CN":"蓝莓酱烤鱿鱼","zh-TW":"藍莓醬烤魷魚","ko":"블루베리 잼 오징어구이","th":"ปลาหมึกย่างซอสบลูเบอร์รี่"},
  season:true,
  ended:true,
  image:"./images/foods/1065.PNG",
  restore: [40,48,56,64,80],
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[450],
  materials:["スルメイカ","海ぶどう","ワカメ","ブルーベリージャム"],
  level:1,
  materials_image:[
    { image:"./images/materials/surumeika.jpg" },
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/jam_buruberi.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"スターフルーツジャム添えイカ焼き",
  nameI18n:{"ja":"スターフルーツジャム添えイカ焼き","en":"Grilled Squid w/ Starfruit Jam","zh-CN":"杨桃酱烤鱿鱼","zh-TW":"楊桃醬烤魷魚","ko":"스타프루트 잼 오징어구이","th":"ปลาหมึกย่างซอสมะเฟือง"},
  season:true,
  ended:true,
  image:"./images/foods/1066.PNG",
  restore: [40,48,56,64,80],
  cost:40,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[480],
  materials:["スルメイカ","海ぶどう","ワカメ","スターフルーツジャム(@40)"],
  level:1,
  materials_image:[
    { image:"./images/materials/surumeika.jpg" },
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/jam_star_fruit.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"パイナップルジャム添えイカ焼き",
  nameI18n:{"ja":"パイナップルジャム添えイカ焼き","en":"Grilled Squid w/ Pineapple Jam","zh-CN":"菠萝酱烤鱿鱼","zh-TW":"鳳梨醬烤魷魚","ko":"파인애플 잼 오징어구이","th":"ปลาหมึกย่างซอสสับปะรด"},
  season:true,
  ended:true,
  image:"./images/foods/1067.PNG",
  restore: [45,54,63,72,90],
  cost:60,
  time:30,
  rarity: [true,true,true,true,true],
  prices:[560],
  materials:["スルメイカ","海ぶどう","ワカメ","パイナップルジャム(@60)"],
  level:1,
  materials_image:[
    { image:"./images/materials/surumeika.jpg" },
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/jam_pineapple.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"いちごジャム添えイカ焼き",
  nameI18n:{"ja":"いちごジャム添えイカ焼き","en":"Grilled Squid w/ Strawberry Jam","zh-CN":"草莓酱烤鱿鱼","zh-TW":"草莓醬烤魷魚","ko":"딸기 잼 오징어구이","th":"ปลาหมึกย่างซอสสตรอว์เบอร์รี่"},
  season:true,
  ended:true,
  image:"./images/foods/1068.PNG",
  restore: [100,120,140,160,200],
  cost:500,
  time:360,
  rarity: [true,true,true,true,true],
  prices:[1860],
  materials:["スルメイカ","海ぶどう","ワカメ","いちごジャム(@500)"],
  level:1,
  materials_image:[
    { image:"./images/materials/surumeika.jpg" },
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/jam_strawberry.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"オーシャンパーティー",
  nameI18n:{"ja":"オーシャンパーティー","en":"Ocean Feast","zh-CN":"海洋盛宴","zh-TW":"海洋盛宴","ko":"바다의 향연","th":"งานเลี้ยงแห่งท้องทะเล"},
  season:true,
  ended:true,
  image:"./images/foods/1069.PNG",
  restore: [45,54,63,72,90],
  cost:370,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[1700],
  materials:["海鮮トマトポタージュ(@105)","オーシャンアイスドリンク(@120)","ミニパールケーキならなんでもOK","ジャム添えイカ焼きならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/tomato_potage.jpg" },
    { image:"./images/materials/ocean_ice.jpg" },
    { image:"./images/materials/all_miniperlcake.jpg" },
    { image:"./images/materials/all_ikayaki.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サボテンフレッシュジュース",
  nameI18n:{"ja":"サボテンフレッシュジュース","en":"Prickly Pear Fruit Juice","zh-CN":"仙人掌鲜果饮","zh-TW":"仙人掌鮮果飲","ko":"선인장 생과일주스","th":"น้ำกระบองเพชรสด"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1070.PNG",
  restore: [20,24,28,32,40],
  cost:60,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[220],
  fesCoinPrice:40,
  materials:["ウチワサボテン(種@10)","牛乳(@50)","果物ならなんでもOK","果物ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/saboten.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/all_fruit.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サボテンリンゴジュース",
  nameI18n:{"ja":"サボテンリンゴジュース","en":"Prickly Pear & Apple Juice","zh-CN":"仙人掌苹果饮","zh-TW":"仙人掌蘋果飲","ko":"선인장 사과 주스","th":"น้ำกระบองเพชรแอปเปิล"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1071.PNG",
  restore: [25,30,35,40,50],
  cost:60,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[270],
  fesCoinPrice:50,
  materials:["ウチワサボテン(種@10)","牛乳(@50)","リンゴ","リンゴ"],
  level:1,
  materials_image:[
    { image:"./images/materials/saboten.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/ringo.jpg" },
    { image:"./images/materials/ringo.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サボテンオレンジジュース",
  nameI18n:{"ja":"サボテンオレンジジュース","en":"Prickly Pear & Mandarin Juice","zh-CN":"仙人掌橘子饮","zh-TW":"仙人掌橘子飲","ko":"선인장 오렌지 주스","th":"น้ำกระบองเพชรส้ม"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1072.PNG",
  restore: [25,30,35,40,50],
  cost:60,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[270],
  fesCoinPrice:50,
  materials:["ウチワサボテン(種@10)","牛乳(@50)","オレンジ","オレンジ"],
  level:1,
  materials_image:[
    { image:"./images/materials/saboten.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/orange.jpg" },
    { image:"./images/materials/orange.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サボテンブルーベリージュース",
  nameI18n:{"ja":"サボテンブルーベリージュース","en":"Prickly Pear & Blueberry Juice","zh-CN":"仙人掌蓝莓饮","zh-TW":"仙人掌藍莓飲","ko":"선인장 블루베리 주스","th":"น้ำกระบองเพชรบลูเบอร์รี่"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1073.PNG",
  restore: [20,24,28,32,40],
  cost:60,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[220],
  fesCoinPrice:40,
  materials:["ウチワサボテン(種@10)","牛乳(@50)","ブルーベリー","ブルーベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/saboten.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/buruberi.jpg" },
    { image:"./images/materials/buruberi.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サボテンラズベリージュース",
  nameI18n:{"ja":"サボテンラズベリージュース","en":"Prickly Pear & Raspberry Juice","zh-CN":"仙人掌树莓饮","zh-TW":"仙人掌樹莓飲","ko":"선인장 라즈베리 주스","th":"น้ำกระบองเพชรราสเบอร์รี่"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1074.PNG",
  restore: [25,30,35,40,50],
  cost:60,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[260],
  fesCoinPrice:50,
  materials:["ウチワサボテン(種@10)","牛乳(@50)","ラズベリー","ラズベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/saboten.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/razuberi.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サボテンイチゴジュース",
  nameI18n:{"ja":"サボテンイチゴジュース","en":"Prickly Pear & Strawberry Juice","zh-CN":"仙人掌草莓饮","zh-TW":"仙人掌草莓飲","ko":"선인장 딸기 주스","th":"น้ำกระบองเพชรสตรอว์เบอร์รี่"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1075.PNG",
  restore: [100,120,140,160,200],
  cost:310,
  time:360,
  rarity: [true,true,true,true,true],
  prices:[910],
  fesCoinPrice:160,
  materials:["ウチワサボテン(種@10)","牛乳(@50)","いちご(種@125)","いちご(種@125)"],
  level:1,
  materials_image:[
    { image:"./images/materials/saboten.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/strawberry.jpg" },
    { image:"./images/materials/strawberry.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サボテンブドウジュース",
  nameI18n:{"ja":"サボテンブドウジュース","en":"Prickly Pear & Grape Juice","zh-CN":"仙人掌葡萄饮","zh-TW":"仙人掌葡萄飲","ko":"선인장 포도 주스","th":"น้ำกระบองเพชรองุ่น"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1076.PNG",
  restore: [100,120,140,160,200],
  cost:380,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[1120],
  fesCoinPrice:200,
  materials:["ウチワサボテン(種@10)","牛乳(@50)","ブドウ(種@160)","ブドウ(種@160)"],
  level:1,
  materials_image:[
    { image:"./images/materials/saboten.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/grape.jpg" },
    { image:"./images/materials/grape.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サボテンパイナップルジュース",
  nameI18n:{"ja":"サボテンパイナップルジュース","en":"Prickly Pear & Pineapple Juice","zh-CN":"仙人掌菠萝饮","zh-TW":"仙人掌鳳梨飲","ko":"선인장 파인애플 주스","th":"น้ำกระบองเพชรสับปะรด"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1077.PNG",
  restore: [25,30,35,40,50],
  cost:90,
  time:30,
  rarity: [true,true,true,true,true],
  prices:[260],
  fesCoinPrice:50,
  materials:["ウチワサボテン(種@10)","牛乳(@50)","パイナップル(種@15)","パイナップル(種@15)"],
  level:1,
  materials_image:[
    { image:"./images/materials/saboten.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/pineapple.jpg" },
    { image:"./images/materials/pineapple.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"野菜焼き肉",
  nameI18n:{"ja":"野菜焼き肉","en":"Grilled Meat & Vegetables","zh-CN":"鲜蔬烤肉","zh-TW":"鮮蔬烤肉","ko":"채소 바비큐","th":"เนื้อย่างผักสด"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1078.PNG",
  restore: [50,60,70,80,100],
  cost:450,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[580],
  fesCoinPrice:105,
  materials:["果樹の炭(@50)","肉(@200)","肉(@200)","野菜ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/sumi.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ジャガイモ焼き肉",
  nameI18n:{"ja":"ジャガイモ焼き肉","en":"Grilled Meat & Potatoes","zh-CN":"土豆烤肉","zh-TW":"馬鈴薯烤肉","ko":"감자 바비큐","th":"เนื้อย่างมันฝรั่ง"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1079.PNG",
  restore: [60,72,84,96,120],
  cost:480,
  time:60,
  rarity: [true,true,true,true,true],
  prices:[640],
  fesCoinPrice:115,
  materials:["果樹の炭(@50)","肉(@200)","肉(@200)","じゃがいも(種@30)"],
  level:1,
  materials_image:[
    { image:"./images/materials/sumi.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/potato.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"トウモロコシ焼き肉",
  nameI18n:{"ja":"トウモロコシ焼き肉","en":"Grilled Meat & Corn","zh-CN":"玉米烤肉","zh-TW":"玉米烤肉","ko":"옥수수 바비큐","th":"เนื้อย่างข้าวโพด"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1080.PNG",
  restore: [100,120,140,160,200],
  cost:620,
  time:720,
  rarity: [true,true,true,true,true],
  prices:[1070],
  fesCoinPrice:450,
  materials:["果樹の炭(@50)","肉(@200)","肉(@200)","トウモロコシ(種@170)"],
  level:1,
  materials_image:[
    { image:"./images/materials/sumi.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/corn.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"トマト焼き肉",
  nameI18n:{"ja":"トマト焼き肉","en":"Grilled Meat & Tomatoes","zh-CN":"西红柿烤肉","zh-TW":"番茄烤肉","ko":"토마토 바비큐","th":"เนื้อย่างมะเขือเทศ"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1081.PNG",
  restore: [50,60,70,80,100],
  cost:460,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[580],
  fesCoinPrice:105,
  materials:["果樹の炭(@50)","肉(@200)","肉(@200)","トマト(種@10)"],
  level:1,
  materials_image:[
    { image:"./images/materials/sumi.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/tomato.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ニンジン焼き肉",
  nameI18n:{"ja":"ニンジン焼き肉","en":"Grilled Meat & Carrots","zh-CN":"胡萝卜烤肉","zh-TW":"胡蘿蔔烤肉","ko":"당근 바비큐","th":"เนื้อย่างแครอท"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1082.PNG",
  restore: [70,84,98,112,140],
  cost:475,
  time:120,
  rarity: [true,true,true,true,true],
  prices:[710],
  fesCoinPrice:125,
  materials:["果樹の炭(@50)","肉(@200)","肉(@200)","ニンジン(種@25)"],
  level:1,
  materials_image:[
    { image:"./images/materials/sumi.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/carrot.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"ナス焼き肉",
  nameI18n:{"ja":"ナス焼き肉","en":"Grilled Meat & Eggplants","zh-CN":"茄子烤肉","zh-TW":"茄子烤肉","ko":"가지 바비큐","th":"เนื้อย่างมะเขือม่วง"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1083.PNG",
  restore: [100,120,140,160,200],
  cost:585,
  time:420,
  rarity: [true,true,true,true,true],
  prices:[960],
  fesCoinPrice:170,
  materials:["果樹の炭(@50)","肉(@200)","肉(@200)","ナス(種@135)"],
  level:1,
  materials_image:[
    { image:"./images/materials/sumi.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/eggplant.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サボテンと魚のスープ",
  nameI18n:{"ja":"サボテンと魚のスープ","en":"Prickly Pear Fish Soup","zh-CN":"仙人掌鲜鱼羹","zh-TW":"仙人掌鮮魚羹","ko":"선인장 생선 수프","th":"ซุปข้นกระบองเพชรและปลา"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1084.PNG",
  restore: [20,24,28,32,40],
  cost:110,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[230],
  fesCoinPrice:45,
  materials:["ウチワサボテン(種@10)","凝縮ナツメペースト(@50)","凝縮ナツメペースト(@50)","魚ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/saboten.jpg" },
    { image:"./images/materials/natsume.jpg" },
    { image:"./images/materials/natsume.jpg" },
    { image:"./images/materials/all_fish.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サボテンとペールゴールドガーのスープ",
  nameI18n:{"ja":"サボテンとペールゴールドガーのスープ","en":"Prickly Pear & Pale Gold Garfish Soup","zh-CN":"仙人掌淡金雀鳝羹","zh-TW":"仙人掌淡金雀鱔羹","ko":"선인장 연금색 가아피쉬 수프","th":"ซุปข้นกระบองเพชรและปลาการ์สีทองอ่อน"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1085.PNG",
  restore: [40,48,56,64,80],
  cost:110,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[400],
  fesCoinPrice:70,
  materials:["ウチワサボテン(種@10)","凝縮ナツメペースト(@50)","凝縮ナツメペースト(@50)","ペールゴールドガーパイク"],
  level:1,
  materials_image:[
    { image:"./images/materials/saboten.jpg" },
    { image:"./images/materials/natsume.jpg" },
    { image:"./images/materials/natsume.jpg" },
    { image:"./images/materials/palegold.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サボテンとブラウンブロッチガーのスープ",
  nameI18n:{"ja":"サボテンとブラウンブロッチガーのスープ","en":"Prickly Pear & Brown Garfish Soup","zh-CN":"仙人掌棕斑雀鳝羹","zh-TW":"仙人掌棕斑雀鱔羹","ko":"선인장 갈색 얼룩 가아피쉬 수프","th":"ซุปข้นกระบองเพชรและปลาการ์ลายจุดสีน้ำตาล"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1086.PNG",
  restore: [40,48,56,64,80],
  cost:110,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[400],
  fesCoinPrice:70,
  materials:["ウチワサボテン(種@10)","凝縮ナツメペースト(@50)","凝縮ナツメペースト(@50)","ブラウンブロッチガーパイク"],
  level:1,
  materials_image:[
    { image:"./images/materials/saboten.jpg" },
    { image:"./images/materials/natsume.jpg" },
    { image:"./images/materials/natsume.jpg" },
    { image:"./images/materials/brown.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サボテンとシルバーガーのスープ",
  nameI18n:{"ja":"サボテンとシルバーガーのスープ","en":"Prickly Pear & Silver Garfish Soup","zh-CN":"仙人掌银白雀鳝羹","zh-TW":"仙人掌銀白雀鱔羹","ko":"선인장 은색 가아피쉬 수프","th":"ซุปข้นกระบองเพชรและปลาการ์สีเงินขาว"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1087.PNG",
  restore: [40,48,56,64,80],
  cost:110,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[400],
  fesCoinPrice:70,
  materials:["ウチワサボテン(種@10)","凝縮ナツメペースト(@50)","凝縮ナツメペースト(@50)","シルバーガーパイク"],
  level:1,
  materials_image:[
    { image:"./images/materials/saboten.jpg" },
    { image:"./images/materials/natsume.jpg" },
    { image:"./images/materials/natsume.jpg" },
    { image:"./images/materials/silver.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サボテンとブラックスポットガーのスープ",
  nameI18n:{"ja":"サボテンとブラックスポットガーのスープ","en":"Prickly Pear & Black Garfish Soup","zh-CN":"仙人掌黑斑雀鳝羹","zh-TW":"仙人掌黑斑雀鱔羹","ko":"선인장 검은 얼룩 가아피쉬 수프","th":"ซุปข้นกระบองเพชรและปลาการ์ลายจุดสีดำ"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1088.PNG",
  restore: [40,48,56,64,80],
  cost:110,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[400],
  fesCoinPrice:70,
  materials:["ウチワサボテン(種@10)","凝縮ナツメペースト(@50)","凝縮ナツメペースト(@50)","ブラックスポットガーパイク"],
  level:1,
  materials_image:[
    { image:"./images/materials/saboten.jpg" },
    { image:"./images/materials/natsume.jpg" },
    { image:"./images/materials/natsume.jpg" },
    { image:"./images/materials/black.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"サボテンとゴールデンガーのスープ",
  nameI18n:{"ja":"サボテンとゴールデンガーのスープ","en":"Prickly Pear & Golden Garfish Soup","zh-CN":"仙人掌黄金雀鳝羹","zh-TW":"仙人掌黃金雀鱔羹","ko":"선인장 황금 가아피쉬 수프","th":"ซุปข้นกระบองเพชรและปลาการ์สีทอง"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1089.PNG",
  restore: [50,60,70,80,100],
  cost:110,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[500],
  fesCoinPrice:190,
  materials:["ウチワサボテン(種@10)","凝縮ナツメペースト(@50)","凝縮ナツメペースト(@50)","ゴールデンガーパイク"],
  level:1,
  materials_image:[
    { image:"./images/materials/saboten.jpg" },
    { image:"./images/materials/natsume.jpg" },
    { image:"./images/materials/natsume.jpg" },
    { image:"./images/materials/gold.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},
{
  name:"原始風味セット",
  nameI18n:{"ja":"原始風味セット","en":"Primitive Feast Combo","zh-CN":"原始风味套餐","zh-TW":"原始風味套餐","ko":"원시의 맛 세트","th":"ชุดอาหารรสชาติดั้งเดิม"},
  fes:true,
  ended:true, // 2026/10/10 6:00 原始の呼び声フェス終了
  image:"./images/foods/1090.PNG",
  restore: [35,42,49,56,70],
  cost:0,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[1300],
  fesCoinPrice:240,
  materials:["サボテンジュースならなんでもOK","サボテンジュースならなんでもOK","野菜焼き肉ならなんでもOK","サボテンと魚のスープならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_sabotenjuice.jpg" },
    { image:"./images/materials/all_sabotenjuice.jpg" },
    { image:"./images/materials/all_yasaiyakiniku.jpg" },
    { image:"./images/materials/all_sabotensoup.jpg" }
  ],
  authTarget: null, // 認証マスターに必要な累計作成数（例: 720）。未設定はnull
  auth:false
},

// ── 2026/10/10開始フェス料理（19品）──
// 正式な日本語名・フェスコイン価格はユーザー確認済み。調理時間・開放レベル・
// 素材個数は引き続き未確認（null）。判明次第更新すること。
{
  name:"ホオズキ香るホットココア",
  nameI18n:{"ja":"ホオズキ香るホットココア","en":"Cape Gooseberry Hot Cocoa","zh-CN":"灯笼果香热可可","zh-TW":"燈籠果香熱可可","ko":"꽈리향 핫코코아","th":"เคพกูสเบอรี่โกโก้ร้อน"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1091.PNG",
  restore: [25,30,35,40,50],
  cost:110, // ホオズキ10+シナモンココアパウダー50+牛乳50+果物0（ワイルドカード枠は最安のブルーベリー等0円を採用）
  time:15, // 素材の成長時間から算出：ホオズキ15分（フェス限定作物の標準値、果物枠はワイルドカードのため対象外）
  rarity: [true,true,true,true,true],
  prices:[240],
  fesCoinPrice:35,
  fesCoinIcon:"yuuyafes_coin",
  materials:["ホオズキ(種@10)","シナモンココアパウダー(@50)","牛乳(@50)","果物ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/hozuki.jpg" },
    { image:"./images/materials/sinamonn_cocoa.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/all_fruit.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"ホオズキリンゴホットココア",
  nameI18n:{"ja":"ホオズキリンゴホットココア","en":"Cape Gooseberry & Apple Hot Cocoa","zh-CN":"灯笼苹果热可可","zh-TW":"燈籠蘋果熱可可","ko":"사과&꽈리 핫코코아","th":"เคพกูสเบอรี่โกโก้ร้อนแอปเปิ้ล"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1092.PNG",
  restore: [25,30,35,40,50],
  cost:110, // ホオズキ10+シナモンココアパウダー50+牛乳50+リンゴ0（リンゴは種がなく購入費がかからないため0。シナモンココアパウダーの価格50はユーザー確認済み）
  time:15, // 素材の成長時間から算出：ホオズキ15分・リンゴは作物timerなし（対象外）→15分
  rarity: [true,true,true,true,true],
  prices:[260],
  fesCoinPrice:40,
  fesCoinIcon:"yuuyafes_coin",
  materials:["ホオズキ(種@10)","シナモンココアパウダー(@50)","牛乳(@50)","リンゴ"],
  level:1,
  materials_image:[
    { image:"./images/materials/hozuki.jpg" },
    { image:"./images/materials/sinamonn_cocoa.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/ringo.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"ホオズキオレンジホットココア",
  nameI18n:{"ja":"ホオズキオレンジホットココア","en":"Cape Gooseberry & Orange Hot Cocoa","zh-CN":"灯笼橘子热可可","zh-TW":"燈籠橘子熱可可","ko":"오렌지&꽈리 핫코코아","th":"เคพกูสเบอรี่โกโก้ร้อนส้มแมนดาริน"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1093.PNG",
  restore: [25,30,35,40,50],
  cost:110, // ホオズキ10+シナモンココアパウダー50+牛乳50+オレンジ0（オレンジは種がなく購入費がかからないため0。いずれもユーザー確認済み）
  time:15, // 素材の成長時間から算出：ホオズキ15分・オレンジは作物timerなし（対象外、他レシピでも(@価格)表記なし）→15分
  rarity: [true,true,true,true,true],
  prices:[260],
  fesCoinPrice:40,
  fesCoinIcon:"yuuyafes_coin",
  materials:["ホオズキ(種@10)","シナモンココアパウダー(@50)","牛乳(@50)","オレンジ"],
  level:1,
  materials_image:[
    { image:"./images/materials/hozuki.jpg" },
    { image:"./images/materials/sinamonn_cocoa.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/orange.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"ホオズキブルーベリーホットココア",
  nameI18n:{"ja":"ホオズキブルーベリーホットココア","en":"Cape Gooseberry & Blueberry Hot Cocoa","zh-CN":"灯笼蓝莓热可可","zh-TW":"燈籠藍莓熱可可","ko":"블루베리&꽈리 핫코코아","th":"โกโก้ร้อนบลูเบอร์รี่เคพกูสเบอร์รี่"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1094.PNG",
  restore: [25,30,35,40,50],
  cost:110, // ホオズキ10+シナモンココアパウダー50+牛乳50+ブルーベリー0（いずれもユーザー確認済み）
  time:15, // 素材の成長時間から算出：ホオズキ15分・ブルーベリーは作物timerなし（対象外）→15分
  rarity: [true,true,true,true,true],
  prices:[240],
  fesCoinPrice:35,
  fesCoinIcon:"yuuyafes_coin",
  materials:["ホオズキ(種@10)","シナモンココアパウダー(@50)","牛乳(@50)","ブルーベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/hozuki.jpg" },
    { image:"./images/materials/sinamonn_cocoa.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/buruberi.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"ホオズキラズベリーホットココア",
  nameI18n:{"ja":"ホオズキラズベリーホットココア","en":"Cape Gooseberry & Raspberry Hot Cocoa","zh-CN":"灯笼树莓热可可","zh-TW":"燈籠樹莓熱可可","ko":"라즈베리&꽈리 핫코코아","th":"โกโก้ร้อนราสเบอร์รี่เคพกูสเบอร์รี่"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1095.PNG",
  restore: [25,30,35,40,50],
  cost:110, // ホオズキ10+シナモンココアパウダー50+牛乳50+ラズベリー0（いずれもユーザー確認済み）
  time:15, // 素材の成長時間から算出：ホオズキ15分・ラズベリーは作物timerなし（対象外）→15分
  rarity: [true,true,true,true,true],
  prices:[260],
  fesCoinPrice:40,
  fesCoinIcon:"yuuyafes_coin",
  materials:["ホオズキ(種@10)","シナモンココアパウダー(@50)","牛乳(@50)","ラズベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/hozuki.jpg" },
    { image:"./images/materials/sinamonn_cocoa.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"ホオズキイチゴホットココア",
  nameI18n:{"ja":"ホオズキイチゴホットココア","en":"Cape Gooseberry & Strawberry Hot Cocoa","zh-CN":"灯笼草莓热可可","zh-TW":"燈籠草莓熱可可","ko":"딸기&꽈리 핫코코아","th":"โกโก้ร้อนสตรอว์เบอร์รี่เคพกูสเบอร์รี่"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1096.PNG",
  restore: [50,60,70,80,100],
  cost:235, // ホオズキ10+シナモンココアパウダー50+牛乳50+イチゴ125（シナモンココアパウダーの価格50はユーザー確認済み）
  time:360, // 素材の成長時間から算出：ホオズキ15分・いちご360分（6時間）→長い方の360分
  rarity: [true,true,true,true,true],
  prices:[580],
  fesCoinPrice:85,
  fesCoinIcon:"yuuyafes_coin",
  materials:["ホオズキ(種@10)","シナモンココアパウダー(@50)","牛乳(@50)","イチゴ(種@125)"],
  level:1,
  materials_image:[
    { image:"./images/materials/hozuki.jpg" },
    { image:"./images/materials/sinamonn_cocoa.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/strawberry.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"ホオズキブドウホットココア",
  nameI18n:{"ja":"ホオズキブドウホットココア","en":"Cape Gooseberry & Grape Hot Cocoa","zh-CN":"灯笼葡萄热可可","zh-TW":"燈籠葡萄熱可可","ko":"포도&꽈리 핫코코아","th":"เคพกูสเบอรี่โกโก้ร้อนองุ่น"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1097.PNG",
  restore: [65,78,91,104,130],
  cost:270, // ホオズキ10+シナモンココアパウダー50+牛乳50+ブドウ160（シナモンココアパウダーの価格50はユーザー確認済み）
  time:600, // 素材の成長時間から算出：ホオズキ15分・ブドウ600分（10時間）→長い方の600分
  rarity: [true,true,true,true,true],
  prices:[690],
  fesCoinPrice:100,
  fesCoinIcon:"yuuyafes_coin",
  materials:["ホオズキ(種@10)","シナモンココアパウダー(@50)","牛乳(@50)","ブドウ(種@160)"],
  level:1,
  materials_image:[
    { image:"./images/materials/hozuki.jpg" },
    { image:"./images/materials/sinamonn_cocoa.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/grape.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"ホオズキパイナップルホットココア",
  nameI18n:{"ja":"ホオズキパイナップルホットココア","en":"Cape Gooseberry & Pineapple Hot Cocoa","zh-CN":"灯笼菠萝热可可","zh-TW":"燈籠鳳梨熱可可","ko":"파인애플&꽈리 핫코코아","th":"เคพกูสเบอรี่โกโก้ร้อนสับปะรด"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1098.PNG",
  restore: [25,30,35,40,50],
  cost:125, // ホオズキ10+シナモンココアパウダー50+牛乳50+パイナップル15（シナモンココアパウダーの価格50はユーザー確認済み）
  time:30, // 素材の成長時間から算出：ホオズキ15分・パイナップル30分→長い方の30分
  rarity: [true,true,true,true,true],
  prices:[260],
  fesCoinPrice:40,
  fesCoinIcon:"yuuyafes_coin",
  materials:["ホオズキ(種@10)","シナモンココアパウダー(@50)","牛乳(@50)","パイナップル(種@15)"],
  level:1,
  materials_image:[
    { image:"./images/materials/hozuki.jpg" },
    { image:"./images/materials/sinamonn_cocoa.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/pineapple.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"かぼちゃとキノコのクリームポタージュ",
  nameI18n:{"ja":"かぼちゃとキノコのクリームポタージュ","en":"Creamy Pumpkin Mushroom Soup","zh-CN":"南瓜奶油蘑菇浓汤","zh-TW":"南瓜奶油蘑菇濃湯","ko":"호박 크림 버섯 수프","th":"ซุปครีมฟักทองและเห็ด"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1099.PNG",
  restore: [20,24,28,32,40],
  cost:60, // ナラタケ0+かぼちゃ10+牛乳50+野菜0（ワイルドカード枠は最安の野菜0円を採用）
  time:15, // 素材の成長時間から算出：かぼちゃ15分（フェス限定作物の標準値、野菜枠はワイルドカードのため対象外）
  rarity: [true,true,true,true,true],
  prices:[240],
  fesCoinPrice:35,
  fesCoinIcon:"yuuyafes_coin",
  materials:["ナラタケ","かぼちゃ(種@10)","牛乳(@50)","野菜ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/naratake.jpg" },
    { image:"./images/materials/kabotya.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"かぼちゃとジャガイモのクリームポタージュ",
  nameI18n:{"ja":"かぼちゃとジャガイモのクリームポタージュ","en":"Creamy Pumpkin Potato Soup","zh-CN":"南瓜奶油土豆浓汤","zh-TW":"南瓜奶油馬鈴薯濃湯","ko":"호박 크림 감자 수프","th":"ซุปครีมฟักทองและมันฝรั่ง"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1100.PNG",
  restore: [25,30,35,40,50],
  cost:90, // ナラタケ0+かぼちゃ10+牛乳50+ジャガイモ30（いずれもユーザー確認済み）
  time:60, // 素材の成長時間から算出：かぼちゃ15分・ジャガイモ60分→長い方の60分
  rarity: [true,true,true,true,true],
  prices:[300],
  fesCoinPrice:45,
  fesCoinIcon:"yuuyafes_coin",
  materials:["ナラタケ","かぼちゃ(種@10)","牛乳(@50)","ジャガイモ(種@30)"],
  level:1,
  materials_image:[
    { image:"./images/materials/naratake.jpg" },
    { image:"./images/materials/kabotya.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/potato.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"かぼちゃとコーンのクリームポタージュ",
  nameI18n:{"ja":"かぼちゃとコーンのクリームポタージュ","en":"Creamy Pumpkin Corn Soup","zh-CN":"南瓜奶油玉米浓汤","zh-TW":"南瓜奶油玉米濃湯","ko":"호박 크림 콘수프","th":"ซุปครีมฟักทองและข้าวโพด"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1101.PNG",
  restore: [70,84,98,112,140],
  cost:230, // ナラタケ0+かぼちゃ10+牛乳50+トウモロコシ170（いずれもユーザー確認済み）
  time:720, // 素材の成長時間から算出：かぼちゃ15分・トウモロコシ720分（12時間）→長い方の720分
  rarity: [true,true,true,true,true],
  prices:[730],
  fesCoinPrice:105,
  fesCoinIcon:"yuuyafes_coin",
  materials:["ナラタケ","かぼちゃ(種@10)","牛乳(@50)","トウモロコシ(種@170)"],
  level:1,
  materials_image:[
    { image:"./images/materials/naratake.jpg" },
    { image:"./images/materials/kabotya.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/corn.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"かぼちゃとトマトのクリームポタージュ",
  nameI18n:{"ja":"かぼちゃとトマトのクリームポタージュ","en":"Creamy Pumpkin Tomato Soup","zh-CN":"南瓜奶油番茄浓汤","zh-TW":"南瓜奶油番茄濃湯","ko":"호박 크림 토마토 수프","th":"ซุปครีมฟักทองและมะเขือเทศ"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1102.PNG",
  restore: [20,24,28,32,40],
  cost:70, // ナラタケ0+かぼちゃ10+牛乳50+トマト10（いずれもユーザー確認済み）
  time:15, // 素材の成長時間から算出：かぼちゃ15分・トマト15分→どちらも15分
  rarity: [true,true,true,true,true],
  prices:[240],
  fesCoinPrice:35,
  fesCoinIcon:"yuuyafes_coin",
  materials:["ナラタケ","かぼちゃ(種@10)","牛乳(@50)","トマト(種@10)"],
  level:1,
  materials_image:[
    { image:"./images/materials/naratake.jpg" },
    { image:"./images/materials/kabotya.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/tomato.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"かぼちゃとニンジンのクリームポタージュ",
  nameI18n:{"ja":"かぼちゃとニンジンのクリームポタージュ","en":"Creamy Pumpkin Carrot Soup","zh-CN":"南瓜奶油胡萝卜浓汤","zh-TW":"南瓜奶油胡蘿蔔濃湯","ko":"호박 크림 당근 수프","th":"ซุปครีมฟักทองและแครอท"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1103.PNG",
  restore: [35,42,49,56,70],
  cost:85, // ナラタケ0+かぼちゃ10+牛乳50+ニンジン25（いずれもユーザー確認済み）
  time:120, // 素材の成長時間から算出：かぼちゃ15分・ニンジン120分（2時間）→長い方の120分
  rarity: [true,true,true,true,true],
  prices:[370],
  fesCoinPrice:55, // フェス星2売価82から逆算（55×1.5=82.5を切り捨てて82、ユーザー確認済み）
  fesCoinIcon:"yuuyafes_coin",
  materials:["ナラタケ","かぼちゃ(種@10)","牛乳(@50)","ニンジン(種@25)"],
  level:1,
  materials_image:[
    { image:"./images/materials/naratake.jpg" },
    { image:"./images/materials/kabotya.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/carrot.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"かぼちゃとナスのクリームポタージュ",
  nameI18n:{"ja":"かぼちゃとナスのクリームポタージュ","en":"Creamy Pumpkin Eggplant Soup","zh-CN":"南瓜奶油茄子浓汤","zh-TW":"南瓜奶油茄子濃湯","ko":"호박 크림 가지 수프","th":"ซุปครีมฟักทองและมะเขือม่วง"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1104.PNG",
  restore: [60,72,84,96,120],
  cost:195, // ナラタケ0+かぼちゃ10+牛乳50+ナス135（いずれもユーザー確認済み）
  time:420, // 素材の成長時間から算出：かぼちゃ15分・ナス420分（7時間）→長い方の420分
  rarity: [true,true,true,true,true],
  prices:[620],
  fesCoinPrice:90,
  fesCoinIcon:"yuuyafes_coin",
  materials:["ナラタケ","かぼちゃ(種@10)","牛乳(@50)","ナス(種@135)"],
  level:1,
  materials_image:[
    { image:"./images/materials/naratake.jpg" },
    { image:"./images/materials/kabotya.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/eggplant.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"イカのトムヤムクンヌードル",
  nameI18n:{"ja":"イカのトムヤムクンヌードル","en":"Tom Yum Cuttlefish Noodles","zh-CN":"冬阴功乌贼面","zh-TW":"冬蔭功烏賊麵","ko":"똠얌꿍 갑오징어면","th":"บะหมี่ต้มยำกุ้งหมึกกระดอง"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1105.PNG",
  restore: [30,36,42,48,60],
  cost:60, // トムヤムペースト50+かぼちゃ10+イカ0（ワイルドカード枠は最安のイカ0円を採用）
  time:15, // 素材の成長時間から算出：かぼちゃ15分（フェス限定作物の標準値、イカ枠はワイルドカードのため対象外）
  rarity: [true,true,true,true,true],
  prices:[290],
  fesCoinPrice:45,
  fesCoinIcon:"yuuyafes_coin",
  materials:["トムヤムペースト(@50)","かぼちゃ(種@10)","イカならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/tomuyamu_paste.jpg" },
    { image:"./images/materials/kabotya.jpg" },
    { image:"./images/materials/all_ika.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"シリヤケイカのトムヤムクンヌードル",
  nameI18n:{"ja":"シリヤケイカのトムヤムクンヌードル","en":"Tom Yum Spineless Cuttlefish Noodles","zh-CN":"冬阴功无针乌贼面","zh-TW":"冬蔭功無針烏賊麵","ko":"똠얌꿍 쇠갑오징어면","th":"บะหมี่ต้มยำกุ้งหมึกกระดองไร้หนาม"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1106.PNG",
  restore: [30,36,42,48,60],
  cost:60, // トムヤムペースト50+かぼちゃ10+シリヤケイカ0（いずれもユーザー確認済み）
  time:15, // 素材の成長時間から算出：かぼちゃ15分（シリヤケイカは作物ではないため対象外）
  rarity: [true,true,true,true,true],
  prices:[290],
  fesCoinPrice:45,
  fesCoinIcon:"yuuyafes_coin",
  materials:["トムヤムペースト(@50)","かぼちゃ(種@10)","シリヤケイカ"],
  level:1,
  materials_image:[
    { image:"./images/materials/tomuyamu_paste.jpg" },
    { image:"./images/materials/kabotya.jpg" },
    { image:"./images/materials/shiriyake_ika.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"トラフコウイカのトムヤムクンヌードル",
  nameI18n:{"ja":"トラフコウイカのトムヤムクンヌードル","en":"Tom Yum Pharaoh Cuttlefish Noodles","zh-CN":"冬阴功虎斑乌贼面","zh-TW":"冬蔭功虎斑烏賊麵","ko":"똠얌꿍 호랑무늬갑오징어면","th":"บะหมี่ต้มยำกุ้งหมึกกระดองลายเสือ"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1107.PNG",
  restore: [30,36,42,48,60],
  cost:60, // トムヤムペースト50+かぼちゃ10+トラフコウイカ0（いずれもユーザー確認済み）
  time:15, // 素材の成長時間から算出：かぼちゃ15分（トラフコウイカは作物ではないため対象外）
  rarity: [true,true,true,true,true],
  prices:[290],
  fesCoinPrice:45, // フェス星2売価67から逆算（45×1.5=67.5を切り捨てて67、ユーザー確認済み）
  fesCoinIcon:"yuuyafes_coin",
  materials:["トムヤムペースト(@50)","かぼちゃ(種@10)","トラフコウイカ"],
  level:1,
  materials_image:[
    { image:"./images/materials/tomuyamu_paste.jpg" },
    { image:"./images/materials/kabotya.jpg" },
    { image:"./images/materials/torafu_ika.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"コウイカのトムヤムクンヌードル",
  nameI18n:{"ja":"コウイカのトムヤムクンヌードル","en":"Tom Yum Golden Cuttlefish Noodles","zh-CN":"冬阴功金乌贼面","zh-TW":"冬蔭功金烏賊麵","ko":"똠얌꿍 참갑오징어면","th":"บะหมี่ต้มยำกุ้งหมึกกระดองทอง"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1108.PNG",
  restore: [30,36,42,48,60],
  cost:60, // トムヤムペースト50+かぼちゃ10+コウイカ0（いずれもユーザー確認済み）
  time:15, // 素材の成長時間から算出：かぼちゃ15分（コウイカは作物ではないため対象外）
  rarity: [true,true,true,true,true],
  prices:[290],
  fesCoinPrice:45,
  fesCoinIcon:"yuuyafes_coin",
  materials:["トムヤムペースト(@50)","かぼちゃ(種@10)","コウイカ"],
  level:1,
  materials_image:[
    { image:"./images/materials/tomuyamu_paste.jpg" },
    { image:"./images/materials/kabotya.jpg" },
    { image:"./images/materials/kou_ika.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
{
  name:"幽林の不思議セット",
  nameI18n:{"ja":"幽林の不思議セット","en":"Gloomwood Meal","zh-CN":"幽林奇妙餐","zh-TW":"幽林奇妙餐","ko":"정적의 숲 미스터리 세트","th":"อาหารมหัศจรรย์แห่งป่าลึกลับ"},
  fes:true,
  ended:false, // 2026/10/10 原始の呼び声フェス開始
  image:"./images/foods/1109.PNG",
  restore: [30,36,42,48,60],
  cost:340, // ホオズキ香るホットココア110×2+かぼちゃとキノコのクリームポタージュ60+イカのトムヤムクンヌードル60（各ワイルドカード枠は最安の料理の材料費を採用）
  time:15, // 材料費計算と同じ各ワイルドカード枠の採用レシピ（ホオズキ香るホットココア・かぼちゃとキノコのクリームポタージュ・イカのトムヤムクンヌードル、いずれも15分）のうち最も長いものを採用
  rarity: [true,true,true,true,true],
  prices:[1060],
  fesCoinPrice:160,
  fesCoinIcon:"yuuyafes_coin",
  materials:["ホオズキホットココアならなんでもOK","ホオズキホットココアならなんでもOK","かぼちゃのクリームポタージュならなんでもOK","イカのトムヤムクンヌードルならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_hozuki_cocoa.jpg" },
    { image:"./images/materials/all_hozuki_cocoa.jpg" },
    { image:"./images/materials/all_kabotya_potage.jpg" },
    { image:"./images/materials/all_ika_noodle.jpg" }
  ],
  authTarget: null, // フェス限定レシピのため認証マスター対象外
  auth:false
},
];
