# ゾンビ防衛ゲーム — 並列開発ガイド

## フォルダ構成

```
zombie_tasks/
├── README.md              ← このファイル
├── TASK-01_難易度カーブ.md
├── TASK-02_武器バランス.md
├── TASK-03_ゾンビAI.md
├── TASK-04_ショップ経済.md
├── TASK-05_窓修理.md
├── TASK-06_マップ.md
├── TASK-07_スコア.md
└── TASK-08_モバイルUI.md
```

---

## Claude Code への渡し方（各セッション共通）

各タスクを **新しい Claude Code ウィンドウ** で開く。

### セッション開始時の最初の一声（コピペ用）

```
zombie_defense_v2.js、zombie_defense_v2.css、zombie_defense_v2.html を読み込んでください。
次に TASK-XX_XXX.md を読んで、指示通りに変更を加えてください。

ルール:
- 変更箇所には // [TASK-XX] コメントを必ず付ける
- 指示にない箇所は絶対に変更しない
- 完了したらファイルを zombie_defense_v2_taskXX.js として保存する
- 最後にチェックリストの確認結果を報告する
```

※ `XX` と `XXX` は実際のタスク番号・名前に置き換える。

---

## 並列実行の推奨グループ

### 🟢 第1波（完全独立 — 同時に走らせてOK）

| セッション | タスク | 編集ファイル |
|-----------|--------|-------------|
| Session A | TASK-03 ゾンビAI | .js のみ |
| Session B | TASK-05 窓修理 | .js のみ |
| Session C | TASK-06 マップ | .js のみ |
| Session D | TASK-08 モバイルUI | .js + .css |

### 🟡 第2波（第1波マージ後）

| セッション | タスク | 依存 |
|-----------|--------|------|
| Session E | TASK-01 難易度カーブ | なし（単独可だが TASK-07 と変数共有） |
| Session F | TASK-07 スコア | TASK-01 と `waveStartKills` 変数共有 |
| Session G | TASK-02 武器バランス | なし（単独可） |

### 🔴 第3波（TASK-02 マージ後）

| セッション | タスク | 依存 |
|-----------|--------|------|
| Session H | TASK-04 ショップ経済 | TASK-02 の `dmg` 計算式に乗算するため |

---

## マージ手順

### パターンA: 手動マージ（おすすめ）

各タスクの出力ファイルを diff ツールで確認しながら手動マージ。
`// [TASK-XX]` コメントが目印になる。

```bash
# 例: VSCode でdiff
code --diff zombie_defense_v2.js zombie_defense_v2_task03.js
```

### パターンB: Claude Code にマージを依頼

全タスク完了後、新しいセッションに以下を渡す：

```
以下のファイルをすべて読み込んでください：
- zombie_defense_v2.js（オリジナル）
- zombie_defense_v2_task01.js
- zombie_defense_v2_task03.js
- zombie_defense_v2_task05.js
- zombie_defense_v2_task06.js
- zombie_defense_v2_task07.js
- zombie_defense_v2_task08.js

各ファイルの // [TASK-XX] コメントの付いた変更点を
オリジナルに統合して zombie_defense_v2_merged.js を作ってください。
変更点が競合する場合は報告してください。
```

---

## 変数共有に注意が必要な箇所

| 変数名 | 宣言タスク | 参照タスク | 内容 |
|--------|-----------|-----------|------|
| `waveStartKills` | TASK-01 or TASK-07 | 両方 | Waveバナーの撃破数表示 |
| `dmgBoost` / `spdBoost` | TASK-04 | TASK-02（dmg計算） | バフ乗数 |

→ TASK-01 と TASK-07 は同じ変数を追加するので、マージ時に重複しないよう注意。

---

## トラブルシューティング

**Q: Claude Code がファイルを読み込まない**  
→ `cat zombie_defense_v2.js` を最初に実行させる指示を追加する

**Q: 変更が競合した**  
→ `// [TASK-XX]` コメントを grep で探して差分を特定する  
```bash
grep -n "\[TASK-" zombie_defense_v2_merged.js
```

**Q: 動作確認したい**  
→ html ファイルをブラウザで直接開く（ローカルサーバー不要）
