#!/usr/bin/env node
// tools/validate-weather-data.js
// js/data-weather.js の形式チェック（windows/hourly形式）。
// 使い方: node tools/validate-weather-data.js

const path = require("path");
const weatherData = require(path.join("..", "js", "data-weather.js"));
const { WEATHER_MASTER } = require(path.join("..", "js", "weather-master.js"));

const REQUIRED_WINDOWS = ["00-06", "06-12", "12-18", "18-24"];
const REQUIRED_HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

let errors = [];
let unknownWeatherNames = new Set();

function checkWeatherName(name, where) {
  if (!(name in WEATHER_MASTER)) {
    unknownWeatherNames.add(name);
  }
}

for (const [date, day] of Object.entries(weatherData)) {
  if (!DATE_RE.test(date)) {
    errors.push(`[${date}] 日付形式が不正です（YYYY-MM-DD で入力してください）`);
  }

  if (!day || typeof day !== "object") {
    errors.push(`[${date}] windows/hourlyを持つオブジェクトではありません`);
    continue;
  }

  const windows = day.windows || {};
  const windowKeys = Object.keys(windows);
  for (const wk of REQUIRED_WINDOWS) {
    if (!windowKeys.includes(wk)) errors.push(`[${date}] windows."${wk}" が抜けています`);
  }
  for (const wk of windowKeys) {
    if (!REQUIRED_WINDOWS.includes(wk)) errors.push(`[${date}] windowsに未知のキー "${wk}" があります`);
    else checkWeatherName(windows[wk], `${date}.windows.${wk}`);
  }

  const hourly = day.hourly || {};
  const hourKeys = Object.keys(hourly);
  for (const hh of REQUIRED_HOURS) {
    if (!hourKeys.includes(hh)) errors.push(`[${date}] hourly."${hh}" が抜けています`);
  }
  for (const hh of hourKeys) {
    if (!REQUIRED_HOURS.includes(hh)) errors.push(`[${date}] hourlyに未知のキー "${hh}" があります`);
    else checkWeatherName(hourly[hh], `${date}.hourly.${hh}`);
  }
}

if (unknownWeatherNames.size) {
  console.warn(
    `警告: js/weather-master.js のWEATHER_MASTERに未登録の天気名が ${unknownWeatherNames.size} 種類あります` +
    `（エラーにはしていません。絵文字なし・翻訳なしで生の文字列のまま表示されます）:\n` +
    [...unknownWeatherNames].map((w) => ` - ${w}`).join("\n")
  );
}

if (errors.length > 0) {
  console.error(`weatherData に ${errors.length} 件の問題があります:\n`);
  errors.forEach((e) => console.error(" - " + e));
  process.exit(1);
}

console.log(`OK: ${Object.keys(weatherData).length} 件の日付データを検証しました。問題ありません。`);
