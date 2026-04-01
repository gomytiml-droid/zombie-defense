# TASK-15c — 物理攻撃ボタン UI（HTML / CSS）

## 概要

`#action-bar` に「👊物理」ボタンを追加し、スタイルを設定する。

---

## 変更対象ファイル

- `zombie_defense_v2.html`
- `zombie_defense_v2.css`

---

## 変更しないもの

- `js/` フォルダ内のすべての JS ファイル

---

## HTML の変更

`#action-bar` に物理攻撃ボタンを追加する。
**窓修理ボタンの直後、ドアボタンの前**に挿入する。

`#action-bar` の現在の構造（参考）：
```html
<div id="action-bar">
  <div class="abtn" id="repairBtn">窓修理<br><span style="font-size:9px">窓に近づくと自動</span></div>
  <!-- ここに挿入 -->
  ...
</div>
```

**追加するボタン：**
```html
<div class="abtn phys-btn" id="physBtn" onclick="doPhysicalAttack()">👊<br><span style="font-size:9px">物理攻撃</span></div><!-- [TASK-15c] -->
```

---

## CSS の変更

`.abtn` ルールの後に追記する：

```css
/* [TASK-15c] 物理攻撃ボタン */
.phys-btn{border-color:rgba(255,100,60,0.6);color:#ff7a4a;}
.phys-btn:active{background:rgba(80,20,0,0.7);border-color:#ff7a4a;}
```

---

## チェックリスト（完了時に報告）

- [ ] HTML に `id="physBtn"` ボタンを追加した（`onclick="doPhysicalAttack()"`）
- [ ] CSS に `.phys-btn` スタイルを追加した
- [ ] 既存の他ボタンレイアウトを変更していないことを確認した
- [ ] 指示にない箇所を変更していないことを確認した

---

## 注意

- 変更箇所に `/* [TASK-15c] */` コメントを付ける
- `zombie_defense_v2.js`（モノリシック版）は触らない
