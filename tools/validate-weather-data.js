#!/usr/bin/env node
// tools/validate-weather-data.js
// js/data-weather.js の形式チェック。
// 使い方: node tools/validate-weather-data.js

const path = require("path");
const weatherData = require(path.join("..", "js", "data-weather.js"));

const REQUIRED_ZONES = ["6-12", "12-18", "18-0", "0-6"];
const VALID_WEATHERS = ["晴れ", "雨", "虹", "流星雨"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

let errors = [];

for (const [date, zones] of Object.entries(weatherData)) {
  if (!DATE_RE.test(date)) {
    errors.push(`[${date}] 日付形式が不正です（YYYY-MM-DD で入力してください）`);
  }

  const zoneKeys = Object.keys(zones);
  for (const zone of REQUIRED_ZONES) {
    if (!zoneKeys.includes(zone)) {
      errors.push(`[${date}] 時間帯 "${zone}" が抜けています`);
    }
  }
  for (const zone of zoneKeys) {
    if (!REQUIRED_ZONES.includes(zone)) {
      errors.push(`[${date}] 未知の時間帯キー "${zone}" があります`);
    }
  }

  for (const [zone, weather] of Object.entries(zones)) {
    if (!VALID_WEATHERS.includes(weather)) {
      errors.push(
        `[${date}] "${zone}" の天気 "${weather}" は不正です（${VALID_WEATHERS.join("/")} のいずれかにしてください）`
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`weatherData に ${errors.length} 件の問題があります:\n`);
  errors.forEach((e) => console.error(" - " + e));
  process.exit(1);
}

console.log(`OK: ${Object.keys(weatherData).length} 件の日付データを検証しました。問題ありません。`);
