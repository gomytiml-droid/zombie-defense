# TASK-10｜スマホ縦画面レイアウト対応

## 目的
現在の横向きレイアウトを、スマートフォン縦画面（ポートレート）でフルプレイできるように再設計する。
ゲームロジック・マップ・カメラは変更しない。HTML/CSS/resize()のみ変更。

---

## 変更対象ファイル
- `zombie_defense_v2.html`（shop-panelをモーダルに移動）
- `zombie_defense_v2.css`（全面的に縦画面用に書き直し）
- `js/game.js`（resize()のcanvas高さ計算のみ変更）

---

## 完成レイアウトイメージ（縦画面 390×844px 想定）

```
┌────────────────────┐
│ WAVE HP SCR $ KEY  │ ← HUD（40px、1行に全部収める）
├────────────────────┤
│                    │
│    GAME CANVAS     │ ← 画面幅100%・高さは残り領域の大部分
│                    │
├────────────────────┤
│ [メイン] ⇆ [サブ]  │ ← アイテムスロット（52px）
├────────────────────┤
│ [窓修理]  [ショップ]│ ← アクションバー（48px）
├────────────────────┤
│  🕹️                │ ← コントロール（100px、左にスティック）
└────────────────────┘

ショップ = 画面全体を覆うfixedオーバーレイ（サイドパネル廃止）
```

---

## STEP 1 — zombie_defense_v2.html の変更

### 1a. shop-panelをbody末尾のfixed要素に移動

`#outer-wrap` の外に出して `#wrap` の後に配置する。
`#outer-wrap` の中に `#shop-panel` は置かない。

```html
</div><!-- /#outer-wrap ここで閉じる -->

<!-- [TASK-10] ショップをfixedオーバーレイに変更 -->
<div id="shop-panel">
  <div class="shop-header">
    <div class="shop-title">ショップ</div>
    <button class="shop-close-btn" onclick="closeShop()">✕</button>
  </div>
  <div id="shop-items"></div>
</div>
```

### 1b. #outer-wrap の構造をシンプルに

```html
<div id="outer-wrap">
  <div id="wrap">
    <!-- HUD、canvas-wrap、bottom はそのまま -->
  </div>
</div>
```

---

## STEP 2 — zombie_defense_v2.css の全面書き直し

以下の内容で **CSS全体を置き換える**：

