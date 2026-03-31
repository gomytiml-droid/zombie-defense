// ============================================================
// items.js — アイテムボックス・パワーアップシステム
// 部屋内に定期スポーンするアイテムを取得して一時強化を得る
// ============================================================
//
// ─── 統合方法（他の作業完了後に以下を追加する）──────────────
//
// [HTML]  zombie_defense_v2.html — game.js の直前に追加:
//   <script src="js/items.js"></script>
//
// [game.js]  startGame() のリセット部分に追加:
//   itemBoxes = []; activePowerups = []; _itemSpawnTimer = 0;
//
// [game.js]  loop() の fireAuto(now) の直後に追加:
//   updateItems();
//
// [game.js]  loop() のプレイヤーダメージ処理（player.hp -= ...）を変更:
//   player.hp -= 0.25 * (1 - armor) * getPowerupDamageReduction();
//
// [entities.js]  fireAuto() の dmg 計算行を変更:
//   const dmg  = (wp.damage + wp.upgDmg * 8) * getPowerupDamageMul();
//
// [entities.js]  spd 計算（game.js の player移動部分）に追加:
//   const spd = (player.speed + upgrades.speed * 0.3 + getPowerupSpeedBonus())
//               * (moveX !== 0 && moveY !== 0 ? 0.707 : 1);
//
// [render.js]  draw() 内の ctx.restore() の直前に追加:
//   drawItems();
//
// ─────────────────────────────────────────────────────────────

// ─── アイテム種別マスター ─────────────────────────────────────
const ITEM_TYPES = [
  {
    id:       'health',
    label:    '回復キット',
    color:    '#e24b4a',
    icon:     '+',
    duration: 0,       // 0 = 即時効果
    effect:   () => {
      const heal = 40;
      player.hp = Math.min(player.maxHp, player.hp + heal);
      addFloat(player.x, player.y - 22, `HP +${heal}`, '#e24b4a');
    },
  },
  {
    id:       'speed_boost',
    label:    'スピードUP',
    color:    '#63c422',
    icon:     '▲',
    duration: 600,     // 約10秒 (60fps)
    effect:   () => { addFloat(player.x, player.y - 22, 'スピードUP!', '#63c422'); },
  },
  {
    id:       'damage_boost',
    label:    'ダメージUP',
    color:    '#EF9F27',
    icon:     '★',
    duration: 480,     // 約8秒
    effect:   () => { addFloat(player.x, player.y - 22, 'ダメージUP!', '#EF9F27'); },
  },
  {
    id:       'shield',
    label:    'シールド',
    color:    '#85B7EB',
    icon:     '◆',
    duration: 360,     // 約6秒
    effect:   () => { addFloat(player.x, player.y - 22, 'シールド発動!', '#85B7EB'); },
  },
];

// ─── グローバル状態 ───────────────────────────────────────────
// (startGame でリセット必須 → 統合方法参照)
let itemBoxes      = [];
let activePowerups = [];   // { id, remaining, duration }
let _itemSpawnTimer = 0;

const ITEM_SPAWN_INTERVAL = 900;  // ~15秒に1個スポーン (60fps)
const ITEM_MAX_COUNT      = 3;    // 同時出現最大数

// ─── アイテムボックスのスポーン ───────────────────────────────
function spawnItemBox() {
  if (itemBoxes.length >= ITEM_MAX_COUNT) return;

  // ランダムな部屋の内側にスポーン（端から20%内側に限定）
  const room = ROOMS[Math.floor(Math.random() * ROOMS.length)];
  const x    = room.x + room.w * 0.2 + Math.random() * room.w * 0.6;
  const y    = room.y + room.h * 0.2 + Math.random() * room.h * 0.6;

  // wave が高いほどアイテムの種類を重み付け（低waveは回復多め）
  let pool = [...ITEM_TYPES];
  if (wave <= 2) {
    // 低waveは回復を2倍の確率で出す
    pool = [...pool, ITEM_TYPES[0]];
  } else if (wave >= 6) {
    // 高waveはシールドを多く出す
    pool = [...pool, ITEM_TYPES[3]];
  }
  const type = pool[Math.floor(Math.random() * pool.length)];

  itemBoxes.push({
    x, y,
    r:    10,
    type,
    anim: Math.floor(Math.random() * 60), // 浮遊位相をずらす
    life: 1200,                            // ~20秒で消滅
  });
}

