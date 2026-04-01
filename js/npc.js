// ============================================================
// npc.js — NPC システム（生存者・医師・警備員）
// 部屋内を徘徊する市民、プレイヤーを支援する雇用 NPC を管理する
// ============================================================
//
// ─── 統合方法（他の作業完了後に以下を追加する）──────────────
//
// [HTML]  zombie_defense_v2.html — game.js の直前に追加:
//   <script src="js/npc.js"></script>
//
// [game.js]  startGame() のリセット部分に追加:
//   npcs = []; npcBullets = []; _npcSpawnTimer = 0;
//
// [game.js]  loop() の fireAuto(now) の直後に追加:
//   updateNPCs(now);
//
// [render.js]  draw() 内のゾンビ描画ブロックの直後に追加:
//   drawNPCs();
//
// [render.js]  ミニマップのプレイヤードット描画の直後に追加:
//   drawNPCMinimap(MX, MY, sx, sy);
//
// [shop.js]  ショップアイテムに追加（任意）:
//   { name:'医師を雇う',   cost:80,  action:() => hireNPC(NPC_TYPES.MEDIC)  }
//   { name:'警備員を雇う', cost:150, action:() => hireNPC(NPC_TYPES.GUARD)  }
//
// ─────────────────────────────────────────────────────────────

// ─── NPC 行動モード定数 [TASK-14a]
const NPC_MODE = {
  WANDER:       1, // 安全地帯でゆっくりウロウロ
  FLEE:         2, // ゾンビから逃げる（武器なし）
  DEFEND:       3, // その場で迎撃（武器あり・待機）
  ACTIVE:       4, // 自分からゾンビを攻撃
  FOLLOW:       5, // プレイヤーに追従
  FOLLOW_FIGHT: 6, // プレイヤーに追従 + 武器で攻撃
};

// ─── NPC コマンド定数 [TASK-14a]
const NPC_CMD = {
  FOLLOW:  'follow',
  STANDBY: 'standby',
};

// ─── NPC 種別定数 ─────────────────────────────────────────────
const NPC_TYPES = {
  SURVIVOR: 0, // 生存者: 自動スポーン。救助するとお金+スコア
  MEDIC:    1, // 医師:   雇用制。プレイヤーに追従しHPを継続回復
  GUARD:    2, // 警備員: 雇用制。開いた窓周辺を守り自動射撃
};

// ─── NPC マスターデータ ────────────────────────────────────────
const NPC_CONFIG = [
  // ── 生存者 ──────────────────────────────────────────────────
  {
    type:         NPC_TYPES.SURVIVOR,
    label:        '生存者',
    r:            9,
    hp:           100, // [TASK-14a]
    speed:        1.1,
    bodyColor:    '#c8a84b',
    headColor:    '#e8c87a',
    rescueMoney:  40,   // 救助時に獲得するマネー
    rescueScore:  30,   // 救助時に加算するスコア
    rescueRange:  30,   // 救助判定距離
    hireCost:     0,
  },
  // ── 医師 ────────────────────────────────────────────────────
  {
    type:         NPC_TYPES.MEDIC,
    label:        '医師',
    r:            9,
    hp:           100, // [TASK-14a]
    speed:        1.8,
    bodyColor:    '#2a7a4a',
    headColor:    '#5aba7a',
    healPerFrame: 0.012, // 毎フレームの回復量
    healRange:    55,    // 回復が届く距離
    hireCost:     80,
  },
  // ── 警備員 ──────────────────────────────────────────────────
  {
    type:         NPC_TYPES.GUARD,
    label:        '警備',
    r:            10,
    hp:           100, // [TASK-14a]
    speed:        1.4,
    bodyColor:    '#2a4a7a',
    headColor:    '#4a7aaa',
    fireRange:    140,  // 射程
    fireDmg:      12,   // 弾のダメージ
    fireRate:     700,  // 発射間隔 (ms)
    hireCost:     150,
  },
];

