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
  medalOutline: `<circle cx="12" cy="9.5" r="5"/><path d="m9 13.8-1.6 6.7L12 18l4.6 2.5L15 13.8"/>`,

  // その他
  mail: `<rect x="3.5" y="5.5" width="17" height="13" rx="2.2"/><path d="m4.5 7 7.5 6 7.5-6"/>`,
  warning: `<path d="M12 4 3 20h18Z"/><path d="M12 10.2v4M12 17.2v.1"/>`,
  info: `<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.1"/>`,
  download: `<path d="M12 3.5v11.6M8 11.6l4 4 4-4"/><path d="M4.5 17v2.5A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5V17"/>`,
  globe: `<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.3 4 5.3 4 8.5s-1.4 6.2-4 8.5c-2.6-2.3-4-5.3-4-8.5s1.4-6.2 4-8.5Z"/>`,
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
