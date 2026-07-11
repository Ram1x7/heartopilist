//isEvent: true

const foodsData = [
{
  name:"田園サラダ",
  nameI18n:{"ja":"田園サラダ","en":"Country Salad","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/001.PNG",
  cost:20,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[90,135,180,360,720],
  materials:["野菜ならなんでもOK","野菜ならなんでもOK","",""],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:null },
    { image:null }
  ],
  auth:true
},
{
  name:"ミックスジャム",
  nameI18n:{"ja":"ミックスジャム","en":"Mixed Jam","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/002.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[160,240,320,640,1280],
  materials:["ジャムの材料ならなんでもOK","ジャムの材料ならなんでもOK","ジャムの材料ならなんでもOK","ジャムの材料ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  auth:true
},
{
  name:"ラズベリージャム",
  nameI18n:{"ja":"ラズベリージャム","en":"Raspberry Jam","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/003.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[160,240,320,640,1280],
  materials:["ラズベリー","ラズベリー","ラズベリー","ラズベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/razuberi.jpg" },
    { image:"./images/materials/razuberi.jpg" },
    { image:"./images/materials/razuberi.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  auth:true
},
{
  name:"トマトソース",
  nameI18n:{"ja":"トマトソース","en":"Tomato Sauce","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/004.PNG",
  cost:40,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[180,270,360,720,1440],
  materials:["トマト(種@10)","トマト(種@10)","トマト(種@10)","トマト(種@10)"],
  level:1,
  materials_image:[
    { image:"./images/materials/tomato.jpg" },
    { image:"./images/materials/tomato.jpg" },
    { image:"./images/materials/tomato.jpg" },
    { image:"./images/materials/tomato.jpg" }
  ],
  auth:true
},
{
  name:"ブルーベリージャム",
  nameI18n:{"ja":"ブルーベリージャム","en":"Blueberry Jam","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/005.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[170,255,340,680,1360],
  materials:["ブルーベリー","ブルーベリー","ブルーベリー","ブルーベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/buruberi.jpg" },
    { image:"./images/materials/buruberi.jpg" },
    { image:"./images/materials/buruberi.jpg" },
    { image:"./images/materials/buruberi.jpg" }
  ],
  auth:true
},
{
  name:"リンゴジャム",
  nameI18n:{"ja":"リンゴジャム","en":"Apple Jam","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/006.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[270,405,540,1080,2160],
  materials:["リンゴ","リンゴ","リンゴ","リンゴ"],
  level:1,
  materials_image:[
    { image:"./images/materials/ringo.jpg" },
    { image:"./images/materials/ringo.jpg" },
    { image:"./images/materials/ringo.jpg" },
    { image:"./images/materials/ringo.jpg" }
  ],
  auth:true
},
{
  name:"オレンジジャム",
  nameI18n:{"ja":"オレンジジャム","en":"Orange Jam","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/007.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[270,405,540,1080,2160],
  materials:["オレンジ","オレンジ","オレンジ","オレンジ"],
  level:1,
  materials_image:[
    { image:"./images/materials/orange.jpg" },
    { image:"./images/materials/orange.jpg" },
    { image:"./images/materials/orange.jpg" },
    { image:"./images/materials/orange.jpg" }
  ],
  auth:true
},
{
  name:"不気味な食べ物",
  nameI18n:{"ja":"不気味な食べ物","en":"Creepy Food","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/009.PNG",
  cost:0,
  time:0,
  rarity: [true,false,false,false,false],
  prices:[30,null,null,null,null],
  materials:["食べ物の失敗作"],
  level:1,
  materials_image:[
    { image:null },
    { image:null },
    { image:null },
    { image:null }
  ],
  auth:false
},
{
  name:"不気味な飲み物",
  nameI18n:{"ja":"不気味な飲み物","en":"Creepy Drink","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/010.PNG",
  cost:0,
  time:0,
  rarity: [true,false,false,false,false],
  prices:[30,null,null,null,null],
  materials:["飲み物の失敗作"],
  level:1,
  materials_image:[
    { image:null },
    { image:null },
    { image:null },
    { image:null }
  ],
  auth:false
},
{
  name:"いちごジャム",
  nameI18n:{"ja":"いちごジャム","en":"Strawberry Jam","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/011.PNG",
  cost:500,
  time:360,
  rarity: [true,true,true,true,true],
  prices:[1580,2370,3160,6320,12640],
  materials:["いちご(種@125)","いちご(種@125)","いちご(種@125)","いちご(種@125)"],
  level:1,
  materials_image:[
    { image:"./images/materials/strawberry.jpg" },
    { image:"./images/materials/strawberry.jpg" },
    { image:"./images/materials/strawberry.jpg" },
    { image:"./images/materials/strawberry.jpg" }
  ],
  auth:true
},
{
  name:"パイナップルジャム",
  nameI18n:{"ja":"パイナップルジャム","en":"Pineapple Jam","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/012.PNG",
  cost:60,
  time:30,
  rarity: [true,true,true,true,true],
  prices:[280,420,560,1120,2240],
  materials:["パイナップル(種@15)","パイナップル(種@15)","パイナップル(種@15)","パイナップル(種@15)"],
  level:1,
  materials_image:[
    { image:"./images/materials/pineapple.jpg" },
    { image:"./images/materials/pineapple.jpg" },
    { image:"./images/materials/pineapple.jpg" },
    { image:"./images/materials/pineapple.jpg" }
  ],
  auth:true
},
{
  name:"ブドウジャム",
  nameI18n:{"ja":"ブドウジャム","en":"Grape Jam","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/013.PNG",
  cost:640,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[2020,3030,4040,8080,16160],
  materials:["ブドウ(種@160)","ブドウ(種@160)","ブドウ(種@160)","ブドウ(種@160)"],
  level:1,
  materials_image:[
    { image:"./images/materials/grape.jpg" },
    { image:"./images/materials/grape.jpg" },
    { image:"./images/materials/grape.jpg" },
    { image:"./images/materials/grape.jpg" }
  ],
  auth:true
},
{
  name:"チョコソース",
  nameI18n:{"ja":"チョコソース","en":"Chocolate Sauce","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/068.PNG",
  cost:440,
  time:300,
  rarity: [true,true,true,true,true],
  prices:[1400,2100,2800,5600,11200],
  materials:["カカオ豆(種@110)","カカオ豆(種@110)","カカオ豆(種@110)","カカオ豆(種@110)"],
  level:1,
  materials_image:[
    { image:"./images/materials/cacao.jpg" },
    { image:"./images/materials/cacao.jpg" },
    { image:"./images/materials/cacao.jpg" },
    { image:"./images/materials/cacao.jpg" }
  ],
  auth:true
},

{
  name:"スターフルーツジャム",
  nameI18n:{"ja":"スターフルーツジャム","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/096.PNG",
  cost:40,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[200,300,400,800,1600],
  materials:["スターフルーツ(種@10)","スターフルーツ(種@10)","スターフルーツ(種@10)","スターフルーツ(種@10)"],
  level:1,
  materials_image:[
    { image:"./images/materials/star_fruit.jpg" },
    { image:"./images/materials/star_fruit.jpg" },
    { image:"./images/materials/star_fruit.jpg" },
    { image:"./images/materials/star_fruit.jpg" }
  ],
  auth:false
},
{
  name:"フィッシュアンドチップス",
  nameI18n:{"ja":"フィッシュアンドチップス","en":"Fish and Chips","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/008.PNG",
  cost:60,
  time:60,
  rarity: [true,true,true,true,true],
  prices:[310,465,620,1240,2480],
  materials:["魚ならなんでもOK","魚ならなんでもOK","じゃがいも(種@30)","じゃがいも(種@30)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_fish.jpg" },
    { image:"./images/materials/all_fish.jpg" },
    { image:"./images/materials/potato.jpg" },
    { image:"./images/materials/potato.jpg" }
  ],
  auth:true
},
{
  name:"チーズケーキ",
  nameI18n:{"ja":"チーズケーキ","en":"Cheesecake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/014.PNG",
  cost:245,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[480,720,960,1920,3840],
  materials:["チーズ(@100)","牛乳(@50)","小麦(種@95)","小麦(種@95)"],
  level:1,
  materials_image:[
    { image:"./images/materials/cheese.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/wheat.jpg" }
  ],
  auth:true
},
{
  name:"オリジナルロールケーキ",
  nameI18n:{"ja":"オリジナルロールケーキ","en":"Original Roll Cake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/015.PNG",
  cost:450,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[550,825,1100,2200,4400],
  materials:["卵(@100)","牛乳(@50)","虹色キャンディならなんでもOK","虹キャンディならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/all_candy.jpg" },
    { image:"./images/materials/all_candy.jpg" }
  ],
  auth:true
},
{
  name:"赤いロールケーキ",
  nameI18n:{"ja":"赤いロールケーキ","en":"Red Roll Cake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/016.PNG",
  cost:550,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[670,1005,1340,2680,5360],
  materials:["卵(@100)","牛乳(@50)","赤いキャンディ(@200)","赤いキャンディ(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/red_candy.jpg" },
    { image:"./images/materials/red_candy.jpg" }
  ],
  auth:true
},
{
  name:"オレンジのロールケーキ",
  nameI18n:{"ja":"オレンジのロールケーキ","en":"Orange Roll Cake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/017.PNG",
  cost:550,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[670,1005,1340,2680,5360],
  materials:["卵(@100)","牛乳(@50)","オレンジのキャンディ(@200)","オレンジのキャンディ(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/orange_candy.jpg" },
    { image:"./images/materials/orange_candy.jpg" }
  ],
  auth:true
},
{
  name:"黄色いロールケーキ",
  nameI18n:{"ja":"黄色いロールケーキ","en":"Yellow Roll Cake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/018.PNG",
  cost:550,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[670,1005,1340,2680,5360],
  materials:["卵(@100)","牛乳(@50)","黄色いキャンディ(@200)","黄色いキャンディ(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/yellow_candy.jpg" },
    { image:"./images/materials/yellow_candy.jpg" }
  ],
  auth:true
},
{
  name:"紫のロールケーキ",
  nameI18n:{"ja":"紫のロールケーキ","en":"Purple Roll Cake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/019.PNG",
  cost:450,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[570,855,1140,2280,4560],
  materials:["卵(@100)","牛乳(@50)","紫のキャンディ(@150)","紫のキャンディ(@150)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/purple_candy.jpg" },
    { image:"./images/materials/purple_candy.jpg" }
  ],
  auth:true
},
{
  name:"緑のロールケーキ",
  nameI18n:{"ja":"緑のロールケーキ","en":"Green Roll Cake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/020.PNG",
  cost:550,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[670,1005,1340,2680,5360],
  materials:["卵(@100)","牛乳(@50)","緑のキャンディ(@200)","緑のキャンディ(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/green_candy.jpg" },
    { image:"./images/materials/green_candy.jpg" }
  ],
  auth:true
},
{
  name:"水色ロールケーキ",
  nameI18n:{"ja":"水色ロールケーキ","en":"Light Blue Roll Cake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/021.PNG",
  cost:450,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[570,855,1140,2280,4560],
  materials:["卵(@100)","牛乳(@50)","青のキャンディ(@150)","青のキャンディ(@150)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/water_candy.jpg" },
    { image:"./images/materials/water_candy.jpg" }
  ],
  auth:true
},
{
  name:"青いロールケーキ",
  nameI18n:{"ja":"青いロールケーキ","en":"Blue Roll Cake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/022.PNG",
  cost:450,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[570,855,1140,2280,4560],
  materials:["卵(@100)","牛乳(@50)","ブルーキャンディ(@150)","ブルーキャンディ(@150)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/blue_candy.jpg" },
    { image:"./images/materials/blue_candy.jpg" }
  ],
  auth:true
},
{
  name:"キノコパイ",
  nameI18n:{"ja":"キノコパイ","en":"Mushroom Pie","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/023.PNG",
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[500,750,1000,2000,4000],
  materials:["キノコならなんでもOK","キノコならなんでもOK","小麦(種@95)","卵(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_kinoko.jpg" },
    { image:"./images/materials/all_kinoko.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" }
  ],
  auth:true
},
{
  name:"ヒラタケパイ",
  nameI18n:{"ja":"ヒラタケパイ","en":"Oyster Mushroom Pie","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/024.PNG",
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[500,750,1000,2000,4000],
  materials:["ヒラタケ","ヒラタケ","小麦(種@95)","卵(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/hiratake.jpg" },
    { image:"./images/materials/hiratake.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" }
  ],
  auth:true
},
{
  name:"シイタケパイ",
  nameI18n:{"ja":"シイタケパイ","en":"Shiitake Pie","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/025.PNG",
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[500,750,1000,2000,4000],
  materials:["シイタケ","シイタケ","小麦(種@95)","卵(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/shitake.jpg" },
    { image:"./images/materials/shitake.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" }
  ],
  auth:true
},
{
  name:"マッシュルームパイ",
  nameI18n:{"ja":"マッシュルームパイ","en":"Button Mushroom Pie","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/026.PNG",
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[500,750,1000,2000,4000],
  materials:["マッシュルーム","マッシュルーム","小麦(種@95)","卵(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/mushroom.jpg" },
    { image:"./images/materials/mushroom.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" }
  ],
  auth:true
},
{
  name:"ヤマドリタケパイ",
  nameI18n:{"ja":"ヤマドリタケパイ","en":"Porcini Pie","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/027.PNG",
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[500,750,1000,2000,4000],
  materials:["ヤマドリタケ","ヤマドリタケ","小麦(種@95)","卵(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/yamadoritake.jpg" },
    { image:"./images/materials/yamadoritake.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" }
  ],
  auth:true
},
{
  name:"トリュフパイ",
  nameI18n:{"ja":"トリュフパイ","en":"Truffle Pie","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/028.PNG",
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[830,1245,1660,3320,6640],
  materials:["トリュフ","トリュフ","小麦(種@95)","卵(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/truffle.jpg" },
    { image:"./images/materials/truffle.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" }
  ],
  auth:true
},
{
  name:"焼きキノコ",
  nameI18n:{"ja":"焼きキノコ","en":"Grilled Mushrooms","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/029.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[180,270,360,720,1440],
  materials:["キノコならなんでもOK","キノコならなんでもOK","キノコならなんでもOK","キノコならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_kinoko.jpg" },
    { image:"./images/materials/all_kinoko.jpg" },
    { image:"./images/materials/all_kinoko.jpg" },
    { image:"./images/materials/all_kinoko.jpg" }
  ],
  auth:true
},
{
  name:"焼きヒラタケ",
  nameI18n:{"ja":"焼きヒラタケ","en":"Grilled Oyster Mushroom","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/030.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[180,270,360,720,1440],
  materials:["ヒラタケ","ヒラタケ","ヒラタケ","ヒラタケ"],
  level:1,
  materials_image:[
    { image:"./images/materials/hiratake.jpg" },
    { image:"./images/materials/hiratake.jpg" },
    { image:"./images/materials/hiratake.jpg" },
    { image:"./images/materials/hiratake.jpg" }
  ],
  auth:true
},
{
  name:"焼きシイタケ",
  nameI18n:{"ja":"焼きシイタケ","en":"Grilled Shiitake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/031.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[180,270,360,720,1440],
  materials:["シイタケ","シイタケ","シイタケ","シイタケ"],
  level:1,
  materials_image:[
    { image:"./images/materials/shitake.jpg" },
    { image:"./images/materials/shitake.jpg" },
    { image:"./images/materials/shitake.jpg" },
    { image:"./images/materials/shitake.jpg" }
  ],
  auth:true
},
{
  name:"焼きマッシュルーム",
  nameI18n:{"ja":"焼きマッシュルーム","en":"Grilled Button Mushroom","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/032.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[180,270,360,720,1440],
  materials:["マッシュルーム","マッシュルーム","マッシュルーム","マッシュルーム"],
  level:1,
  materials_image:[
    { image:"./images/materials/mushroom.jpg" },
    { image:"./images/materials/mushroom.jpg" },
    { image:"./images/materials/mushroom.jpg" },
    { image:"./images/materials/mushroom.jpg" }
  ],
  auth:true
},
{
  name:"焼きヤマドリタケ",
  nameI18n:{"ja":"焼きヤマドリタケ","en":"Grilled Porcini","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/033.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[180,270,360,720,1440],
  materials:["ヤマドリタケ","ヤマドリタケ","ヤマドリタケ","ヤマドリタケ"],
  level:1,
  materials_image:[
    { image:"./images/materials/yamadoritake.jpg" },
    { image:"./images/materials/yamadoritake.jpg" },
    { image:"./images/materials/yamadoritake.jpg" },
    { image:"./images/materials/yamadoritake.jpg" }
  ],
  auth:true
},
{
  name:"温泉卵",
  nameI18n:{"ja":"温泉卵","en":"Onsen Egg","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/056.PNG",
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[130,195,260,520,1140],
  materials:["無菌卵(@100)","","",""],
  level:1,
  materials_image:[
    { image:"./images/materials/m_egg.jpg" },
    { image:null },
    { image:null },
    { image:null }
  ],
  auth:false
},
{
  name:"復活のエッグ",
  nameI18n:{"ja":"復活のエッグ","en":"Egg of Revival","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/058.PNG",
  cost:100,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[190,285,380,760,1520],
  materials:["卵(@100)","復活のエッグの素材ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:null },
    { image:null }
  ],
  auth:false
},
{
  name:"復活祭の模様入り卵(紫)",
  nameI18n:{"ja":"復活祭の模様入り卵(紫)","en":"Easter Patterned Egg (Purple)","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/059.PNG",
  cost:260,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[620,930,1240,2480,4960],
  materials:["卵(@100)","ブドウ(種@160)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/grape.jpg" },
    { image:null },
    { image:null }
  ],
  auth:false
},
{
  name:"復活祭の模様入り卵(緑)",
  nameI18n:{"ja":"復活祭の模様入り卵(緑)","en":"Easter Patterned Egg (Green)","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/060.PNG",
  cost:245,
  time:480,
  rarity: [true,true,true,true,true],
  prices:[570,855,1140,2280,4560],
  materials:["卵(@100)","レタス(種@145)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lettuce.jpg" },
    { image:null },
    { image:null }
  ],
  auth:false
},
{
  name:"復活祭の模様入り卵(オレンジ)",
  nameI18n:{"ja":"復活祭の模様入り卵(オレンジ)","en":"Easter Patterned Egg (Orange)","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/061.PNG",
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[190,285,380,760,1520],
  materials:["卵(@100)","リンゴ"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/apple.jpg" },
    { image:null },
    { image:null }
  ],
  auth:false
},
{
  name:"復活祭のイースターエッグの宴",
  nameI18n:{"ja":"復活祭のイースターエッグの宴","en":"Easter Egg Feast","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/062.PNG",
  cost:755,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[1650,2475,3300,6600,13200],
  materials:["復活のエッグ","復活祭の模様入り卵(紫)","復活祭の模様入り卵(緑)","復活祭の模様入り卵(オレンジ)"],
  level:1,
  materials_image:[
    { image:"./images/materials/f_egg.jpg" },
    { image:"./images/materials/p_egg.jpg" },
    { image:"./images/materials/g_egg.jpg" },
    { image:"./images/materials/o_egg.jpg" }
  ],
  auth:false
},
{
  name:"三角の白米ちまき",
  nameI18n:{"ja":"三角の白米ちまき","en":"Triangular White Rice Zongzi","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/071.PNG",
  cost:162,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[240,360,480,960,1920],
  materials:["ちまきの葉(@50)","稲(@12)","ちまきの食材ならなんでもOK","ちまきの食材ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/timaki.jpg" },
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  auth:false
},
{
  name:"三角のあずきちまき",
  nameI18n:{"ja":"三角のあずきちまき","en":"Triangular Red Bean Zongzi","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/072.PNG",
  cost:162,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[260,390,520,1040,2080],
  materials:["ちまきの葉(@50)","稲(@12)","あずき(@50)","あずき(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/timaki.jpg" },
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/azuki.jpg" },
    { image:"./images/materials/azuki.jpg" }
  ],
  auth:false
},
{
  name:"三角の卵黄入り肉ちまき",
  nameI18n:{"ja":"三角の卵黄入り肉ちまき","en":"Triangular Meat & Egg Yolk Zongzi","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/073.PNG",
  cost:362,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[460,690,920,1840,3680],
  materials:["ちまきの葉(@50)","稲(@12)","卵(@100)","肉(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/timaki.jpg" },
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/meat.jpg" }
  ],
  auth:false
},
{
  name:"枕型の白米ちまき",
  nameI18n:{"ja":"枕型の白米ちまき","en":"Pillow-shaped White Rice Zongzi","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/074.PNG",
  cost:162,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[240,360,480,960,1920],
  materials:["ちまきの葉(@50)","稲(@12)","ちまきの食材ならなんでもOK","ちまきの食材ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/timaki.jpg" },
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  auth:false
},
{
  name:"枕型のこしあんちまき",
  nameI18n:{"ja":"枕型のこしあんちまき","en":"Pillow-shaped Red Bean Paste Zongzi","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/075.PNG",
  cost:162,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[260,390,520,1040,2080],
  materials:["ちまきの葉(@50)","稲(@12)","あずき(@50)","あずき(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/timaki.jpg" },
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/azuki.jpg" },
    { image:"./images/materials/azuki.jpg" }
  ],
  auth:false
},
{
  name:"枕型の卵黄入りちまき",
  nameI18n:{"ja":"枕型の卵黄入りちまき","en":"Pillow-shaped Egg Yolk Zongzi","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/076.PNG",
  cost:362,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[460,690,920,1840,3680],
  materials:["ちまきの葉(@50)","稲(@12)","卵(@100)","肉(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/timaki.jpg" },
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/meat.jpg" }
  ],
  auth:false
},
{
  name:"モルチーズカヌレ",
  nameI18n:{"ja":"モルチーズカヌレ","en":"Maltese Canelé","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/063.PNG",
  cost:370,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[910,1365,1820,3640,7280],
  materials:["卵(@100)","牛乳(@50)","小麦(種@95)","イチゴ(種@125)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/strawberry.jpg" }
  ],
  auth:false
},
{
  name:"レトリバーカヌレ",
  nameI18n:{"ja":"レトリバーカヌレ","en":"Retriever Canelé","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/064.PNG",
  cost:295,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[590,885,1180,2360,4720],
  materials:["卵(@100)","牛乳(@50)","小麦(種@95)","コーヒー豆(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/coffee.jpg" }
  ],
  auth:false
},
{
  name:"モルチーズコンパンナ",
  nameI18n:{"ja":"モルチーズコンパンナ","en":"Maltese Con Panna","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/065.PNG",
  cost:350,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[520,780,1040,2080,4160],
  materials:["牛乳(@50)","牛乳(@50)","牛乳(@50)","コーヒー(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/r_coffee.jpg" }
  ],
  auth:false
},
{
  name:"レトリバーコンパンナ",
  nameI18n:{"ja":"レトリバーコンパンナ","en":"Retriever Con Panna","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/066.PNG",
  cost:350,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[520,780,1040,2080,4160],
  materials:["牛乳(@50)","牛乳(@50)","コーヒー豆(@50)","コーヒー(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/r_coffee.jpg" }
  ],
  auth:false
},
{
  name:"ラブリーMALTESEコンパンナ",
  nameI18n:{"ja":"ラブリーMALTESEコンパンナ","en":"Lovely Maltese Con Panna","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/067.PNG",
  cost:500,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[1220,1830,2440,4880,9760],
  materials:["牛乳(@50)","牛乳(@50)","コーヒー(@200)","コーヒー(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/r_coffee.jpg" },
    { image:"./images/materials/r_coffee.jpg" }
  ],
  auth:false
},
{
  name:"若草のケーキ",
  nameI18n:{"ja":"若草のケーキ","en":"Spring Green Cake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/057.PNG",
  cost:395,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[690,1035,1380,2760,5520],
  materials:["小麦(種@95)","牛乳(@50)","抹茶パウダー(@250)","雑草"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/mattya.jpg" },
    { image:"./images/materials/grass.jpg" }
  ],
  auth:false
},
{
  name:"虹のときめきグミ",
  nameI18n:{"ja":"虹のときめきグミ","en":"Rainbow Sparkle Gummy","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/070.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[170,255,340,680,1360],
  materials:["果物ならなんでもOK","果物ならなんでもOK","果物ならなんでもOK","果物ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/all_fruit.jpg" }
  ],
  auth:false
},
{
  name:"虹のドキドキグミ",
  nameI18n:{"ja":"虹のドキドキグミ","en":"Rainbow Thrill Gummy","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/069.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[170,255,340,680,1360],
  materials:["果物ならなんでもOK","果物ならなんでもOK","果物ならなんでもOK","果物ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/all_fruit.jpg" }
  ],
  auth:false
},
{
  name:"コーヒー",
  nameI18n:{"ja":"コーヒー","en":"Coffee","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/034.PNG",
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[290,435,580,1160,2320],
  materials:["コーヒー豆(@50)","コーヒー豆(@50)","コーヒーの材料ならなんでもOK","コーヒーの材料ならなんでもOK"],
  level:2,
  materials_image:[
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  auth:true
},
{
  name:"カフェラテ",
  nameI18n:{"ja":"カフェラテ","en":"Café Latte","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/035.PNG",
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[300,450,600,1200,2400],
  materials:["コーヒー豆×2(@50×2)","牛乳×2(@50×2)"],
  level:2,
  materials_image:[
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" }
  ],
  auth:true
},
{
  name:"スモークサーモンベーグル",
  nameI18n:{"ja":"スモークサーモンベーグル","en":"Smoked Salmon Bagel","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/036.PNG",
  cost:205,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[520,780,1040,2080,4160],
  materials:["魚ならなんでもOK","チーズ(@100)","野菜ならなんでもOK","小麦(種@95)"],
  level:2,
  materials_image:[
    { image:"./images/materials/all_fish.jpg" },
    { image:"./images/materials/cheese.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/wheat.jpg" }
  ],
  auth:true
},
{
  name:"海ぶどうとシイタケの茶碗蒸し",
  nameI18n:{"ja":"海ぶどうとシイタケの茶碗蒸し","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/097.PNG",
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[230,345,460,980,1960],
  materials:["海ぶどう","海ぶどう","シイタケ","無菌卵(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/shitake.jpg" },
    { image:"./images/materials/m_egg.jpg" }
  ],
  auth:true
},
{
  name:"ワカメと肉団子のスープ",
  nameI18n:{"ja":"ワカメと肉団子のスープ","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/098.PNG",
  cost:400,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[500,750,1000,2000,4000],
  materials:["ワカメ","ワカメ","肉(@200)","肉(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/meat.jpg" }
  ],
  auth:true
},
{
  name:"シーフードリゾット",
  nameI18n:{"ja":"シーフードリゾット","en":"Seafood Risotto","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/037.PNG",
  cost:105,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[490,735,980,1960,3920],
  materials:["海鮮ならなんでもOK","海鮮ならなんでもOK","小麦(種@95)","トマト(種@10)"],
  level:3,
  materials_image:[
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tomato.jpg" }
  ],
  auth:true
},
{
  name:"カントリー風煮込み",
  nameI18n:{"ja":"カントリー風煮込み","en":"Country-style Stew","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/038.PNG",
  cost:185,
  time:640,
  rarity: [true,true,true,true,true],
  prices:[640,960,1280,2560,5120],
  materials:["トマト(種@10)","じゃがいも(種@30)","レタス(種@145)",""],
  level:3,
  materials_image:[
    { image:"./images/materials/tomato.jpg" },
    { image:"./images/materials/potato.jpg" },
    { image:"./images/materials/lettuce.jpg" },
    { image:null }
  ],
  auth:true
},
{
  name:"トリュフのクリームパスタ",
  nameI18n:{"ja":"トリュフのクリームパスタ","en":"Truffle Cream Pasta","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/039.PNG",
  cost:240,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[900,1350,1800,3600,7200],
  materials:["トリュフ","小麦(種@95)","小麦(種@95)","牛乳(@50)"],
  level:3,
  materials_image:[
    { image:"./images/materials/truffle.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" }
  ],
  auth:true
},
{
  name:"シーアスパラガスのエビチャーハン",
  nameI18n:{"ja":"シーアスパラガスのエビチャーハン","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/099.PNG",
  cost:12,
  time:20,
  rarity: [true,true,true,true,true],
  prices:[160,240,320,640,1280],
  materials:["稲(種@12)","シーアスパラガス","シーアスパラガス","ウミエビ"],
  level:1,
  materials_image:[
    { image:"./images/materials/ine.jpg" },
    { image:"./images/materials/sea_asupara.jpg" },
    { image:"./images/materials/sea_asupara.jpg" },
    { image:"./images/materials/umiebi.jpg" }
  ],
  auth:true
},
{
  name:"シーフードピザ",
  nameI18n:{"ja":"シーフードピザ","en":"Seafood Pizza","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/040.PNG",
  cost:235,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[780,1170,1560,3120,6240],
  materials:["チーズ(@100)","トマトソース(@40)","小麦(種@95)","魚ならなんでもOK"],
  level:4,
  materials_image:[
    { image:"./images/materials/cheese.jpg" },
    { image:"./images/materials/tomato_source.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/all_fish.jpg" }
  ],
  auth:true
},
{
  name:"ミートソースパスタ",
  nameI18n:{"ja":"ミートソースパスタ","en":"Meat Sauce Pasta","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/041.PNG",
  cost:405,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[670,1005,1340,2680,5360],
  materials:["肉(@200)","小麦(種@95)","トマト(種@10)","チーズ(@100)"],
  level:4,
  materials_image:[
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tomato.jpg" },
    { image:"./images/materials/cheese.jpg" }
  ],
  auth:true
},
{
  name:"アップルパイ",
  nameI18n:{"ja":"アップルパイ","en":"Apple Pie","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/042.PNG",
  cost:345,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[730,1095,1460,2920,5840],
  materials:["リンゴ","小麦(種@95)","卵(@100)","バター(@150)"],
  level:5,
  materials_image:[
    { image:"./images/materials/apple.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/batter.jpg" }
  ],
  auth:true
},
{
  name:"ニンジンケーキ",
  nameI18n:{"ja":"ニンジンケーキ","en":"Carrot Cake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/043.PNG",
  cost:245,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[840,1260,1680,3360,6720],
  materials:["ニンジン(種@25)","ニンジン(種@25)","卵(@100)","小麦(種@95)"],
  level:5,
  materials_image:[
    { image:"./images/materials/carrot.jpg" },
    { image:"./images/materials/carrot.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/wheat.jpg" }
  ],
  auth:true
},
{
  name:"コーンポタージュ",
  nameI18n:{"ja":"コーンポタージュ","en":"Corn Potage","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/044.PNG",
  cost:540,
  time:720,
  rarity: [true,true,true,true,true],
  prices:[1340,2010,2680,5360,10720],
  materials:["トウモロコシ(種@170)","トウモロコシ(種@170)","牛乳(@50)","バター(@150)"],
  level:5,
  materials_image:[
    { image:"./images/materials/corn.jpg" },
    { image:"./images/materials/corn.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/batter.jpg" }
  ],
  auth:true
},
{
  name:"豪華海鮮盛り合わせ",
  nameI18n:{"ja":"豪華海鮮盛り合わせ","en":"Deluxe Seafood Platter","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/045.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[410,615,820,1640,3280],
  materials:["北欧アカザエビ","北欧アカザエビ","魚ならなんでもOK","魚ならなんでもOK"],
  level:6,
  materials_image:[
    { image:"./images/materials/akaza.jpg" },
    { image:"./images/materials/akaza.jpg" },
    { image:"./images/materials/all_fish.jpg" },
    { image:"./images/materials/all_fish.jpg" }
  ],
  auth:true
},
{
  name:"ティラミス",
  nameI18n:{"ja":"ティラミス","en":"Tiramisu","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/046.PNG",
  cost:300,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[530,795,1060,2120,4240],
  materials:["コーヒー豆(@50)","卵(@100)","牛乳(@50)","チーズ(@100)"],
  level:6,
  materials_image:[
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/cheese.jpg" }
  ],
  auth:true
},
{
  name:"キャンプセット",
  nameI18n:{"ja":"キャンプセット","en":"Camping Set","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/047.PNG",
  cost:840,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[2260,3390,4520,9040,18080],
  materials:["コーヒー(@200)","シーフードピザ(@235)","アップルパイ(@345)","フィッシュアンドチップス(@60)"],
  level:7,
  materials_image:[
    { image:"./images/materials/r_coffee.jpg" },
    { image:"./images/materials/seafood_pizza.jpg" },
    { image:"./images/materials/apple_pie.jpg" },
    { image:"./images/materials/fish_Chips.jpg" }
  ],
  auth:true
},
{
  name:"英式アフタヌーンティー",
  nameI18n:{"ja":"英式アフタヌーンティー","en":"English Afternoon Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/048.PNG",
  cost:300,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[710,1065,1420,2840,5680],
  materials:["ティラミス(@300)","ジャムの材料ならなんでもOK","",""],
  level:7,
  materials_image:[
    { image:"./images/materials/teiramisu.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:null },
    { image:null }
  ],
  auth:true
},
{
  name:"ミートバーガー",
  nameI18n:{"ja":"ミートバーガー","en":"Meat Burger","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/049.PNG",
  cost:480,
  time:480,
  rarity: [true,true,true,true,true],
  prices:[1350,2025,2700,5400,10800],
  materials:["小麦(種@95)","肉(@200)","レタス(種@145)","トマトソース(@40)"],
  level:8,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/lettuce.jpg" },
    { image:"./images/materials/tomato_source.jpg" }
  ],
  auth:true
},
{
  name:"アカザエビの前菜",
  nameI18n:{"ja":"アカザエビの前菜","en":"Norway Lobster Appetizer","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/050.PNG",
  cost:145,
  time:480,
  rarity: [true,true,true,true,true],
  prices:[850,1275,1700,3400,6800],
  materials:["アカザエビならなんでもOK","アカザエビならなんでもOK","アカザエビならなんでもOK","レタス(種@145)"],
  level:8,
  materials_image:[
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/lettuce.jpg" }
  ],
  auth:true
},
{
  name:"北欧ブルーアカザエビの前菜",
  nameI18n:{"ja":"北欧ブルーアカザエビの前菜","en":"Nordic Blue Norway Lobster Appetizer","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/051.PNG",
  cost:145,
  time:480,
  rarity: [true,true,true,true,true],
  prices:[1310,1965,2620,5240,10480],
  materials:["北欧ブルーアカザエビ","北欧ブルーアカザエビ","北欧ブルーアカザエビ","レタス(種@145)"],
  level:8,
  materials_image:[
    { image:"./images/materials/blue_akaza.jpg" },
    { image:"./images/materials/blue_akaza.jpg" },
    { image:"./images/materials/blue_akaza.jpg" },
    { image:"./images/materials/lettuce.jpg" }
  ],
  auth:true
},
{
  name:"ナスとひき肉の炒め物",
  nameI18n:{"ja":"ナスとひき肉の炒め物","en":"Stir-fried Eggplant and Ground Meat","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/052.PNG",
  cost:475,
  time:420,
  rarity: [true,true,true,true,true],
  prices:[1230,1845,2460,4920,9840],
  materials:["ナス(種@135)","肉(@200)","料理油(@100)","トマトソース(@40)"],
  level:10,
  materials_image:[
    { image:"./images/materials/eggplant.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/oil.jpg" },
    { image:"./images/materials/tomato_source.jpg" }
  ],
  auth:true
},
{
  name:"キャンドルディナー",
  nameI18n:{"ja":"キャンドルディナー","en":"Candlelight Dinner","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/053.PNG",
  cost:630,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[1760,2640,3520,7040,14080],
  materials:["田園サラダ(@20)","スモークサーモンベーグル(@205)","シーフードリゾット(@105)","ティラミス(@300)"],
  level:9,
  materials_image:[
    { image:"./images/materials/salad.jpg" },
    { image:"./images/materials/salmon_bagel.jpg" },
    { image:"./images/materials/seafood_rizotto.jpg" },
    { image:"./images/materials/teiramisu.jpg" }
  ],
  auth:true
},
{
  name:"蒸しタラバガニ",
  nameI18n:{"ja":"蒸しタラバガニ","en":"Steamed King Crab","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/054.PNG",
  cost:150,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[1990,2985,3980,7960,15920],
  materials:["タラバガニならなんでもOK","タラバガニならなんでもOK","タラバガニならなんでもOK","バター(@150)"],
  level:10,
  materials_image:[
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/batter.jpg" }
  ],
  auth:true
},
{
  name:"蒸し黄金タラバガニ",
  nameI18n:{"ja":"蒸し黄金タラバガニ","en":"Steamed Golden King Crab","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/055.PNG",
  cost:150,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[2980,4470,5960,11920,23840],
  materials:["黄金タラバガニ","黄金タラバガニ","黄金タラバガニ","バター(@150)"],
  level:10,
  materials_image:[
    { image:"./images/materials/gold_taraba.jpg" },
    { image:"./images/materials/gold_taraba.jpg" },
    { image:"./images/materials/gold_taraba.jpg" },
    { image:"./images/materials/batter.jpg" }
  ],
  auth:true
},
{
  name:"香る紅茶",
  nameI18n:{"ja":"香る紅茶","en":"Fragrant Black Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/077.PNG",
  cost:600,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[840,1260,1680,3360,6720],
  materials:["紅茶(@250)","紅茶(@250)","紅茶の食材ならなんでもOK","紅茶の食材ならなんでもOK"],
  level:11,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  auth:true
},
{
  name:"濃厚ミルクティー",
  nameI18n:{"ja":"濃厚ミルクティー","en":"Rich Milk Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/078.PNG",
  cost:600,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[840,1260,1680,3360,6720],
  materials:["紅茶(@250)","紅茶(@250)","牛乳(@50)","牛乳(@50)"],
  level:11,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" }
  ],
  auth:true
},
{
  name:"ココアミルクティー",
  nameI18n:{"ja":"ココアミルクティー","en":"Cocoa Milk Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/079.PNG",
  cost:660,
  time:300,
  rarity: [true,true,true,true,true],
  prices:[1120,1680,2240,4480,8960],
  materials:["紅茶(@250)","紅茶(@250)","牛乳(@50)","カカオ豆(種@110)"],
  level:11,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/cacao.jpg" }
  ],
  auth:true
},
{
  name:"シェイク",
  nameI18n:{"ja":"シェイク","en":"Shake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/080.PNG",
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[400,600,800,1600,3200],
  materials:["牛乳(@50)","牛乳(@50)","シェイクの食材ならなんでもOK","シェイクの食材ならなんでもOK"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  auth:true
},
{
  name:"ココアシェイク",
  nameI18n:{"ja":"ココアシェイク","en":"Cocoa Shake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/081.PNG",
  cost:320,
  time:300,
  rarity: [true,true,true,true,true],
  prices:[1120,1680,2240,4480,8960],
  materials:["牛乳(@50)","牛乳(@50)","カカオ豆(種@110)","カカオ(種@110)"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/cacao.jpg" },
    { image:"./images/materials/cacao.jpg" }
  ],
  auth:true
},
{
  name:"ラズベリーシェイク",
  nameI18n:{"ja":"ラズベリーシェイク","en":"Raspberry Shake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/082.PNG",
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[440,660,880,1760,3520],
  materials:["牛乳(@50)","牛乳(@50)","ラズベリー","ラズベリー"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/razuberi.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  auth:true
},
{
  name:"ブルーベリーシェイク",
  nameI18n:{"ja":"ブルーベリーシェイク","en":"Blueberry Shake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/083.PNG",
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[2980,4470,5960,11920,23840],
  materials:["牛乳(@50)","牛乳(@50)","ブルーベリー","ブルーベリー"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/buruberi.jpg" },
    { image:"./images/materials/buruberi.jpg" }
  ],
  auth:true
},
{
  name:"リンゴシェイク",
  nameI18n:{"ja":"リンゴシェイク","en":"Apple Shake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/084.PNG",
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[450,675,900,1800,3600],
  materials:["牛乳(@50)","牛乳(@50)","リンゴ","リンゴ"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/ringo.jpg" },
    { image:"./images/materials/ringo.jpg" }
  ],
  auth:true
},
{
  name:"オレンジシェイク",
  nameI18n:{"ja":"オレンジシェイク","en":"Orange Shake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/085.PNG",
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[450,675,900,1800,3600],
  materials:["牛乳(@50)","牛乳(@50)","オレンジ","オレンジ"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/orange.jpg" },
    { image:"./images/materials/orange.jpg" }
  ],
  auth:true
},
{
  name:"パイナップルシェイク",
  nameI18n:{"ja":"パイナップルシェイク","en":"Pineapple Shake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/086.PNG",
  cost:130,
  time:30,
  rarity: [true,true,true,true,true],
  prices:[440,660,880,1760,3520],
  materials:["牛乳(@50)","牛乳(@50)","パイナップル(種@15)","パイナップル(種@15)"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/pineapple.jpg" },
    { image:"./images/materials/pineapple.jpg" }
  ],
  auth:true
},
{
  name:"いちごシェイク",
  nameI18n:{"ja":"いちごシェイク","en":"Strawberry Shake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/087.PNG",
  cost:250,
  time:360,
  rarity: [true,true,true,true,true],
  prices:[1090,1635,2180,4360,8720],
  materials:["牛乳(@50)","牛乳(@50)","いちご(種@125)","いちご(種@125)"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/strawberry.jpg" },
    { image:"./images/materials/strawberry.jpg" }
  ],
  auth:true
},
{
  name:"ブドウシェイク",
  nameI18n:{"ja":"ブドウシェイク","en":"Grape Shake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/088.PNG",
  cost:420,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[1300,1950,2600,5200,10400],
  materials:["牛乳(@50)","牛乳(@50)","ブドウ(種@160)","ブドウ(種@160)"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/grape.jpg" },
    { image:"./images/materials/grape.jpg" }
  ],
  auth:true
},
{
  name:"抹茶シェイク",
  nameI18n:{"ja":"抹茶シェイク","en":"Matcha Shake","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/089.PNG",
  cost:600,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[840,1260,1680,3360,6720],
  materials:["牛乳(@50)","牛乳(@50)","抹茶パウダー(@250)","抹茶パウダー(@250)"],
  level:11,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/mattya.jpg" },
    { image:"./images/materials/mattya.jpg" }
  ],
  auth:true
},
{
  name:"フレッシュ緑茶",
  nameI18n:{"ja":"フレッシュ緑茶","en":"Fresh Green Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/090.PNG",
  cost:100,
  time:45,
  rarity: [true,true,true,true,true],
  prices:[500,750,1000,2000,4000],
  materials:["茶葉(種@25)","茶葉(種@25)","緑茶の食材ならなんでもOK","緑茶の食材ならなんでもOK"],
  level:12,
  materials_image:[
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  auth:true
},
{
  name:"フレッシュミルクティー",
  nameI18n:{"ja":"フレッシュミルクティー","en":"Fresh Milk Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/091.PNG",
  cost:150,
  time:45,
  rarity: [true,true,true,true,true],
  prices:[500,750,1000,2000,4000],
  materials:["茶葉(種@25)","茶葉(種@25)","牛乳(@50)","牛乳(@50)"],
  level:12,
  materials_image:[
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" }
  ],
  auth:true
},
{
  name:"抹茶ミルクティー",
  nameI18n:{"ja":"抹茶ミルクティー","en":"Matcha Milk Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/092.PNG",
  cost:350,
  time:45,
  rarity: [true,true,true,true,true],
  prices:[700,1050,1400,2800,5600],
  materials:["茶葉(種@25)","茶葉(種@25)","牛乳(@50)","抹茶パウダー(@250)"],
  level:12,
  materials_image:[
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/mattya.jpg" }
  ],
  auth:true
},
{
  name:"ヒナギクハーブティー",
  nameI18n:{"ja":"ヒナギクハーブティー","en":"Daisy Herbal Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/093.PNG",
  cost:110,
  time:1440,
  rarity: [true,true,true,true,true],
  prices:[600,900,1200,2400,4800],
  materials:["茶葉(種@25)","茶葉(種@25)","白いヒナギク(種@30)","白いヒナギク(種@30)"],
  level:12,
  materials_image:[
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/hinagiku.jpg" },
    { image:"./images/materials/hinagiku.jpg" }
  ],
  auth:true
},
{
  name:"ローズティー",
  nameI18n:{"ja":"ローズティー","en":"Rose Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/094.PNG",
  cost:650,
  time:4320,
  rarity: [true,true,true,true,true],
  prices:[1930,2895,3860,7720,15440],
  materials:["茶葉(種@25)","茶葉(種@25)","赤いバラ(種@300)","赤いバラ(種@300)"],
  level:12,
  materials_image:[
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/tyaba.jpg" },
    { image:"./images/materials/rose.jpg" },
    { image:"./images/materials/rose.jpg" }
  ],
  auth:true
},
{
  name:"アフターヌーンティー",
  nameI18n:{"ja":"アフターヌーンティー","en":"Afternoon Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/foods/095.PNG",
  cost:1690,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[2970,4455,5940,11880,23760],
  materials:["チーズケーキ(@245)","チーズケーキ(@245)","香る紅茶(@600)","香る紅茶(@600)"],
  level:12,
  materials_image:[
    { image:"./images/materials/cheese_cake.jpg" },
    { image:"./images/materials/cheese_cake.jpg" },
    { image:"./images/materials/k_kotya.jpg" },
    { image:"./images/materials/k_kotya.jpg" }
  ],
  auth:true
},
{
  name:"エビのアボカドカップ詰め",
  nameI18n:{"ja":"エビのアボカドカップ詰め","en":"Shrimp-stuffed Avocado Cup","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/000.PNG",
  cost:360,
  time:840,
  rarity: [true,true,true,true,true],
  prices:[1560,2340,3120,6240,12480],
  materials:["アカザエビならなんでもOK","アカザエビならなんでもOK","アボカド(種@180)","アボカド(種@180)"],
  level:13,
  materials_image:[
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/000.PNG" },
    { image:"./images/000.PNG" }
  ],
  auth:true
},
{
  name:"チーズカニ爪フライ",
  nameI18n:{"ja":"チーズカニ爪フライ","en":"Fried Cheese Crab Claw","zh-CN":"","zh-TW":"","ko":"","th":""},
  image:"./images/000.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[1440,2160,2880,5760,11520],
  materials:["タラバガニならなんでもOK","タラバガニならなんでもOK","アカザエビならなんでもOK","アカザエビならなんでもOK"],
  level:13,
  materials_image:[
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" },
    { image:"./images/materials/all_kaisen.jpg" }
  ],
  auth:true
},
{
  name:"アイスカップコーヒー",
  nameI18n:{"ja":"アイスカップコーヒー","en":"Iced Cup Coffee","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:true,
  image:"./images/foods/1001.PNG",
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[280,420,560,1120,2240],
  materials:["シュガー(@50)","コーヒー豆(@50)","コーヒーの材料ならなんでもOK","コーヒーの材料ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/sugar.jpg" },
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/all_material.jpg" },
    { image:"./images/materials/all_material.jpg" }
  ],
  auth:false
},
{
  name:"アイスカップカフェラテ",
  nameI18n:{"ja":"アイスカップカフェラテ","en":"Iced Cup Café Latte","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:true,
  image:"./images/foods/1002.PNG",
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[280,420,560,1120,2240],
  materials:["シュガー(@50)","コーヒー豆(@50)","牛乳(@50)","牛乳(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/sugar.jpg" },
    { image:"./images/materials/coffee.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/milk.jpg" }
  ],
  auth:false
},
{
  name:"大根おろし肉",
  nameI18n:{"ja":"大根おろし肉","en":"Grated Daikon with Meat","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:true,
  image:"./images/foods/1003.PNG",
  cost:560,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[630,945,1260,2520,5040],
  materials:["肉(@200)","肉(@200)","バター(@150)","大根(種@10)"],
  level:1,
  materials_image:[
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/meat.jpg" },
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/daikon.jpg" }
  ],
  auth:false
},
{
  name:"大根クリームポタージュ",
  nameI18n:{"ja":"大根クリームポタージュ","en":"Daikon Cream Potage","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:true,
  image:"./images/foods/1004.PNG",
  cost:220,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[340,510,680,1360,2720],
  materials:["牛乳(@50)","バター(@150)","大根(種@10)","大根(種@10)"],
  level:1,
  materials_image:[
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/daikon.jpg" },
    { image:"./images/materials/daikon.jpg" }
  ],
  auth:false
},
{
  name:"シュガーパンケーキ(プレーン)",
  nameI18n:{"ja":"シュガーパンケーキ(プレーン)","en":"Sugar Pancake (Plain)","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:true,
  image:"./images/foods/1005.PNG",
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[330,495,660,1320,2640],
  materials:["卵(@100)","牛乳(@50)","シュガー(@50)","果物ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/sugar.jpg" },
    { image:"./images/materials/all_fruit.jpg" }
  ],
  auth:false
},
{
  name:"シュガーパンケーキ(ブルーベリー)",
  nameI18n:{"ja":"シュガーパンケーキ(ブルーベリー)","en":"Sugar Pancake (Blueberry)","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:true,
  image:"./images/foods/1006.PNG",
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[330,495,660,1320,2640],
  materials:["卵(@100)","牛乳(@50)","シュガー(@50)","ブルーベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/sugar.jpg" },
    { image:"./images/materials/buruberi.jpg" }
  ],
  auth:false
},
{
  name:"シュガーパンケーキ(ラズベリー)",
  nameI18n:{"ja":"シュガーパンケーキ(ラズベリー)","en":"Sugar Pancake (Raspberry)","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:true,
  image:"./images/foods/1007.PNG",
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[350,525,700,1400,2800],
  materials:["卵(@100)","牛乳(@50)","シュガー(@50)","ラズベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/sugar.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  auth:false
},
{
  name:"シュガーパンケーキ(アップル)",
  nameI18n:{"ja":"シュガーパンケーキ(アップル)","en":"Sugar Pancake (Apple)","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:true,
  image:"./images/foods/1008.PNG",
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[360,540,720,1440,2880],
  materials:["卵(@100)","牛乳(@50)","シュガー(@50)","リンゴ"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/sugar.jpg" },
    { image:"./images/materials/apple.jpg" }
  ],
  auth:false
},
{
  name:"シュガーパンケーキ(オレンジ)",
  nameI18n:{"ja":"シュガーパンケーキ(オレンジ)","en":"Sugar Pancake (Orange)","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:true,
  image:"./images/foods/1009.PNG",
  cost:200,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[360,540,720,1440,2880],
  materials:["卵(@100)","牛乳(@50)","シュガー(@50)","オレンジ"],
  level:1,
  materials_image:[
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/sugar.jpg" },
    { image:"./images/materials/orange.jpg" }
  ],
  auth:false
},
{
  name:"オーロラディナー",
  nameI18n:{"ja":"オーロラディナー","en":"Aurora Dinner","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:true,
  image:"./images/foods/1010.PNG",
  cost:1180,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[1630,2445,3260,6520,13040],
  materials:["大根おろし肉(@560)","大根クリームポタージュ(@220)","アイスカップコーヒーの材料ならなんでもOK","シュガーパンケーキの料理ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/daikon_meat.jpg" },
    { image:"./images/materials/daikon_potage.jpg" },
    { image:"./images/materials/all_ice_coffee.jpg" },
    { image:"./images/materials/all_pancake.jpg" }
  ],
  auth:false
},
{
  name:"積み木ボウルフルーツかき氷",
  nameI18n:{"ja":"積み木ボウルフルーツかき氷","en":"Building Block Bowl Fruit Shaved Ice","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1011.PNG",
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[210,315,420,840,1680],
  materials:["練乳(@50)","積み木アイス(@50)","果物ならなんでもOK","果物ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/all_fruit.jpg" }
  ],
  auth:false
},
{
  name:"積み木ボウルリンゴかき氷",
  nameI18n:{"ja":"積み木ボウルリンゴかき氷","en":"Building Block Bowl Apple Shaved Ice","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1012.PNG",
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[260,390,520,1040,2080],
  materials:["練乳(@50)","積み木アイス(@50)","リンゴ","リンゴ"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/ringo.jpg" },
    { image:"./images/materials/ringo.jpg" }
  ],
  auth:false
},
{
  name:"積み木ボウルオレンジかき氷",
  nameI18n:{"ja":"積み木ボウルオレンジかき氷","en":"Building Block Bowl Orange Shaved Ice","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1013.PNG",
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[260,390,520,1040,2080],
  materials:["練乳(@50)","積み木アイス(@50)","オレンジ","オレンジ"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/orange.jpg" },
    { image:"./images/materials/orange.jpg" }
  ],
  auth:false
},
{
  name:"積み木ボウブルーベリーかき氷",
  nameI18n:{"ja":"積み木ボウブルーベリーかき氷","en":"Building Block Bowl Blueberry Shaved Ice","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1014.PNG",
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[220,330,440,880,1060],
  materials:["練乳(@50)","積み木アイス(@50)","ブルーベリー","ブルーベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/buruberi.jpg" },
    { image:"./images/materials/buruberi.jpg" }
  ],
  auth:false
},
{
  name:"積み木ボウルラズベリーかき氷",
  nameI18n:{"ja":"積み木ボウルラズベリーかき氷","en":"Building Block Bowl Raspberry Shaved Ice","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1015.PNG",
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[260,390,520,1040,2080],
  materials:["練乳(@50)","積み木アイス(@50)","ラズベリー","ラズベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/razuberi.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  auth:false
},
{
  name:"積み木ボウルいちごかき氷",
  nameI18n:{"ja":"積み木ボウルいちごかき氷","en":"Building Block Bowl Strawberry Shaved Ice","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1016.PNG",
  cost:350,
  time:360,
  rarity: [true,true,true,true,true],
  prices:[900,1350,1800,3600,7200],
  materials:["練乳(@50)","積み木アイス(@50)","いちご(種@125)","いちご(種@125)"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/strawberry.jpg" },
    { image:"./images/materials/strawberry.jpg" }
  ],
  auth:false
},
{
  name:"積み木ボウルブドウかき氷",
  nameI18n:{"ja":"積み木ボウルブドウかき氷","en":"Building Block Bowl Grape Shaved Ice","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1017.PNG",
  cost:420,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[1110,1665,2220,4440,8880],
  materials:["練乳(@50)","積み木アイス(@50)","リンゴ(種@160)","ブドウ(種@160)"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/grape.jpg" },
    { image:"./images/materials/grape.jpg" }
  ],
  auth:false
},
{
  name:"積み木ボウルパイナップルかき氷",
  nameI18n:{"ja":"積み木ボウルパイナップルかき氷","en":"Building Block Bowl Pineapple Shaved Ice","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1018.PNG",
  cost:130,
  time:30,
  rarity: [true,true,true,true,true],
  prices:[1110,1665,2220,4440,8880],
  materials:["練乳(@50)","積み木アイス(@50)","パイナップル(種@15)","パイナップル(種@15)"],
  level:1,
  materials_image:[
    { image:"./images/materials/rennyu.jpg" },
    { image:"./images/materials/tsumiki_ice.jpg" },
    { image:"./images/materials/pineapple.jpg" },
    { image:"./images/materials/pineapple.jpg" }
  ],
  auth:false
},
{
  name:"フルーツバーベナテイスティーパイ",
  nameI18n:{"ja":"フルーツバーベナテイスティーパイ","en":"Fruit Verbena Tea Pie","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1019.PNG",
  cost:210,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[360,540,720,1480,2960],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","果物ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/all_fruit.jpg" }
  ],
  auth:false
},
{
  name:"リンゴバーベナテイスティーパイ",
  nameI18n:{"ja":"リンゴバーベナテイスティーパイ","en":"Apple Verbena Tea Pie","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1020.PNG",
  cost:210,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[390,585,780,1560,3120],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","リンゴ"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/ringo.jpg" }
  ],
  auth:false
},{
  name:"オレンジバーベナテイスティーパイ",
  nameI18n:{"ja":"オレンジバーベナテイスティーパイ","en":"Orange Verbena Tea Pie","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1021.PNG",
  cost:210,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[360,540,720,1480,2960],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","オレンジ"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/orange.jpg" }
  ],
  auth:false
},
{
  name:"ブルーベリーバーベナテイスティーパイ",
  nameI18n:{"ja":"ブルーベリーバーベナテイスティーパイ","en":"Blueberry Verbena Tea Pie","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1022.PNG",
  cost:210,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[360,540,720,1480,2960],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","ブルーベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/buruberi.jpg" }
  ],
  auth:false
},
{
  name:"ラズベリーバーベナテイスティーパイ",
  nameI18n:{"ja":"ラズベリーバーベナテイスティーパイ","en":"Raspberry Verbena Tea Pie","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1023.PNG",
  cost:210,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[380,570,760,1520,3040],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","ラズベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  auth:false
},{
  name:"いちごバーベナテイスティーパイ",
  nameI18n:{"ja":"いちごバーベナテイスティーパイ","en":"Strawberry Verbena Tea Pie","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1024.PNG",
  cost:335,
  time:360,
  rarity: [true,true,true,true,true],
  prices:[710,1065,1420,2840,5680],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","いちご(種@125)"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/strawberry.jpg" }
  ],
  auth:false
},
{
  name:"ブドウバーベナテイスティーパイ",
  nameI18n:{"ja":"ブドウバーベナテイスティーパイ","en":"Grape Verbena Tea Pie","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1025.PNG",
  cost:370,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[810,1215,1620,3240,6480],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","ブドウ(種@160)"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/grape.jpg" }
  ],
  auth:false
},
{
  name:"パイナップルバーベナテイスティーパイ",
  nameI18n:{"ja":"パイナップルバーベナテイスティーパイ","en":"Pineapple Verbena Tea Pie","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1026.PNG",
  cost:225,
  time:30,
  rarity: [true,true,true,true,true],
  prices:[380,570,760,1520,3040],
  materials:["バター(@150)","卵(@50)","レモンバーベナ(種@10)","パイナップル(種@15)"],
  level:1,
  materials_image:[
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/pineapple.jpg" }
  ],
  auth:false
},
{
  name:"積み木パティキノコバーガー",
  nameI18n:{"ja":"積み木パティキノコバーガー","en":"Building Block Patty Mushroom Burger","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1027.PNG",
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[450,675,900,1800,3600],
  materials:["小麦(種@95)","積み木パティ(@50)","キノコならなんでもOK","キノコならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tsumiki_meat.jpg" },
    { image:"./images/materials/all_kinoko.jpg" },
    { image:"./images/materials/all_kinoko.jpg" }
  ],
  auth:false
},
{
  name:"積み木パティヒラタケバーガー",
  nameI18n:{"ja":"積み木パティヒラタケバーガー","en":"Building Block Patty Oyster Mushroom Burger","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1028.PNG",
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[450,675,900,1800,3600],
  materials:["小麦(種@95)","積み木パティ(@50)","ヒラタケ","ヒラタケ"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tsumiki_meat.jpg" },
    { image:"./images/materials/hiratake.jpg" },
    { image:"./images/materials/hiratake.jpg" }
  ],
  auth:false
},{
  name:"積み木パティシイタケバーガー",
  nameI18n:{"ja":"積み木パティシイタケバーガー","en":"Building Block Patty Shiitake Burger","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1029.PNG",
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[450,675,900,1800,3600],
  materials:["小麦(種@95)","積み木パティ(@50)","シイタケ","シイタケ"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tsumiki_meat.jpg" },
    { image:"./images/materials/shitake.jpg" },
    { image:"./images/materials/shitake.jpg" }
  ],
  auth:false
},
{
  name:"積み木パティマッシュルームバーガー",
  nameI18n:{"ja":"積み木パティマッシュルームバーガー","en":"Building Block Patty Button Mushroom Burger","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1030.PNG",
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[450,675,900,1800,3600],
  materials:["小麦(種@95)","積み木パティ(@50)","マッシュルーム","マッシュルーム"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tsumiki_meat.jpg" },
    { image:"./images/materials/mushroom.jpg" },
    { image:"./images/materials/mushroom.jpg" }
  ],
  auth:false
},
{
  name:"積み木パティヤマドリタケバーガー",
  nameI18n:{"ja":"積み木パティヤマドリタケバーガー","en":"Building Block Patty Porcini Burger","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1031.PNG",
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[450,675,900,1800,3600],
  materials:["小麦(種@95)","積み木パティ(@50)","ヤマドリタケ","ヤマドリタケ"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tsumiki_meat.jpg" },
    { image:"./images/materials/yamadoritake.jpg" },
    { image:"./images/materials/yamadoritake.jpg" }
  ],
  auth:false
},
{
  name:"積み木パティトリュフバーガー",
  nameI18n:{"ja":"積み木パティトリュフバーガー","en":"Building Block Patty Truffle Burger","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1032.PNG",
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[780,1170,1560,3120,6240],
  materials:["小麦(種@95)","積み木パティ(@50)","トリュフ","トリュフ"],
  level:1,
  materials_image:[
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/tsumiki_meat.jpg" },
    { image:"./images/materials/truffle.jpg" },
    { image:"./images/materials/truffle.jpg" }
  ],
  auth:false
},
{
  name:"積み木テーマセット",
  nameI18n:{"ja":"積み木テーマセット","en":"Building Block Theme Set","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1033.PNG",
  cost:455,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[1070,1605,2140,4280,8560],
  materials:["積み木ボウルフルーツかき氷ならなんでもOK(@100)","フルーツバーベナテイスティーパイならなんでもOK(@210)","積み木キノコバーガーならなんでもOK(@145)",""],
  level:1,
  materials_image:[
    { image:"./images/materials/tsumiki_kakigori.jpg" },
    { image:"./images/materials/verbena_pie.jpg" },
    { image:"./images/materials/tsumiki_burger.jpg" },
    { image:null }
  ],
  auth:false
},
{
  name:"塩味ポップコーンバケツ",
  nameI18n:{"ja":"塩味ポップコーンバケツ","en":"Salted Popcorn Bucket","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1034.PNG",
  cost:470,
  time:720,
  rarity: [true,true,true,true,true],
  prices:[900,1350,1800,3600,7200],
  materials:["トウモロコシ(種@170)","キノコならなんでもOK","バター(@150)","バター(@150)"],
  level:1,
  materials_image:[
    { image:"./images/materials/corn.jpg" },
    { image:"./images/materials/all_kinoko.jpg" },
    { image:"./images/materials/batter.jpg" },
    { image:"./images/materials/batter.jpg" }
  ],
  auth:false
},
{
  name:"キャラメルポップコーンバケツ",
  nameI18n:{"ja":"キャラメルポップコーンバケツ","en":"Caramel Popcorn Bucket","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1035.PNG",
  cost:420,
  time:720,
  rarity: [true,true,true,true,true],
  prices:[820,1230,1640,3280,6560],
  materials:["トウモロコシ(種@170)","春のブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)","バター(@150)"],
  level:1,
  materials_image:[
    { image:"./images/materials/corn.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/batter.jpg" }
  ],
  auth:false
},
{
  name:"サルサウェーブポテトチップス",
  nameI18n:{"ja":"サルサウェーブポテトチップス","en":"Salsa Wave Potato Chips","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1036.PNG",
  cost:110,
  time:60,
  rarity: [true,true,true,true,true],
  prices:[280,420,560,1120,2240],
  materials:["ジャガイモ(種@30)","ジャガイモ(種@30)","サルサソース(@50)",""],
  level:1,
  materials_image:[
    { image:"./images/materials/potato.jpg" },
    { image:"./images/materials/potato.jpg" },
    { image:"./images/materials/salsa_source.jpg" },
    { image:null }
  ],
  auth:false
}, 
{
  name:"塩味2種盛りバケツ",
  nameI18n:{"ja":"塩味2種盛りバケツ","en":"Salted Duo Bucket","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1037.PNG",
  cost:580,
  time:720,
  rarity: [true,true,true,true,true],
  prices:[1230,1845,2460,4920,9840],
  materials:["塩味ポップコーンバケツ(@470)","サルサウェーブポテトチップス(@110)","",""],
  level:1,
  materials_image:[
    { image:"./images/materials/b_popcorn.jpg" },
    { image:"./images/materials/salsa_chips.jpg" },
    { image:null },
    { image:null }
  ],
  auth:false
},
{
  name:"甘口2種盛りバケツ",
  nameI18n:{"ja":"甘口2種盛りバケツ","en":"Sweet Duo Bucket","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1038.PNG",
  cost:530,
  time:720,
  rarity: [true,true,true,true,true],
  prices:[1150,1725,2300,4600,9200],
  materials:["キャラメルポップコーンバケツ(@420)","サルサウェーブポテトチップス(@110)","",""],
  level:1,
  materials_image:[
    { image:"./images/materials/r_popcorn.jpg" },
    { image:"./images/materials/salsa_chips.jpg" },
    { image:null },
    { image:null }
  ],
  auth:false
},
{
  name:"ロメインレタスタコス",
  nameI18n:{"ja":"ロメインレタスタコス","en":"Romaine Lettuce Taco","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1039.PNG",
  cost:120,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[260,390,520,1040,2080],
  materials:["ロメインレタス(種@10)","ロメインレタス(種@10)","サルサソース(@50)","卵(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/romeinn.jpg" },
    { image:"./images/materials/romeinn.jpg" },
    { image:"./images/materials/salsa_source.jpg" },
    { image:"./images/materials/egg.jpg" }
  ],
  auth:false
},
{
  name:"山菜レタスタコス",
  nameI18n:{"ja":"山菜レタスタコス","en":"Wild Vegetable Lettuce Taco","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1040.PNG",
  cost:120,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[330,495,660,1320,2640],
  materials:["野菜類ならなんでもOK","野菜類ならなんでもOK","ロメインレタスタコス(@120)",""],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege2.jpg" },
    { image:"./images/materials/all_vege2.jpg" },
    { image:"./images/materials/romeinn_tacos.jpg" },
    { image:null }
  ],
  auth:false
},
{
  name:"野シダレタスタコス",
  nameI18n:{"ja":"野シダレタスタコス","en":"Wild Fern Lettuce Taco","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1041.PNG",
  cost:120,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[330,495,660,1320,2640],
  materials:["野シダ","野シダ","ロメインレタスタコス(@120)",""],
  level:1,
  materials_image:[
    { image:"./images/materials/noshida.jpg" },
    { image:"./images/materials/noshida.jpg" },
    { image:"./images/materials/romeinn_tacos.jpg" },
    { image:null }
  ],
  auth:false
},
{
  name:"野ニンニクガラシレタスタコス",
  nameI18n:{"ja":"野ニンニクガラシレタスタコス","en":"Wild Garlic Mustard Lettuce Taco","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1042.PNG",
  cost:120,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[330,495,660,1320,2640],
  materials:["野ニンニクガラシ","野ニンニクガラシ","ロメインレタスタコス(@120)",""],
  level:1,
  materials_image:[
    { image:"./images/materials/noninniku.jpg" },
    { image:"./images/materials/noninniku.jpg" },
    { image:"./images/materials/romeinn_tacos.jpg" },
    { image:null }
  ],
  auth:false
},
{
  name:"野ゴボウレタスタコス",
  nameI18n:{"ja":"野ゴボウレタスタコス","en":"Wild Burdock Lettuce Taco","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1043.PNG",
  cost:120,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[330,495,660,1320,2640],
  materials:["野ゴボウ","野ゴボウ","ロメインレタスタコス(@120)",""],
  level:1,
  materials_image:[
    { image:"./images/materials/nogobou.jpg" },
    { image:"./images/materials/nogobou.jpg" },
    { image:"./images/materials/romeinn_tacos.jpg" },
    { image:null }
  ],
  auth:false
},
{
  name:"野カラシナレタスタコス",
  nameI18n:{"ja":"野カラシナレタスタコス","en":"Wild Mustard Greens Lettuce Taco","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1044.PNG",
  cost:120,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[330,495,660,1320,2640],
  materials:["野カラシナ","野カラシナ","ロメインレタス(@110)",""],
  level:1,
  materials_image:[
    { image:"./images/materials/nokarashina.jpg" },
    { image:"./images/materials/nokarashina.jpg" },
    { image:"./images/materials/romeinn_tacos.jpg" },
    { image:null }
  ],
  auth:false
},
{
  name:"春のフルーツティー",
  nameI18n:{"ja":"春のフルーツティー","en":"Spring Fruit Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1045.PNG",
  cost:350,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[460,690,920,1840,3680],
  materials:["紅茶(@250)","果物ならなんでもOK","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/all_fruit.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  auth:false
},

{
  name:"春のアップルティー",
  nameI18n:{"ja":"春のアップルティー","en":"Spring Apple Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1046.PNG",
  cost:350,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[480,720,960,1920,3840],
  materials:["紅茶(@250)","リンゴ","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/ringo.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  auth:false
},
{
  name:"春のオレンジティー",
  nameI18n:{"ja":"春のオレンジティー","en":"Spring Orange Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1047.PNG",
  cost:350,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[480,720,960,1920,3840],
  materials:["紅茶(@250)","オレンジ","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/orange.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  auth:false
},
{
  name:"春のブルーベリーティー",
  nameI18n:{"ja":"春のブルーベリーティー","en":"Spring Blueberry Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1048.PNG",
  cost:350,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[460,690,920,1840,3680],
  materials:["紅茶(@250)","ブルーベリー","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/buruberi.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  auth:false
},
{
  name:"春のラズベリーティー",
  nameI18n:{"ja":"春のラズベリーティー","en":"Spring Raspberry Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1049.PNG",
  cost:350,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[480,720,960,1920,3840],
  materials:["紅茶(@250)","ラズベリー","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/razuberi.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  auth:false
},
{
  name:"春のストロベリーティー",
  nameI18n:{"ja":"春のストロベリーティー","en":"Spring Strawberry Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1050.PNG",
  cost:475,
  time:360,
  rarity: [true,true,true,true,true],
  prices:[800,1200,1600,3200,6400],
  materials:["紅茶(@250)","いちご(種@125)","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/strawberry.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  auth:false
},
{
  name:"春のグレープティー",
  nameI18n:{"ja":"春のグレープティー","en":"Spring Grape Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1051.PNG",
  cost:510,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[910,1365,1820,3640,7280],
  materials:["紅茶(@250)","ブドウ(種@160)","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/grape.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  auth:false
},
{
  name:"春のパイナップルティー",
  nameI18n:{"ja":"春のパイナップルティー","en":"Spring Pineapple Tea","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1052.PNG",
  cost:365,
  time:30,
  rarity: [true,true,true,true,true],
  prices:[480,720,960,1920,3840],
  materials:["紅茶(@250)","パイナップル(種@15)","春ブラウンシュガーパック(@50)","春のブラウンシュガーパック(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/kotya.jpg" },
    { image:"./images/materials/pineapple.jpg" },
    { image:"./images/materials/spring_sugar.jpg" },
    { image:"./images/materials/spring_sugar.jpg" }
  ],
  auth:false
},
{
  name:"カラフル映画鑑賞セット",
  nameI18n:{"ja":"カラフル映画鑑賞セット","en":"Colorful Movie Night Set","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1053.PNG",
  cost:1000,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[1960,2940,3920,7840,15680],
  materials:["春のフルーツティーならなんでもOK","甘口2種盛りバケツ(@530)","山菜レタスタコスならなんでもOK",""],
  level:1,
  materials_image:[
    { image:"./images/materials/spring_tea.jpg" },
    { image:"./images/materials/r_bucket.jpg" },
    { image:"./images/materials/sansai_tacos.jpg" },
    { image:null }
  ],
  auth:false
},
{
  name:"プレミアム映画鑑賞セット",
  nameI18n:{"ja":"プレミアム映画鑑賞セット","en":"Premium Movie Night Set","zh-CN":"","zh-TW":"","ko":"","th":""},
  fes:true,
  ended:true,
  image:"./images/foods/1054.PNG",
  cost:1170,
  time:780,
  rarity: [true,true,true,true,true],
  prices:[2370,3555,4740,9480,18960],
  materials:["春のフルーツティーならなんでもOK","塩味2種盛りバケツ(@580)","山菜レタスタコスならなんでもOK","山菜レタスタコスならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/spring_tea.jpg" },
    { image:"./images/materials/b_bucket.jpg" },
    { image:"./images/materials/sansai_tacos.jpg" },
    { image:"./images/materials/sansai_tacos.jpg" }
  ],
  auth:false
},
{
  name:"オーシャンアイスドリンク",
  nameI18n:{"ja":"オーシャンアイスドリンク","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:false,
  image:"./images/foods/1055.PNG",
  cost:120,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[190,285,380,760,1520],
  materials:["藍藻パウダー(@50)","藍藻パウダー(@50)","スターフルーツ(種@10)","スターフルーツ(種@10)"],
  level:1,
  materials_image:[
    { image:"./images/materials/ransou.jpg" },
    { image:"./images/materials/ransou.jpg" },
    { image:"./images/materials/star_fruit.jpg" },
    { image:"./images/materials/star_fruit.jpg" }
  ],
  auth:false
},
{
  name:"海鮮トマトポタージュ",
  nameI18n:{"ja":"海鮮トマトポタージュ","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:false,
  image:"./images/foods/1056.PNG",
  cost:105,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[190,285,380,760,1520],
  materials:["ウミエビ","トマト(種@10)","シーアスパラガス","小麦(種@95)"],
  level:1,
  materials_image:[
    { image:"./images/materials/umiebi.jpg" },
    { image:"./images/materials/tomato.jpg" },
    { image:"./images/materials/sea_asupara.jpg" },
    { image:"./images/materials/wheat.jpg" }
  ],
  auth:false
},
{
  name:"ミニパールケーキ",
  nameI18n:{"ja":"ミニパールケーキ","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:false,
  image:"./images/foods/1057.PNG",
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[230,345,460,920,1840],
  materials:["ホタテ","小麦(種@95)","牛乳(@50)","果物ならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/hotate.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/all_fruit.jpg" }
  ],
  auth:false
},
{
  name:"ミニスターフルーツパールケーキ",
  nameI18n:{"ja":"ミニスターフルーツパールケーキ","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:false,
  image:"./images/foods/1058.PNG",
  cost:155,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[230,345,460,920,1840],
  materials:["ホタテ","小麦(種@95)","牛乳(@50)","スターフルーツ(種@10)"],
  level:1,
  materials_image:[
    { image:"./images/materials/hotate.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/star_fruit.jpg" }
  ],
  auth:false
},

{
  name:"ミニアップルパールケーキ",
  nameI18n:{"ja":"ミニアップルパールケーキ","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:false,
  image:"./images/foods/1059.PNG",
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[240,360,480,960,1920],
  materials:["ホタテ","小麦(種@95)","牛乳(@50)","リンゴ"],
  level:1,
  materials_image:[
    { image:"./images/materials/hotate.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/ringo.jpg" }
  ],
  auth:false
},
{
  name:"ミオレンジパールケーキ",
  nameI18n:{"ja":"ミニオレンジパールケーキ","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:false,
  image:"./images/foods/1060.PNG",
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[240,360,480,960,1920],
  materials:["ホタテ","小麦(種@95)","牛乳(@50)","オレンジ"],
  level:1,
  materials_image:[
    { image:"./images/materials/hotate.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/orange.jpg" }
  ],
  auth:false
},
{
  name:"ミニブルーベリーパールケーキ",
  nameI18n:{"ja":"ミニブルーベリーパールケーキ","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:false,
  image:"./images/foods/1061.PNG",
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[230,345,460,920,1840],
  materials:["ホタテ","小麦(種@95)","牛乳(@50)","ブルーベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/hotate.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/buruberi.jpg" }
  ],
  auth:false
},
{
  name:"ミニラズベリーパールケーキ",
  nameI18n:{"ja":"ミニラズベリーパールケーキ","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:false,
  image:"./images/foods/1062.PNG",
  cost:145,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[240,360,480,960,1920],
  materials:["ホタテ","小麦(種@95)","牛乳(@50)","ラズベリー"],
  level:1,
  materials_image:[
    { image:"./images/materials/hotate.jpg" },
    { image:"./images/materials/wheat.jpg" },
    { image:"./images/materials/milk.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  auth:false
},
{
  name:"ジャム添えイカ焼き",
  nameI18n:{"ja":"ジャム添えイカ焼き","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:false,
  image:"./images/foods/1063.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[440,660,880,1760,3520],
  materials:["スルメイカ","海ぶどう","ワカメ","ジャムならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/surumeika.jpg" },
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/all_jam.jpg" }
  ],
  auth:false
},
{
  name:"リンゴジャム添えイカ焼き",
  nameI18n:{"ja":"リンゴジャム添えイカ焼き","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:false,
  image:"./images/foods/1064.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[550,825,1100,2200,4400],
  materials:["スルメイカ","海ぶどう","ワカメ","リンゴジャム"],
  level:1,
  materials_image:[
    { image:"./images/materials/surumeika.jpg" },
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/jam_apple.jpg" }
  ],
  auth:false
},
{
  name:"ブルーベリージャム添えイカ焼き",
  nameI18n:{"ja":"ブルーベリージャム添えイカ焼き","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:false,
  image:"./images/foods/1065.PNG",
  cost:0,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[450,675,900,1800,3600],
  materials:["スルメイカ","海ぶどう","ワカメ","ブルーベリージャム"],
  level:1,
  materials_image:[
    { image:"./images/materials/surumeika.jpg" },
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/jam_buruberi.jpg" }
  ],
  auth:false
},
{
  name:"スターフルーツジャム添えイカ焼き",
  nameI18n:{"ja":"スターフルーツジャム添えイカ焼き","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:false,
  image:"./images/foods/1066.PNG",
  cost:40,
  time:15,
  rarity: [true,true,true,true,true],
  prices:[480,720,960,1920,3840],
  materials:["スルメイカ","海ぶどう","ワカメ","スターフルーツジャム(@40)"],
  level:1,
  materials_image:[
    { image:"./images/materials/surumeika.jpg" },
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/jam_star_fruit.jpg" }
  ],
  auth:false
},
{
  name:"パイナップルジャム添えイカ焼き",
  nameI18n:{"ja":"パイナップルジャム添えイカ焼き","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:false,
  image:"./images/foods/1067.PNG",
  cost:60,
  time:30,
  rarity: [true,true,true,true,true],
  prices:[560,840,1120,2240,4480],
  materials:["スルメイカ","海ぶどう","ワカメ","パイナップルジャム(@60)"],
  level:1,
  materials_image:[
    { image:"./images/materials/surumeika.jpg" },
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/jam_pineapple.jpg" }
  ],
  auth:false
},
{
  name:"いちごジャム添えイカ焼き",
  nameI18n:{"ja":"いちごジャム添えイカ焼き","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:false,
  image:"./images/foods/1068.PNG",
  cost:500,
  time:360,
  rarity: [true,true,true,true,true],
  prices:[1860,2790,3720,7440,14880],
  materials:["スルメイカ","海ぶどう","ワカメ","いちごジャム(@500)"],
  level:1,
  materials_image:[
    { image:"./images/materials/surumeika.jpg" },
    { image:"./images/materials/umibudo.jpg" },
    { image:"./images/materials/wakame.jpg" },
    { image:"./images/materials/jam_strawberry.jpg" }
  ],
  auth:false
},
{
  name:"オーシャンパーティー",
  nameI18n:{"ja":"オーシャンパーティー","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
  season:true,
  ended:false,
  image:"./images/foods/1069.PNG",
  cost:370,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[1700,2550,3400,6800,13600],
  materials:["海鮮トマトポタージュ(@105)","オーシャンアイスドリンク(@120)","ミニパールケーキならなんでもOK","ジャム添えイカ焼きならなんでもOK"],
  level:1,
  materials_image:[
    { image:"./images/materials/tomato_potage.jpg" },
    { image:"./images/materials/ocean_ice.jpg" },
    { image:"./images/materials/all_miniperlcake.jpg" },
    { image:"./images/materials/all_ikayaki.jpg" }
  ],
  auth:false
},
];
