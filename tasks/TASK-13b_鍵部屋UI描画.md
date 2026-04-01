# TASK-13b — 鍵部屋UI描画（render.js / HTML / CSS）

## 前提

**TASK-13a 完了後に実行すること。**

---

## 概要

- ドアが「開いている」状態の描画を追加（薄い枠のみ）
- 「閉じている」ドアの近接ヒントを「タップで開/閉」に変更
- `#action-bar` に「🔑ドア」ボタンを追加
- 毎フレームドアボタンの状態を更新

---

## 変更対象ファイル

- `js/render.js`
- `zombie_defense_v2.html`
- `zombie_defense_v2.css`

---

## render.js の変更

### 1. ドア描画ブロックを置き換え

**変更前：**
```javascript
  // 鍵付きドア（未解錠）
  LOCKED_ROOMS.forEach(room => {
    if (lockedRoomState[room.id]) return;
    const d = room.door;
    ctx.fillStyle = '#5a3a00';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = '#EF9F27'; ctx.lineWidth = 2;
    ctx.strokeRect(d.x, d.y, d.w, d.h);
    ctx.fillStyle = '#EF9F27'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('KEY', d.x + d.w/2, d.y + d.h/2 + 4);
    // 近接ヒント
    const cx = d.x + d.w/2, cy = d.y + d.h/2;
    if (playerKeys > 0 && Math.hypot(cx - player.x, cy - player.y) < 120) {
      ctx.fillStyle = 'rgba(239,159,39,0.18)';
      ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#EF9F27'; ctx.font = '9px sans-serif';
      ctx.fillText('近づくと解錠', cx, cy + d.h/2 + 14);
    }
  });
```

**変更後：**
```javascript
  // 鍵付きドア（開閉状態で描き分け） [TASK-13b]
  LOCKED_ROOMS.forEach(room => {
    const d = room.door;
    const cx = d.x + d.w / 2, cy = d.y + d.h / 2;
    const isOpen = lockedRoomState[room.id];
    const isHintRange = playerKeys > 0 && Math.hypot(cx - player.x, cy - player.y) < 120;

    if (isOpen) {
      // 開いている：薄い枠だけ
      ctx.strokeStyle = 'rgba(239,159,39,0.25)'; ctx.lineWidth = 1;
      ctx.strokeRect(d.x, d.y, d.w, d.h);
    } else {
      // 閉じている：茶色ブロック + KEY 表示
      ctx.fillStyle = '#5a3a00';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeStyle = '#EF9F27'; ctx.lineWidth = 2;
      ctx.strokeRect(d.x, d.y, d.w, d.h);
      ctx.fillStyle = '#EF9F27'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('KEY', cx, cy + 4);
    }

    // 近接ヒント
    if (isHintRange) {
      ctx.fillStyle = 'rgba(239,159,39,0.14)';
      ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#EF9F27'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(isOpen ? 'タップで施錠' : 'タップで解錠', cx, cy + d.h / 2 + 14);
    }
  });
```

### 2. ドアボタン状態更新を描画ループ末尾に追加

`draw()` 関数の末尾（`ctx.restore()` の直前）に追記：

```javascript
  // ドアボタン状態更新 [TASK-13b]
  const doorBtn = document.getElementById('doorBtn');
  if (doorBtn) {
    const near = typeof isNearDoor === 'function' && isNearDoor();
    doorBtn.classList.toggle('active', near);
  }
```

### 3. ミニマップのドア描画は変更不要（そのまま）

---

## HTML の変更

`#action-bar` に `doorBtn` を追加する。

**変更前：**
```html
<div id="action-bar">
  <div class="abtn" id="repairBtn">窓修理<br><span style="font-size:9px">窓に近づくと自動</span></div>
  <div class="abtn" onclick="openShop()" style="border-color:#EF9F27;color:#EF9F27;">ショップ<br><span style="font-size:9px">アップグレード</span></div>
</div>
```

**変更後：**
```html
<div id="action-bar">
  <div class="abtn" id="repairBtn">窓修理<br><span style="font-size:9px">窓に近づくと自動</span></div>
  <div class="abtn" id="doorBtn" onclick="tryToggleDoor()">🔑ドア<br><span style="font-size:9px">開 / 閉</span></div><!-- [TASK-13b] -->
  <div class="abtn" onclick="openShop()" style="border-color:#EF9F27;color:#EF9F27;">ショップ<br><span style="font-size:9px">アップグレード</span></div>
</div>
```

---

## CSS の変更

`.abtn` ルールの後に追記：

```css
/* [TASK-13b] ドアボタン: 非active時はグレーアウト */
#doorBtn:not(.active){opacity:0.4;pointer-events:none;}
```

---

## チェックリスト（完了時に報告）

- [ ] 開いているドアが薄い枠だけで描画されることを確認した
- [ ] 閉じているドアが茶色ブロック + KEY 表示されることを確認した
- [ ] 近接ヒント「タップで解錠/施錠」が出ることを確認した
- [ ] `draw()` 末尾に `doorBtn` の active 切り替えを追加した
- [ ] HTML の `#action-bar` に `id="doorBtn"` ボタンを追加した
- [ ] CSS に `#doorBtn:not(.active)` のグレーアウトスタイルを追加した
- [ ] 指示にない箇所を変更していないことを確認した
