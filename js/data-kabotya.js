// かぼちゃの彫刻（「幽夜の集い」イベントの収集コンテンツ）
// 出現時間帯・出現天気の概念が無いため、weather/timeは常時出現扱いの値を入れている。
// 図鑑ページでは「かぼちゃ」タブ選択時のみ表示し、出現モード（今出現するもの全て／
// 今の天気限定／今は出現しない／すべて）の影響を受けない特別扱いをjs/main.js側で行う。
//
// authCount: 認証マスター（彫刻マスター）に必要な獲得数
// star1Only: 失敗作（★1のみ）のため★2〜5は非表示

const kabotyaData = [
{
 name:"巨大かぼちゃオーバーオール",
 nameI18n:{"ja":"巨大かぼちゃオーバーオール","en":"Huge Pumpkin Overalls Body","zh-CN":"巨大背带裤南瓜身体","zh-TW":"巨大吊帶褲南瓜身體","ko":"거대 멜빵 호박 몸통","th":"ตัวฟักทองเอี๊ยมกางเกงยักษ์"},
 level:4,
 price:170,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/001.PNG",
 authCount:175,
 auth:true
},
{
 name:"かぼちゃオーバーオール",
 nameI18n:{"ja":"かぼちゃオーバーオール","en":"Pumpkin Overalls Body","zh-CN":"背带裤南瓜身体","zh-TW":"吊帶褲南瓜身體","ko":"멜빵 호박 몸통","th":"ตัวฟักทองเอี๊ยมกางเกง"},
 level:4,
 price:170,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/002.PNG",
 authCount:175,
 auth:true
},
{
 name:"巨大ブランクかぼちゃ",
 nameI18n:{"ja":"巨大ブランクかぼちゃ","en":"Huge Blankin","zh-CN":"巨大布南克","zh-TW":"巨大布南克","ko":"거대 블랑호박","th":"บูแนนค์ยักษ์"},
 level:5,
 price:230,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/003.PNG",
 authCount:140,
 auth:true
},
{
 name:"ブランクかぼちゃ",
 nameI18n:{"ja":"ブランクかぼちゃ","en":"Blankin","zh-CN":"布南克","zh-TW":"布南克","ko":"블랑호박","th":"บูแนนค์"},
 level:5,
 price:230,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/004.PNG",
 authCount:140,
 auth:true
},
{
 name:"精巧なかぼちゃの足",
 nameI18n:{"ja":"精巧なかぼちゃの足","en":"Exquisite Pumpkin Legs","zh-CN":"精致南瓜腿","zh-TW":"精緻南瓜腿","ko":"정교한 호박 다리","th":"ขาฟักทองสุดหรู"},
 level:5,
 price:230,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/005.PNG",
 authCount:175,
 auth:true
},
{
 name:"巨大かぼちゃヘッド（猫）",
 nameI18n:{"ja":"巨大かぼちゃヘッド（猫）","en":"Huge Kitty Pumpkin Head","zh-CN":"巨大猫猫南瓜头","zh-TW":"巨大貓貓南瓜頭","ko":"고양이 거대 호박 머리","th":"หัวฟักทองน้องแมวยักษ์"},
 level:2,
 price:90,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/006.PNG",
 authCount:210,
 auth:true
},
{
 name:"かぼちゃヘッド（猫）",
 nameI18n:{"ja":"かぼちゃヘッド（猫）","en":"Kitty Pumpkin Head","zh-CN":"猫猫南瓜头","zh-TW":"貓貓南瓜頭","ko":"고양이 호박 머리","th":"หัวฟักทองน้องแมว"},
 level:2,
 price:90,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/007.PNG",
 authCount:210,
 auth:true
},
{
 name:"かぼちゃベスト",
 nameI18n:{"ja":"かぼちゃベスト","en":"Pumpkin Vest Body","zh-CN":"马甲南瓜身体","zh-TW":"馬甲背心南瓜身體","ko":"조끼 호박 몸통","th":"ตัวฟักทองเสื้อกั๊ก"},
 level:1,
 price:75,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/008.PNG",
 authCount:210,
 auth:true
},
{
 name:"かぼちゃヘッド（クマ）",
 nameI18n:{"ja":"かぼちゃヘッド（クマ）","en":"Bear Pumpkin Head","zh-CN":"小熊南瓜头","zh-TW":"小熊南瓜頭","ko":"곰돌이 호박 머리","th":"หัวฟักทองแบร์"},
 level:4,
 price:170,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/009.PNG",
 authCount:175,
 auth:true
},
{
 name:"巨大くつろぎかぼちゃの足",
 nameI18n:{"ja":"巨大くつろぎかぼちゃの足","en":"Huge Relaxing Pumpkin Legs","zh-CN":"巨大放松南瓜腿","zh-TW":"巨大放鬆南瓜腿","ko":"느긋한 거대 호박 다리","th":"ขาฟักทองสุดชิลยักษ์"},
 level:3,
 price:120,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/010.PNG",
 authCount:175,
 auth:true
},
{
 name:"くつろぎかぼちゃの足",
 nameI18n:{"ja":"くつろぎかぼちゃの足","en":"Relaxing Pumpkin Legs","zh-CN":"放松南瓜腿","zh-TW":"放鬆南瓜腿","ko":"느긋한 호박 다리","th":"ขาฟักทองสุดชิล"},
 level:3,
 price:120,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/011.PNG",
 authCount:175,
 auth:true
},
{
 name:"かぼちゃヘッド（うさちゃん）",
 nameI18n:{"ja":"かぼちゃヘッド（うさちゃん）","en":"Bunny Pumpkin Head","zh-CN":"兔兔南瓜头","zh-TW":"兔兔南瓜頭","ko":"토끼 호박 머리","th":"หัวฟักทองเจ้ากระต่าย"},
 level:3,
 price:120,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/012.PNG",
 authCount:175,
 auth:true
},
{
 // 巨大かぼちゃオーバーオールの失敗作。★1のみ・認証マスター対象外
 name:"巨大かぼちゃヘッド（気絶）",
 nameI18n:{"ja":"巨大かぼちゃヘッド（気絶）","en":"Huge Broken Pumpkin Head","zh-CN":"巨大破碎南瓜头","zh-TW":"巨大破碎南瓜頭","ko":"깨진 거대 호박 머리","th":"หัวฟักทองแตกยักษ์"},
 level:2,
 price:10,
 star1Only:true,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/013.PNG",
 auth:false
},
{
 // かぼちゃの失敗作。★1のみ・認証マスター対象外
 name:"かぼちゃヘッド（気絶）",
 nameI18n:{"ja":"かぼちゃヘッド（気絶）","en":"Broken Pumpkin Head","zh-CN":"破碎南瓜头","zh-TW":"破碎南瓜頭","ko":"깨진 호박 머리","th":"หัวฟักทองแตก"},
 level:1,
 price:10,
 star1Only:true,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/014.PNG",
 auth:false
},
{
 name:"真面目なかぼちゃの足",
 nameI18n:{"ja":"真面目なかぼちゃの足","en":"Straight Pumpkin Legs","zh-CN":"正直南瓜腿","zh-TW":"正直南瓜腿","ko":"반듯한 호박 다리","th":"ขาฟักทองตรง"},
 level:1,
 price:75,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/015.PNG",
 authCount:210,
 auth:true
},
{
 name:"かぼちゃワンピース",
 nameI18n:{"ja":"かぼちゃワンピース","en":"Pumpkin Body w/ Dress","zh-CN":"连衣裙南瓜身体","zh-TW":"洋裝南瓜身體","ko":"원피스 호박 몸통","th":"ตัวฟักทองเดรส"},
 level:2,
 price:75,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/016.PNG",
 authCount:210,
 auth:true
},
{
 name:"巨大かぼちゃマント",
 nameI18n:{"ja":"巨大かぼちゃマント","en":"Huge Pumpkin Body w/ Cape","zh-CN":"巨大斗篷南瓜身体","zh-TW":"巨大斗篷南瓜身體","ko":"거대 망토 호박 몸통","th":"ตัวฟักทองคลุมผ้ายักษ์"},
 level:3,
 price:120,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/017.PNG",
 authCount:175,
 auth:true
},
{
 name:"かぼちゃマント",
 nameI18n:{"ja":"かぼちゃマント","en":"Pumpkin Body w/ Cape","zh-CN":"斗篷南瓜身体","zh-TW":"斗篷南瓜身體","ko":"망토 호박 몸통","th":"ตัวฟักทองคลุมผ้า"},
 level:3,
 price:120,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/018.PNG",
 authCount:175,
 auth:true
},
{
 name:"かぼちゃヘッド（萌え）",
 nameI18n:{"ja":"かぼちゃヘッド（萌え）","en":"Cute Pumpkin Head","zh-CN":"萌萌南瓜头","zh-TW":"萌萌南瓜頭","ko":"귀여운 호박 머리","th":"หัวฟักทองน่ารัก"},
 level:2,
 price:90,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/019.PNG",
 authCount:210,
 auth:true
},
{
 name:"かぼちゃヘッド（怒り）",
 nameI18n:{"ja":"かぼちゃヘッド（怒り）","en":"Angry Pumpkin Head","zh-CN":"怒怒南瓜头","zh-TW":"怒怒南瓜頭","ko":"화난 호박 머리","th":"หัวฟักทองโกรธ"},
 level:1,
 price:75,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/020.PNG",
 authCount:210,
 auth:true
},
{
 name:"かぼちゃヘッド（ぼんやり）",
 nameI18n:{"ja":"かぼちゃヘッド（ぼんやり）","en":"Derpy Pumpkin Head","zh-CN":"呆呆南瓜头","zh-TW":"呆呆南瓜頭","ko":"멍한 호박 머리","th":"หัวฟักทองทึ่ม"},
 level:1,
 price:75,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"彫刻台で彫刻",
 locationI18n:{"ja":"彫刻台で彫刻","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/kabotya/021.PNG",
 authCount:210,
 auth:true
}
  // ここに追加していく
].map((c,i) => ({
  ...c,
  type:"pumpkin",
  bookIndex:i
}));
