# TASK-14c — NPC武器・コマンドUIボタン（render.js / HTML / CSS）

## 前提

**TASK-14a 完了後に実行すること。**
`giveWeaponToNPC()` / `commandNPC()` / `isNearNPC()` が実装済みであること。

---

## 概要

- `#action-bar` に「武器渡す」「ついて来い」「待機」ボタンを追加
- 近くにNPCがいるときだけ active になる
- NPC 描画に武器所持・行動コマンドの状態表示を追加

---

## 変更対象ファイル

- `zombie_defense_v2.html`
- `zombie_defense_v2.css`
- `js/render.js`

---

## HTML の変更

`#action-bar` の末尾（ショップボタンの前）にボタン3つ追加：

```html
<!-- [TASK-14c] NPC操作ボタン -->
<div class="abtn" id="npcWeaponBtn" onclick="giveWeaponToNPC()">🔫渡す<br><span style="font-size:9px">NPC武器</span></div>
<div class="abtn" id="npcFollowBtn" onclick="commandNPC('follow')">🚶<br><span style="font-size:9px">ついてこい</span></div>
<div class="abtn" id="npcStandbyBtn" onclick="commandNPC('standby')">✋<br><span style="font-size:9px">待機</span></div>
```

---

## CSS の変更

`.abtn` ルールの後に追記：

```css
/* [TASK-14c] NPC操作ボタン: 近くにNPCいないときグレーアウト */
#npcWeaponBtn:not(.active),
#npcFollowBtn:not(.active),
#npcStandbyBtn:not(.active){opacity:0.35;pointer-events:none;}
```

---

## render.js の変更

### 1. `draw()` 末尾に NPC ボタン状態更新を追加

```javascript
  // NPC ボタン状態更新 [TASK-14c]
  const nearNPC = typeof isNearNPC === 'function' && isNearNPC();
  ['npcWeaponBtn','npcFollowBtn','npcStandbyBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.toggle('active', nearNPC);
  });
  // followBtn / standbyBtn: コマンド中は強調
  if (nearNPC) {
    const target = npcs.find(n => !n.dead && Math.hypot(n.x - player.x, n.y - player.y) < 60);
    if (target) {
      const fb = document.getElementById('npcFollowBtn');
      const sb = document.getElementById('npcStandbyBtn');
      if (fb) fb.style.borderColor = target.command === 'follow'  ? '#85B7EB' : '';
      if (sb) sb.style.borderColor = target.command === 'standby' ? '#EF9F27' : '';
    }
  }
```

### 2. `drawNPCs()` の NPC 描画に武器・コマンド状態を追加

既存の `// ── ラベル ──` ブロックの後に追記する：

```javascript
    // ── 武器所持アイコン [TASK-14c] ──
    if (npc.weapon) {
      const icon = npc.weapon.type === 'melee' ? '⚔' : '🔫';
      ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = '#EF9F27';
      ctx.fillText(icon, npc.x + npc.r + 4, npc.y - npc.r - 5 + bob);
    }

    // ── コマンド状態アイコン [TASK-14c] ──
    if (npc.command === 'follow') {
      ctx.fillStyle = '#85B7EB'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('▶', npc.x, npc.y + npc.r + 8 + bob);
    } else if (npc.command === 'standby') {
      ctx.fillStyle = '#EF9F27'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('■', npc.x, npc.y + npc.r + 8 + bob);
    }
```

---

## チェックリスト（完了時に報告）

- [ ] HTML に 3 つの NPC ボタンを追加した
- [ ] CSS に グレーアウトスタイルを追加した
- [ ] `draw()` 末尾に NPC ボタン状態更新を追加した
- [ ] `drawNPCs()` に武器アイコン・コマンドアイコンを追加した
- [ ] 指示にない箇所を変更していないことを確認した
