# TASK FILE MAP — タスクと必要ファイルの対応表

> Claude Codeへの指示時は **「読むファイル」欄のファイルだけ** を渡す。
> 不要なファイルは読まない = コンテキスト節約。

---

## ファイル役割早見表

| ファイル | 役割 | サイズ |
|---|---|---|
| `js/weapons.js`   | ★銃・近接武器マスター＋アップグレード定義（追加予定） | 新規 |
| `js/constants.js` | マップ・部屋・窓・壁データのみ | 7KB |
| `js/state.js`     | グローバル変数宣言 | 5KB |
| `js/entities.js`  | ゾンビ生成・弾発射ロジック | 4KB |
| `js/game.js`      | ゲームループ・ウェーブ進行・初期化 | 8KB |
| `js/render.js`    | 全描画処理 | 10KB |
| `js/shop.js`      | ショップUI（SHOP_ITEMSはweapons.jsから自動生成） | 3KB |
| `js/items.js`     | 鍵・床アイテム・近接攻撃 | 6KB |
| `js/input.js`     | キーボード・タッチ操作 | 2KB |
| `js/walls.js`     | 壁衝突判定 | 2KB |
| `js/audio.js`     | 効果音合成 | 6KB |
| `zombie_defense_v2.html` | HTML構造・HUD要素 | 3KB |
| `zombie_defense_v2.css`  | スタイル | 3KB |

---

## タスク別 必要ファイル一覧

### TASK-01｜難易度カーブ
**読むファイル:** `js/game.js` `js/entities.js` `js/state.js`
**書くファイル:** `js/game.js` `js/entities.js` `js/state.js`
- game.js: ウェーブ進行条件・スポーン数
- entities.js: spawnZombie() のHP/速度計算
- state.js: waveStartKills 変数追加

---

### TASK-02｜武器バランス
**読むファイル:** `js/weapons.js`
**書くファイル:** `js/weapons.js`
- weapons.js: WEAPONS[]のパラメータ調整のみ
- ※ TASK-09完了後はこの1ファイルで完結

---

### TASK-03｜ゾンビAI
**読むファイル:** `js/entities.js` `js/game.js`
**書くファイル:** `js/entities.js` `js/game.js`
- entities.js: spawnZombie() にseed/windowTarget追加
- game.js: loop()内のゾンビ移動処理を置き換え

---

### TASK-04｜ショップ経済
**読むファイル:** `js/weapons.js` `js/shop.js` `js/game.js` `zombie_defense_v2.html`
**書くファイル:** `js/weapons.js` `js/shop.js` `js/game.js` `zombie_defense_v2.html`
- weapons.js: dmgBoost/spdBoostをfireAuto計算に乗算
- shop.js: 消耗品3種追加
- game.js: バフタイマー・HUDバフ表示
- html: hBuff要素追加

---

### TASK-05｜窓修理
**読むファイル:** `js/game.js` `js/render.js`
**書くファイル:** `js/game.js` `js/render.js`
- game.js: tryRepair()コスト動的計算・修理ボタンUI
- render.js: 窓の亀裂エフェクト描画

---

### TASK-06｜マップ
**読むファイル:** `js/constants.js` `js/game.js`
**書くファイル:** `js/constants.js` `js/game.js`
- constants.js: ROOMS廊下追加・WALLS定数追加
- game.js: プレイヤー移動後のWALLS衝突判定

---

### TASK-07｜スコア
**読むファイル:** `js/game.js` `js/render.js` `zombie_defense_v2.html`
**書くファイル:** `js/game.js` `js/render.js` `zombie_defense_v2.html`
- game.js: endGame()ハイスコア保存・waveStartKills
- render.js: Waveバナーに撃破数追加
- html: hBest要素追加

---

### TASK-08｜モバイルUI
**読むファイル:** `js/input.js` `js/entities.js` `zombie_defense_v2.css`
**書くファイル:** `js/input.js` `js/entities.js` `zombie_defense_v2.css`
- input.js: スティックデッドゾーン・手動エイム変数
- entities.js: fireAuto()に手動エイム優先ロジック
- css: スティック/ボタンサイズ拡大

---

### TASK-09｜武器パターン化（NEW）
**読むファイル:** `js/constants.js` `js/shop.js` `js/entities.js` `zombie_defense_v2.html`
**書くファイル:** `js/weapons.js`(新規) `js/constants.js` `js/shop.js` `zombie_defense_v2.html`
- weapons.js: 武器定義＋shopUpgrades一元化（新規作成）
- constants.js: WEAPONS・MELEE_WEAPONS削除
- shop.js: SHOP_ITEMSをweapons.jsから自動生成に変更
- html: weapons.jsのscriptタグ追加

---

## 武器を1本追加するだけなら

```
TASK-09完了後は js/weapons.js の WEAPONS[] に1エントリ追加するだけ。
shopUpgradesも同じオブジェクト内に書くため他ファイル変更不要。
```

---

## Claude Codeへの渡し方テンプレート

```
【読むファイル】
- js/XXX.js
- js/YYY.js

【タスク】
tasks/TASK-XX_XXX.md を読んで指示通りに変更してください。

【ルール】
- 変更箇所に // [TASK-XX] コメントを必ず付ける
- 指示にないファイル・箇所は変更しない
- 完了後に変更ファイルをそのまま上書き保存する
- 最後にチェックリストの確認結果を報告する
```

---

### TASK-10｜スマホ縦画面レイアウト
**読むファイル:** `zombie_defense_v2.html` `zombie_defense_v2.css` `js/game.js`
**書くファイル:** `zombie_defense_v2.html` `zombie_defense_v2.css` `js/game.js`
- html: shop-panelをfixed要素として#outer-wrapの外に移動
- css: 縦画面用に全面書き直し（flexbox縦積み・shop固定オーバーレイ）
- game.js: resize()のVH計算をCWRAP.clientHeightに変更
