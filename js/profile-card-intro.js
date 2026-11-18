// The preview and downloaded PNG use the same canvas and avatar crop.
const PROFILE_CARD_INTRO_LAYOUTS = {
  landscape: {
    width: 1600, height: 1000,
    identity: { x: 56, y: 146, w: 490, h: 760 },
    avatar: { cx: 301, cy: 405, r: 146 },
    name: { x: 91, y: 620, w: 420, align: "center" },
    details: { x: 574, y: 146, w: 970, h: 760 },
  },
  portrait: {
    width: 1080, height: 1350,
    identity: { x: 52, y: 145, w: 976, h: 290 },
    avatar: { cx: 212, cy: 290, r: 106 },
    name: { x: 373, y: 287, w: 605, align: "left" },
    details: { x: 52, y: 462, w: 976, h: 783 },
  },
};

function renderIntroCard(ctx, state, { avatarImg, mascotImg }, translate, translatePreset) {
  const layout = PROFILE_CARD_INTRO_LAYOUTS[state.layout];
  const theme = PROFILE_CARD_THEMES[state.theme];
  const { width, height, identity, name, avatar, details } = layout;
  const font = SANS_FONT;
  const paper = "#fffdf9";

  function panel(x, y, w, h, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();
  }

  function text(value, x, y, size, color, maxWidth, weight = 700) {
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.fillText(value, x, y, maxWidth);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = theme.goldLight;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = theme.indigo;
  ctx.fillRect(0, 0, width, 298);
  text(translate("pc_intro_title", "ハートピア自己紹介カード"), identity.x, 79, 45, paper, width - 2 * identity.x - 150);
  ctx.textAlign = "right";
  text("Heartopia", width - identity.x, 80, 26, theme.goldHighlight, 140);
  ctx.textAlign = "left";

  panel(identity.x, identity.y, identity.w, identity.h, 35, paper);
  panel(details.x, details.y, details.w, details.h, 35, paper);
  panel(avatar.cx - avatar.r - 20, avatar.cy - avatar.r - 20, (avatar.r + 20) * 2, (avatar.r + 20) * 2, avatar.r + 20, theme.goldLight);
  drawAvatar(ctx, avatar.cx, avatar.cy, avatar.r, avatarImg, state.avatar, theme, mascotImg);
  const nameX = name.align === "center" ? name.x + name.w / 2 : name.x;
  const playerName = state.playerName.trim();
  if (playerName) {
    ctx.textAlign = name.align;
    text(playerName, nameX, name.y, 66, theme.indigo, name.w);
    ctx.textAlign = "left";
  }

  const friendsValue = state.friends && translate(`pc_friends_${state.friends}`);
  const fields = [
    ["pc_field_id", "UID", state.playerId],
    ["pc_field_level", "開拓者レベル", state.level],
    ["pc_field_server", "サーバー", state.server],
    ["pc_field_activity", "主な活動時間", state.activityTime],
    ["pc_field_weekend", "休日の活動時間", state.weekendTime],
    ["pc_field_friends", "フレンド募集", friendsValue],
    ["pc_field_playstyle", "プレイスタイル", translatePreset(state.playStyle)],
  ];
  if (state.showSns) {
    fields.push(
      [null, "X", state.snsX.trim() && `@${state.snsX.trim().replace(/^@+/, "")}`],
      [null, "TikTok", state.snsTiktok.trim() && `@${state.snsTiktok.trim().replace(/^@+/, "")}`],
      [null, "YouTube", state.snsYoutube],
    );
  }

  const x = details.x + 40;
  const boxWidth = details.w - 80;
  const columnWidth = boxWidth / 2;
  let y = details.y + 50;
  const populated = fields.filter(([, , value]) => String(value ?? "").trim());
  populated.forEach(([key, label, value], index) => {
    const columnX = x + (index % 2) * columnWidth;
    const rowY = y + Math.floor(index / 2) * 76;
    text(key ? translate(key, label) : label, columnX, rowY, 23, theme.inkSub, columnWidth - 20);
    text(String(value).trim(), columnX, rowY + 31, 31, theme.ink, columnWidth - 20);
  });
  y += Math.ceil(populated.length / 2) * 76;

  if (state.tags.length) {
    let tagX = x;
    state.tags.forEach(tag => {
      const label = translatePreset(tag);
      ctx.font = `700 26px ${font}`;
      const w = Math.min(ctx.measureText(label).width + 34, boxWidth / 3 - 12);
      if (tagX + w > x + boxWidth) {
        tagX = x;
        y += 52;
      }
      panel(tagX, y - 16, w, 41, 20, theme.goldLight);
      text(label, tagX + 17, y + 4, 26, theme.indigo, w - 34);
      tagX += w + 12;
    });
    y += 65;
  }

  if (state.bio.trim()) {
    text(translate("pc_field_bio", "ひとこと・自己紹介"), x, y, 24, theme.inkSub, boxWidth);
    ctx.font = `500 32px ${font}`;
    const lines = pcWrapTextPreserveBreaks(ctx, state.bio.trim(), boxWidth, 61);
    if (lines.length > 4) {
      lines.length = 4;
      lines[3] = pcFitTextWidth(ctx, lines[3] + "…", boxWidth);
    }
    lines.forEach((line, index) => text(line, x, y + 39 + index * 38, 32, theme.ink, boxWidth, 500));
  }

  if (state.showSiteUrl) {
    text("ram1x7.github.io/heartopilist", identity.x, height - 43, 22, theme.indigo, width / 2);
  }
  ctx.textAlign = "right";
  if (state.showDate) {
    const date = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date());
    text(date, width - identity.x, height - 43, 22, theme.indigo, width / 2 - identity.x);
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}
