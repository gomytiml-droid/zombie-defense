# TASK-14b — ゾンビのターゲット変更（game.js）

## 概要

現在ゾンビは常に `player` だけを追う。
これを**プレイヤーと全NPCのうち最も近い存在**に向かって走るように変更する。

---

## 変更対象ファイル

- `js/game.js` のみ

---

## 変更しないもの

- 他 JS ファイル一切

---

## ① ヘルパー関数を追加

`game.js` の先頭付近（`let currentRepairCost` の直後など）に追加する：

```javascript
// ─── ゾンビの最近接ターゲット（player or NPC）を返す ─────────── [TASK-14b]
function _getNearestTarget(zx, zy) {
  let nearest = player;
  let nd = Math.hypot(player.x - zx, player.y - zy);
  if (typeof npcs !== 'undefined') {
    npcs.forEach(n => {
      if (n.dead) return;
      const d = Math.hypot(n.x - zx, n.y - zy);
      if (d < nd) { nd = d; nearest = n; }
    });
  }
  return nearest;
}
```

---

## ② ゾンビ移動ロジックのターゲット切り替え

`loop()` 内の「ゾンビ移動 + 衝突 + プレイヤー攻撃」ブロックを変更する。

対象は `player` への参照が3箇所ある部分（type 1 ジグザグ、type 0 直進）。

**変更前（type 1 ジグザグ）：**
```javascript
    } else if (z.type === 1) {
      // [TASK-03] type 1（速）: ジグザグ移動
      const ang = Math.atan2(player.y - z.y, player.x - z.x);
      z.angle = ang;
      const zigzag = Math.sin(Date.now() / 200 + z.seed) * 0.8;
      const perpX = -Math.sin(ang), perpY = Math.cos(ang);
      z.x += (Math.cos(ang) + perpX * zigzag) * z.speed;
      z.y += (Math.sin(ang) + perpY * zigzag) * z.speed;
    } else {
      // [TASK-03] type 0（通常）: プレイヤーに直進（従来通り）
      const ang = Math.atan2(player.y - z.y, player.x - z.x);
      z.angle = ang;
      z.x += Math.cos(ang) * z.speed; z.y += Math.sin(ang) * z.speed;
    }
```

**変更後（type 1 ジグザグ）：**
```javascript
    } else if (z.type === 1) {
      // [TASK-03] type 1（速）: ジグザグ移動 [TASK-14b] ターゲット最近接に変更
      const tgt1 = _getNearestTarget(z.x, z.y);
      const ang = Math.atan2(tgt1.y - z.y, tgt1.x - z.x);
      z.angle = ang;
      const zigzag = Math.sin(Date.now() / 200 + z.seed) * 0.8;
      const perpX = -Math.sin(ang), perpY = Math.cos(ang);
      z.x += (Math.cos(ang) + perpX * zigzag) * z.speed;
      z.y += (Math.sin(ang) + perpY * zigzag) * z.speed;
    } else {
      // [TASK-03] type 0（通常）直進 [TASK-14b] ターゲット最近接に変更
      const tgt0 = _getNearestTarget(z.x, z.y);
      const ang = Math.atan2(tgt0.y - z.y, tgt0.x - z.x);
      z.angle = ang;
      z.x += Math.cos(ang) * z.speed; z.y += Math.sin(ang) * z.speed;
    }
```

---

## ③ プレイヤー接触ダメージをターゲット接触に変更

**変更前：**
```javascript
    if (Math.hypot(z.x-player.x, z.y-player.y) < player.r + z.r) {
      const armor = upgrades.armor * 0.08;
      player.hp -= 0.25 * (1 - armor);
      playHurt();
      if (player.hp <= 0) { player.hp = 0; endGame(); }
    }
```

**変更後：**
```javascript
    // [TASK-14b] プレイヤー & NPC 両方に接触ダメージ
    if (Math.hypot(z.x-player.x, z.y-player.y) < player.r + z.r) {
      const armor = upgrades.armor * 0.08;
      player.hp -= 0.25 * (1 - armor);
      playHurt();
      if (player.hp <= 0) { player.hp = 0; endGame(); }
    }
    // NPC への接触ダメージは npc.js の updateNPCs 内で処理済みのため追加不要
```

※ NPC への接触ダメージは既存の `updateNPCs` 内の `zombies.forEach(z => { npc.hp -= 0.18; })` で処理されているため、この部分は変更不要。コメントを追加するのみ。

---

## チェックリスト（完了時に報告）

- [ ] `_getNearestTarget` ヘルパー関数を追加した
- [ ] type 1 ジグザグ移動のターゲットを `_getNearestTarget` に変更した
- [ ] type 0 直進のターゲットを `_getNearestTarget` に変更した
- [ ] type 2（重ゾンビ・窓狙い）は変更していないことを確認した
- [ ] プレイヤー接触ダメージのロジックは維持されていることを確認した
- [ ] 指示にない箇所を変更していないことを確認した
