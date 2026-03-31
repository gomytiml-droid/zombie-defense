// ============================================================
// boss.js — ボスゾンビシステム
// 5ウェーブごとに強力なボスが出現する。3フェーズ制で追い詰めるほど凶暴になる
// ============================================================
//
// ─── 統合方法（他の作業完了後に以下を追加する）──────────────
//
// [HTML]  zombie_defense_v2.html — items.js の直前に追加:
//   <script src="js/boss.js"></script>
//
// [game.js]  startGame() のリセット部分に追加:
//   bossZombie = null; bossWarning = 0; _bossSpawnedWaves = [];
//
// [game.js]  loop() の waveTimer 進行ブロックの直後（waveClearAnim の手前）に追加:
//   checkBossSpawn();
//
// [game.js]  loop() の zombies = zombies.filter(...) の直後に追加:
//   updateBoss();
//
// [render.js]  draw() の ctx.restore() の直前に追加（drawItems() より前推奨）:
//   drawBoss();
//
// ─────────────────────────────────────────────────────────────

// ─── ボス設定定数 ─────────────────────────────────────────────
const BOSS_CFG = {
  r:              22,      // 半径（通常の約2倍）
  baseHp:         400,     // wave1換算のHP（wave×80加算）
  baseSpeed:      0.60,    // 基礎速度
  waveSpeedBonus: 0.04,    // wave毎の速度加算
  // フェーズ閾値（HP割合）
  phase2At:       0.60,
  phase3At:       0.30,
  // チャージ攻撃
  chargeInterval: 260,     // チャージまでのフレーム（phase2以降）
  chargeIntervalP3: 140,   // phase3はより頻繁
  chargeDuration: 55,      // チャージ継続フレーム
  chargeSpeed:    5.8,
  chargeDamage:   8,       // チャージヒット時の追加ダメージ/frame
  // 報酬
  scoreBase:      800,     // wave×倍率の基礎スコア
  coinBase:       120,     // ドロップコイン基礎値
};

// ─── グローバル状態 ───────────────────────────────────────────
let bossZombie        = null;   // null = ボス不在
let bossWarning       = 0;      // 警告アニメーションカウンタ（180→0）
let _bossSpawnedWaves = [];     // スポーン済みwave番号（再スポーン防止）

// ─── ウェーブ進行時にボス出現チェック（毎フレーム呼ぶ）──────
function checkBossSpawn() {
  if (!gameRunning) return;
  if (bossZombie) return;    // 既にボスがいる
  if (wave <= 0 || wave % 5 !== 0) return;
  if (_bossSpawnedWaves.includes(wave)) return;

  if (bossWarning === 0) {
    bossWarning = 180;       // 3秒間の警告を開始
  }

  if (bossWarning > 0) {
    bossWarning--;
    if (bossWarning === 0) {
      _bossSpawnedWaves.push(wave);
      _spawnBoss();
    }
  }
}

// ─── ボスをスポーン ───────────────────────────────────────────
function _spawnBoss() {
  const open = windows.filter(w => w.open);
  let sx, sy;

  if (open.length > 0) {
    const win = open[Math.floor(Math.random() * open.length)];
    sx = win.x; sy = win.y;
    if      (win.dir === 'n') sy = 18;
    else if (win.dir === 's') sy = MAP_H - 18;
    else if (win.dir === 'w') sx = 18;
    else                      sx = MAP_W - 18;
  } else {
    // 全窓が閉じていたら北壁中央の外から出現（壁を貫通させる）
    sx = MAP_W / 2; sy = 15;
  }

  const hp = BOSS_CFG.baseHp + wave * 80;
  bossZombie = {
    x: sx, y: sy,
    r: BOSS_CFG.r,
    hp,
    maxHp: hp,
    speed: BOSS_CFG.baseSpeed + wave * BOSS_CFG.waveSpeedBonus,
    phase:        1,
    state:        'walk',   // 'walk' | 'charge'
    chargeTimer:  0,
    chargeVx:     0,
    chargeVy:     0,
    chargeLeft:   0,
    angle:        0,
    glowAnim:     0,
    hitFlash:     0,        // 被弾時の白フラッシュ
    dead:         false,
  };
}

