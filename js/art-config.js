// js/art-config.js
// 「アート」機能（art-create.html / art-convert.html）で共有するキャンバスサイズ設定。
// art-pia.comへの直接アクセスができないため、寸法を独自に確認できていない。
// 自由キャンバスの4サイズはユーザーから提示された確定値としてそのまま使用する。
// デザイン枠（衣装など）は正確な寸法が未確認のため、確認できるまでnull/confirmed:falseのまま
// プレースホルダーとして残す（推測値は入れない。確認でき次第、値を登録するだけで対応可能な構造）。

const FREE_CANVAS_SIZES = [30, 50, 100, 150];

const DESIGN_FRAME_PRESETS = [
  { id: "myDesignSquare", nameKey: "art_frame_mydesign", nameFallback: "マイデザイン（正方形）", width: null, height: null, confirmed: false },
  { id: "clothingTop", nameKey: "art_frame_clothing", nameFallback: "衣装（服）", width: null, height: null, confirmed: false },
];
