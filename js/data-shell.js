// 貝殻
// star1Only : true の場合、★1価格のみ持ち★2〜5は非表示にする（壊れ物など）
// auth      : false の場合、認証マスター対象外
//
// ※ 以下の5種は天気・時間帯が未確認のため、判明次第追加してください。
//   ハリナガリンボウ / ミガキウラシマ / リュウキュウアオイ /
//   ランタンアヤネジレガイ / ウスムラサキイモ

const shellData = [
{
 name:"破損した貝殻",
 nameI18n:{"ja":"破損した貝殻","en":"Damaged Seashell","zh-CN":"破损的海贝","zh-TW":"破損的海貝","ko":"손상된 바닷조개","th":"เปลือกหอยชำรุด"},
 level:1,
 price:2,
 star1Only:true,
 weather:["晴れ","雨","虹"],
 time:["6-12","12-18","18-0","0-6"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/001.PNG",
 auth:false
},
{
 name:"ゴトウオキナエビス",
 nameI18n:{"ja":"ゴトウオキナエビス","en":"Goto's Slit Shell","zh-CN":"后藤翁戎螺","zh-TW":"後藤翁戎螺","ko":"고토이 심해고둥","th":"หอยสลิตเชลล์โกโตะ"},
 level:1,
 price:50,
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/002.PNG",
 auth:true
},
{
 name:"ツキガイ",
 nameI18n:{"ja":"ツキガイ","en":"Tiger Lucine","zh-CN":"满月蛤","zh-TW":"滿月蛤","ko":"루시나조개","th":"หอยลูซีนลายเสือ"},
 level:1,
 price:85,
 weather:["晴れ","雨","虹"],
 time:["0-6","12-18","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/003.PNG",
 auth:true
},
{
 name:"アダムクモガイ",
 nameI18n:{"ja":"アダムクモガイ","en":"Mini Spider Conch","zh-CN":"迷你蜘蛛凤凰螺","zh-TW":"迷你蜘蛛鳳凰螺","ko":"미니 거미고둥","th":"หอยสังข์แมงมุมจิ๋ว"},
 level:1,
 price:50,
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","12-18"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/004.PNG",
 auth:true
},
{
 name:"マツカワガイ",
 nameI18n:{"ja":"マツカワガイ","en":"Maple Leaf Triton","zh-CN":"翼法螺","zh-TW":"翼法螺","ko":"개구리소라","th":"หอยทริตันเมเปิล"},
 level:1,
 price:50,
 weather:["晴れ","雨","虹"],
 time:["0-6","12-18","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/005.PNG",
 auth:true
},
{
 name:"ハリガナリンボウ",
 nameI18n:{"ja":"ハリガナリンボウ","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 level:1,
 price:50,
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","18-0"],
 location:"海洋清掃クエスト",
 locationI18n:{"ja":"海洋清掃クエスト","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/021.PNG",
 auth:true
},
{
 name:"ナミマガシワ",
 nameI18n:{"ja":"ナミマガシワ","en":"Chinese Jingle Shell","zh-CN":"银蛤","zh-TW":"銀蛤","ko":"개굴잠쟁이","th":"หอยกระดิ่งจีน"},
 level:1,
 price:65,
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","12-18"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/006.PNG",
 auth:true
},
{
 name:"カトレアバショウ",
 nameI18n:{"ja":"カトレアバショウ","en":"Orchid Murex","zh-CN":"兰花芭蕉螺","zh-TW":"蘭花芭蕉螺","ko":"난초뿔고둥","th":"หอยสังข์มิวเร็กซ์"},
 level:2,
 price:65,
 weather:["晴れ","雨","虹"],
 time:["0-6","12-18","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/007.PNG",
 auth:true
},
{
 name:"ヘサキザクラ",
 nameI18n:{"ja":"ヘサキザクラ","en":"Tellina Prora","zh-CN":"船首樱蛤","zh-TW":"船首櫻蛤","ko":"프로라 텔린조개","th":"หอยเทลลินา"},
 level:2,
 price:85,
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","12-18"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/008.PNG",
 auth:true
},
{
 name:"ミガキウラシマ",
 nameI18n:{"ja":"ミガキウラシマ","en":"Smooth Bonnet Shell","zh-CN":"光滑蛹螺","zh-TW":"光滑蛹螺","ko":"매끈투구고둥","th":"หอยหมวกเรียบ"},
 level:2,
 price:50,
 weather:["晴れ","雨","虹"],
 time:["0-6","12-18","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/022.PNG",
 auth:true
},
{
 name:"リュウキュウアオイ",
 nameI18n:{"ja":"リュウキュウアオイ","en":"Heart Cockle","zh-CN":"鸡心蛤","zh-TW":"雞心蛤","ko":"흰꽈리조개","th":"หอยแครงหัวใจ"},
 level:3,
 price:50,
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","12-18"],
 location:"海洋清掃クエスト",
 locationI18n:{"ja":"海洋清掃クエスト","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/023.PNG",
 auth:true
},
{
 name:"ホネガイ",
 nameI18n:{"ja":"ホネガイ","en":"Venus Comb Murex","zh-CN":"维纳斯骨螺","zh-TW":"維納斯骨螺","ko":"흰작은가시고둥","th":"หอยหวีวีนัส"},
 level:3,
 price:50,
 weather:["晴れ","雨","虹"],
 time:["0-6","12-18","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/009.PNG",
 auth:true
},
{
 name:"ヒメジャコ",
 nameI18n:{"ja":"ヒメジャコ","en":"Boring Clam","zh-CN":"番红砗磲","zh-TW":"番紅硨磲","ko":"크로세아 클램","th":"หอยมือเสือ"},
 level:3,
 price:65,
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","12-18"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/010.PNG",
 auth:true
},
{
 name:"ヌノメイトカケ",
 nameI18n:{"ja":"ヌノメイトカケ","en":"Fine-ribbed Staircase Shell","zh-CN":"细肋海蛳螺","zh-TW":"細肋海螄螺","ko":"무명올각시실꾸리고둥","th":"หอยไฟน์ริบด์สแตร์เคส"},
 level:4,
 price:68,
 weather:["晴れ","雨","虹"],
 time:["0-6","12-18","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/011.PNG",
 auth:true
},
{
 name:"シロスジグルマ",
 nameI18n:{"ja":"シロスジグルマ","en":"Giant Sundial","zh-CN":"白环车轮螺","zh-TW":"白環車輪螺","ko":"해시계고둥","th":"หอยเวียนยักษ์"},
 level:4,
 price:85,
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/012.PNG",
 auth:true
},
{
 name:"ボタンウミウサギ",
 nameI18n:{"ja":"ボタンウミウサギ","en":"Umbilical Egg Shell","zh-CN":"乳白海兔螺","zh-TW":"乳白海兔螺","ko":"사마귀알고둥","th":"หอยอัมบิลิคัลเอ็กเชลล์"},
 level:4,
 price:65,
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/013.PNG",
 auth:true
},
{
 name:"オオベニシボリ",
 nameI18n:{"ja":"オオベニシボリ","en":"Red-lined Bubble Snail","zh-CN":"灯笼艳捻螺","zh-TW":"燈籠艷捻螺","ko":"노빌리스 두순고둥","th":"หอยบับเบิลลายแดง"},
 level:5,
 price:120,
 // ☆2・☆3売価は標準倍率(floor×1.5=180・floor×2=240)と異なり
 // ユーザー確認済みの240・360を個別指定（prices参照。☆4・☆5は標準倍率と一致）
 prices:[120,240,360,480,960],
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","12-18"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/000.PNG",
 auth:true
},
{
 name:"ミズスイ",
 nameI18n:{"ja":"ミズスイ","en":"Mawe's Latiaxis","zh-CN":"玛娃花仙螺","zh-TW":"瑪娃花仙螺","ko":"라티악시스 마와","th":"หอยมาเวลาไทอาเซนซิส"},
 level:5,
 price:50,
 weather:["晴れ","雨","虹"],
 time:["0-6","12-18","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/014.PNG",
 auth:true
},
{
 name:"カブラガイ",
 nameI18n:{"ja":"カブラガイ","en":"Bubble Turnip","zh-CN":"洋葱螺","zh-TW":"洋蔥螺","ko":"라파고둥","th":"หอยบับเบิลเทอร์นิป"},
 level:5,
 price:85,
 weather:["晴れ","雨","虹"],
 time:["0-6","12-18","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/015.PNG",
 auth:true
},
{
 name:"ウスムラサキイモ",
 nameI18n:{"ja":"ウスムラサキイモ","en":"Cone Snail","zh-CN":"花簇芋螺","zh-TW":"花簇芋螺","ko":"꽃송이 원뿔고둥","th":"หอยเต้าปูนลายดอก"},
 level:5,
 price:85,
 weather:["晴れ","雨","虹"],
 time:["0-6","12-18","18-0"],
 location:"海洋清掃クエスト",
 locationI18n:{"ja":"海洋清掃クエスト","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/024.PNG",
 auth:true
},
{
 name:"ツリフネキヌヅツミ",
 nameI18n:{"ja":"ツリフネキヌヅツミ","en":"Long-snouted Volva","zh-CN":"独木舟菱角螺","zh-TW":"獨木舟菱角螺","ko":"카누두루마리고둥","th":"หอยโวลวางวงยาว"},
 level:6,
 price:65,
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/016.PNG",
 auth:true
},
{
 name:"ショウジョウラ",
 nameI18n:{"ja":"ショウジョウラ","en":"Ruby Triton","zh-CN":"艳红美法螺","zh-TW":"豔紅美法螺","ko":"붉은가슴고둥","th":"หอยทริตันทับทิม"},
 level:7,
 price:120,
 weather:["晴れ","雨","虹"],
 time:["0-6","12-18","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/017.PNG",
 auth:true
},
{
 name:"オウムガイ",
 nameI18n:{"ja":"オウムガイ","en":"Chambered Nautilus","zh-CN":"鹦鹉螺","zh-TW":"鸚鵡螺","ko":"앵무조개","th":"หอยงวงช้าง"},
 level:7,
 price:165,
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/018.PNG",
 auth:true
},
{
 name:"ルリガイ",
 nameI18n:{"ja":"ルリガイ","en":"Violet Snail","zh-CN":"琉璃紫螺","zh-TW":"琉璃紫螺","ko":"잔티나 글로보사","th":"หอยทากทะเลสีม่วง"},
 level:7,
 price:85,
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","12-18"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/019.PNG",
 auth:true
},
{
 name:"チョウセンフデ",
 nameI18n:{"ja":"チョウセンフデ","en":"Episcopal Miter","zh-CN":"锦鲤笔螺","zh-TW":"錦鯉筆螺","ko":"주교관고둥","th":"หอยมิตรา"},
 level:8,
 price:85,
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/020.PNG",
 auth:true
},
{
 name:"ベニヤカタガイ",
 nameI18n:{"ja":"ベニヤカタガイ","en":"Royal Paper Bubble","zh-CN":"玫瑰泡螺","zh-TW":"玫瑰泡螺","ko":"장미두순고둥","th":"หอยบับเบิลเปเปอร์รอยัล"},
 level:8,
 price:85,
 weather:["虹"],
 time:["0-6","12-18","18-0"],
 location:"海洋清掃クエスト",
 locationI18n:{"ja":"海洋清掃クエスト","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/025.PNG",
 auth:true
},
{
 name:"マンボウガイ",
 nameI18n:{"ja":"マンボウガイ","en":"Bullmouth Shell","zh-CN":"万宝螺","zh-TW":"萬寶螺","ko":"사모아고둥","th":"หอยปากวัว"},
 level:9,
 price:165,
 weather:["虹"],
 time:["0-6","6-12","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/027.PNG",
 auth:true
},
{
 name:"イチゴナツモモ",
 nameI18n:{"ja":"イチゴナツモモ","en":"Strawberry Top Shell","zh-CN":"草莓钟螺","zh-TW":"草莓鐘螺","ko":"딸기밤고둥","th":"หอยท็อปเชลล์สตรอว์เบอร์รี่"},
 level:9,
 price:120,
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/026.PNG",
 auth:true
},
{
 name:"ナンヨウダカラ",
 nameI18n:{"ja":"ナンヨウダカラ","en":"Golden Cowrie","zh-CN":"黄金宝螺","zh-TW":"黃金寶螺","ko":"골든 카우리","th":"หอยเบี้ยทอง"},
 level:10,
 price:165,
 // ☆2・☆3売価は標準倍率(floor×1.5=247・floor×2=330)と異なり
 // ユーザー確認済みの330・495を個別指定（prices参照。☆4・☆5は標準倍率と一致）
 prices:[165,330,495,660,1320],
 weather:["晴れ","雨","虹"],
 time:["0-6","6-12","18-0"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/shells/028.PNG",
 auth:true
},
{
 name:"ピンクガイ",
 nameI18n:{"ja":"ピンクガイ","en":"Queen Conch","zh-CN":"女王凤凰螺","zh-TW":"女王鳳凰螺","ko":"분홍거미고둥","th":"หอยสังข์ราชินี"},
 level:10,
 price:165,
 // ☆2・☆3売価は標準倍率(floor×1.5=247・floor×2=330)と異なり
 // ユーザー確認済みの330・495を個別指定（prices参照。☆4・☆5は標準倍率と一致）
 prices:[165,330,495,660,1320],
 weather:["虹"],
 time:["0-6","6-12","12-18"],
 location:"海洋清掃",
 locationI18n:{"ja":"海洋清掃","en":"","zh-CN":"","zh-TW":"","ko":"","th":""},
 img:"./images/000.PNG",
 auth:true
}
 // ここに追加していく
].map((c,i) => ({
  ...c,
  type:"shell",
  bookIndex:i
}));
