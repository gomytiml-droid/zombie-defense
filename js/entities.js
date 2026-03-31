// ============================================================
// entities.js — ゲームオブジェクトの生成・更新ロジック
// ゾンビ・弾・コイン・パーティクル・フロートテキストを管理
// ============================================================

// ─── パーティクル生成 ─────────────────────────────────────────
function addParticle(x, y, color, n = 6) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 1 + Math.random() * 2.5;
    particles.push({x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life:22, maxLife:22, color, r: 2+Math.random()*2});
  }
}

// ─── フロートテキスト生成（ダメージ・コインなど）──────────────
function addFloat(x, y, text, color) {
  floatTexts.push({x, y, text, color, life:50, maxLife:50});
}

// ─── ゾンビスポーン ───────────────────────────────────────────
// 開いた窓の「外側」にスポーンし、壁を通って侵入させる
function spawnZombie() {
  const open = windows.filter(w => w.open);
  if (!open.length) return;
  const win = open[Math.floor(Math.random() * open.length)];

  // 窓の外側 (建物外) にスポーン
  let sx = win.x, sy = win.y;
  if      (win.dir === 'n') sy = 28;
  else if (win.dir === 's') sy = 692;
  else if (win.dir === 'w') sx = 28;
  else                      sx = 872;

  // ウェーブに応じてゾンビ種別を決定
  let type = 0;
  const r = Math.random();
  if      (wave >= 5 && r < 0.20) type = 2;  // タフ: wave5以降 20%
  else if (wave >= 3 && r < 0.40) type = 1;  // 速い: wave3以降 40%

  const cfg     = ZOMBIE_TYPES[type];
  const baseSpd = 0.55 + wave * 0.12 + Math.random() * 0.25;
  const baseHp  = 25  + wave * 14;

  zombies.push({
    x: sx, y: sy,
    r: cfg.r,
    hp: baseHp * cfg.hpMul, maxHp: baseHp * cfg.hpMul,
    speed: baseSpd * cfg.spdMul,
    type, body: cfg.body, head: cfg.head,
    scoreMul: cfg.scoreMul, coinMul: cfg.coinMul, label: cfg.label,
    attacking: false,
  });
}

// ─── 自動照準・発射 ───────────────────────────────────────────
// 射程内で最も近いゾンビを自動で狙い弾を生成する
function fireAuto(now) {
  const wp   = WEAPONS[currentWeapon];
  const rate = Math.max(60, wp.fireRate - wp.upgRate * 80);
  const dmg  = wp.damage + wp.upgDmg * 8;
  const range = (wp.range + wp.upgRange * 20) * 1.5;

  if (now < nextFireTime) return;
  nextFireTime = now + rate;
  if (!zombies.length) return;

  let nearest = null, nd = Infinity;
  zombies.forEach(z => {
    const d = Math.hypot(z.x - player.x, z.y - player.y);
    if (d < range && d < nd) { nd = d; nearest = z; }
  });
  if (!nearest) return;

  const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  for (let i = 0; i < wp.bullets; i++) {
    const ang = baseAngle + (Math.random() - 0.5) * wp.spread;
    bullets.push({
      x: player.x, y: player.y,
      vx: Math.cos(ang) * 8, vy: Math.sin(ang) * 8,
      dmg, life: Math.round(range / 8), color: wp.color,
    });
  }
  playShoot(currentWeapon);
}

// ─── 最寄りの破損窓を検索 ─────────────────────────────────────
function nearestDamagedWindow() {
  let best = null, bd = Infinity;
  windows.forEach(w => {
    if (w.hp >= w.maxHp) return;
    const d = Math.hypot(w.x - player.x, w.y - player.y);
    if (d < bd) { bd = d; best = w; }
  });
  return best ? {win: best, dist: bd} : null;
}
