# ゾンビ防衛ゲーム — Claude Code 共通コンテキスト

## ゲーム概要

HTML/JavaScript製のゾンビサバイバルゲーム（zombie_defense_v2）。  
プレイヤーが建物内を移動しながらゾンビの波を迎え撃つ俯瞰視点ディフェンス。

- **プラットフォーム**: ブラウザ（ローカルHTMLを直接開くだけで動く）
- **操作**: キーボード（WASD/矢印）＋タッチジョイスティック対応
- **マップ**: 900×700、10部屋、12窓
- **ウェーブ制**: 時間またはキル数でウェーブ進行

---

## フォルダ構成

```
ゾンビゲーム/
├── CLAUDE.md                  ← このファイル（必ず最初に読む）
├── ARCHITECTURE.md            ← 各ファイルの詳細仕様
│
├── zombie_defense_v2.html     ← メインHTML（UI構造）
├── zombie_defense_v2.css      ← スタイルシート
├── zombie_defense_v2.js       ← ★作業対象★ モノリシック版JS
│
├── js/                        ← モジュール分割版（参照用）
│   ├── constants.js           定数・データ定義
│   ├── state.js               グローバル変数・DOM参照
│   ├── audio.js               効果音合成（Web Audio API）
│   ├── walls.js               壁衝突判定
│   ├── entities.js            ゲームオブジェクト生成・更新
│   ├── render.js              描画システム
│   ├── shop.js                ショップUI・アップグレード
│   ├── input.js               入力処理
│   ├── game.js                ゲームループ・初期化
│   ├── items.js               アイテム
│   ├── traps.js               トラップ
│   └── boss.js                ボス
│
├── tasks/                     ← 各タスクの実装指示書
│   ├── README.md              並列開発ガイド（必読）
│   ├── TASK-01_難易度カーブ.md
│   ├── TASK-02_武器バランス.md
│   ├── TASK-03_ゾンビAI.md
│   ├── TASK-04_ショップ経済.md
│   ├── TASK-05_窓修理.md
│   ├── TASK-06_マップ.md
│   ├── TASK-07_スコア.md
│   └── TASK-08_モバイルUI.md
│
├── output/                    ← タスク完了後の出力ファイル置き場
│   └── zombie_defense_v2_taskXX.js  （ここに保存する）
│
├── images/                    ← 画像素材
└── 素材/                      ← BGM・その他素材
```

---

## 作業ルール（Claude Code 全セッション共通）

### 必須
- **作業ファイル**: `zombie_defense_v2.js`（モノリシック版）を編集する
- **コメント**: 変更した全箇所に `// [TASK-XX]` コメントを付ける
- **スコープ厳守**: 指示されていない箇所は一切変更しない
- **出力先**: 完了後は `output/zombie_defense_v2_taskXX.js` として保存

### セッション開始時のコピペ用テンプレート

```
zombie_defense_v2.js、zombie_defense_v2.css、zombie_defense_v2.html を読み込んでください。
次に tasks/TASK-XX_XXX.md を読んで、指示通りに変更を加えてください。

ルール:
- 変更箇所には // [TASK-XX] コメントを必ず付ける
- 指示にない箇所は絶対に変更しない
- 完了したら output/zombie_defense_v2_taskXX.js として保存する
- 最後にチェックリストの確認結果を報告する
```

---

## 並列実行グループ

### 🟢 第1波（今すぐ同時に走らせてOK）

| セッション | タスク | 変更ファイル |
|---|---|---|
| A | TASK-03 ゾンビAI | .js のみ |
| B | TASK-05 窓修理 | .js のみ |
| C | TASK-06 マップ | .js のみ |
| D | TASK-08 モバイルUI | .js + .css |

### 🟡 第2波（第1波マージ後）

| セッション | タスク | 注意 |
|---|---|---|
| E | TASK-01 難易度カーブ | `waveStartKills` 変数をTASK-07と共有 |
| F | TASK-07 スコア | `waveStartKills` 変数をTASK-01と共有 |
| G | TASK-02 武器バランス | 単独可 |

### 🔴 第3波（TASK-02マージ後）

| セッション | タスク | 注意 |
|---|---|---|
| H | TASK-04 ショップ経済 | TASK-02の `dmg` 計算式に依存 |

---

## 変数共有の注意点

| 変数名 | 関係タスク | 内容 |
|---|---|---|
| `waveStartKills` | TASK-01 / TASK-07 | 両方が同じ変数を追加 → マージ時に重複除去 |
| `dmgBoost` / `spdBoost` | TASK-04 | TASK-02のdmg計算式に乗算 |

---

## マージ手順（全タスク完了後）

新しいClaude Codeセッションで以下を渡す：

```
以下のファイルをすべて読み込んでください：
- zombie_defense_v2.js（オリジナル）
- output/zombie_defense_v2_task01.js
- output/zombie_defense_v2_task02.js
- output/zombie_defense_v2_task03.js
- output/zombie_defense_v2_task04.js
- output/zombie_defense_v2_task05.js
- output/zombie_defense_v2_task06.js
- output/zombie_defense_v2_task07.js
- output/zombie_defense_v2_task08.js

各ファイルの // [TASK-XX] コメントの付いた変更点をオリジナルに統合して
output/zombie_defense_v2_merged.js を作成してください。
変数の重複（特に waveStartKills）や競合があれば報告してください。
```

---

## 動作確認

ブラウザで `zombie_defense_v2.html` を直接開くだけで動く（サーバー不要）。
