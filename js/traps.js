// ============================================================
// traps.js — 設置型トラップシステム
// プレイヤーが足元にベアトラップを設置。踏んだゾンビを60ダメージ+スロー
// ============================================================
//
// ─── 統合方法（他の作業完了後に以下を追加する）──────────────
//
// [HTML]  zombie_defense_v2.html — boss.js の直前に追加:
//   <script src="js/traps.js"></script>
//
// [game.js]  startGame() のリセット部分に追加:
//   traps = [];
//
// [game.js]  loop() のゾンビ移動ブロック（zombies.forEach(z => {...}) の直後に追加:
//   updateTraps();
//
// [render.js]  draw() の ctx.restore() の直前に追加（drawBoss() より前推奨）:
//   drawTraps();
//
// ※ キー 'F' とUIボタンはこのファイル内で自動登録される
//
// ─────────────────────────────────────────────────────────────

// ─── トラップ設定定数 ─────────────────────────────────────────
const TRAP_CFG = {
  cost:         30,    // 設置コスト
  maxCount:     5,     // 同時設置最大数
  triggerR:     14,    // 発動半径
  damage:       60,    // 即時ダメージ
  slowMul:      0.18,  // スロー中の速度倍率
  slowDuration: 210,   // スロー継続フレーム（約3.5秒）
  r:            9,     // 描画半径
};

// ─── グローバル状態 ───────────────────────────────────────────
let traps = [];        // { x, y, state:'set'|'sprung', animTimer }

// ─── トラップ設置 ─────────────────────────────────────────────
function placeTrap() {
  if (!gameRunning)                           return;
  if (money < TRAP_CFG.cost)                 { addFloat(player.x, player.y - 22, 'お金が足りない', '#e24b4a'); return; }
  if (traps.filter(t => t.state === 'set').length >= TRAP_CFG.maxCount) {
    addFloat(player.x, player.y - 22, `トラップは最大${TRAP_CFG.maxCount}個`, '#888');
    return;
  }

  money -= TRAP_CFG.cost;
  traps.push({ x: player.x, y: player.y, state: 'set', animTimer: 0 });
  addParticle(player.x, player.y, '#a0784a', 6);
  addFloat(player.x, player.y - 20, 'トラップ設置', '#c8a060');
}

// ─── トラップ更新（毎フレーム呼ぶ）──────────────────────────
function updateTraps() {
  if (!gameRunning) return;

  // ── スロー効果のカウントダウン（全ゾンビ対象）──
  zombies.forEach(z => {
    if (z.slowTimer > 0) {
      z.slowTimer--;
      if (z.slowTimer === 0) {
        z.speed = z._baseSpeed;   // 速度復元
      }
    }
  });

  // ── ボスのスロー管理 ──
  if (typeof bossZombie !== 'undefined' && bossZombie && bossZombie.slowTimer > 0) {
    bossZombie.slowTimer--;
    if (bossZombie.slowTimer === 0) {
      bossZombie.speed = bossZombie._baseSpeed;
    }
  }

  // ── 各トラップの処理 ──
  traps.forEach(trap => {
    trap.animTimer++;

    if (trap.state !== 'set') return;

    // 通常ゾンビとの衝突
    zombies.forEach(z => {
      if (Math.hypot(z.x - trap.x, z.y - trap.y) < TRAP_CFG.triggerR + z.r) {
        _triggerTrap(trap, z.x, z.y);
        _applyTrapEffect(z);
      }
    });

    // ボスとの衝突
    if (typeof bossZombie !== 'undefined' && bossZombie && trap.state === 'set') {
      const b = bossZombie;
      if (Math.hypot(b.x - trap.x, b.y - trap.y) < TRAP_CFG.triggerR + b.r) {
        _triggerTrap(trap, b.x, b.y);
        _applyTrapEffect(b);
      }
    }
  });

  // 発動済みトラップのアニメが終わったら削除（60フレーム後）
  traps = traps.filter(t => !(t.state === 'sprung' && t.animTimer > 60));
}

// ─── トラップ発動 ─────────────────────────────────────────────
function _triggerTrap(trap, zx, zy) {
  trap.state     = 'sprung';
  trap.animTimer = 0;
  addParticle(trap.x, trap.y, '#c8a060', 10);
  addParticle(trap.x, trap.y, '#8b2020', 6);
  addFloat(trap.x, trap.y - 16, `トラップ! -${TRAP_CFG.damage}`, '#c8a060');
}