// ─── グローバル状態 ───────────────────────────────────────────
// (startGame でリセット必須 → 統合方法参照)
let npcs          = [];
let npcBullets    = [];
let _npcSpawnTimer = 0;

// ─── 部屋内のランダム座標を返す（内部用）────────────────────
function _npcRandPos() {
  const room = ROOMS[Math.floor(Math.random() * ROOMS.length)];
  return {
    x: room.x + 20 + Math.random() * Math.max(0, room.w - 40),
    y: room.y + 20 + Math.random() * Math.max(0, room.h - 40),
  };
}

// ─── NPC オブジェクトを生成する（内部用）────────────────────
function _makeNPC(type) {
  const cfg = NPC_CONFIG[type];
  const pos = _npcRandPos();
  return {
    type:         cfg.type,
    label:        cfg.label,
    r:            cfg.r,
    hp:           cfg.hp,
    maxHp:        cfg.hp,
    speed:        cfg.speed,
    bodyColor:    cfg.bodyColor,
    headColor:    cfg.headColor,
    hireCost:     cfg.hireCost,
    rescueMoney:  cfg.rescueMoney  || 0,
    rescueScore:  cfg.rescueScore  || 0,
    rescueRange:  cfg.rescueRange  || 0,
    healPerFrame: cfg.healPerFrame || 0,
    healRange:    cfg.healRange    || 0,
    fireRange:    cfg.fireRange    || 0,
    fireDmg:      cfg.fireDmg      || 0,
    fireRate:     cfg.fireRate     || 999999,
    x:            pos.x,
    y:            pos.y,
    vx:           0,
    vy:           0,
    wanderTimer:  0,
    nextFireTime: 0,
    dead:         false,
    anim:         Math.floor(Math.random() * 60),
    // [TASK-14a]
    weapon:      null,
    mode:        NPC_MODE.WANDER,
    command:     null,
    npcFireTime: 0,
  };
}

// ─── NPC 雇用（shop.js などから呼び出す）────────────────────
// 返り値: true=成功  false=失敗（お金不足 or 同タイプ雇用中）
function hireNPC(type) {
  if (!gameRunning) return false;
  const cfg = NPC_CONFIG[type];

  if (money < cfg.hireCost) {
    addFloat(player.x, player.y - 24, 'お金が足りない!', '#e24b4a');
    return false;
  }
  // 同タイプは同時に 1 体まで
  if (npcs.some(n => n.type === type && !n.dead)) {
    addFloat(player.x, player.y - 24, cfg.label + 'はすでに雇用中!', '#EF9F27');
    return false;
  }

  money -= cfg.hireCost;
  npcs.push(_makeNPC(type));
  addFloat(player.x, player.y - 24, cfg.label + 'を雇用した!', '#63c422');
  return true;
}

