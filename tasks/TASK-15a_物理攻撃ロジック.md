# TASK-15a — 物理攻撃システム（items.js）

## 概要

- `doMeleeAuto` の共通ロジックを `_executeMeleeAttack` に切り出す
- 物理攻撃ボタン発動関数 `doPhysicalAttack()` を追加する
- 物理攻撃中は自動迎撃（近接・射撃）を一時中断する
- 素手殴打（武器なし）対応を追加する

---

## 変更対象ファイル

- `js/items.js` のみ

---

## ① 変数を先頭付近に追加

`let lastDoorActionTime = 0;` の直後に追記：

```javascript
// [TASK-15a] 物理攻撃中断管理
const MELEE_INTERRUPT_DURATION = 500; // ms — 物理攻撃後に自動迎撃を中断する時間
let meleeInterruptEndTime = 0;        // この時刻まで自動迎撃を中断
```

---

## ② `getAnyMelee` 関数を追加

`getActiveMelee` の直後に追加：

```javascript
// ─── どちらかのスロットにある近接武器を返す（物理攻撃ボタン用） [TASK-15a]
function getAnyMelee() {
  for (let i = 0; i < itemSlots.length; i++) {
    const s = itemSlots[i];
    if (s && s.type === 'melee') return MELEE_WEAPONS[s.meleeIdx];
  }
  return null; // 近接武器なし → 素手
}
```

---

## ③ `doMeleeAuto` を書き換え

**変更前（既存）：**
```javascript
function doMeleeAuto(now) {
  const mw = getActiveMelee();
  if (!mw || now < nextMeleeTime || !zombies.length) return;

  let nearest = null, nd = Infinity;
  zombies.forEach(z => {
    const d = Math.hypot(z.x - player.x, z.y - player.y);
    if (d < mw.range && d < nd) { nd = d; nearest = z; }
  });
  if (!nearest) return;

  nextMeleeTime = now + mw.cooldown;
  const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);

  // 扇形の範囲内ゾンビ全員にダメージ
  zombies.forEach(z => {
    const d = Math.hypot(z.x - player.x, z.y - player.y);
    if (d > mw.range) return;
    let diff = Math.atan2(z.y - player.y, z.x - player.x) - baseAngle;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > mw.arc / 2) return;

    z.hp -= mw.damage;
    addParticle(z.x, z.y, '#cc3311', 6);
    if (z.hp <= 0) zombieDie(z);
  });

  // スイングアニメーション
  meleeAnim = {
    x: player.x, y: player.y,
    angle: baseAngle, range: mw.range, arc: mw.arc,
    timer: 12, maxTimer: 12, color: mw.color,
  };
}
```

**変更後（完全置き換え）：**
```javascript
// ─── 近接攻撃共通実行（doMeleeAuto / doPhysicalAttack 共用）─── [TASK-15a]
function _executeMeleeAttack(damage, range, arc, color) {
  if (!zombies.length) return;
  let nearest = null, nd = Infinity;
  zombies.forEach(z => {
    const d = Math.hypot(z.x - player.x, z.y - player.y);
    if (d < range && d < nd) { nd = d; nearest = z; }
  });
  if (!nearest) return;

  const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  zombies.forEach(z => {
    const d = Math.hypot(z.x - player.x, z.y - player.y);
    if (d > range) return;
    let diff = Math.atan2(z.y - player.y, z.x - player.x) - baseAngle;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > arc / 2) return;
    z.hp -= damage;
    addParticle(z.x, z.y, '#cc3311', 6);
    if (z.hp <= 0) zombieDie(z);
  });
  meleeAnim = { x: player.x, y: player.y, angle: baseAngle, range, arc, timer: 12, maxTimer: 12, color };
}

// ─── 自動近接攻撃（アクティブスロットが近接武器の時） ─────────── [TASK-15a]
function doMeleeAuto(now) {
  if (now < meleeInterruptEndTime) return; // 物理攻撃中断中はスキップ
  const mw = getActiveMelee();
  if (!mw || now < nextMeleeTime) return;
  nextMeleeTime = now + mw.cooldown;
  _executeMeleeAttack(mw.damage, mw.range, mw.arc, mw.color);
}

// ─── 物理攻撃（ボタン発動）────────────────────────────────────── [TASK-15a]
// 武器なし → 素手殴打 / 近接武器所持 → 武器攻撃（1.3倍ダメージ）
function doPhysicalAttack() {
  if (!gameRunning) return;
  const now = performance.now();
  if (now < nextMeleeTime) return; // クールダウン中

  // 自動迎撃を一時中断
  meleeInterruptEndTime = now + MELEE_INTERRUPT_DURATION;

  const mw = getAnyMelee();
  if (mw) {
    // 近接武器あり: 1.3倍強化攻撃
    nextMeleeTime = now + mw.cooldown;
    _executeMeleeAttack(Math.round(mw.damage * 1.3), mw.range, mw.arc, mw.color);
    addFloat(player.x, player.y - 28, mw.name + '!', mw.color);
  } else {
    // 素手殴打: 範囲狭い・ダメージそこそこ
    nextMeleeTime = now + 600;
    _executeMeleeAttack(30, 35, Math.PI * 0.9, '#ffaa44');
    addFloat(player.x, player.y - 28, '素手!', '#ffaa44');
  }
}
```

---

## チェックリスト（完了時に報告）

- [ ] `MELEE_INTERRUPT_DURATION` / `meleeInterruptEndTime` を追加した
- [ ] `getAnyMelee()` を追加した
- [ ] 既存の `doMeleeAuto` を削除し `_executeMeleeAttack` + 新 `doMeleeAuto` に置き換えた
- [ ] `doMeleeAuto` に `meleeInterruptEndTime` チェックを入れた
- [ ] `doPhysicalAttack()` を追加した（素手・近接武器両対応）
- [ ] 物理攻撃ボタン発動時にフロートテキストが出ることを確認した
- [ ] 指示にない箇所を変更していないことを確認した

---

## 注意

- 変更箇所に `// [TASK-15a]` コメントを必ず付ける
- `initItems()` 内の `meleeAnim = null; nextMeleeTime = 0;` はそのまま維持
- `fireAuto` は `entities.js` にあるため **触らない**（TASK-15b で対応）
