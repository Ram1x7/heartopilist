// 雪像
// star1Only : true の場合、★1価格のみ持ち★2〜5は非表示にする（失敗作など）
// location  : 「彫刻台で彫刻」固定。シーズンのバッジ表記は行わない

const snowData = [
{
 name:"ジオメトリック雪ブロック",
 nameI18n:{"ja":"ジオメトリック雪ブロック","en":"Geometric Snow Brick","zh-CN":"几何雪砖","zh-TW":"幾何雪磚","ko":"입체 눈 벽돌","th":"บล็อกหิมะทรงเหลี่ยม"},
 level:1,
 price:155,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/snows/001.PNG",
 auth:true
},
{
 name:"雪小屋パーツ",
 nameI18n:{"ja":"雪小屋パーツ","en":"Igloo Brick","zh-CN":"雪屋组件","zh-TW":"雪屋組件","ko":"이글루 부품","th":"ส่วนประกอบบ้านหิมะ"},
 level:1,
 price:155,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/snows/002.PNG",
 auth:true
},
{
 name:"アイスコーンの雪像",
 nameI18n:{"ja":"アイスコーンの雪像","en":"Ice Cream Cone Snow Sculpture","zh-CN":"雪糕筒雪雕","zh-TW":"雪糕筒雪雕","ko":"아이스크림콘 눈 조각","th":"ประติมากรรมหิมะโคนไอศกรีม"},
 level:1,
 price:155,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/snows/003.PNG",
 auth:true
},
{
 name:"怪しい雪像",
 nameI18n:{"ja":"怪しい雪像","en":"Poop Snow Sculpture","zh-CN":"一坨雪雕","zh-TW":"一坨雪雕","ko":"덩어리 눈 조각","th":"กองแกะสลักหิมะ"},
 level:1,
 price:155,
 star1Only:true,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/snows/004.PNG",
 auth:false
},
{
 name:"微笑みスギ",
 nameI18n:{"ja":"微笑みスギ","en":"Smiling Cedar","zh-CN":"微笑雪松","zh-TW":"微笑雪松","ko":"스마일리 눈 소나무","th":"สนซีดาร์อมยิ้ม"},
 level:2,
 price:155,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/snows/005.PNG",
 auth:true
},
{
 name:"シフゾウ・タタの雪像",
 nameI18n:{"ja":"シフゾウ・タタの雪像","en":"Milu Tata Snow Sculpture","zh-CN":"塔塔麋鹿雪雕","zh-TW":"塔塔麋鹿雪雕","ko":"사슴 아타라 눈 조각","th":"แกะสลักหิมะกวางเอลก์ทาทา"},
 level:2,
 price:165,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/snows/006.PNG",
 auth:true
},
{
 name:"ビーバー・ボブの雪像",
 nameI18n:{"ja":"ビーバー・ボブの雪像","en":"Beaver Bobo Snow Sculpture","zh-CN":"波波河狸雪雕","zh-TW":"波波河狸雪雕","ko":"비버 밥 눈 조각","th":"แกะสลักหิมะบีเวอร์โบโบ้"},
 level:2,
 price:165,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/snows/007.PNG",
 auth:true
},
{
 name:"ヒツジ・ジョーンの雪像",
 nameI18n:{"ja":"ヒツジ・ジョーンの雪像","en":"Sheep Jojo Snow Sculpture","zh-CN":"琼琼绵羊雪雕","zh-TW":"瓊瓊綿羊雪雕","ko":"양 조안 눈 조각","th":"แกะสลักหิมะแกะ Joan"},
 level:3,
 price:190,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/snows/008.PNG",
 auth:true
},
{
 name:"ハクチョウ・ロロの雪像",
 nameI18n:{"ja":"ハクチョウ・ロロの雪像","en":"Swan Dory Snow Sculpture","zh-CN":"萝萝天鹅雪雕","zh-TW":"蘿蘿天鵝雪雕","ko":"백조 도로시 눈 조각","th":"แกะสลักหิมะหงส์ Dory"},
 level:3,
 price:190,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/snows/009.PNG",
 auth:true
},
{
 name:"ウサギ・アニーの雪像",
 nameI18n:{"ja":"ウサギ・アニーの雪像","en":"Rabbit Nia Snow Sculpture","zh-CN":"妮妮兔雪雕","zh-TW":"妮妮兔雪雕","ko":"토끼 애니 눈 조각","th":"แกะสลักหิมะตุ๊กตากระต่ายเนเน่จัง"},
 level:3,
 price:225,
 weather:["晴れ","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/snows/010.PNG",
 auth:true
},
{
 name:"シェフ・モモの雪像",
 nameI18n:{"ja":"シェフ・モモの雪像","en":"Chef Moe Snow Sculpture","zh-CN":"莫莫厨师雪雕","zh-TW":"莫莫廚師雪雕","ko":"요리사 마시모 눈 조각","th":"แกะสลักหิมะเชฟ Mo Mo"},
 level:4,
 price:225,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/snows/011.PNG",
 auth:true
},
{
 name:"ハチ・ナニワの雪像",
 nameI18n:{"ja":"ハチ・ナニワの雪像","en":"Bee Naniwa Snow Sculpture","zh-CN":"浪花蜂雪雕","zh-TW":"浪花蜂雪雕","ko":"벌 나니와 눈 조각","th":"แกะสลักหิมะผึ้งฟองคลื่น"},
 level:4,
 price:225,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/snows/012.PNG",
 auth:true
},
{
 name:"コアラ・ベイリーの雪像",
 nameI18n:{"ja":"コアラ・ベイリーの雪像","en":"Koala Bay Snow Sculpture","zh-CN":"贝贝考拉雪雕","zh-TW":"貝貝無尾熊雪雕","ko":"코알라 베일리 눈 조각","th":"แกะสลักหิมะเบบี้โคอาล่า"},
 level:4,
 price:225,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/snows/013.PNG",
 auth:true
},
{
 name:"トム・ブランクの雪像",
 nameI18n:{"ja":"トム・ブランクの雪像","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 level:5,
 price:280,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/snows/014.PNG",
 auth:true
},
{
 name:"クマ・ヴァンニアの雪像",
 nameI18n:{"ja":"クマ・ヴァンニアの雪像","en":"Bear Nya Snow Sculpture","zh-CN":"尼尼熊雪雕","zh-TW":"尼尼熊雪雕","ko":"곰돌이 바냐 눈 조각","th":"แกะสลักหิมะนีนี่แบร์"},
 level:5,
 price:280,
 weather:["雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/snows/015.PNG",
 auth:true
}
 // ここに追加していく
].map((c,i) => ({
  ...c,
  type:"snow",
  bookIndex:i
}));
