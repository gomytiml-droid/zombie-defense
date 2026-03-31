# TASK-07｜スコア・ハイスコア機能

## あなたへの指示

`zombie_defense_v2.js` と `zombie_defense_v2.html` を読み込んで、以下の変更を加えてください。
変更した箇所には必ずコメント `// [TASK-07]` または `<!-- [TASK-07] -->` を付けてください。
**それ以外の箇所は一切変更しないでください。**

---

## 変更内容

### 1. HTMLの `#hud` にBESTスコア表示を追加（zombie_defense_v2.html）

`<div class="hud-b"><div class="hud-l">MONEY</div>...` の直後に追加：

```html
<div class="hud-b"><!-- [TASK-07] -->
  <div class="hud-l">BEST</div>
  <div class="hud-v" id="hBest" style="color:#EF9F27">0</div>
</div>
```

### 2. `startGame()` でハイスコアをHUDに反映

`document.getElementById('overlay').classList.remove('show');` の直後に追加：

```js
// [TASK-07] ハイスコアをHUDに表示
document.getElementById('hBest').textContent=localStorage.getItem('zombie_hi')||'0';
```

### 3. `endGame()` でハイスコードを保存・表示

```js
// 変更前
function endGame(){
  gameRunning=false;
  document.getElementById('ovTitle').textContent='GAME OVER';
  document.getElementById('ovSub').textContent=`スコア: ${score}  |  WAVE ${wave}  |  ${kills}体撃破  |  $${money}`;
  document.getElementById('overlay').classList.add('show');
}

// 変更後
function endGame(){
  gameRunning=false;
  // [TASK-07] ハイスコア保存
  const hiKey='zombie_hi';
  const prev=parseInt(localStorage.getItem(hiKey)||'0');
  const isHi=score>prev;
  if(isHi)localStorage.setItem(hiKey,score);
  document.getElementById('hBest').textContent=Math.max(score,prev);
  document.getElementById('ovTitle').textContent=isHi?'🏆 NEW RECORD!':'GAME OVER';
  document.getElementById('ovSub').textContent=
    `スコア: ${score}  |  WAVE ${wave}  |  ${kills}体撃破  |  $${money}\n`+
    (isHi?'新記録達成！':`ハイスコア: ${prev}`);
  document.getElementById('overlay').classList.add('show');
}
```

### 4. Wave完了バナーに撃破数を追加

#### 4a. グローバル変数を追加（`let waveStartKills` がなければ追加）

`let score,kills,wave...` の行の直後に追加：

```js
let waveStartKills=0; // [TASK-07] このWaveの開始時kills
```

#### 4b. `startGame()` で初期化

```js
score=0;kills=0;wave=1;money=0;waveTimer=0;spawnTimer=0;nextFireTime=0;
waveStartKills=0; // [TASK-07]
```

#### 4c. `loop()` のWave進行時に `waveStartKills` をリセット

```js
// wave++; の直後に追加
waveStartKills=kills; // [TASK-07]
```

#### 4d. `waveClearBonus` に撃破数を追加

```js
// 変更前
waveClearBonus={score:bScore,money:bMoney,wave:completedWave};

// 変更後
waveClearBonus={score:bScore,money:bMoney,wave:completedWave,kills:kills-waveStartKills+1}; // [TASK-07]
```

#### 4e. `draw()` のWaveクリアバナーに撃破数テキストを追加

```js
// 変更前
ctx.fillText(`ボーナス  +${waveClearBonus.score}点  +$${waveClearBonus.money}`,VW/2,VH/2+20);

// 変更後
ctx.fillText(`${waveClearBonus.kills}体撃破  +${waveClearBonus.score}点  +$${waveClearBonus.money}`,VW/2,VH/2+20); // [TASK-07]
```

---

## 完了確認

- [ ] HTMLに `hBest` 要素が追加されている
- [ ] `startGame()` でハイスコアが `hBest` に表示される
- [ ] `endGame()` でハイスコアが localStorage に保存される
- [ ] 新記録時に `🏆 NEW RECORD!` タイトルが表示される
- [ ] `waveStartKills` が宣言・初期化・更新されている
- [ ] Waveバナーに撃破数が表示される
- [ ] 変更箇所すべてに `// [TASK-07]` コメントがある
