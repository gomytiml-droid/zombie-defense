# TASK-06｜マップ・部屋レイアウト改善

## あなたへの指示

`zombie_defense_v2.js` を読み込んで、以下の変更を加えてください。
変更した箇所には必ずコメント `// [TASK-06]` を付けてください。
**それ以外の箇所は一切変更しないでください。**

---

## 変更内容

### 1. `ROOMS` 配列に廊下を2本追加

既存の `ROOMS` 配列の末尾（`];` の直前）に追加：

```js
// [TASK-06] 縦廊下（上下フロアの接続）
{x:260,y:455,w:55,h:50,label:'',color:'#222'},
{x:555,y:455,w:55,h:50,label:'',color:'#222'},
```

### 2. 壁の当たり判定データを追加

`const ROOMS=[...]` の直後に追加：

```js
// [TASK-06] 簡易壁データ（プレイヤーが入れない隙間）
const WALLS=[
  {x:240,y:60,w:20,h:160},   // 寝室-子供部屋
  {x:520,y:60,w:20,h:160},   // 子供部屋-リビング
  {x:840,y:60,w:0,h:0},      // 右端（マップ境界で処理済み）
  {x:220,y:460,w:40,h:45},   // キッチン上の隙間
  {x:520,y:460,w:35,h:45},   // ダイニング上の隙間
  {x:60,y:220,w:160,h:40},   // 書斎下の隙間
  {x:700,y:220,w:140,h:40},  // WC上の隙間
];
```

### 3. `loop()` のプレイヤー移動後に壁判定を追加

```js
// 変更前（移動処理）
player.x=Math.max(player.r,Math.min(MAP_W-player.r,player.x+moveX*spd));
player.y=Math.max(player.r,Math.min(MAP_H-player.r,player.y+moveY*spd));

// 変更後
const nx=Math.max(player.r,Math.min(MAP_W-player.r,player.x+moveX*spd));
const ny=Math.max(player.r,Math.min(MAP_H-player.r,player.y+moveY*spd));
// [TASK-06] 壁との衝突判定
let blocked=false;
WALLS.forEach(wall=>{
  if(wall.w===0)return;
  if(nx+player.r>wall.x&&nx-player.r<wall.x+wall.w&&
     ny+player.r>wall.y&&ny-player.r<wall.y+wall.h) blocked=true;
});
player.x=blocked?player.x:nx;
player.y=blocked?player.y:ny;
```

### 4. `draw()` の部屋描画を改善

```js
// 変更前
ctx.fillStyle='rgba(255,255,255,0.1)';
ctx.font='11px sans-serif';
ctx.textAlign='center';
ctx.fillText(r.label,r.x+r.w/2,r.y+r.h/2);

// 変更後
if(r.label&&r.w>80&&r.h>50){ // [TASK-06] 小さい部屋はラベル非表示
  ctx.fillStyle='rgba(255,255,255,0.2)';
  ctx.font='bold 12px sans-serif';
  ctx.textAlign='center';
  ctx.fillText(r.label,r.x+r.w/2,r.y+r.h/2);
}
```

### 5. 壁データをデバッグ表示（開発用、後で削除可）

`draw()` の `ctx.restore()` の直前に一時的に追加（不要なら実装不要）：

```js
// [TASK-06][DEBUG] 壁の可視化（開発用）
if(false){ // trueにすると壁が見える
  WALLS.forEach(wall=>{
    if(wall.w===0)return;
    ctx.strokeStyle='rgba(255,0,0,0.4)';ctx.lineWidth=1;
    ctx.strokeRect(wall.x,wall.y,wall.w,wall.h);
  });
}
```

---

## 完了確認

- [ ] `ROOMS` に廊下2本が追加されている（x:260,y:455 と x:555,y:455）
- [ ] `WALLS` 定数が定義されている
- [ ] プレイヤー移動後に `WALLS` との衝突判定がある
- [ ] 壁に衝突した場合に移動がブロックされる
- [ ] 部屋ラベルが小さい部屋では非表示になっている
- [ ] ラベルのフォントが `bold 12px` になっている
- [ ] 変更箇所すべてに `// [TASK-06]` コメントがある

---

## 注意事項

壁のX/Y座標は **マップ座標**（MAP_W=900, MAP_H=700 基準）です。
カメラオフセット（camX/camY）の影響を受けないよう、  
壁判定はカメラ変換**前**のプレイヤー座標で行ってください（既存コードと同じ）。