// ─── NPC 更新メイン（loop() の中で毎フレーム呼ぶ）──────────
function updateNPCs(now) {
  // 生存者の自動スポーン（同時 2 体まで）
  const maxSurvivors = 2;
  const activeSurvivors = npcs.filter(
    n => n.type === NPC_TYPES.SURVIVOR && !n.dead
  ).length;

  _npcSpawnTimer++;
  const spawnInterval = Math.max(300, 700 - wave * 20);
  if (_npcSpawnTimer >= spawnInterval && activeSurvivors < maxSurvivors) {
    _npcSpawnTimer = 0;
    npcs.push(_makeNPC(NPC_TYPES.SURVIVOR));
  }

  // 各 NPC の AI 更新
  npcs.forEach(npc => {
    if (npc.dead) return;
    npc.anim = (npc.anim + 1) % 62;

    // [TASK-14a] 型別AIを廃止し統一AIに変更。生存者の救助判定は維持
    if (npc.type === NPC_TYPES.SURVIVOR) {
      if (Math.hypot(npc.x - player.x, npc.y - player.y) < (npc.rescueRange || 30) + player.r) {
        money += npc.rescueMoney || 0;
        score += npc.rescueScore || 0;
        addFloat(npc.x, npc.y - 22, '救助! +$' + (npc.rescueMoney || 0), '#63c422');
        addParticle(npc.x, npc.y, '#c8a84b', 12);
        npc.dead = true;
        return;
      }
    }
    _updateNPCAI(npc, now); // [TASK-14a]

    // ゾンビに接触ダメージを受ける
    zombies.forEach(z => {
      if (Math.hypot(z.x - npc.x, z.y - npc.y) < z.r + npc.r) {
        npc.hp -= 0.18;
      }
    });

    // 死亡判定
    if (npc.hp <= 0 && !npc.dead) {
      npc.dead = true;
      addParticle(npc.x, npc.y, '#888', 8);
      const msg = npc.type === NPC_TYPES.SURVIVOR
        ? '生存者が倒れた...'
        : npc.label + 'が倒れた!';
      addFloat(npc.x, npc.y - 18, msg, '#e24b4a');
    }
  });

  // NPC 弾の移動・寿命管理
  npcBullets.forEach(b => { b.x += b.vx; b.y += b.vy; b.life--; });
  npcBullets = npcBullets.filter(
    b => b.life > 0
      && b.x > -20 && b.x < MAP_W + 20
      && b.y > -20 && b.y < MAP_H + 20
  );

  // NPC 弾とゾンビの当たり判定
  npcBullets.forEach(b => {
    if (b.hit) return;
    zombies.forEach(z => {
      if (z.dead || b.hit) return;
      if (Math.hypot(b.x - z.x, b.y - z.y) < z.r + 3) {
        b.hit  = true;
        b.life = 0;
        z.hp  -= b.dmg;
        addParticle(z.x, z.y, '#8b2020', 3);
        if (z.hp <= 0) {
          z.dead = true;
          const pts = Math.round((10 + wave * 2) * z.scoreMul);
          score += pts;
          kills++;
          const coinAmt = Math.floor((Math.random() * 8 + 4 + wave) * z.coinMul);
          const magR    = (upgrades.coinMag || 0) * 15 + 30;
          coins.push({ x: z.x, y: z.y, val: coinAmt, r: 7, magR });
          addFloat(z.x, z.y - 16, '$' + coinAmt, '#EF9F27');
          addParticle(z.x, z.y, '#4a4a4a', 8);
          playDeath();
        }
      }
    });
  });

  // 死亡した NPC を配列から除去
  npcs = npcs.filter(n => !n.dead);
}

