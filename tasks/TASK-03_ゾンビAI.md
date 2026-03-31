# TASK-03｜ゾンビAI・行動パターン強化

## あなたへの指示

`zombie_defense_v2.js` を読み込んで、以下の変更を加えてください。
変更した箇所には必ずコメント `// [TASK-03]` を付けてください。
**それ以外の箇所は一切変更しないでください。**

---

## 変更内容

### 1. `spawnZombie()` でゾンビに `seed` と `windowTarget` を追加

`zombies.push({...})` のオブジェクトに以下のプロパティを追加：

```js
zombies.push({
  x:win.x, y:win.y,
  r:cfg.r,
  hp:baseHp*cfg.hpMul,
  maxHp:baseHp*cfg.hpMul,
  speed:baseSpd*cfg.spdMul,
  type,
  body:cfg.body,
  head:cfg.head,
  scoreMul:cfg.scoreMul,
  coinMul:cfg.coinMul,
  label:cfg.label,
  attacking:false,
  seed:Math.random()*100,       // [TASK-03] ジグザグ用シード値
  windowTarget:null,            // [TASK-03] 重ゾンビの窓ターゲット
});
```

### 2. 重ゾンビ（type 2）のスポーン時に窓ターゲットを設定

`zombies.push(...)` の直後に追加：

```js
// [TASK-03] 重ゾンビは最寄りの閉じた窓を優先ターゲットにする
if(type===2){
  const closedWins = windows.filter(w=>!w.open);
  if(closedWins.length){
    const tw = closedWins[Math.floor(Math.random()*closedWins.length)];
    zombies[zombies.length-1].windowTarget = tw;
  }
}
```

### 3. `loop()` 内のゾンビ移動処理を置き換え

現在の以下の部分：
```js
// zombies move & damage player
zombies.forEach(z=>{
  const ang=Math.atan2(player.y-z.y,player.x-z.x);
  z.x+=Math.cos(ang)*z.speed;z.y+=Math.sin(ang)*z.speed;
```

を以下に置き換え：

```js
// zombies move & damage player
zombies.forEach(z=>{
  // [TASK-03] 分離ステアリング（ゾンビ同士が重ならない）
  let sepX=0,sepY=0;
  zombies.forEach(other=>{
    if(other===z)return;
    const dx=z.x-other.x,dy=z.y-other.y;
    const d=Math.hypot(dx,dy);
    if(d<(z.r+other.r+4)&&d>0){
      sepX+=dx/d*(z.r+other.r+4-d)*0.4;
      sepY+=dy/d*(z.r+other.r+4-d)*0.4;
    }
  });
  z.x+=sepX;z.y+=sepY;

  // [TASK-03] type 2（重）: 窓ターゲットがある間は窓に向かう
  if(z.type===2&&z.windowTarget&&!z.windowTarget.open){
    const distToWin=Math.hypot(z.windowTarget.x-z.x,z.windowTarget.y-z.y);
    if(distToWin>20){
      const a=Math.atan2(z.windowTarget.y-z.y,z.windowTarget.x-z.x);
      z.x+=Math.cos(a)*z.speed;z.y+=Math.sin(a)*z.speed;
    }
  } else if(z.type===1){
    // [TASK-03] type 1（速）: ジグザグ移動
    const ang=Math.atan2(player.y-z.y,player.x-z.x);
    const zigzag=Math.sin(Date.now()/200+z.seed)*0.8;
    const perpX=-Math.sin(ang),perpY=Math.cos(ang);
    z.x+=(Math.cos(ang)+perpX*zigzag)*z.speed;
    z.y+=(Math.sin(ang)+perpY*zigzag)*z.speed;
  } else {
    // [TASK-03] type 0（通常）: プレイヤーに直進（従来通り）
    const ang=Math.atan2(player.y-z.y,player.x-z.x);
    z.x+=Math.cos(ang)*z.speed;z.y+=Math.sin(ang)*z.speed;
  }
```

※ `if(Math.hypot(z.x-player.x,z.y-player.y)<player.r+z.r){` 以降のダメージ処理は変更しない。

---

## 完了確認

- [ ] `zombies.push()` に `seed` と `windowTarget` が追加されている
- [ ] type 2 スポーン後に `windowTarget` が設定されている
- [ ] 移動処理に分離ステアリングが追加されている
- [ ] type 1 がジグザグ移動している
- [ ] type 2 が `windowTarget` に向かって移動している
- [ ] 変更箇所すべてに `// [TASK-03]` コメントがある
