# TASK-08｜モバイルUI・操作感改善

## あなたへの指示

`zombie_defense_v2.js` と `zombie_defense_v2.css` を読み込んで、以下の変更を加えてください。
変更した箇所には必ずコメント `// [TASK-08]`（JS）または `/* [TASK-08] */`（CSS）を付けてください。
**それ以外の箇所は一切変更しないでください。**

---

## 変更内容（CSS: zombie_defense_v2.css）

### 1. スティックを大きく

```css
/* 変更前 */
#stick-pad{width:72px;height:72px;...}
#stick-knob{width:28px;height:28px;...}

/* 変更後 */
#stick-pad{width:88px;height:88px;border-radius:50%;border:1px solid #333;background:#161616;position:relative;flex-shrink:0;} /* [TASK-08] */
#stick-knob{width:34px;height:34px;border-radius:50%;background:#444;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transition:transform .05s;} /* [TASK-08] */
```

### 2. 武器ボタンのタップ領域を拡大

```css
/* 変更前 */
.wbtn{flex:1;padding:5px 2px;...}

/* 変更後 */
.wbtn{flex:1;padding:8px 2px;border-radius:5px;border:1px solid #333;background:#1a1a1a;font-size:10px;color:#888;cursor:pointer;text-align:center;transition:all .15s;min-height:44px;} /* [TASK-08] */
```

### 3. ゲームオーバーボタンを大きく

```css
/* 変更前 */
.ov-btn{padding:9px 24px;...font-size:14px;...}

/* 変更後 */
.ov-btn{padding:13px 32px;border-radius:6px;border:none;background:#e24b4a;color:#fff;font-size:16px;cursor:pointer;min-width:160px;} /* [TASK-08] */
```

---

## 変更内容（JS: zombie_defense_v2.js）

### 4. スティックにデッドゾーンを追加（`updStick()` 関数）

```js
// 変更前（末尾2行）
moveX=Math.cos(ang)*(Math.min(dist,maxR)/maxR);
moveY=Math.sin(ang)*(Math.min(dist,maxR)/maxR);

// 変更後
const rawMX=Math.cos(ang)*(Math.min(dist,maxR)/maxR); // [TASK-08]
const rawMY=Math.sin(ang)*(Math.min(dist,maxR)/maxR); // [TASK-08]
const dz=0.12; // [TASK-08] デッドゾーン
moveX=Math.abs(rawMX)<dz?0:rawMX; // [TASK-08]
moveY=Math.abs(rawMY)<dz?0:rawMY; // [TASK-08]
```

### 5. グローバル変数に手動エイム用変数を追加

`let moveX=0,moveY=0;` の直後に追加：

```js
let manualAimX=0,manualAimY=0,manualAimActive=false,manualAimTimer=0; // [TASK-08]
```

### 6. `startGame()` で手動エイム変数を初期化

`currentWeapon=0;repairing=false;...` の行に追記：

```js
manualAimActive=false;manualAimTimer=0; // [TASK-08]
```

### 7. キャンバスタップで手動エイム発動

`pad.addEventListener('touchstart',...` の直前に追加：

```js
// [TASK-08] キャンバスタップ → 手動エイム方向を記録
canvas.addEventListener('touchstart',e=>{
  if(!gameRunning)return;
  const t=e.changedTouches[0];
  const rect=canvas.getBoundingClientRect();
  manualAimX=(t.clientX-rect.left)/rect.width*VW+camX; // [TASK-08]
  manualAimY=(t.clientY-rect.top)/rect.height*VH+camY; // [TASK-08]
  manualAimActive=true;manualAimTimer=30;               // [TASK-08] 0.5秒有効
},{passive:true});
```

### 8. `loop()` でエイムタイマーを処理

`waveTimer++;` の直後に追加：

```js
if(manualAimTimer>0){manualAimTimer--;if(manualAimTimer<=0)manualAimActive=false;} // [TASK-08]
```

### 9. `fireAuto()` に手動エイム優先ロジックを追加

```js
// 変更前
if(!nearest)return;
const baseAngle=Math.atan2(nearest.y-player.y,nearest.x-player.x);

// 変更後
if(!nearest&&!manualAimActive)return; // [TASK-08]
const baseAngle=manualAimActive
  ? Math.atan2(manualAimY-player.y,manualAimX-player.x) // [TASK-08] 手動エイム優先
  : Math.atan2(nearest.y-player.y,nearest.x-player.x);
```

### 10. エイム方向をビジュアルで表示（`draw()` の「range circle」の直後に追加）

```js
// [TASK-08] 手動エイム方向インジケーター
if(manualAimActive){
  const ang=Math.atan2(manualAimY-player.y,manualAimX-player.x);
  ctx.strokeStyle='rgba(250,200,100,0.5)';ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(player.x,player.y);
  ctx.lineTo(player.x+Math.cos(ang)*50,player.y+Math.sin(ang)*50);
  ctx.stroke();
}
```

---

## 完了確認

- [ ] スティックが88×88pxになっている（CSS）
- [ ] 武器ボタンの `min-height:44px` が設定されている（CSS）
- [ ] `.ov-btn` が `min-width:160px` / `font-size:16px` になっている（CSS）
- [ ] `updStick()` にデッドゾーン処理がある（JS）
- [ ] `manualAimX/Y/Active/Timer` がグローバルに宣言されている（JS）
- [ ] キャンバスタップでエイム座標が更新される（JS）
- [ ] `fireAuto()` で手動エイムが優先される（JS）
- [ ] `draw()` にエイム方向の線が表示される（JS）
- [ ] 変更箇所すべてにコメントがある
