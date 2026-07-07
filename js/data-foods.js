//isEvent: true

const foodsData = [
{
  name:"田園サラダ",
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
  name:"フィッシュアンドチップス",
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
  name:"不気味な食べ物",
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
  name:"パイナップルジャム",
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
  name:"いちごジャム",
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
  name:"チーズケーキ",
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
  name:"シーフードリゾット",
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
  name:"シーフードピザ",
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
  image:"./images/foods/077.PNG",
  cost:600,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[840,1260,1680,3360,6720],
  materials:["紅茶(@250)","紅茶(@250)","香る紅茶の材料ならなんでもOK(紅茶or牛乳)","香る紅茶の材料ならなんでもOK(紅茶or牛乳)"],
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
  image:"./images/foods/080.PNG",
  cost:100,
  time:0,
  rarity: [true,true,true,true,true],
  prices:[400,600,800,1600,3200],
  materials:["牛乳(@50)","牛乳(@50)","シェイクの材料ならなんでもOK","シェイクの材料ならなんでもOK"],
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
  image:"./images/foods/090.PNG",
  cost:100,
  time:45,
  rarity: [true,true,true,true,true],
  prices:[500,750,1000,2000,4000],
  materials:["茶葉(種@25)","茶葉(種@25)","フレッシュ緑茶の材料ならなんでもOK","フレッシュ緑茶の材料ならなんでもOK"],
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
    { image:"./images/materials/butter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/all_fruit.jpg" }
  ],
  auth:false
},
{
  name:"リンゴバーベナテイスティーパイ",
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
    { image:"./images/materials/butter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/ringo.jpg" }
  ],
  auth:false
},{
  name:"オレンジバーベナテイスティーパイ",
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
    { image:"./images/materials/butter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/orange.jpg" }
  ],
  auth:false
},
{
  name:"ブルーベリーバーベナテイスティーパイ",
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
    { image:"./images/materials/butter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/buruberi.jpg" }
  ],
  auth:false
},
{
  name:"ラズベリーバーベナテイスティーパイ",
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
    { image:"./images/materials/butter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/razuberi.jpg" }
  ],
  auth:false
},{
  name:"いちごバーベナテイスティーパイ",
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
    { image:"./images/materials/butter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/strawberry.jpg" }
  ],
  auth:false
},
{
  name:"ブドウバーベナテイスティーパイ",
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
    { image:"./images/materials/butter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/grape.jpg" }
  ],
  auth:false
},
{
  name:"パイナップルバーベナテイスティーパイ",
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
    { image:"./images/materials/butter.jpg" },
    { image:"./images/materials/egg.jpg" },
    { image:"./images/materials/lemon_verbena.jpg" },
    { image:"./images/materials/pineapple.jpg" }
  ],
  auth:false
},
{
  name:"積み木パティキノコバーガー",
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
];
