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
  time:1,
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
  time:1,
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
  time:1,
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
  name:"りんごジャム",
  image:"./images/foods/006.PNG",
  cost:0,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[270,405,540,1080,2160],
  materials:["りんご","りんご","りんご","りんご"],
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
  time:1,
  rarity: [true,true,true,true,true],
  prices:[270,405,540,1080,2160],
  materials:["オレンジ","オレンジ","オレンジ","オレンジ"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
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
  materials:["魚素材×2","じゃがいも×2(種@30×2)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"不気味な食べ物",
  image:"./images/foods/009.PNG",
  cost:0,
  time:1,
  rarity: [true,false,false,false,false],
  prices:[30,null,null,null,null],
  materials:["食料系の失敗作(必ず損)"],
  level:null,
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
  level:null,
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
  image:"./images/foods/011.PNG",
  cost:60,
  time:30,
  rarity: [true,true,true,true,true],
  prices:[280,420,560,1120,2240],
  materials:["パイナップル×4(種@15×4)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"ブドウジャム",
  image:"./images/foods/012.PNG",
  cost:640,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[2020,3030,4040,8080,16160],
  materials:["ブドウ×4(種@160×4)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"チョコソース",
  image:"./images/foods/013.PNG",
  cost:440,
  time:300,
  rarity: [true,true,true,true,true],
  prices:[1400,2100,2800,5600,11200],
  level:1,
  materials:["カカオ豆×4(種@110×4)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"イチゴジャム",
  image:"./images/foods/014.PNG",
  cost:500,
  time:360,
  rarity: [true,true,true,true,true],
  prices:[1580,2370,3160,6320,12640],
  materials:["イチゴ×4(種@125×4)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"チーズケーキ",
  image:"./images/foods/015.PNG",
  cost:245,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[480,720,960,1920,3840],
  materials:["チーズ×1(@100)","牛乳×1(@50)","小麦×2(種@95×2)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"オリジナルロールケーキ",
  image:"./images/foods/016.PNG",
  cost:450,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[550,825,1100,2200,4400],
  materials:["卵×1(@100)","牛乳×1(@50)","紫のキャンディ×2(@150×2)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"赤いロールケーキ",
  image:"./images/foods/017.PNG",
  cost:550,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[670,1005,1340,2680,5360],
  materials:["卵×1(@100)","牛乳×1(@50)","赤いキャンディ×2(@200×2)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"オレンジのロールケーキ",
  image:"./images/foods/018.PNG",
  cost:550,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[670,1005,1340,2680,5360],
  materials:["卵×1(@100)","牛乳×1(@50)","オレンジのキャンディ×2(@200×2)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"黄色いロールケーキ",
  image:"./images/foods/019.PNG",
  cost:550,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[670,1005,1340,2680,5360],
  materials:["卵×1(@100)","牛乳×1(@50)","黄色いキャンディ×2(@200×2)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"紫のロールケーキ",
  image:"./images/foods/020.PNG",
  cost:450,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[570,855,1140,2280,4560],
  materials:["卵×1(@100)","牛乳×1(@50)","紫のキャンディ×2(@150×2)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"緑のロールケーキ",
  image:"./images/foods/021.PNG",
  cost:550,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[670,1005,1340,2680,5360],
  materials:["卵×1(@100)","牛乳×1(@50)","緑のキャンディ×2(@200×2)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"水色ロールケーキ",
  image:"./images/foods/022.PNG",
  cost:450,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[570,855,1140,2280,4560],
  materials:["卵×1(@100)","牛乳×1(@50)","青のキャンディ×2(@150×2)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"青いロールケーキ",
  image:"./images/foods/023.PNG",
  cost:450,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[570,855,1140,2280,4560],
  materials:["卵×1(@100)","牛乳×1(@50)","ブルーキャンディ×2(@150×2)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"キノコパイ",
  image:"./images/foods/024.PNG",
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[500,750,1000,2000,4000],
  materials:["キノコ×2(トリュフ以外推奨)","小麦×1(種@95)","卵×1(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"ヒラタケパイ",
  image:"./images/foods/025.PNG",
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[500,750,1000,2000,4000],
  materials:["ヒラタケ×2","小麦×1(種@95)","卵×1(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"シイタケパイ",
  image:"./images/foods/026.PNG",
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[500,750,1000,2000,4000],
  materials:["シイタケ×2","小麦×1(種@95)","卵×1(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"マッシュルームパイ",
  image:"./images/foods/027.PNG",
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[500,750,1000,2000,4000],
  materials:["マッシュルーム×2","小麦×1(種@95)","卵×1(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"ヤマドリタケパイ",
  image:"./images/foods/028.PNG",
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[500,750,1000,2000,4000],
  materials:["ヤマドリタケ×2","小麦×1(種@95)","卵×1(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"トリュフパイ",
  image:"./images/foods/029.PNG",
  cost:195,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[830,1245,1660,3320,6640],
  materials:["トリュフ×2","小麦×1(種@95)","卵×1(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"焼きキノコ",
  image:"./images/foods/030.PNG",
  cost:0,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[180,270,360,720,1440],
  materials:["キノコ×4(トリュフ以外推奨)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"焼きヒラタケ",
  image:"./images/foods/031.PNG",
  cost:0,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[180,270,360,720,1440],
  materials:["ヒラタケ×4"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"焼きシイタケ",
  image:"./images/foods/032.PNG",
  cost:0,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[180,270,360,720,1440],
  materials:["シイタケ×4"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"焼きマッシュルーム",
  image:"./images/foods/033.PNG",
  cost:0,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[180,270,360,720,1440],
  materials:["マッシュルーム×4"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"焼きヤマドリタケ",
  image:"./images/foods/034.PNG",
  cost:0,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[180,270,360,720,1440],
  materials:["ヤマドリタケ×4"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"コーヒー",
  image:"./images/foods/035.PNG",
  cost:200,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[290,435,580,1160,2320],
  materials:["コーヒー豆×4(@50×4)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"カフェラテ",
  image:"./images/foods/036.PNG",
  cost:200,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[300,450,600,1200,2400],
  materials:["コーヒー豆×2(@50×2)","牛乳×2(@50×2)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"スモークサーモンベーグル",
  image:"./images/foods/037.PNG",
  cost:205,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[520,780,1040,2080,4160],
  materials:["魚×1(★1推奨)","チーズ×1(@100)","野菜×1(★1トマト推奨)(種@10)","小麦×1(種@95)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"シーフードリゾット",
  image:"./images/foods/038.PNG",
  cost:105,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[490,735,980,1960,3920],
  materials:["魚orエビ×2(★1推奨)","小麦×1(種@95)","トマト×1(種@10)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"カントリー風煮込み",
  image:"./images/foods/039.PNG",
  cost:185,
  time:640,
  rarity: [true,true,true,true,true],
  prices:[640,960,1280,2560,5120],
  materials:["トマト×1(種@10)","じゃがいも×1(種@30)","レタス×1(種@145)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"トリュフのクリームパスタ",
  image:"./images/foods/040.PNG",
  cost:240,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[900,1350,1800,3600,7200],
  materials:["トリュフ×1","小麦×2(種@95×2)","牛乳×1(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"シーフードピザ",
  image:"./images/foods/041.PNG",
  cost:235,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[780,1170,1560,3120,6240],
  materials:["チーズ×1(@100)","トマトソース×1(@40)","小麦×1(種@95)","魚×1(★1推奨)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"ミートソースパスタ",
  image:"./images/foods/042.PNG",
  cost:405,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[670,1005,1340,2680,5360],
  materials:["肉×1(@200)","小麦×1(種@95)","トマト×1(種@10)","チーズ×1(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"アップルパイ",
  image:"./images/foods/043.PNG",
  cost:345,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[730,1095,1460,2920,5840],
  materials:["リンゴ×1","小麦×1(種@95)","卵×1(@100)","バター×1(@150)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"ニンジンケーキ",
  image:"./images/foods/044.PNG",
  cost:245,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[840,1260,1680,3360,6720],
  materials:["ニンジン×2(種@25×2)","卵×1(@100)","小麦×1(種@95)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"コーンポタージュ",
  image:"./images/foods/045.PNG",
  cost:540,
  time:720,
  rarity: [true,true,true,true,true],
  prices:[1340,2010,2680,5360,10720],
  materials:["トウモロコシ×2(種@170×2)","牛乳×1(@50)","バター×1(@150)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"豪華海鮮盛り合わせ",
  image:"./images/foods/046.PNG",
  cost:0,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[410,615,820,1640,3280],
  materials:["魚×2(★1推奨)","エビ×2(★1推奨)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"ティラミス",
  image:"./images/foods/047.PNG",
  cost:300,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[530,795,1060,2120,4240],
  materials:["コーヒー豆×1(@50)","卵×1(@100)","牛乳×1(@50)","チーズ×1(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"キャンプセット",
  image:"./images/foods/048.PNG",
  cost:840,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[2260,3390,4520,9040,18080],
  materials:["コーヒー×1(@200)","シーフードピザ×1(@235)","アップルパイ×1(@345)","フィッシュアンドチップス×1(@60)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"英式アフタヌーンティー",
  image:"./images/foods/049.PNG",
  cost:300,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[710,1065,1420,2840,5680],
  materials:["ティラミス×1(@300)","ブルーベリー×1"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"ミートバーガー",
  image:"./images/foods/050.PNG",
  cost:480,
  time:480,
  rarity: [true,true,true,true,true],
  prices:[1350,2025,2700,5400,10800],
  materials:["小麦×1(種@95)","肉×1(@200)","レタス×1(種@145)","トマトソース×1(@40)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"アカザエビの前菜",
  image:"./images/foods/051.PNG",
  cost:145,
  time:480,
  rarity: [true,true,true,true,true],
  prices:[850,1275,1700,3400,6800],
  materials:["アカザエビ×3","レタス×1(種@145)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"北欧ブルーアカザエビの前菜",
  image:"./images/foods/052.PNG",
  cost:145,
  time:480,
  rarity: [true,true,true,true,true],
  prices:[1310,1965,2620,5240,10480],
  materials:["北欧ブルーアカザエビ×3","レタス×1(種@145)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"ナスとひき肉の炒め物",
  image:"./images/foods/053.PNG",
  cost:475,
  time:420,
  rarity: [true,true,true,true,true],
  prices:[1230,1845,2460,4920,9840],
  materials:["ナス×1(種@135)","肉×1(@200)","料理油×1(@100)","トマトソース×1(@40)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"キャンドルディナー",
  image:"./images/foods/054.PNG",
  cost:630,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[1760,2640,3520,7040,14080],
  materials:["田園サラダ×1(@20)","スモークサーモンベーグル×1(@205)","シーフードリゾット×1(@105)","ティラミス×1(@300)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"蒸しタラバガニ",
  image:"./images/foods/055.PNG",
  cost:150,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[1990,2985,3980,7960,15920],
  materials:["タラバガニ×3(★1推奨)","バター×1(@150)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"蒸し黄金タラバガニ",
  image:"./images/foods/056.PNG",
  cost:150,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[2980,4470,5960,11920,23840],
  materials:["黄金タラバガニ×3(★1推奨)","バター×1(@150)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"温泉卵",
  image:"./images/foods/057.PNG",
  cost:100,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[130,195,260,520,1140],
  materials:["無菌卵×1(@100)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"若草のケーキ",
  image:"./images/foods/058.PNG",
  cost:395,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[690,1035,1380,2760,5520],
  materials:["小麦×1(種@95)","牛乳×1(@50)","抹茶パウダー×1(@250)","雑草×1"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"復活のエッグ",
  image:"./images/foods/059.PNG",
  cost:100,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[190,285,380,760,1520],
  materials:["卵×1(@100)","リンゴ×1"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"復活祭の模様入り卵(紫)",
  image:"./images/foods/060.PNG",
  cost:260,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[620,930,1240,2480,4960],
  materials:["卵×1(@100)","ブドウ×1(種@160)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"復活祭の模様入り卵(緑)",
  image:"./images/foods/061.PNG",
  cost:245,
  time:480,
  rarity: [true,true,true,true,true],
  prices:[570,855,1140,2280,4560],
  materials:["卵×1(@100)","レタス×1(種@145)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"復活祭の模様入り卵(オレンジ)",
  image:"./images/foods/062.PNG",
  cost:100,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[190,285,380,760,1520],
  materials:["卵×1(@100)","リンゴ×1"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"復活祭のイースターエッグの宴",
  image:"./images/foods/063.PNG",
  cost:755,
  time:600,
  rarity: [true,true,true,true,true],
  prices:[1650,2475,3300,6600,13200],
  materials:["復活のエッグ×1","復活祭の模様入り卵(紫)×1","復活祭の模様入り卵(緑)×1","復活祭の模様入り卵(オレンジ)×1"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"モルチーズカヌレ",
  image:"./images/foods/064.PNG",
  cost:370,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[910,1365,1820,3640,7280],
  materials:["卵×1(@100)","牛乳×1(@50)","小麦×1(種@95)","イチゴ×1(種@125)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"レトリバーカヌレ",
  image:"./images/foods/065.PNG",
  cost:295,
  time:240,
  rarity: [true,true,true,true,true],
  prices:[590,885,1180,2360,4720],
  materials:["卵×1(@100)","牛乳×1(@50)","小麦(種@95)","コーヒー豆(@50)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"モルチーズコンパンナ",
  image:"./images/foods/066.PNG",
  cost:350,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[520,780,1040,2080,4160],
  materials:["牛乳×3(@50×3)","コーヒー×1(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"レトリバーコンパンナ",
  image:"./images/foods/067.PNG",
  cost:350,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[520,780,1040,2080,4160],
  materials:["牛乳×2(@50×2)","コーヒー豆×1(@50)","コーヒー×1(@200)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
},
{
  name:"ラブリーMALTESEコンパンナ",
  image:"./images/foods/068.PNG",
  cost:500,
  time:1,
  rarity: [true,true,true,true,true],
  prices:[1220,1830,2440,4880,9760],
  materials:["牛乳×2(@50×2)","コーヒー×2(@200×2)"],
  level:1,
  materials_image:[
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" },
    { image:"./images/materials/all_vege.jpg" }
  ],
  auth:true
}
];
