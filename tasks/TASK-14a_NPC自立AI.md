# TASK-14a — NPC自立AI（npc.js 全面刷新）

## 概要

既存の NPC の型別AI（_updateSurvivor / _updateMedic / _updateGuard）を廃止し、
**武器所持・コマンド状態に応じた6段階行動パターン**の統一AIに置き換える。
武器渡し・コマンド関数も追加する。

---

## 変更対象ファイル

- `js/npc.js` のみ

---

## 変更しないもの

- `js/game.js`（TASK-14b で対応）
- `js/render.js`（TASK-14c で対応）
- HTML / CSS（TASK-14c で対応）

---

## ① 定数追加（ファイル先頭ブロックに追記）

```javascript
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
```

---

## ② NPC_CONFIG の hp を 100 に統一

全 3 種別（SURVIVOR / MEDIC / GUARD）の `hp:` を **100** に変更する。

---

## ③ `_makeNPC` にフィールド追加

既存フィールドの末尾に追加する：

```javascript
    // [TASK-14a]
    weapon:      null,
    mode:        NPC_MODE.WANDER,
    command:     null,
    npcFireTime: 0,
```

---

## ④ `updateNPCs` の型別 switch を置き換え

**変更前：**
```javascript
    switch (npc.type) {
      case NPC_TYPES.SURVIVOR: _updateSurvivor(npc, now); break;
      case NPC_TYPES.MEDIC:    _updateMedic(npc, now);    break;
      case NPC_TYPES.GUARD:    _updateGuard(npc, now);    break;
    }
```

**変更後：**
```javascript
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
```

---

## ⑤ 古いAI関数を削除

以下の関数を**丸ごと削除**する：
- `_updateSurvivor`
- `_updateMedic`
- `_updateGuard`

---

## ⑥ 新規関数を追加（`drawNPCs` の直前に挿入）

```javascript
// ─── NPC 統一AI ────────────────────────────────────────────── [TASK-14a]
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
```

---

## チェックリスト（完了時に報告）

- [ ] `NPC_MODE` / `NPC_CMD` 定数を追加した
- [ ] 全 NPC の hp を 100 に変更した
- [ ] `_makeNPC` に `weapon`, `mode`, `command`, `npcFireTime` を追加した
- [ ] `updateNPCs` の switch を `_updateNPCAI` 呼び出しに変更した
- [ ] `_updateSurvivor` / `_updateMedic` / `_updateGuard` を削除した
- [ ] `_updateNPCAI`（6モード）を追加した
- [ ] `_getNPCFireRange` / `_npcFire` を追加した
- [ ] `giveWeaponToNPC` / `commandNPC` / `isNearNPC` を追加した
- [ ] 指示にない箇所を変更していないことを確認した
