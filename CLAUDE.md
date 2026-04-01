# ゾンビ防衛ゲーム — Claude Code 共通コンテキスト

## 鉄則
- **作業前に `tasks/TASK_FILE_MAP.md` を読む** → 必要ファイルだけ読む
- 変更箇所に `// [TASK-XX]` コメントを必ず付ける
- 指示にない箇所は一切変更しない
- 完了後は変更ファイルをそのまま上書き保存する

## ファイル構成

```
js/weapons.js    ← 武器マスター+アップグレード定義（武器追加はここだけ）
js/constants.js  ← マップ/窓/壁データ
js/state.js      ← グローバル変数
js/entities.js   ← ゾンビ生成・発射
js/game.js       ← ゲームループ・ウェーブ
js/render.js     ← 描画
js/shop.js       ← ショップUI（武器項目はweapons.jsから自動生成）
js/items.js      ← 鍵・近接攻撃
js/input.js      ← 操作
js/audio.js      ← 効果音
tasks/           ← タスク指示書
output/          ← 完成ファイル置き場
```

## セッション開始テンプレート

```
tasks/TASK_FILE_MAP.md を読んでTASK-XXの必要ファイルを確認してください。
そのファイルだけ読み込み、tasks/TASK-XX_XXX.md の指示通りに変更を加えてください。

ルール:
- 変更箇所に // [TASK-XX] コメントを必ず付ける
- 指示にないファイル・箇所は変更しない
- 完了後に変更ファイルをそのまま上書き保存する
- 最後にチェックリストの確認結果を報告する
```

## 武器を追加するだけなら

`js/weapons.js` の WEAPONS[] に1エントリ追加するだけ。他ファイル変更不要。

## 並列実行グループ

🟢 同時OK: TASK-03 TASK-05 TASK-06 TASK-08
🟡 第2波:  TASK-01 TASK-07 TASK-02
🔴 第3波:  TASK-04（TASK-02依存）
