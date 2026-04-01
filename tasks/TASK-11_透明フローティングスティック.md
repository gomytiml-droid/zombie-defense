# TASK-11 — 透明フローティングバーチャルスティック

## 概要

現在の固定位置スティック UI を廃止し、
**画面上のどこをタップしてもその地点が中心になる**完全透明スティックに置き換える。

---

## 変更対象ファイル

- `js/input.js`
- `zombie_defense_v2.css`
- `zombie_defense_v2.html`

---

## 仕様

| 項目 | 内容 |
|---|---|
| タッチエリア | `#canvas-wrap`（ゲームキャンバス全体） |
| 中心点 | touchstart した座標を originX/originY として記録 |
| 移動量算出 | dx = currentX - originX, dy = currentY - originY |
| 最大半径 | 60px（この距離でmoveX/Y が ±1.0） |
| 視覚表示 | **完全透明・一切表示なし** |
| 既存 UI | `#stick-pad`, `#stick-knob` は display:none に |
| キーボード | 既存の WASD/矢印キー操作はそのまま維持 |

---

## 実装ステップ

### 1. `zombie_defense_v2.html`

`#controls` 内の `#stick-pad` ブロックを削除し、ヒントテキストのみ残す。

**変更前：**
```html
<div id="controls">
  <div id="stick-pad"><div id="stick-knob"></div></div>
  <div style="font-size:10px;color:#444;text-align:right">
    移動: スティック / WASD<br>
    SWAP: Tab / Q<br>
    鍵: ゾンビが落とす
  </div>
</div>
```

**変更後：**
```html
<div id="controls">
  <div style="font-size:10px;color:#333;text-align:center;width:100%">
    画面をスライドして移動 / WASD
  </div>
</div>
```

---

### 2. `zombie_defense_v2.css`

`#stick-pad` と `#stick-knob` のスタイルを `display:none` に変更。

**変更前：**
```css
#stick-pad{width:76px;height:76px;border-radius:50%;border:1px solid #2a2a2a;background:#161616;position:relative;flex-shrink:0;touch-action:none;}
#stick-knob{width:32px;height:32px;border-radius:50%;background:#555;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transition:transform .05s;}
```

**変更後：**
```css
#stick-pad{display:none;}
#stick-knob{display:none;}
```

また `#controls` に `justify-content:center` を追加：
```css
#controls{display:flex;align-items:center;justify-content:center;padding:8px 16px;height:96px;}
```

---

### 3. `js/input.js`

既存のスティックロジックを**完全に置き換え**る。
`pad`/`knob` 変数・`updStick` 関数・`pad.addEventListener` を削除。
`#canvas-wrap` へのフローティングスティックロジックに差し替える。

**変更後のコード全体：**

```javascript
// ============================================================
// input.js — 入力管理（キーボード・フローティングタッチスティック）
// ============================================================

let moveX = 0, moveY = 0;

// フローティングスティック
const FLOAT_MAX_R = 60;   // px: この距離でmoveが±1.0
let stickId    = -1;
let originX    = 0;
let originY    = 0;

const canvasWrap = document.getElementById('canvas-wrap');

canvasWrap.addEventListener('touchstart', e => {
  e.preventDefault();
  if (stickId !== -1) return;           // 既に操作中なら無視
  const t = e.changedTouches[0];
  stickId = t.identifier;
  originX = t.clientX;
  originY = t.clientY;
  moveX = 0;
  moveY = 0;
}, { passive: false });

document.addEventListener('touchmove', e => {
  for (const t of e.changedTouches) {
    if (t.identifier !== stickId) continue;
    const dx = t.clientX - originX;
    const dy = t.clientY - originY;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) { moveX = 0; moveY = 0; continue; }
    const ratio = Math.min(dist, FLOAT_MAX_R) / FLOAT_MAX_R;
    moveX = (dx / dist) * ratio;
    moveY = (dy / dist) * ratio;
  }
}, { passive: true });

document.addEventListener('touchend', e => {
  for (const t of e.changedTouches) {
    if (t.identifier !== stickId) continue;
    stickId = -1;
    moveX = 0;
    moveY = 0;
  }
}, { passive: true });

document.addEventListener('touchcancel', e => {
  for (const t of e.changedTouches) {
    if (t.identifier !== stickId) continue;
    stickId = -1;
    moveX = 0;
    moveY = 0;
  }
}, { passive: true });

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'a') moveX = -1;
  if (e.key === 'ArrowRight' || e.key === 'd') moveX =  1;
  if (e.key === 'ArrowUp'    || e.key === 'w') moveY = -1;
  if (e.key === 'ArrowDown'  || e.key === 's') moveY =  1;
  if (e.key === 'Tab' || e.key === 'q' || e.key === 'Q') { e.preventDefault(); swapSlots(); }
  if (e.key === 'Escape') closeShop();
});

document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') moveX = 0;
  if (e.key === 'ArrowUp'    || e.key === 'w' || e.key === 'ArrowDown'  || e.key === 's') moveY = 0;
});

window.addEventListener('resize', () => { if (gameRunning) resize(); });
```

---

## チェックリスト（完了時に報告）

- [ ] `js/input.js` を上記コードに差し替えた
- [ ] `zombie_defense_v2.html` の `#stick-pad` ブロックを削除した
- [ ] `zombie_defense_v2.css` の `#stick-pad`, `#stick-knob` を `display:none` にした
- [ ] `#controls` の `justify-content` を `center` に変更した
- [ ] `pad` や `knob` への参照が残っていないことを確認した
- [ ] `touchcancel` ハンドラを追加した（指が画面外に出た場合の安全処理）
- [ ] キーボード操作（WASD/矢印）が維持されていることを確認した

---

## 注意事項

- `zombie_defense_v2.js`（モノリシック版）は**変更しない**（HTML は `js/` フォルダを参照）
- `#canvas-wrap` に `touch-action: none` が必要な場合は CSS に追加すること
- ショップパネル表示中はタッチが貫通しないことを確認（shop-panel が fixed overlay なので基本OK）
- 指示にない箇所は**絶対に変更しない**
