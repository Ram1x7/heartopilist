/**
 * icons.js
 * サイト全体で使うインラインSVGアイコン集。
 * すべて 24x24 グリッド、stroke=currentColor（親要素の文字色を継承）。
 * 呼び出し側は icon("name", {size, className}) でHTML文字列を取得する。
 */

const ICONS = {
  // ヘッダー
  help: `<circle cx="12" cy="12" r="9"/><path d="M9.2 9a2.8 2.8 0 0 1 5.4.9c0 1.7-2.4 2-2.4 3.6"/><circle cx="12" cy="16.6" r="0.6" fill="currentColor" stroke="none"/>`,
  share: `<path d="M8.6 13.4 15.4 9.6M8.6 10.6l6.8 3.8"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="17.5" cy="7" r="2.5"/><circle cx="17.5" cy="17" r="2.5"/>`,
  sun: `<circle cx="12" cy="12" r="4.2"/><path d="M12 3v2.2M12 18.8V21M4.2 12H2M22 12h-2.2M5.5 5.5l1.6 1.6M16.9 16.9l1.6 1.6M5.5 18.5l1.6-1.6M16.9 7.1l1.6-1.6"/>`,
  moon: `<path d="M20 13.6A8.3 8.3 0 1 1 10.4 4a6.6 6.6 0 0 0 9.6 9.6z"/>`,

  // 検索・操作
  search: `<circle cx="10.8" cy="10.8" r="6.3"/><path d="m20 20-4.4-4.4"/>`,
  close: `<path d="M6 6l12 12M18 6 6 18"/>`,
  calendar: `<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 9.5h17M8 3v3.6M16 3v3.6"/>`,
  pin: `<path d="M12 21s6.5-6.1 6.5-11A6.5 6.5 0 0 0 5.5 10c0 4.9 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.3"/>`,
  chevronDown: `<path d="m6 9 6 6 6-6"/>`,
  minus: `<path d="M5 12h14"/>`,
  rotateDevice: `<rect x="7" y="3.5" width="10" height="17" rx="2"/><path d="M9.5 20.5h5"/><path d="M19 9.5a6 6 0 0 0-9.8-4.6M5 14.5a6 6 0 0 0 9.8 4.6"/><path d="M18.5 6.5 19 9.5l3-1M5.5 17.5 5 14.5l-3 1"/>`,

  // 種類フィルター
  all: `<rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.6"/><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.6"/><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.6"/><rect x="13" y="13" width="7.5" height="7.5" rx="1.6"/>`,
  fish: `<path d="M3.5 12c3-4 8-6.5 12-4.8M15.5 7.2c2 1 4 2.7 5 4.8-1 2.1-3 3.8-5 4.8M15.5 16.8C11.5 18.5 6.5 16 3.5 12"/><circle cx="14.3" cy="10.6" r="0.7" fill="currentColor" stroke="none"/><path d="M3.5 12c1 .8 2.2 1.3 3.4 1.5M3.5 12c1-.8 2.2-1.3 3.4-1.5"/>`,
  bug: `<circle cx="12" cy="13" r="5"/><path d="M12 8V5.2M9.5 5.8 8 4M14.5 5.8 16 4M7.2 11l-3-1.4M16.8 11l3-1.4M7.2 15.5l-3 1.8M16.8 15.5l3 1.8M9 13h6"/>`,
  bird: `<path d="M4 15c3-6 8-8.5 11.5-6.5 1.4.8 1.7 2.5.6 3.6-1 1-2.6 1-4 .4"/><path d="M12 12.3c2.2 1 3.6 3 3.9 5.4M6.5 12.8C5.2 14 4.4 15.6 4 17.3"/><circle cx="16.3" cy="7.6" r="0.7" fill="currentColor" stroke="none"/>`,
  sand: `<path d="M4 20h16M6 20l2.5-9h7L18 20"/><path d="M9.5 15.5h5M8.7 11h6.6"/>`,
  snow: `<path d="M12 3v18M4.5 7.5l15 9M19.5 7.5l-15 9"/><path d="m8.5 5.5 3.5 2 3.5-2M8.5 18.5l3.5-2 3.5 2M4 10l1 3.3L2 15M20 10l-1 3.3L23 15"/>`,
  shell: `<path d="M12 4c4.5 0 7.5 4 7.5 8.5S16.5 20 12 20 4.5 17 4.5 12.5 7.5 4 12 4Z"/><path d="M12 4v16M9 8.5c1.4 3 1.4 8 0 11M15 8.5c-1.4 3-1.4 8 0 11"/>`,

  // 天気
  weatherSun: `<circle cx="12" cy="12" r="4"/><path d="M12 4v1.6M12 18.4V20M4 12h1.6M18.4 12H20M6.3 6.3l1.2 1.2M16.5 16.5l1.2 1.2M6.3 17.7l1.2-1.2M16.5 7.5l1.2-1.2"/>`,
  weatherRain: `<path d="M7 15a4.5 4.5 0 0 1 .8-9 5.5 5.5 0 0 1 10.6 1.6A4 4 0 0 1 17.5 15Z"/><path d="M8.5 18v2M12 18v2M15.5 18v2"/>`,
  weatherRainbow: `<path d="M4 19a8 8 0 0 1 16 0"/><path d="M7 19a5 5 0 0 1 10 0"/>`,
  weatherMeteor: `<path d="M14 4 5 13a4 4 0 1 0 6 6l9-9"/><path d="M13.5 8.5 15.5 10.5M4 19h16"/>`,
  bubbles: `<circle cx="10" cy="13" r="6"/><circle cx="17" cy="7.5" r="3"/><circle cx="8" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="6.5" r="0.6" fill="currentColor" stroke="none"/>`,
  play: `<path d="M7 4.5v15l13-7.5Z"/>`,

  // 並び替え・絞り込み
  sortBook: `<path d="M6 4.5h6.5A2.5 2.5 0 0 1 15 7v13H8.5A2.5 2.5 0 0 1 6 17.5Z"/><path d="M15 7a2.5 2.5 0 0 1 2.5-2.5H18v13a2.5 2.5 0 0 1-2.5 2.5H15"/>`,
  sortLevel: `<path d="M5 19V13M11 19V9M17 19V5"/>`,
  sortStar: `<path d="M12 4.2 14 9l5.2.5-4 3.4 1.2 5.1L12 15.6l-4.4 2.4 1.2-5.1-4-3.4L9.9 9Z"/>`,
  sortMedal: `<circle cx="12" cy="9.5" r="5"/><path d="m9 13.8-1.6 6.7L12 18l4.6 2.5L15 13.8"/>`,
  level: `<path d="M4 17h16M4 12h16M4 7h16" opacity=".0"/><path d="m4 8 4-4 4 4M4 16l4 4 4-4" transform="translate(4 0)"/>`,

  // 選択・チェック
  checkSquare: `<rect x="4" y="4" width="16" height="16" rx="3.2"/><path d="m8.2 12.3 2.6 2.6 5-5.4"/>`,
  star: `<path d="M12 4.2 14 9l5.2.5-4 3.4 1.2 5.1L12 15.6l-4.4 2.4 1.2-5.1-4-3.4L9.9 9Z"/>`,
  starOutline: `<path d="M12 4.2 14 9l5.2.5-4 3.4 1.2 5.1L12 15.6l-4.4 2.4 1.2-5.1-4-3.4L9.9 9Z"/>`,
  medal: `<circle cx="12" cy="9.5" r="5"/><path d="m9 13.8-1.6 6.7L12 18l4.6 2.5L15 13.8"/>`,
  trophy: `<path d="M7 4h10v4a5 5 0 0 1-10 0Z"/><path d="M7 5.5H4.5a2 2 0 0 0-2 2v.5a3.5 3.5 0 0 0 3.5 3.5H7M17 5.5h2.5a2 2 0 0 1 2 2v.5a3.5 3.5 0 0 1-3.5 3.5H17"/><path d="M12 13v3.5M9 20h6M9.5 16.8h5"/>`,
  medalOutline: `<circle cx="12" cy="9.5" r="5"/><path d="m9 13.8-1.6 6.7L12 18l4.6 2.5L15 13.8"/>`,

  // その他
  mail: `<rect x="3.5" y="5.5" width="17" height="13" rx="2.2"/><path d="m4.5 7 7.5 6 7.5-6"/>`,
  warning: `<path d="M12 4 3 20h18Z"/><path d="M12 10.2v4M12 17.2v.1"/>`,
  info: `<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/>`,
  download: `<path d="M12 3.5v11.6M8 11.6l4 4 4-4"/><path d="M4.5 17v2.5A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5V17"/>`,
  globe: `<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.3 4 5.3 4 8.5s-1.4 6.2-4 8.5c-2.6-2.3-4-5.3-4-8.5s1.4-6.2 4-8.5Z"/>`,
  ingredient: `<path d="M12 21c-3.5 0-6-2.6-6-6.5C6 10.5 9 6.5 10.5 3c.3 2 1.3 3 2.3 3.8C14.5 8 16 9.8 16 12.5c0 1-.2 1.8-.6 2.5"/><path d="M8.5 15c0 2.5 1.8 4.3 4 4.3"/>`,
  crop: `<path d="M12 21v-8M12 13c-3-.3-5-2.6-5-6 3.6 0 5.8 1.7 6 5"/><path d="M12 13c3-.3 5-2.6 5-6-3.6 0-5.8 1.7-6 5"/>`,
  flower: `<circle cx="12" cy="12" r="2.3"/><path d="M12 9.7a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6ZM12 19a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6ZM9.7 12a2.3 2.3 0 1 1-4.6 0 2.3 2.3 0 0 1 4.6 0ZM19 12a2.3 2.3 0 1 1-4.6 0 2.3 2.3 0 0 1 4.6 0Z"/><path d="M12 16v5"/>`,
  bell: `<path d="M12 3.5c-.9 0-1.6.7-1.6 1.6v.6C7.8 6.3 6 8.7 6 11.5v3.3L4.3 17h15.4L18 14.8v-3.3c0-2.8-1.8-5.2-4.4-5.8v-.6c0-.9-.7-1.6-1.6-1.6Z"/><path d="M9.5 17a2.5 2.5 0 0 0 5 0"/>`,
  bellOff: `<path d="M12 3.5c-.9 0-1.6.7-1.6 1.6v.6C7.8 6.3 6 8.7 6 11.5v3.3L4.3 17h15.4L18 14.8v-3.3c0-2.8-1.8-5.2-4.4-5.8v-.6c0-.9-.7-1.6-1.6-1.6Z" opacity="0.4"/><path d="M9.5 17a2.5 2.5 0 0 0 5 0"/><path d="M4 4l16 16"/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7"/>`,
  sprout: `<path d="M12 21v-9"/><path d="M12 12c-4 0-7-2.3-7-7 4.5 0 7 2 7 5.3"/><path d="M12 12c4 0 7-2.3 7-7-4.5 0-7 2-7 5.3"/>`,
  archive: `<rect x="3.5" y="4" width="17" height="4.5" rx="1.4"/><path d="M4.5 8.5v9a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-9"/><path d="M10 12.5h4"/>`,
  trash: `<path d="M5 7h14"/><path d="M9 7V5.3A1.3 1.3 0 0 1 10.3 4h3.4A1.3 1.3 0 0 1 15 5.3V7"/><path d="M7 7l1 12.3A1.7 1.7 0 0 0 9.7 21h4.6a1.7 1.7 0 0 0 1.7-1.7L17 7"/><path d="M10.3 11v6M13.7 11v6"/>`,
  upload: `<path d="M12 20.5V9M8 13l4-4 4 4"/><path d="M4.5 17v2.5A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5V17"/>`,
  meat: `<path d="M8 15.5c-2-1-3-3-2.3-5.3C6.4 8 8.2 6.5 10.4 6.2c1.5-2 4-3 6.3-1.9 2.5 1.2 3.5 4 2.5 6.5-1 2.5-3.3 3.5-3.3 3.5"/><path d="M15.8 13.3c-.5 3-3 5.7-6 6.4-1.7.4-3.4-.6-3.7-2.3-.3-1.7.9-3.3 2.6-3.5"/>`,
  sortAsc: `<path d="M6 17V6M3.5 8.5 6 6l2.5 2.5"/><path d="M12 8h8M12 13h5.5M12 18h3"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  gift: `<rect x="3.5" y="9.5" width="17" height="10.5" rx="1.6"/><path d="M3.5 9.5h17M12 9.5v10.5"/><path d="M12 9.5c-1.5-4-6-5-6-2 0 1.6 2 2 6 2Z"/><path d="M12 9.5c1.5-4 6-5 6-2 0 1.6-2 2-6 2Z"/>`,
  link: `<path d="M9.5 14.5 14.5 9.5"/><path d="M11 7.5 12.7 5.8a3.3 3.3 0 1 1 4.7 4.7L15.7 12.2"/><path d="M13 16.5l-1.7 1.7a3.3 3.3 0 1 1-4.7-4.7l1.7-1.7"/>`,
  dice: `<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8.3" cy="8.3" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.7" cy="8.3" r="1.1" fill="currentColor" stroke="none"/><circle cx="8.3" cy="15.7" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.7" cy="15.7" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/>`,
  tent: `<path d="M12 4 4 20h16Z"/><path d="M12 4v16M8 20l4-9 4 9"/>`,
  idea: `<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>`,
  wrench: `<path d="M14.5 6.5a3.5 3.5 0 0 1-4.6 4.6L5 16l3 3 4.9-4.9a3.5 3.5 0 0 1 4.6-4.6l-2.7 2.7-2-2Z"/>`,
  lock: `<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>`,
  checklist: `<rect x="4" y="3.5" width="16" height="17" rx="2.2"/><path d="M8 8.5h8M8 12h8M8 15.5h5"/><path d="m7 8.2.6.6L9 7.4" opacity="0"/>`,
  clock: `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>`,
  undo: `<path d="M8 10H15.5a5 5 0 0 1 0 10H12"/><path d="M8 10l4-4M8 10l4 4"/>`,
  redo: `<path d="M16 10H8.5a5 5 0 0 0 0 10H12"/><path d="M16 10l-4-4M16 10l-4 4"/>`,
  shirt: `<path d="M8 4 5 6.5 6.5 9l1.7-1V20h7.6V8l1.7 1 1.5-2.5L16 4c-1 1.4-2.5 2.2-4 2.2S9 5.4 8 4Z"/>`,
  sofa: `<path d="M5.5 12.5V9a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v3.5"/><path d="M4.5 12.5h15v4a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4.5 16.5Z"/><path d="M5.5 18v1.5M18.5 18v1.5"/>`,
  cardId: `<rect x="3.5" y="6" width="17" height="12" rx="2"/><circle cx="8.5" cy="12" r="2"/><path d="M6 15.5c0-1.4 1.1-2.2 2.5-2.2s2.5.8 2.5 2.2M13.5 10h5M13.5 13h5M13.5 15.5h3.5"/>`,
  coin: `<circle cx="12" cy="12" r="8.5"/><path d="M9.3 14.2c.3 1 1.3 1.6 2.7 1.6 1.7 0 2.8-.8 2.8-2s-1.1-1.7-2.8-1.9c-1.7-.2-2.8-.7-2.8-1.9s1.1-2 2.8-2c1.4 0 2.4.6 2.7 1.6"/><path d="M12 7.3v1.1M12 15.6v1.1"/>`,

  // アートエディター
  pen: `<path d="M4 20l1-4.2L15.8 5a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19 4 20Z"/><path d="M14 6.8l3.2 3.2"/>`,
  eraser: `<path d="M18.5 13.5 9.8 4.8a1.8 1.8 0 0 0-2.5 0L3.6 8.5a1.8 1.8 0 0 0 0 2.5l8.5 8.5H16"/><path d="M8.5 19.5H20"/>`,
  // 筆（ペンツールの和風アイコン）
  fude: `<path d="M19 4.5 9 14.5"/><path d="M9 14.5c-1.8.5-3.4 2.1-4.4 4.9-.3.8.4 1.5 1.2 1.2 2.8-1 4.4-2.6 4.9-4.4"/><circle cx="20" cy="3.5" r="1.1" fill="currentColor" stroke="none"/>`,
  // 字消し（消しゴムツールの和風アイコン）
  sumiKeshi: `<path d="M6 20 4.7 15a2 2 0 0 1 .5-2L14 4.3a2 2 0 0 1 2.8 0l2.9 2.9a2 2 0 0 1 0 2.8L11 18.6a2 2 0 0 1-1.4.6H6Z"/><path d="M10.5 7.7 16.3 13.5"/>`,
  bucket: `<path d="M4.5 10.5 12 3l7.5 7.5a3 3 0 0 1 0 4.2l-3.3 3.3a3 3 0 0 1-4.2 0l-7.5-7.5Z"/><path d="M4 12l6 6"/><path d="M18.5 16.5c.8.8.8 2 0 2.8-.8.8-2 .8-2.8 0"/>`,
  eyedropper: `<path d="m7.5 16.5 8-8"/><path d="M14 5.5 18.5 10"/><path d="M15.8 3.7a2.3 2.3 0 0 1 3.2 0l1.3 1.3a2.3 2.3 0 0 1 0 3.2l-1.8 1.8-4.5-4.5Z"/><path d="M7.5 16.5 5 20l3.5-2.5"/>`,
  // パレット（画家用パレットの形。親指を通す穴の位置に絵の具の玉を配置）
  palette: `<path d="M12 3.5C7 3.5 3 7.3 3 12c0 2.9 2 5.3 4.6 5.3.8 0 1.1.9.6 1.5-.6.7-.2 1.7.7 1.7C15.2 20.5 21 16.6 21 11c0-4.1-4-7.5-9-7.5Z"/><circle cx="8" cy="10.3" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="7.8" r="1.2" fill="currentColor" stroke="none"/><circle cx="16" cy="9.3" r="1.2" fill="currentColor" stroke="none"/><circle cx="17" cy="13.3" r="1.2" fill="currentColor" stroke="none"/>`,
  undo: `<path d="M4 11h9a5.5 5.5 0 0 1 0 11h-3"/><path d="m8 6-4 5 4 5"/>`,
  redo: `<path d="M20 11h-9a5.5 5.5 0 0 0 0 11h3"/><path d="m16 6 4 5-4 5"/>`,
  shapeLine: `<path d="M6 18 18 6"/><circle cx="6" cy="18" r="1.7" fill="currentColor" stroke="none"/><circle cx="18" cy="6" r="1.7" fill="currentColor" stroke="none"/>`,
  shapeRect: `<rect x="4.5" y="6.5" width="15" height="11" rx="1.4"/>`,
  shapeCircle: `<circle cx="12" cy="12" r="7.5"/>`,
  swap: `<path d="M4 8h13"/><path d="M14 4.5 17.5 8 14 11.5"/><path d="M20 16H7"/><path d="M10 12.5 6.5 16 10 19.5"/>`,
  flipHorizontal: `<path d="M12 3v18" stroke-dasharray="2.5 2.5"/><path d="M8.5 8 5.5 12l3 4"/><path d="M15.5 8l3 4-3 4"/>`,
  flipVertical: `<path d="M3 12h18" stroke-dasharray="2.5 2.5"/><path d="M8 8.5 12 5.5l4 3"/><path d="M8 15.5l4 3 4-3"/>`,
  arrowUp: `<path d="M12 19V5"/><path d="M6.5 10.5 12 5l5.5 5.5"/>`,
  arrowDown: `<path d="M12 5v14"/><path d="M6.5 13.5 12 19l5.5-5.5"/>`,
  arrowLeft: `<path d="M19 12H5"/><path d="M10.5 6.5 5 12l5.5 5.5"/>`,
  arrowRight: `<path d="M5 12h14"/><path d="M13.5 6.5 19 12l-5.5 5.5"/>`,
  guideLine: `<path d="M4 17c4-9 12-9 16 0" stroke-dasharray="3 2.5"/>`,

  // 楽譜エディター
  pause: `<rect x="6" y="4.5" width="4" height="15" rx="1"/><rect x="14" y="4.5" width="4" height="15" rx="1"/>`,
  volumeOn: `<path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z"/><path d="M16 9a4.5 4.5 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>`,
  volumeOff: `<path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4Z"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5"/>`,

  // ボトムナビ
  home: `<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9.5h12V10"/><path d="M10 19.5v-6h4v6"/>`,
  book: `<path d="M12 6.5c-1.6-1.3-3.8-2-6.5-2v13c2.7 0 4.9.7 6.5 2 1.6-1.3 3.8-2 6.5-2v-13c-2.7 0-4.9.7-6.5 2Z"/><path d="M12 6.5v13"/>`,
  menu: `<path d="M4 7h16M4 12h16M4 17h16"/>`,
  paw: `<circle cx="12" cy="15.3" r="3.6"/><circle cx="6" cy="10" r="2"/><circle cx="18" cy="10" r="2"/><circle cx="9" cy="6" r="1.8"/><circle cx="15" cy="6" r="1.8"/>`,

  // 建築サポート：建築モード切替
  build3dSolid: `<path d="M12 3 4 7v10l8 4 8-4V7Z"/><path d="M4 7l8 4 8-4M12 11v10"/>`,
  build3dFlat: `<path d="M3 12 12 8l9 4-9 4Z"/><path d="M3 12v4l9 4 9-4v-4"/>`,
  build3dWall: `<rect x="4" y="6" width="16" height="13" rx="1.3"/><circle cx="8" cy="10" r="1.3"/><path d="M5 17 9 12l3 3 4-5.5 4 7.5"/>`,
};

/**
 * icon(name, opts) : SVGアイコンのHTML文字列を返す
 * opts.size : 幅高さ(px)。デフォルト18
 * opts.className : 追加クラス名
 * opts.strokeWidth : 線の太さ。デフォルト1.8
 */
function icon(name, opts = {}) {
  const body = ICONS[name];
  if (!body) return "";
  const size = opts.size || 18;
  const cls = opts.className ? ` ${opts.className}` : "";
  const sw = opts.strokeWidth || 1.8;
  return `<svg class="icon${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

window.icon = icon;