// ─── NPC 統一AI ────────────────────────────────────────────────── [TASK-14a]
function _updateNPCAI(npc, now) {
  let nearestZ = null, nearestZDist = Infinity;
  zombies.forEach(z => {
    const d = Math.hypot(z.x - npc.x, z.y - npc.y);
    if (d < nearestZDist) { nearestZDist = d; nearestZ = z; }
  });

  // 行動モード決定
  if (npc.command === NPC_CMD.FOLLOW) {
    npc.mode = npc.weapon ? NPC_MODE.FOLLOW_FIGHT : NPC_MODE.FOLLOW;
  } else if (npc.command === NPC_CMD.STANDBY) {
    npc.mode = npc.weapon ? NPC_MODE.DEFEND : NPC_MODE.WANDER;
  } else {
    if (!npc.weapon) {
      npc.mode = nearestZDist < 150 ? NPC_MODE.FLEE : NPC_MODE.WANDER;
    } else {
      npc.mode = nearestZDist < 200 ? NPC_MODE.ACTIVE : NPC_MODE.WANDER;
    }
  }

  switch (npc.mode) {
    case NPC_MODE.WANDER: {
      npc.wanderTimer--;
      if (npc.wanderTimer <= 0) {
        npc.wanderTimer = 90 + Math.floor(Math.random() * 120);
        if (Math.random() < 0.25) { npc.vx = 0; npc.vy = 0; }
        else {
          const ang = Math.random() * Math.PI * 2;
          npc.vx = Math.cos(ang) * npc.speed * 0.45;
          npc.vy = Math.sin(ang) * npc.speed * 0.45;
        }
      }
      break;
    }
    case NPC_MODE.FLEE: {
      if (nearestZ) {
        const awayAng = Math.atan2(npc.y - nearestZ.y, npc.x - nearestZ.x);
        const toPlayerAng = Math.atan2(player.y - npc.y, player.x - npc.x);
        const blend = Math.min(1, nearestZDist / 150);
        const ang = awayAng * (1 - blend) + toPlayerAng * blend;
        npc.vx = Math.cos(ang) * npc.speed;
        npc.vy = Math.sin(ang) * npc.speed;
      }
      break;
    }
    case NPC_MODE.DEFEND: {
      npc.vx *= 0.85; npc.vy *= 0.85;
      _npcFire(npc, nearestZ, now);
      break;
    }
    case NPC_MODE.ACTIVE: {
      if (nearestZ) {
        const fireR = _getNPCFireRange(npc);
        if (nearestZDist > fireR * 0.70) {
          const ang = Math.atan2(nearestZ.y - npc.y, nearestZ.x - npc.x);
          npc.vx = Math.cos(ang) * npc.speed;
          npc.vy = Math.sin(ang) * npc.speed;
        } else { npc.vx *= 0.82; npc.vy *= 0.82; }
        _npcFire(npc, nearestZ, now);
      }
      break;
    }
    case NPC_MODE.FOLLOW: {
      const dp = Math.hypot(player.x - npc.x, player.y - npc.y);
      if (dp > 48) {
        const ang = Math.atan2(player.y - npc.y, player.x - npc.x);
        npc.vx = Math.cos(ang) * npc.speed; npc.vy = Math.sin(ang) * npc.speed;
      } else { npc.vx *= 0.75; npc.vy *= 0.75; }
      break;
    }
    case NPC_MODE.FOLLOW_FIGHT: {
      const dp2 = Math.hypot(player.x - npc.x, player.y - npc.y);
      if (dp2 > 48) {
        const ang = Math.atan2(player.y - npc.y, player.x - npc.x);
        npc.vx = Math.cos(ang) * npc.speed; npc.vy = Math.sin(ang) * npc.speed;
      } else { npc.vx *= 0.75; npc.vy *= 0.75; }
      _npcFire(npc, nearestZ, now);
      break;
    }
  }

  npc.x += npc.vx; npc.y += npc.vy;
  npc.x = Math.max(npc.r, Math.min(MAP_W - npc.r, npc.x));
  npc.y = Math.max(npc.r, Math.min(MAP_H - npc.r, npc.y));
  resolveWalls(npc);
}

// ─── NPC 射程取得 ─────────────────────────────────────────────── [TASK-14a]
function _getNPCFireRange(npc) {
  if (!npc.weapon) return 0;
  if (npc.weapon.type === 'gun') {
    const wp = WEAPONS[npc.weapon.weaponIdx];
    return wp ? (wp.range + (wp.upgRange || 0) * 20) : 120;
  }
  if (npc.weapon.type === 'melee') {
    const mw = MELEE_WEAPONS[npc.weapon.meleeIdx];
    return mw ? mw.range : 40;
  }
  return 120;
}

