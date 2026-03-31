# TASK-05｜窓修理システム改善

## あなたへの指示

`zombie_defense_v2.js` を読み込んで、以下の変更を加えてください。
変更した箇所には必ずコメント `// [TASK-05]` を付けてください。
**それ以外の箇所は一切変更しないでください。**

---

## 変更内容

### 1. グローバル変数に修理コストを追加

`let repairing=false,repairTimer=0,repairTarget=null;` を以下に変更：

```js
let repairing=false,repairTimer=0,repairTarget=null,currentRepairCost=20,repairRequired=180; // [TASK-05]
```

### 2. `tryRepair()` を修理コスト動的計算に変更

```js
// 変更後（関数丸ごと置き換え）
function tryRepair(){
  if(!gameRunning)return;
  const near=nearestDamagedWindow();
  if(!near||near.dist>55){addFloat(player.x,player.y-20,'窓に近づいて','#e24b4a');return;}
  const w=near.win;
  const missingHp=w.maxHp-w.hp;
  currentRepairCost=w.open?35:Math.max(5,Math.ceil(missingHp/w.maxHp*20)); // [TASK-05]
  repairRequired=w.open?240:Math.ceil(missingHp/w.maxHp*180+60);           // [TASK-05]
  if(money<currentRepairCost){addFloat(player.x,player.y-20,`お金が足りない ($${currentRepairCost})`,'#e24b4a');return;}
  repairing=true;repairTarget=w;repairTimer=0;
  document.getElementById('repairBtn').classList.add('active');
}
```

### 3. 修理完了処理のコスト参照を変数に変更

```js
// 変更前
if(repairTimer>=180){
  ...
  money=Math.max(0,money-20);

// 変更後
if(repairTimer>=repairRequired){ // [TASK-05]
  ...
  money=Math.max(0,money-currentRepairCost); // [TASK-05]
```

### 4. 修理進捗アークの分母も変数に変更（`draw()` 内）

```js
// 変更前
ctx.beginPath();ctx.arc(w.x,w.y,14,-Math.PI/2,-Math.PI/2+Math.PI*2*(repairTimer/180));ctx.stroke();

// 変更後
ctx.beginPath();ctx.arc(w.x,w.y,14,-Math.PI/2,-Math.PI/2+Math.PI*2*(repairTimer/repairRequired));ctx.stroke(); // [TASK-05]
```

### 5. 窓の視覚表示を強化（`draw()` 内の windows 描画部分）

窓の `ctx.fillRect(w.x-8,w.y-8,16,16)` の**直後**に追加：

```js
// [TASK-05] 亀裂エフェクト（HP60%以下）
if(!w.open && w.hp/w.maxHp<0.6){
  ctx.save();
  const crackAlpha = w.hp/w.maxHp<0.3
    ? (Math.sin(Date.now()/150)>0?0.9:0.4)  // 30%以下は点滅
    : 0.5;
  ctx.globalAlpha=crackAlpha;
  ctx.strokeStyle='#ff4444';ctx.lineWidth=1.5;
  ctx.beginPath();
  ctx.moveTo(w.x-4,w.y-5);ctx.lineTo(w.x+2,w.y);ctx.lineTo(w.x-2,w.y+5);
  ctx.moveTo(w.x+3,w.y-4);ctx.lineTo(w.x,w.y+3);
  ctx.stroke();
  ctx.restore();
}
```

### 6. 修理ボタンのUIテキストをコスト表示に更新（`loop()` 内）

```js
// 変更前（repBtn のテキスト更新部分）
if(near&&near.dist<55&&money>=20){
  repBtn.style.borderColor='#63c422';repBtn.style.color='#63c422';
  if(repairing)repBtn.innerHTML=`修理中 ${Math.floor(repairTimer/180*100)}%<br>...`;
  else repBtn.innerHTML='窓修理<br>...';
} else {
  ...
}

// 変更後
if(near&&near.dist<55){
  const w=near.win;
  const mHp=w.maxHp-w.hp;
  const cost=w.open?35:Math.max(5,Math.ceil(mHp/w.maxHp*20)); // [TASK-05]
  const req=w.open?240:Math.ceil(mHp/w.maxHp*180+60);         // [TASK-05]
  const canAfford=money>=cost;
  repBtn.style.borderColor=canAfford?'#63c422':'#e24b4a';
  repBtn.style.color=canAfford?'#63c422':'#e24b4a';
  if(repairing)repBtn.innerHTML=`修理中 ${Math.floor(repairTimer/repairRequired*100)}%<br><span style="font-size:9px">$${currentRepairCost} 離れないで</span>`; // [TASK-05]
  else repBtn.innerHTML=`窓修理<br><span style="font-size:9px">${canAfford?'$'+cost+'でタップ':'お金不足 $'+cost}</span>`; // [TASK-05]
} else {
  repBtn.style.borderColor='#333';repBtn.style.color='#888';
  repBtn.innerHTML='窓修理<br><span style="font-size:9px">近づいてタップ</span>';
}
```

---

## 完了確認

- [ ] `currentRepairCost` と `repairRequired` がグローバルに宣言されている
- [ ] `tryRepair()` でコストと所要時間が動的に計算されている
- [ ] 修理完了時に `currentRepairCost` が差し引かれている
- [ ] 進捗アークが `repairRequired` ベースになっている
- [ ] HP60%以下の窓に亀裂エフェクトが表示される
- [ ] HP30%以下の窓が点滅する
- [ ] 修理ボタンにコストが表示される
- [ ] 変更箇所すべてに `// [TASK-05]` コメントがある
