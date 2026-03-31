# TASK-04｜ショップ・経済システム改善

## あなたへの指示

`zombie_defense_v2.js` を読み込んで、以下の変更を加えてください。
変更した箇所には必ずコメント `// [TASK-04]` を付けてください。
**それ以外の箇所は一切変更しないでください。**

---

## 変更内容

### 1. グローバル変数に時限バフ用変数を追加

`let upgrades={speed:0,armor:0,coinMag:0};` の直後に追加：

```js
let dmgBoost=1,dmgBoostTimer=0,spdBoost=1,spdBoostTimer=0; // [TASK-04]
```

### 2. `startGame()` でバフ変数を初期化

`upgrades={speed:0,armor:0,coinMag:0};` の直後に追加：

```js
dmgBoost=1;dmgBoostTimer=0;spdBoost=1;spdBoostTimer=0; // [TASK-04]
```

### 3. `loop()` 内でバフタイマーを毎フレーム処理

`waveTimer++;` の直後に追加：

```js
// [TASK-04] 時限バフのタイマー処理
if(dmgBoostTimer>0){dmgBoostTimer--;if(dmgBoostTimer<=0)dmgBoost=1;}
if(spdBoostTimer>0){spdBoostTimer--;if(spdBoostTimer<=0)spdBoost=1;}
```

### 4. `fireAuto()` のダメージ計算にバフを乗算

```js
// 変更前
const dmg=wp.damage+wp.upgDmg*8;

// 変更後
const dmg=(wp.damage+wp.upgDmg*8)*dmgBoost; // [TASK-04]
```

### 5. プレイヤー移動速度にバフを乗算

```js
// 変更前
const spd=(player.speed+upgrades.speed*0.3)*(moveX!==0&&moveY!==0?0.707:1);

// 変更後
const spd=(player.speed+upgrades.speed*0.3)*spdBoost*(moveX!==0&&moveY!==0?0.707:1); // [TASK-04]
```

### 6. コイン収入を安定化

```js
// 変更前
const coinAmt=Math.floor((Math.random()*8+4+wave)*z.coinMul);

// 変更後
const baseAmt=5+wave*1.5; // [TASK-04]
const coinAmt=Math.floor(baseAmt*(0.8+Math.random()*0.4)*z.coinMul); // [TASK-04]
```

### 7. `SHOP_ITEMS` に消耗品3種を追加

`SHOP_ITEMS` 配列の末尾（`]` の直前）に追加：

```js
// [TASK-04] 時限バフ・消耗品
{id:'dmg_boost',  label:'💥 ダメージ×2（10秒）', cost:()=>30,
  action:()=>{dmgBoost=2.0;dmgBoostTimer=600;}, max:99, cur:()=>0},
{id:'spd_boost',  label:'⚡ スピード×1.5（10秒）',cost:()=>25,
  action:()=>{spdBoost=1.5;spdBoostTimer=600;}, max:99, cur:()=>0},
{id:'repair_all', label:'🔧 全窓緊急修理 $120',   cost:()=>120,
  action:()=>{windows.forEach(w=>{w.hp=w.maxHp;w.open=false;});playRepairDone();},
  max:99, cur:()=>0},
```

### 8. HUDにバフ状態を表示

`loop()` 内の `document.getElementById('hScore').textContent=score;` の近くに追加：

```js
// [TASK-04] バフ表示をHUDに反映
const dmgEl=document.getElementById('hud');
if(dmgBoostTimer>0||spdBoostTimer>0){
  let buffStr='';
  if(dmgBoostTimer>0) buffStr+='💥'+Math.ceil(dmgBoostTimer/60)+'s ';
  if(spdBoostTimer>0) buffStr+='⚡'+Math.ceil(spdBoostTimer/60)+'s';
  document.getElementById('hBuff').textContent=buffStr;
} else {
  document.getElementById('hBuff').textContent='';
}
```

`zombie_defense_v2.html` の `#hud` 内に以下も追加してください：

```html
<div class="hud-b"><div class="hud-l">BUFF</div><div class="hud-v" id="hBuff" style="color:#63c422;font-size:11px"></div></div>
```

---

## 完了確認

- [ ] `dmgBoost`, `spdBoost` 等のグローバル変数が追加されている
- [ ] `startGame()` でバフ変数が初期化されている
- [ ] `loop()` 内でタイマーがデクリメントされ、0でリセットされる
- [ ] `fireAuto()` のダメージに `dmgBoost` が乗算されている
- [ ] 移動速度に `spdBoost` が乗算されている
- [ ] コイン収入が `baseAmt` ベースの計算になっている
- [ ] `SHOP_ITEMS` に3種の消耗品が追加されている
- [ ] `hBuff` 要素がHTMLとJSに追加されている
- [ ] 変更箇所すべてに `// [TASK-04]` コメントがある