// ─── NPC 射撃・近接 ──────────────────────────────────────────── [TASK-14a]
function _npcFire(npc, targetZ, now) {
  if (!npc.weapon || !targetZ) return;
  const dist = Math.hypot(targetZ.x - npc.x, targetZ.y - npc.y);
  const fireR = _getNPCFireRange(npc);
  if (dist > fireR) return;

  if (npc.weapon.type === 'gun') {
    const wp = WEAPONS[npc.weapon.weaponIdx];
    if (!wp) return;
    const rate = Math.max(80, wp.fireRate - (wp.upgRate || 0) * 80);
    const dmg  = wp.damage + (wp.upgDmg || 0) * 8;
    if (now < npc.npcFireTime) return;
    npc.npcFireTime = now + rate;
    const baseAng = Math.atan2(targetZ.y - npc.y, targetZ.x - npc.x);
    for (let i = 0; i < wp.bullets; i++) {
      const ang = baseAng + (Math.random() - 0.5) * wp.spread * 1.5;
      npcBullets.push({
        x: npc.x, y: npc.y,
        vx: Math.cos(ang) * 7, vy: Math.sin(ang) * 7,
        dmg, life: Math.round(fireR / 7), color: wp.color, hit: false,
      });
    }
  } else if (npc.weapon.type === 'melee') {
    const mw = MELEE_WEAPONS[npc.weapon.meleeIdx];
    if (!mw || now < npc.npcFireTime) return;
    npc.npcFireTime = now + mw.cooldown;
    zombies.forEach(z => {
      if (Math.hypot(z.x - npc.x, z.y - npc.y) > mw.range) return;
      z.hp -= mw.damage;
      addParticle(z.x, z.y, '#cc3311', 5);
      if (z.hp <= 0) zombieDie(z);
    });
  }
}

// ─── 近くの NPC に武器を渡す ──────────────────────────────────── [TASK-14a]
function giveWeaponToNPC() {
  if (!gameRunning) return;
  const target = npcs.find(n => !n.dead && Math.hypot(n.x - player.x, n.y - player.y) < 52);
  if (!target) { addFloat(player.x, player.y - 24, 'NPCが近くにいない', '#e24b4a'); return; }

  // 非アクティブスロット優先
  const nonActive = activeSlot === 0 ? 1 : 0;
  let srcSlot = -1;
  if (itemSlots[nonActive] && itemSlots[nonActive].type) srcSlot = nonActive;
  else if (itemSlots[activeSlot] && itemSlots[activeSlot].type) srcSlot = activeSlot;

  if (srcSlot === -1) { addFloat(player.x, player.y - 24, '渡せる武器がない', '#e24b4a'); return; }

  target.weapon = { ...itemSlots[srcSlot] };
  itemSlots[srcSlot] = null;
  updateItemHUD();
  addFloat(target.x, target.y - 22, target.label + 'に武器を渡した!', '#63c422');
}

// ─── 近くの NPC にコマンドを出す ──────────────────────────────── [TASK-14a]
function commandNPC(cmd) {
  if (!gameRunning) return;
  const target = npcs.find(n => !n.dead && Math.hypot(n.x - player.x, n.y - player.y) < 60);
  if (!target) { addFloat(player.x, player.y - 24, 'NPCが近くにいない', '#e24b4a'); return; }
  target.command = target.command === cmd ? null : cmd;
  const msg   = cmd === NPC_CMD.FOLLOW ? 'ついてきて!' : 'ここで待機!';
  const color = cmd === NPC_CMD.FOLLOW ? '#85B7EB' : '#EF9F27';
  addFloat(target.x, target.y - 22, msg, color);
}

// ─── 近くに NPC がいるか（UIボタン制御用） ───────────────────── [TASK-14a]
function isNearNPC() {
  if (!gameRunning) return false;
  return npcs.some(n => !n.dead && Math.hypot(n.x - player.x, n.y - player.y) < 60);
}