// ─── トラップ効果（ダメージ＋スロー）を対象に適用 ─────────────
function _applyTrapEffect(entity) {
  // ダメージ
  entity.hp -= TRAP_CFG.damage;

  // スロー（既にスロー中なら時間リセット）
  if (entity.slowTimer > 0) {
    entity.slowTimer = TRAP_CFG.slowDuration;
  } else {
    entity._baseSpeed  = entity.speed;
    entity.speed       = entity._baseSpeed * TRAP_CFG.slowMul;
    entity.slowTimer   = TRAP_CFG.slowDuration;
  }

  // ゾンビなら死亡チェック
  if (entity.hp <= 0 && typeof entity.scoreMul !== 'undefined') {
    entity.dead = true;
    const pts = Math.round((10 + wave * 2) * (entity.scoreMul || 1));
    score += pts; kills++;
    const coinAmt = Math.floor((Math.random() * 8 + 4 + wave) * (entity.coinMul || 1));
    const magR = upgrades.coinMag * 15 + 30;
    coins.push({ x: entity.x, y: entity.y, val: coinAmt, r: 7, magR });
    addFloat(entity.x, entity.y - 16, '$' + coinAmt, '#EF9F27');
    addParticle(entity.x, entity.y, '#4a4a4a', 8);
    if (typeof playDeath === 'function') playDeath();
  }
}

// ─── トラップ描画（ctx は -camX,-camY 変換済み状態で呼ぶ）────
function drawTraps() {
  traps.forEach(trap => {
    const sp = trap.state === 'sprung';
    const a  = sp ? Math.max(0, 1 - trap.animTimer / 60) : 1;

    ctx.globalAlpha = a;

    if (sp) {
      // 発動済み：赤い放射パーティクル風の爆発残像
      ctx.strokeStyle = '#c8a060';
      ctx.lineWidth   = 1.5;
      const prog = trap.animTimer / 60;
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const r1  = TRAP_CFG.r * 0.5;
        const r2  = TRAP_CFG.r * (1 + prog * 1.4);
        ctx.beginPath();
        ctx.moveTo(trap.x + Math.cos(ang) * r1, trap.y + Math.sin(ang) * r1);
        ctx.lineTo(trap.x + Math.cos(ang) * r2, trap.y + Math.sin(ang) * r2);
        ctx.stroke();
      }
    } else {
      // 未発動：ベアトラップ形状
      const bob = Math.sin(trap.animTimer * 0.05) * 0.8;   // 微細な浮遊

      // 外枠の光輪
      ctx.fillStyle = 'rgba(200,160,96,0.15)';
      ctx.beginPath();
      ctx.arc(trap.x, trap.y + bob, TRAP_CFG.r + 4, 0, Math.PI * 2);
      ctx.fill();

      // ベアトラップ本体（歯型のクロス）
      ctx.strokeStyle = '#c8a060';
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = 'round';

      // 上下の顎（V字2本）
      const r = TRAP_CFG.r;
      const y = trap.y + bob;

      // 外側の歯（上顎）
      ctx.beginPath();
      ctx.moveTo(trap.x - r * 0.9, y - r * 0.3);
      ctx.lineTo(trap.x,           y - r * 0.9);
      ctx.lineTo(trap.x + r * 0.9, y - r * 0.3);
      ctx.stroke();

      // 外側の歯（下顎）
      ctx.beginPath();
      ctx.moveTo(trap.x - r * 0.9, y + r * 0.3);
      ctx.lineTo(trap.x,           y + r * 0.9);
      ctx.lineTo(trap.x + r * 0.9, y + r * 0.3);
      ctx.stroke();

      // 中央のバネ部（×印）
      ctx.strokeStyle = '#8b6030';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(trap.x - r * 0.4, y - r * 0.4);
      ctx.lineTo(trap.x + r * 0.4, y + r * 0.4);
      ctx.moveTo(trap.x + r * 0.4, y - r * 0.4);
      ctx.lineTo(trap.x - r * 0.4, y + r * 0.4);
      ctx.stroke();

      // 中央の丸
      ctx.fillStyle = '#c8a060';
      ctx.beginPath();
      ctx.arc(trap.x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineCap = 'butt';
    }

    ctx.globalAlpha = 1;
  });

  // ── スクリーン固定：トラップ残数表示 ──
  const setCount = traps.filter(t => t.state === 'set').length;
  const bx = camX + 6;
  const by = camY + VH - 28;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(bx, by, 90, 22);

  ctx.fillStyle = money >= TRAP_CFG.cost ? '#c8a060' : '#666';
  ctx.font      = '9px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`[F] トラップ $${TRAP_CFG.cost}`, bx + 4, by + 9);

  // 設置数インジケーター（●で表示）
  for (let i = 0; i < TRAP_CFG.maxCount; i++) {
    ctx.fillStyle = i < setCount ? '#c8a060' : '#333';
    ctx.beginPath();
    ctx.arc(bx + 8 + i * 14, by + 17, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── キーボード入力（F キーでトラップ設置）───────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'f' || e.key === 'F') placeTrap();
});

// ─── モバイル用ボタンを動的生成（#action-bar に追加）─────────
(function addTrapButton() {
  const bar = document.getElementById('action-bar');
  if (!bar) return;
  const btn = document.createElement('div');
  btn.id        = 'trapBtn';
  btn.className = 'abtn';
  btn.style.cssText = 'border-color:#c8a060;color:#c8a060;';
  btn.innerHTML = `トラップ<br><span style="font-size:9px">$${TRAP_CFG.cost} / [F]</span>`;
  btn.addEventListener('click', placeTrap);
  bar.appendChild(btn);
})();
