# TASK-01｜難易度カーブ再設計

## あなたへの指示

`zombie_defense_v2.js` を読み込んで、以下の変更を加えてください。
変更した箇所には必ずコメント `// [TASK-01]` を付けてください。
**それ以外の箇所は一切変更しないでください。**

---

## 変更内容

### 1. ゾンビHPを指数成長に変更（`spawnZombie()` 内）

```js
// 変更前
const baseHp = 25 + wave * 14;

// 変更後
const baseHp = Math.round(30 * Math.pow(1.18, wave - 1) * (0.9 + Math.random() * 0.2)); // [TASK-01]
```

### 2. 速度にソフトキャップを追加（`spawnZombie()` 内）

```js
// 変更前
const baseSpd = 0.55 + wave * 0.12 + Math.random() * 0.25;

// 変更後
const rawSpd = 0.55 + wave * 0.12 + Math.random() * 0.25; // [TASK-01]
const baseSpd = rawSpd > 1.8 ? 1.8 + (rawSpd - 1.8) * 0.3 : rawSpd; // [TASK-01]
```

### 3. スポーン数をWaveに応じて増加（`loop()` 内）

```js
// 変更前
if(spawnTimer>=sr){spawnTimer=0;spawnZombie();if(wave>2)spawnZombie();}

// 変更後
if(spawnTimer>=sr){ // [TASK-01]
  spawnTimer=0;
  const spawnCount = wave<=2 ? 1 : wave<=5 ? 2 : wave<=9 ? 3 : 4;
  for(let i=0;i<spawnCount;i++) spawnZombie();
}
```

### 4. Wave進行を「撃破数クォータ+時間制限」に変更

#### 4a. グローバル変数を追加（`let score,kills,wave...` の行の直後）

```js
let waveStartKills = 0; // [TASK-01] そのWaveの開始時点のkills数
```

#### 4b. `startGame()` 内に初期化を追加

```js
// score=0;kills=0;wave=1;... の行の直後に追加
waveStartKills = 0; // [TASK-01]
```

#### 4c. `loop()` のWave進行条件を変更

```js
// 変更前
if(waveTimer>360+wave*30){
  const completedWave=wave;
  waveTimer=0;wave++;
  ...

// 変更後
const killQuota = 8 + wave * 4; // [TASK-01]
const timeLimit = 480 + wave * 20; // [TASK-01]
const killsThisWave = kills - waveStartKills; // [TASK-01]
if(waveTimer > timeLimit || killsThisWave >= killQuota){
  const completedWave=wave;
  waveTimer=0;wave++;
  waveStartKills = kills; // [TASK-01] 次Waveの基準をリセット
  ...
```

### 5. Wave5/10/15 にボーナスゾンビ追加（`spawnZombie()` の末尾）

```js
// zombies.push({...}); の直後に追加
if(wave % 5 === 0 && Math.random() < 0.15){ // [TASK-01] ボスWaveに重ゾンビ追加
  const bossCfg = ZOMBIE_TYPES[2];
  const bossHp = baseHp * bossCfg.hpMul * 1.5;
  zombies.push({x:win.x,y:win.y,r:bossCfg.r+2,hp:bossHp,maxHp:bossHp,
    speed:baseSpd*bossCfg.spdMul,type:2,body:bossCfg.body,head:bossCfg.head,
    scoreMul:bossCfg.scoreMul*2,coinMul:bossCfg.coinMul*2,label:'👑',attacking:false});
}
```

---

## 完了確認

- [ ] `baseHp` が指数計算になっている
- [ ] `baseSpd` にソフトキャップがある
- [ ] `spawnCount` でwave別の同時スポーン数が変わる
- [ ] `waveStartKills` が宣言・初期化・更新されている
- [ ] Wave進行条件が `killQuota` または `timeLimit` の2条件になっている
- [ ] 変更箇所すべてに `// [TASK-01]` コメントがある