// ─── NPC 描画（ctx は -camX,-camY 変換済み状態で呼ぶ）────────
// render.js draw() のゾンビ描画ブロックの直後に drawNPCs() を追加する
function drawNPCs() {
  npcs.forEach(npc => {
    if (npc.dead) return;
    const bob = Math.sin(npc.anim * 0.18) * 1.4; // 歩行ボブアニメ

    // ── 体 ──
    ctx.fillStyle = npc.bodyColor;
    ctx.beginPath();
    ctx.arc(npc.x, npc.y + bob, npc.r, 0, Math.PI * 2);
    ctx.fill();

    // ── 頭 ──
    ctx.fillStyle = npc.headColor;
    ctx.beginPath();
    ctx.arc(npc.x, npc.y - npc.r * 0.48 + bob, npc.r * 0.58, 0, Math.PI * 2);
    ctx.fill();

    // ── 医師: 十字マーク ──
    if (npc.type === NPC_TYPES.MEDIC) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth   = 2;
      ctx.beginPath();
      ctx.moveTo(npc.x - 4, npc.y + bob); ctx.lineTo(npc.x + 4, npc.y + bob);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(npc.x, npc.y - 4 + bob); ctx.lineTo(npc.x, npc.y + 4 + bob);
      ctx.stroke();
    }

    // ── 警備員: バッジ（★）──
    if (npc.type === NPC_TYPES.GUARD) {
      ctx.fillStyle = '#EF9F27';
      ctx.font      = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★', npc.x, npc.y + 3.5 + bob);
    }

    // ── ラベル ──
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font      = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(npc.label, npc.x, npc.y - npc.r - 5 + bob);

    // ── 武器所持アイコン [TASK-14c] ──
    if (npc.weapon) {
      const icon = npc.weapon.type === 'melee' ? '⚔' : '🔫';
      ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#EF9F27';
      ctx.fillText(icon, npc.x + npc.r + 4, npc.y - npc.r - 5 + bob);
    }

    // ── コマンド状態アイコン [TASK-14c] ──
    if (npc.command === 'follow') {
      ctx.fillStyle = '#85B7EB'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('▶', npc.x, npc.y + npc.r + 8 + bob);
    } else if (npc.command === 'standby') {
      ctx.fillStyle = '#EF9F27'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('■', npc.x, npc.y + npc.r + 8 + bob);
    }

    // ── HP バー ──
    const hpPct = Math.max(0, npc.hp / npc.maxHp);
    ctx.fillStyle = '#111';
    ctx.fillRect(npc.x - npc.r, npc.y - npc.r - 9, npc.r * 2, 3);
    ctx.fillStyle = hpPct > 0.5 ? '#63c422' : '#e24b4a';
    ctx.fillRect(npc.x - npc.r, npc.y - npc.r - 9, npc.r * 2 * hpPct, 3);

    // ── 生存者: 救助範囲を点滅インジケータで表示 ──
    if (npc.type === NPC_TYPES.SURVIVOR) {
      const pulse = (Math.sin(npc.anim * 0.15) + 1) * 0.5;
      ctx.strokeStyle = `rgba(200,168,75,${pulse * 0.45})`;
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, npc.rescueRange + player.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── 医師: 回復範囲（薄い円）──
    if (npc.type === NPC_TYPES.MEDIC) {
      ctx.strokeStyle = 'rgba(90,186,122,0.15)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, npc.healRange, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ── 警備員: 射程円（薄い円）──
    if (npc.type === NPC_TYPES.GUARD) {
      ctx.strokeStyle = 'rgba(133,183,235,0.10)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.arc(npc.x, npc.y, npc.fireRange, 0, Math.PI * 2);
      ctx.stroke();
    }
  });

  // NPC が撃った弾
  npcBullets.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ─── ミニマップ用 NPC 描画 ─────────────────────────────────────
// render.js のミニマップブロック末尾（プレイヤードットの後）に追加:
//   drawNPCMinimap(MX, MY, sx, sy);
function drawNPCMinimap(MX, MY, sx, sy) {
  npcs.forEach(npc => {
    if (npc.dead) return;
    ctx.fillStyle = npc.type === NPC_TYPES.SURVIVOR ? '#c8a84b'
                  : npc.type === NPC_TYPES.MEDIC    ? '#5aba7a'
                  :                                   '#4a7aaa';
    ctx.beginPath();
    ctx.arc(MX + npc.x * sx, MY + npc.y * sy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
}
