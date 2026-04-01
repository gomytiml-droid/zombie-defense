# TASK-12 — フルスクリーンプレイ画面 + 半透明UIオーバーレイ

## 概要

現在の「HUD → キャンバス → ボトムUI」の縦積みレイアウトを廃止し、
**キャンバスを画面全体（100dvh）** に広げたうえで、
HUD・アイテムスロット・アクションボタンを **半透明オーバーレイ** としてキャンバス上に重ねる。

---

## 変更対象ファイル

- `zombie_defense_v2.css` ← **メイン変更**
- `zombie_defense_v2.html` ← `#wrap` への `position:relative` 追加のみ

---

## 変更しないもの

- `js/` フォルダ内のすべての JS ファイル
- ゲームロジック・DOM要素の ID・クラス名

---

## レイアウト設計

### 変更前
```
#outer-wrap (flex column, 100dvh)
  #wrap (flex column, flex:1)
    #hud     ← 固定高さ、上部
    #canvas-wrap ← flex:1 で残り
    #bottom  ← 固定高さ、下部
      #item-slots
      #action-bar
      #controls (height:96px)
```

### 変更後
```
#outer-wrap (flex column, 100dvh)
  #wrap (position:relative, flex:1)
    #canvas-wrap  ← position:absolute; inset:0 でフルスクリーン
      canvas
      #overlay
    #hud          ← position:absolute; top:0; 半透明
    #bottom       ← position:absolute; bottom:0; 半透明
      #item-slots
      #action-bar
      #controls (height:72px 縮小)
```

---

## CSS 変更詳細

### `#wrap` — position コンテナ化

```css
/* 変更前 */
#wrap{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;}

/* 変更後 */
#wrap{position:relative;flex:1;min-height:0;overflow:hidden;} /* [TASK-12] */
```

### `#canvas-wrap` — フルスクリーン化

```css
/* 変更前 */
#canvas-wrap{position:relative;flex:1;min-height:0;background:#111;}

/* 変更後 */
#canvas-wrap{position:absolute;inset:0;background:#111;} /* [TASK-12] */
```

### `#hud` — 上部半透明オーバーレイ

```css
/* 変更後 */
#hud{position:absolute;top:0;left:0;right:0;z-index:5;display:flex;justify-content:space-around;align-items:center;padding:4px 8px;background:rgba(0,0,0,0.55);border-bottom:1px solid rgba(255,255,255,0.07);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);} /* [TASK-12] */
```

### `#bottom` — 下部半透明オーバーレイ

```css
/* 変更後 */
#bottom{position:absolute;bottom:0;left:0;right:0;z-index:5;display:flex;flex-direction:column;background:transparent;border-top:none;} /* [TASK-12] */
```

### `#item-slots` — 半透明化

```css
/* 変更後 */
#item-slots{display:flex;gap:4px;padding:5px 8px;border-bottom:1px solid rgba(255,255,255,0.06);align-items:stretch;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);} /* [TASK-12] */
```

### `.item-slot` — 半透明ボタン

```css
/* 変更後 */
.item-slot{flex:1;padding:6px 4px;border-radius:6px;border:1px solid rgba(80,80,80,0.5);background:rgba(26,26,26,0.6);font-size:11px;color:#888;text-align:center;cursor:pointer;transition:all .15s;min-height:40px;display:flex;align-items:center;justify-content:center;} /* [TASK-12] */
```

### `.item-slot.active-slot` — アクティブスロット半透明

```css
.item-slot.active-slot{border-color:rgba(55,138,221,0.8);background:rgba(12,58,90,0.7);color:#85B7EB;font-weight:700;} /* [TASK-12] */
```

### `.swap-btn` — 半透明

```css
.swap-btn{padding:4px 10px;border-radius:6px;border:1px solid rgba(80,80,80,0.5);background:rgba(28,28,28,0.6);font-size:10px;color:#aaa;text-align:center;cursor:pointer;white-space:nowrap;flex-shrink:0;min-height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;} /* [TASK-12] */
```

### `#action-bar` — 半透明化

```css
/* 変更後 */
#action-bar{display:flex;gap:4px;padding:5px 8px;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);} /* [TASK-12] */
```

### `.abtn` — 半透明ボタン

```css
.abtn{flex:1;padding:7px 4px;border-radius:6px;border:1px solid rgba(80,80,80,0.5);background:rgba(26,26,26,0.6);font-size:11px;color:#888;cursor:pointer;text-align:center;min-height:42px;} /* [TASK-12] */
```

### `.abtn.active` — アクティブ状態半透明

```css
.abtn.active{border-color:rgba(239,159,39,0.8);background:rgba(58,40,0,0.7);color:#EF9F27;} /* [TASK-12] */
```

### `#controls` — 透明・縮小

```css
#controls{display:flex;align-items:center;justify-content:center;padding:4px 16px;height:72px;background:transparent;} /* [TASK-12] */
```

---

## HTML 変更詳細

CSS の `#wrap` ルール変更だけで対応完了。**HTML は変更不要**。

---

## チェックリスト（完了時に報告）

- [ ] `#wrap` を `position:relative` にした
- [ ] `#canvas-wrap` を `position:absolute; inset:0` にした
- [ ] `#hud` を `position:absolute; top:0; z-index:5` + `rgba` 背景にした
- [ ] `#bottom` を `position:absolute; bottom:0; z-index:5` + 透明背景にした
- [ ] `#item-slots` と `#action-bar` に `rgba` 背景と `backdrop-filter` を付けた
- [ ] `.item-slot`, `.abtn`, `.swap-btn` を半透明ボタンにした
- [ ] `#controls` を透明・高さ72pxに縮小した
- [ ] `#overlay` の `z-index:10` が HUD(5) より上であることを確認した
- [ ] ショップパネルの `z-index:20` が最前面であることを確認した
- [ ] 指示にない箇所を変更していないことを確認した

---

## 注意事項

- `js/` フォルダ内のファイルは**一切触らない**
- `zombie_defense_v2.js`（モノリシック版）も**触らない**
- HTML の DOM 構造（ID・クラス名）は**変更しない**
- 変更箇所には必ず `/* [TASK-12] */` コメントを付ける
- `backdrop-filter` は `-webkit-backdrop-filter` も必ずセットで書く（iOS Safari 対応）