// ─── アイテムシステム更新（毎フレーム呼ぶ）──────────────────
function updateItems() {
  if (!gameRunning) return;

  // スポーンタイマー
  _itemSpawnTimer++;
  if (_itemSpawnTimer >= ITEM_SPAWN_INTERVAL) {
    _itemSpawnTimer = 0;
    spawnItemBox();
  }

  // ボックスの更新（プレイヤー接触 & 寿命管理）
  itemBoxes = itemBoxes.filter(box => {
    box.anim = (box.anim + 1) % 60;
    box.life--;
    if (box.life <= 0) return false;  // 寿命切れ

    const d = Math.hypot(box.x - player.x, box.y - player.y);
    if (d < player.r + box.r) {
      _applyItem(box.type);
      addParticle(box.x, box.y, box.type.color, 10);
      return false;  // 取得済み → 削除
    }
    return true;
  });

  // パワーアップのカウントダウン
  activePowerups.forEach(p => p.remaining--);
  const prevCount = activePowerups.length;
  activePowerups  = activePowerups.filter(p => p.remaining > 0);

  // 消えた瞬間にフロートテキスト
  if (activePowerups.length < prevCount) {
    addFloat(player.x, player.y - 26, 'バフ終了', '#888');
  }
}

// ─── アイテム効果適用（内部用）───────────────────────────────
function _applyItem(type) {
  if (type.duration > 0) {
    const existing = activePowerups.find(p => p.id === type.id);
    if (existing) {
      existing.remaining = type.duration;  // 再取得 → 時間リセット
    } else {
      activePowerups.push({
        id:        type.id,
        remaining: type.duration,
        duration:  type.duration,
      });
    }
  }
  type.effect();
}

// ─── パワーアップ効果クエリ（game.js / entities.js から参照）─
// 現在有効かどうかを返す
function isPowerupActive(id) {
  return activePowerups.some(p => p.id === id);
}

// damage_boost が有効なら 1.6倍のダメージ倍率を返す
function getPowerupDamageMul() {
  return isPowerupActive('damage_boost') ? 1.6 : 1.0;
}

// speed_boost が有効なら +1.5 の速度ボーナスを返す
function getPowerupSpeedBonus() {
  return isPowerupActive('speed_boost') ? 1.5 : 0;
}

// shield が有効なら被ダメージを 35% に軽減する係数を返す
function getPowerupDamageReduction() {
  return isPowerupActive('shield') ? 0.35 : 1.0;
}

// ─── アイテム描画（ctx は -camX,-camY 変換済み状態で呼ぶ）────
// render.js draw() の ctx.restore() 直前に drawItems() を追加する
function drawItems() {
  // ── アイテムボックス本体（ワールド空間）──
  itemBoxes.forEach(box => {
    const bob    = Math.sin(box.anim / 60 * Math.PI * 2) * 2.5;   // 浮遊オフセット
    const glowA  = 0.25 + Math.abs(Math.sin(box.anim / 60 * Math.PI * 2)) * 0.25;
    const fadeA  = box.life < 180 ? box.life / 180 : 1;           // 消滅前フェード
    const s      = box.r * 1.4;
    const cy     = box.y + bob;

    ctx.globalAlpha = glowA * fadeA;
    ctx.fillStyle   = box.type.color;
    ctx.beginPath();
    ctx.arc(box.x, cy, box.r + 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = fadeA;
    ctx.fillStyle   = '#1c1c1c';
    ctx.strokeStyle = box.type.color;
    ctx.lineWidth   = 2;
    ctx.fillRect(box.x - s, cy - s, s * 2, s * 2);
    ctx.strokeRect(box.x - s, cy - s, s * 2, s * 2);

    ctx.fillStyle  = box.type.color;
    ctx.font       = `bold ${Math.round(s * 1.1)}px sans-serif`;
    ctx.textAlign  = 'center';
    ctx.fillText(box.type.icon, box.x, cy + s * 0.38);

    // ラベル（ボックス下）
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font      = '8px sans-serif';
    ctx.fillText(box.type.label, box.x, cy + s + 10);

    ctx.globalAlpha = 1;
  });

  // ── アクティブパワーアップHUDバー（スクリーン固定）──
  // ctx が (-camX,-camY) 変換済みなので camX/camY を加算して画面座標に戻す
  if (activePowerups.length > 0) {
    const bw = 90, bh = 8, gap = 13;
    const totalH = activePowerups.length * (bh + gap);
    let barY = camY + (VH - totalH) / 2;  // 縦方向センタリング

    activePowerups.forEach(p => {
      const type = ITEM_TYPES.find(t => t.id === p.id);
      if (!type) return;

      const pct = p.remaining / p.duration;
      const bx  = camX + VW - bw - 10;   // 右端に固定

      // 背景
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(bx - 1, barY - 10, bw + 2, bh + 12);

      // ラベル
      ctx.fillStyle = type.color;
      ctx.font      = '7px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(type.label, bx, barY - 2);

      // バー背景
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(bx, barY, bw, bh);

      // バー本体（残り時間）
      ctx.fillStyle = type.color;
      ctx.fillRect(bx, barY, bw * pct, bh);

      // バーの点滅（残り60フレーム以下で警告）
      if (p.remaining < 60 && Math.floor(p.remaining / 8) % 2 === 0) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle   = '#fff';
        ctx.fillRect(bx, barY, bw * pct, bh);
        ctx.globalAlpha = 1;
      }

      ctx.strokeStyle = type.color;
      ctx.lineWidth   = 1;
      ctx.strokeRect(bx, barY, bw, bh);

      barY += bh + gap;
    });
  }
}