// ─── ボス更新（毎フレーム呼ぶ）──────────────────────────────
function updateBoss() {
  if (!bossZombie || !gameRunning) return;

  const b = bossZombie;
  b.glowAnim = (b.glowAnim + 1) % 60;
  if (b.hitFlash > 0) b.hitFlash--;

  // ─ フェーズ更新 ─
  const hpPct = b.hp / b.maxHp;
  if      (hpPct < BOSS_CFG.phase3At) b.phase = 3;
  else if (hpPct < BOSS_CFG.phase2At) b.phase = 2;
  else                                 b.phase = 1;

  // ─ チャージ攻撃 ─
  const chargeInt = b.phase === 3
    ? BOSS_CFG.chargeIntervalP3
    : BOSS_CFG.chargeInterval;

  if (b.phase >= 2 && b.state === 'walk') {
    b.chargeTimer++;
    if (b.chargeTimer >= chargeInt) {
      b.chargeTimer = 0;
      b.state       = 'charge';
      b.chargeLeft  = BOSS_CFG.chargeDuration;
      const ang     = Math.atan2(player.y - b.y, player.x - b.x);
      b.chargeVx    = Math.cos(ang) * BOSS_CFG.chargeSpeed;
      b.chargeVy    = Math.sin(ang) * BOSS_CFG.chargeSpeed;
      b.angle       = ang;
      addParticle(b.x, b.y, '#ff2222', 12);
    }
  }

  // ─ 移動 ─
  if (b.state === 'charge') {
    b.x         += b.chargeVx;
    b.y         += b.chargeVy;
    b.chargeLeft--;
    addParticle(b.x, b.y, '#8b0000', 2);
    if (b.chargeLeft <= 0) b.state = 'walk';
  } else {
    const ang = Math.atan2(player.y - b.y, player.x - b.x);
    b.angle    = ang;
    const spd  = b.speed * (b.phase === 3 ? 1.4 : 1.0);
    b.x       += Math.cos(ang) * spd;
    b.y       += Math.sin(ang) * spd;
  }

  b.x = Math.max(b.r, Math.min(MAP_W - b.r, b.x));
  b.y = Math.max(b.r, Math.min(MAP_H - b.r, b.y));
  resolveWalls(b);

  // ─ プレイヤーへのダメージ ─
  const dist = Math.hypot(b.x - player.x, b.y - player.y);
  if (dist < player.r + b.r) {
    const dmg = b.state === 'charge'
      ? BOSS_CFG.chargeDamage  // チャージ中は追加ダメージ
      : 0.6;                   // 通常接触
    const armor = typeof upgrades !== 'undefined' ? upgrades.armor * 0.08 : 0;
    const reduction = typeof getPowerupDamageReduction === 'function'
      ? getPowerupDamageReduction() : 1.0;
    player.hp -= dmg * (1 - armor) * reduction;
    if (typeof playHurt === 'function') playHurt();
    if (player.hp <= 0) { player.hp = 0; endGame(); }
  }

  // ─ 弾との当たり判定 ─
  bullets.forEach(bullet => {
    if (bullet.life <= 0) return;
    if (Math.hypot(bullet.x - b.x, bullet.y - b.y) < b.r + 4) {
      b.hp       -= bullet.dmg;
      bullet.life = 0;
      b.hitFlash  = 6;
      addParticle(b.x, b.y, '#ff4444', 3);
    }
  });

  // ─ 死亡処理 ─
  if (b.hp <= 0) {
    b.dead = true;
    _onBossDeath(b);
    bossZombie = null;
  }
}

// ─── ボス死亡時の報酬・演出 ───────────────────────────────────
function _onBossDeath(b) {
  const pts  = BOSS_CFG.scoreBase + wave * 100;
  const coin = BOSS_CFG.coinBase  + wave * 10;
  score += pts;
  kills++;
  money += coin;

  // 大量のパーティクル
  for (let i = 0; i < 5; i++) {
    addParticle(
      b.x + (Math.random() - 0.5) * 30,
      b.y + (Math.random() - 0.5) * 30,
      i % 2 === 0 ? '#ff2222' : '#ff8800', 12
    );
  }
  addFloat(b.x, b.y - 30, `ボス撃破!! +${pts}点 +$${coin}`, '#ff4444');

  // ボス撃破でアイテムを強制スポーン
  if (typeof spawnItemBox === 'function') {
    spawnItemBox();
    spawnItemBox();
  }
  if (typeof playDeath === 'function') playDeath();
}

