# ゾンビ防衛ゲーム — アーキテクチャ説明

## ファイル構成

```
zombie_defense_v2.html   メインHTML（UI構造 + スクリプト読み込み順）
zombie_defense_v2.css    スタイルシート（レイアウト・HUD・ショップ）
js/
  constants.js           定数・データ定義（変更なし）
  state.js               グローバル変数・DOM参照（ゲーム状態）
  audio.js               効果音合成（Web Audio API）
  walls.js               壁衝突判定システム
  entities.js            ゲームオブジェクト生成・更新
  render.js              描画システム（カメラ・マップ・UI）
  shop.js                ショップUI・アップグレード管理
  input.js               入力処理（キーボード・タッチ）
  game.js                ゲームループ・初期化・終了処理
```

## 読み込み順（依存関係）

```
constants.js  ←  すべての定数（他ファイルが参照）
    ↓
state.js      ←  DOM参照 + let変数（constants.js を参照）
    ↓
audio.js      ←  効果音関数（state.js 不要、単独動作）
walls.js      ←  壁衝突（state.js の _wallCache, windows を参照）
entities.js   ←  spawnZombie など（state.js + audio.js を参照）
render.js     ←  draw() など（state.js を参照）
shop.js       ←  SHOP_ITEMS など（state.js を参照）
    ↓
input.js      ←  moveX/moveY + イベント（game.js の関数を呼ぶ）
    ↓
game.js       ←  loop() + startGame()（上記すべてを参照、最後に startGame() 実行）
```

---

## 各ファイルの詳細

### `js/constants.js` — 定数・データ定義

変更されない定数のみ。ゲームロジックは含まない。

| 定数 | 内容 |
|------|------|
| `MAP_W`, `MAP_H` | マップサイズ（900×700） |
| `WEAPONS[3]` | 武器データ（fireRate, damage, range, upgDmg/Rate/Range） |
| `ZOMBIE_TYPES[3]` | ゾンビ種別（通常/速/重）の倍率・見た目 |
| `ROOMS[10]` | 部屋の位置・色・ラベル |
| `WIN_DEFS[12]` | 窓の定義（位置・方向） |
| `OUTER_WALLS` | 外壁セグメント（角ブロック含む） |
| `WIN_GAPS` | 窓が塞がっている時だけ有効な壁 |
| `INNER_WALLS` | 内壁（扉付き） |

---

### `js/state.js` — グローバル変数・DOM参照

ゲームの「今の状態」を保持する変数をすべてここで宣言する。

```js
// DOM参照
canvas, ctx, CWRAP

// 画面サイズ・カメラ
VW, VH, camX, camY

// ゲームオブジェクト配列
player, zombies, bullets, coins, particles, floatTexts

// スコア・進行
score, kills, wave, money, waveTimer, spawnTimer, nextFireTime

// 武器・修理・アップグレード
currentWeapon, repairing, repairTimer, repairTarget
upgrades: { speed, armor, coinMag }

// アニメーション
animId, waveClearAnim, waveClearBonus

// 壁キャッシュ（毎フレームリセット）
_wallCache
```

---

### `js/audio.js` — 効果音合成

外部音声ファイル不要。すべて Web Audio API の Oscillator / BufferSource で合成する。

| 関数 | 音 | 特徴 |
|------|----|------|
| `playShoot(wpIdx)` | 発射音 | 武器ごとに波形が違う（square/sawtooth）、MG は 90ms スロットル |
| `playDeath()` | ゾンビ死亡 | sawtooth で音程を下げる |
| `playCoin()` | コイン取得 | sine で高音 2 段階、80ms スロットル |
| `playWindowBreak()` | 窓破壊 | ノイズバースト（createBuffer） |
| `playRepairDone()` | 修理完了 | ド・ミ・ソ アルペジオ |
| `playWaveClear()` | ウェーブクリア | 4 音ファンファーレ |
| `playHurt()` | 被弾 | sawtooth 低音、280ms スロットル |

---

### `js/walls.js` — 壁衝突判定

AABB（軸平行境界ボックス）と円の衝突検出・押し出し。

```
getActiveWalls()   OUTER_WALLS + INNER_WALLS + 閉じた窓の WIN_GAPS を結合
                   結果を _wallCache にキャッシュ（毎フレーム再生成）

resolveWalls(entity)  3 回反復で円を壁から押し出す
                      コーナー詰まり対策: 壁内部の場合は最短辺方向に脱出
```

窓が開いている（`open === true`）場合、その WIN_GAP は壁リストに含まれない
→ ゾンビが侵入可能になる。

---