```css
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;user-select:none;}
body{font-family:var(--font-sans,'sans-serif');background:#0d0d0d;height:100dvh;overflow:hidden;} /* [TASK-10] */

/* ─── 全体レイアウト：縦1列 ─────────────────────── */
#outer-wrap{display:flex;flex-direction:column;height:100dvh;width:100%;max-width:480px;margin:0 auto;} /* [TASK-10] */
#wrap{display:flex;flex-direction:column;flex:1;min-height:0;overflow:hidden;} /* [TASK-10] */

/* ─── HUD ────────────────────────────────────────── */
#hud{display:flex;justify-content:space-around;align-items:center;padding:4px 8px;background:#111;border-bottom:1px solid #222;flex-shrink:0;} /* [TASK-10] */
.hud-b{text-align:center;}
.hud-l{font-size:8px;color:#555;text-transform:uppercase;line-height:1;}
.hud-v{font-size:13px;font-weight:600;color:#eee;line-height:1.2;}

/* ─── Canvas ─────────────────────────────────────── */
#canvas-wrap{position:relative;flex:1;min-height:0;background:#111;} /* [TASK-10] flexで残り全部使う */
canvas{display:block;width:100%;height:100%;touch-action:none;} /* [TASK-10] */

/* ─── オーバーレイ ───────────────────────────────── */
#overlay{display:none;position:absolute;inset:0;background:rgba(0,0,0,.8);align-items:center;justify-content:center;flex-direction:column;gap:14px;z-index:10;}
#overlay.show{display:flex;}
.ov-title{font-size:28px;font-weight:600;color:#fff;}
.ov-sub{font-size:13px;color:#aaa;text-align:center;white-space:pre-line;}
.ov-btn{padding:12px 32px;border-radius:8px;border:none;background:#e24b4a;color:#fff;font-size:16px;cursor:pointer;min-width:160px;}

/* ─── ボトムUI ───────────────────────────────────── */
#bottom{display:flex;flex-direction:column;background:#111;border-top:1px solid #222;flex-shrink:0;} /* [TASK-10] */

/* アイテムスロット */
#item-slots{display:flex;gap:4px;padding:5px 8px;border-bottom:1px solid #1a1a1a;align-items:stretch;}
.item-slot{flex:1;padding:6px 4px;border-radius:6px;border:1px solid #333;background:#1a1a1a;font-size:11px;color:#666;text-align:center;cursor:pointer;transition:all .15s;min-height:40px;display:flex;align-items:center;justify-content:center;} /* [TASK-10] */
.item-slot.active-slot{border-color:#378add;background:#0c3a5a;color:#85B7EB;font-weight:700;}
.swap-btn{padding:4px 10px;border-radius:6px;border:1px solid #444;background:#1c1c1c;font-size:10px;color:#aaa;text-align:center;cursor:pointer;white-space:nowrap;flex-shrink:0;min-height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.swap-btn:active{background:#2a2a2a;}

/* アクションバー */
#action-bar{display:flex;gap:4px;padding:5px 8px;border-bottom:1px solid #1a1a1a;}
.abtn{flex:1;padding:7px 4px;border-radius:6px;border:1px solid #333;background:#1a1a1a;font-size:11px;color:#888;cursor:pointer;text-align:center;min-height:42px;} /* [TASK-10] */
.abtn.active{border-color:#EF9F27;background:#3a2800;color:#EF9F27;}

/* コントロール（スティック） */
#controls{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;height:96px;} /* [TASK-10] */
#stick-pad{width:76px;height:76px;border-radius:50%;border:1px solid #2a2a2a;background:#161616;position:relative;flex-shrink:0;touch-action:none;}
#stick-knob{width:32px;height:32px;border-radius:50%;background:#555;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transition:transform .05s;}

/* ─── ショップ：fixedオーバーレイ ────────────────── */
/* [TASK-10] サイドパネルからfullscreen固定モーダルに変更 */
#shop-panel{
  display:none;
  position:fixed;inset:0;
  background:#0d0d0d;
  flex-direction:column;
  padding:0;
  z-index:20;
  overflow-y:auto;
}
#shop-panel.show{display:flex;}
.shop-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid #333;flex-shrink:0;} /* [TASK-10] */
.shop-title{font-size:17px;font-weight:600;color:#fff;}
.shop-close-btn{background:none;border:1px solid #444;border-radius:6px;color:#aaa;font-size:16px;width:36px;height:36px;cursor:pointer;} /* [TASK-10] */
#shop-items{padding:10px;display:flex;flex-direction:column;gap:8px;}
.shop-item{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:10px;display:flex;align-items:center;gap:10px;}
.shop-info{flex:1;font-size:12px;color:#ccc;}
.shop-info b{color:#fff;font-size:13px;display:block;margin-bottom:2px;}
.shop-btn{padding:8px 14px;border-radius:6px;border:none;background:#EF9F27;color:#000;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;} /* [TASK-10] */
.shop-btn:disabled{background:#2a2a2a;color:#555;cursor:default;}
```

---

## STEP 3 — js/game.js の resize() を変更

```js
// 変更前
function resize() {
  VW = CWRAP.clientWidth;
  VH = Math.round(VW * 0.65);
  canvas.width  = VW;
  canvas.height = VH;
}

// 変更後
function resize() {
  VW = CWRAP.clientWidth;
  VH = CWRAP.clientHeight; // [TASK-10] flexで決まった高さをそのまま使う
  canvas.width  = VW;
  canvas.height = VH;
}
```

---

## 完了確認チェックリスト

- [ ] `#outer-wrap` が `flex-direction:column` で縦並びになっている
- [ ] `#canvas-wrap` が `flex:1` で残り領域を埋めている
- [ ] `canvas` が `width:100%;height:100%` で canvas-wrap を埋めている
- [ ] `#shop-panel` が `position:fixed;inset:0` のフルスクリーンオーバーレイになっている
- [ ] `.shop-header` に閉じるボタン（✕）がある
- [ ] `body` に `height:100dvh;overflow:hidden` がある
- [ ] `resize()` が `CWRAP.clientHeight` を使っている
- [ ] iPhone縦画面でHUD・キャンバス・コントロールが全部1画面に収まる
- [ ] ショップが全画面で開閉できる

---

## 注意事項

- ゲームロジック（game.js のloop以降）は変更しない
- マップサイズ（MAP_W=900, MAP_H=700）は変更しない  
- カメラシステムはそのまま動く（縦画面でも自動スクロール）
- `100dvh` を使うことでモバイルのアドレスバー問題を回避できる
