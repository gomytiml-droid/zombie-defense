# TASK-13a — 鍵部屋トグルロジック（items.js / game.js）

## 概要

現在の「近づくと自動で永久解錠」を廃止し、
**鍵を持っているとき・近くで手動タップ → 開け閉めトグル（0.3秒クールダウン）**
に置き換える。ゾンビ・NPCも閉扉時は通れない（walls.js は変更不要）。

---

## 変更対象ファイル

- `js/items.js` ← メイン変更
- `js/game.js` ← 呼び出し変更のみ

---

## 変更しないもの

- `js/walls.js`（`!lockedRoomState[room.id]` で壁追加するロジックはそのまま有効）
- `js/render.js`（TASK-13b で対応）
- HTML / CSS（TASK-13b で対応）

---

## items.js の変更

### 1. ファイル先頭付近に変数追加

```javascript
// [TASK-13a] ドア操作クールダウン管理
let lastDoorActionTime = 0;
const DOOR_ACTION_COOLDOWN = 300; // ms (0.3秒)
```

### 2. `tryUnlockNearby` 関数を `tryToggleDoor` に完全置き換え

**削除する関数（既存）：**
```javascript
function tryUnlockNearby() {
  if (playerKeys <= 0) return;
  LOCKED_ROOMS.forEach(room => {
    if (lockedRoomState[room.id]) return;
    const d = room.door;
    const cx = d.x + d.w / 2, cy = d.y + d.h / 2;
    if (Math.hypot(cx - player.x, cy - player.y) < 52) {
      lockedRoomState[room.id] = true;
      playerKeys--;
      document.getElementById('hKey').textContent = playerKeys;
      addFloat(cx, cy - 20, room.label + ' 解錠!', '#EF9F27');
      _wallCache = null;
    }
  });
}
```

**追加する関数（新規）：**
```javascript
// ─── 鍵ドアを手動でトグル開閉（タップ操作） ──────────────────
// [TASK-13a]
function tryToggleDoor() {
  if (playerKeys <= 0) return;
  const now = performance.now();
  if (now - lastDoorActionTime < DOOR_ACTION_COOLDOWN) return;

  let acted = false;
  LOCKED_ROOMS.forEach(room => {
    if (acted) return;
    const d = room.door;
    const cx = d.x + d.w / 2, cy = d.y + d.h / 2;
    if (Math.hypot(cx - player.x, cy - player.y) < 52) {
      lockedRoomState[room.id] = !lockedRoomState[room.id];
      _wallCache = null;
      lastDoorActionTime = now;
      acted = true;
      const label = lockedRoomState[room.id]
        ? room.label + ' 解錠!'
        : room.label + ' 施錠';
      const color = lockedRoomState[room.id] ? '#EF9F27' : '#aaaaaa';
      addFloat(cx, cy - 20, label, color);
    }
  });
}

// ─── 近くにドアがあるか判定（UIボタンの active 制御用） ────────
// [TASK-13a]
function isNearDoor() {
  if (playerKeys <= 0) return false;
  return LOCKED_ROOMS.some(room => {
    const d = room.door;
    const cx = d.x + d.w / 2, cy = d.y + d.h / 2;
    return Math.hypot(cx - player.x, cy - player.y) < 52;
  });
}
```

---

## game.js の変更

ゲームループ内の `tryUnlockNearby()` を削除する（手動操作になるため不要）。

**変更前：**
```javascript
  // アイテム・鍵・解錠
  updateKeyPickups();
  updateFloorItemPickups();
  tryUnlockNearby();
```

**変更後：**
```javascript
  // アイテム・鍵 [TASK-13a] tryUnlockNearby 削除→手動トグルに変更
  updateKeyPickups();
  updateFloorItemPickups();
```

---

## チェックリスト（完了時に報告）

- [ ] `lastDoorActionTime` / `DOOR_ACTION_COOLDOWN` を items.js 先頭付近に追加した
- [ ] `tryUnlockNearby` を削除し、`tryToggleDoor` に置き換えた
- [ ] `isNearDoor` 関数を追加した
- [ ] `tryToggleDoor` が 1 タップで 1 ドアのみ操作する実装になっている
- [ ] `tryToggleDoor` がトグル動作になっている
- [ ] クールダウン 300ms が正しく動作している
- [ ] `_wallCache = null` をトグル時に必ず呼んでいる
- [ ] `game.js` から `tryUnlockNearby()` 呼び出しを削除した
- [ ] 指示にない箇所を変更していないことを確認した

---

## 注意

- 鍵は消費しない（持っているだけで操作可能）
- `walls.js` は変更しない
  - `lockedRoomState = false（閉）` → ドアが壁として追加 → 全キャラ通れない
  - `lockedRoomState = true（開）` → ドアが壁に追加されない → 全キャラ通れる