### `js/entities.js` — ゲームオブジェクト生成・更新

| 関数 | 役割 |
|------|------|
| `addParticle(x, y, color, n)` | パーティクルを n 個生成 |
| `addFloat(x, y, text, color)` | フロートテキスト（ダメージ表示など）を生成 |
| `spawnZombie()` | 開いた窓の外側にゾンビをスポーン。ウェーブに応じて種別を決定 |
| `fireAuto(now)` | 射程内で最も近いゾンビを自動照準して弾を生成 |
| `nearestDamagedWindow()` | プレイヤーに最も近い破損窓を返す |

**ゾンビ種別（ウェーブ依存）**

| 種別 | 速度倍率 | HP倍率 | 出現条件 |
|------|---------|--------|---------|
| 通常（緑） | ×0.60 | ×1.0 | 常時 |
| 速（黄緑） | ×1.85 | ×0.55 | WAVE 3 以降 40% |
| 重（赤）  | ×0.52 | ×2.6  | WAVE 5 以降 20% |

---

### `js/render.js` — 描画システム

毎フレーム `draw()` が呼ばれ、以下の順で描画する。

```
1. マップ背景（#111）
2. 部屋の床（各色）
3. 内壁
4. 外壁
5. 窓（HP バー・修理進捗アーク・赤いオーラ）
6. コイン
7. パーティクル
8. ゾンビ（体・頭・HP バー・ラベル）
9. 弾
10. プレイヤー（青い同心円）
11. 射程サークル（半透明）
12. フロートテキスト
── ctx.restore() ──（カメラ座標系ここまで）
13. ミニマップ（右下固定）
14. ウェーブクリアバナー（フェードイン/アウト）
```

`updateCamera()` はプレイヤーが画面 1/3 マージンに触れたらカメラをスクロールさせる。

---

### `js/shop.js` — ショップUI・アップグレード管理

ゲーム画面の右側パネルに表示。購入でステータスが上昇する。

| アイテム | 効果 | 最大 Lv |
|---------|------|--------|
| ピストル ダメージ+8 | WEAPONS[0].upgDmg++ | 5 |
| ショットガン 速度+ | WEAPONS[1].upgRate++ | 4 |
| マシンガン ダメージ+8 | WEAPONS[2].upgDmg++ | 5 |
| 移動速度アップ | upgrades.speed++ | 4 |
| 防具 ダメージ-8% | upgrades.armor++ | 5 |
| コイン吸引範囲+ | upgrades.coinMag++ | 5 |
| HP回復 +30 | player.hp += 30 | 無制限 |

`openShop()` は動的に DOM を生成する。所持金不足・MAX のボタンは disabled。

---

### `js/input.js` — 入力処理

`moveX` / `moveY`（各 -1〜1）を設定し、`game.js` の `loop()` が参照する。

- **タッチジョイスティック**: `#stick-pad` を基点に角度・距離を計算。ノブを CSS transform で動かす。
- **キーボード**: WASD / 矢印キーで移動。1/2/3 キーで武器切替。Escape でショップ閉じ。
- **リサイズ**: ウィンドウリサイズ時に `resize()` を呼ぶ。

---

### `js/game.js` — ゲームループ・初期化・終了

ゲームの中心。他のすべてのモジュールを組み合わせて動かす。

| 関数 | 役割 |
|------|------|
| `resize()` | canvas をラッパー幅に合わせてリサイズ |
| `initWindows()` | WIN_DEFS から窓オブジェクトを生成（初期状態はランダム） |
| `setWeapon(i)` | 武器を切り替えてボタンハイライトを更新 |
| `startGame()` | 全状態をリセットしてゲームを開始 |
| `endGame()` | ゲームオーバー処理（オーバーレイ表示） |
| `loop()` | `requestAnimationFrame` で毎フレーム呼ばれるメインループ |

**loop() の処理順**

```
1. ウェーブタイマー進行（一定フレームで次ウェーブ）
2. ゾンビスポーン（ウェーブが上がるほど頻度増加）
3. プレイヤー移動 + 壁衝突解決
4. カメラ追従 + 自動射撃
5. 自動修理（近くの破損窓を $20 で修理）
6. 弾の移動・寿命管理
7. ゾンビが窓を攻撃（窓破壊処理）
8. ゾンビ移動 + 壁衝突 + プレイヤー攻撃
9. 弾がゾンビに当たる → 死亡処理
10. コイン吸引・取得
11. パーティクル・フロートテキスト更新
12. HUD 更新（スコア・HP・お金）
13. 修理ボタン状態更新
14. draw()（描画）
```