// ─── ボス描画（ctx は -camX,-camY 変換済み状態で呼ぶ）─────────
function drawBoss() {
  if (!bossZombie && bossWarning <= 0) return;

  // ── 警告バナー ──
  if (bossWarning > 0) {
    const a  = bossWarning > 150 ? (180 - bossWarning) / 30
               : bossWarning < 30 ? bossWarning / 30 : 1;
    const blink = Math.floor(bossWarning / 12) % 2 === 0;

    ctx.globalAlpha = a * (blink ? 1 : 0.5);
    ctx.fillStyle   = 'rgba(120,0,0,0.75)';
    ctx.fillRect(camX, camY + VH / 2 - 44, VW, 68);

    ctx.fillStyle = '#ff2222';
    ctx.font      = `bold ${Math.round(VW * 0.06)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('⚠ BOSS INCOMING ⚠', camX + VW / 2, camY + VH / 2 - 10);

    ctx.fillStyle = '#ffaa00';
    ctx.font      = `${Math.round(VW * 0.032)}px sans-serif`;
    ctx.fillText(`WAVE ${wave} ボスゾンビ出現!`, camX + VW / 2, camY + VH / 2 + 18);
    ctx.globalAlpha = 1;
  }

  if (!bossZombie) return;
  const b = bossZombie;

  // ── 発光オーラ ──
  const glowR = b.r + 8 + Math.sin(b.glowAnim / 60 * Math.PI * 2) * 4;
  const glowA = b.phase === 3 ? 0.55 : b.phase === 2 ? 0.38 : 0.22;
  ctx.globalAlpha = glowA;
  ctx.fillStyle   = b.phase === 3 ? '#ff0000' : b.phase === 2 ? '#ff4400' : '#8b0000';
  ctx.beginPath();
  ctx.arc(b.x, b.y, glowR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // ── チャージ中の軌跡 ──
  if (b.state === 'charge') {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle   = '#ff2222';
    ctx.beginPath();
    ctx.arc(b.x - b.chargeVx * 1.8, b.y - b.chargeVy * 1.8, b.r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ── ボス本体（スプライトまたは独自図形）──
  const src = zombieSpriteCanvas || zombieSpriteImg;
  if (src) {
    // スプライトを2.5倍スケールで描画（4方向対応）
    let sp;
    const a = ((b.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if      (a < Math.PI * 0.25 || a >= Math.PI * 1.75) sp = SPRITE.right;
    else if (a < Math.PI * 0.75)                         sp = SPRITE.front;
    else if (a < Math.PI * 1.25)                         sp = SPRITE.left;
    else                                                  sp = SPRITE.back;

    const size = b.r * 4.2;
    if (zombieSpriteImg && !zombieSpriteCanvas) {
      ctx.globalCompositeOperation = 'multiply';
    }
    ctx.drawImage(src, sp.sx, sp.sy, sp.sw, sp.sh,
                  b.x - size / 2, b.y - size / 2, size, size);
    ctx.globalCompositeOperation = 'source-over';

    // 赤いフェーズオーラ（phase2以降）
    if (b.phase >= 2) {
      ctx.globalAlpha = b.phase === 3 ? 0.35 : 0.20;
      ctx.fillStyle   = '#ff0000';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 1, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  } else {
    // フォールバック描画（大きな赤い円）
    const phaseColor = b.phase === 3 ? '#cc0000' : b.phase === 2 ? '#8b0000' : '#5a0000';
    ctx.fillStyle = phaseColor;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ff2222'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ff6666';
    ctx.font      = `bold ${b.r}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('BOSS', b.x, b.y + 4);
  }

  // ── 被弾フラッシュ ──
  if (b.hitFlash > 0) {
    ctx.globalAlpha = b.hitFlash / 6 * 0.7;
    ctx.fillStyle   = '#ffffff';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // ── ボスHPバー（ラベル付き大型バー）──
  const hpPct = Math.max(0, b.hp / b.maxHp);
  const bw = b.r * 2 + 20, bh = 7;
  ctx.fillStyle = '#111'; ctx.fillRect(b.x - bw/2, b.y - b.r - 18, bw, bh);
  const barColor = hpPct > 0.6 ? '#e24b4a' : hpPct > 0.3 ? '#ff6600' : '#ff0000';
  ctx.fillStyle  = barColor;
  ctx.fillRect(b.x - bw/2, b.y - b.r - 18, bw * hpPct, bh);
  ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 1;
  ctx.strokeRect(b.x - bw/2, b.y - b.r - 18, bw, bh);

  ctx.fillStyle = '#ff8888';
  ctx.font      = '8px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('BOSS', b.x, b.y - b.r - 20);

  // ── 画面上部の大型ボスHPバー（スクリーン固定）──
  const sbw = Math.round(VW * 0.40);
  const sbh = 12;
  const sbx = camX + (VW - sbw) / 2;
  const sby = camY + 4;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(sbx - 2, sby - 12, sbw + 4, sbh + 16);

  ctx.fillStyle = '#ff4444';
  ctx.font      = `bold ${Math.round(VW * 0.018)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(
    `BOSS  HP ${Math.ceil(b.hp)} / ${b.maxHp}  [フェーズ${b.phase}]`,
    sbx + sbw / 2, sby - 2
  );

  ctx.fillStyle = '#220000';
  ctx.fillRect(sbx, sby, sbw, sbh);
  ctx.fillStyle = hpPct > 0.5 ? '#e24b4a' : hpPct > 0.25 ? '#ff6600' : '#ff0000';
  ctx.fillRect(sbx, sby, sbw * hpPct, sbh);
  ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 1;
  ctx.strokeRect(sbx, sby, sbw, sbh);
}
