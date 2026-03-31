// ============================================================
// items.js — 鍵・鍵付き部屋・床アイテム・近接攻撃を管理する
// ============================================================

// ─── 初期化（startGame から呼ぶ）────────────────────────────
function initItems() {
  LOCKED_ROOMS.forEach(r => { lockedRoomState[r.id] = false; });

  // 床アイテム: 各鍵付き部屋の戦利品 + 廊下のMG
  floorItems = LOCKED_ROOMS.map(r => ({
    x: r.lootPos.x, y: r.lootPos.y,
    item: { ...r.loot },
    roomId: r.id,
  }));
  floorItems.push({ ...HALLWAY_ITEM, item: { ...HALLWAY_ITEM.item } });

  itemSlots    = [{ type:'gun', weaponIdx:0, name:'ハンドガン' }, null];
  activeSlot   = 0;
  playerKeys   = 0;
  droppedKeys  = [];
  meleeAnim    = null;
  nextMeleeTime = 0;
  _wallCache   = null;
  updateItemHUD();
}

// ─── アクティブ武器取得 ───────────────────────────────────────
function getActiveWeapon() {
  const s = itemSlots[activeSlot];
  return (s && s.type === 'gun') ? WEAPONS[s.weaponIdx] : null;
}
function getActiveMelee() {
  const s = itemSlots[activeSlot];
  return (s && s.type === 'melee') ? MELEE_WEAPONS[s.meleeIdx] : null;
}

// ─── スロット入れ替え ─────────────────────────────────────────
function swapSlots() {
  activeSlot = activeSlot === 0 ? 1 : 0;
  updateItemHUD();
}

// ─── アイテムHUD更新 ──────────────────────────────────────────
function updateItemHUD() {
  [0, 1].forEach(i => {
    const el = document.getElementById('item-slot-' + i);
    if (!el) return;
    const s = itemSlots[i];
    el.textContent = s ? s.name : '---';
    el.classList.toggle('active-slot', i === activeSlot);
  });
}

// ─── 近接自動攻撃 ─────────────────────────────────────────────
function doMeleeAuto(now) {
  const mw = getActiveMelee();
  if (!mw || now < nextMeleeTime || !zombies.length) return;

  let nearest = null, nd = Infinity;
  zombies.forEach(z => {
    const d = Math.hypot(z.x - player.x, z.y - player.y);
    if (d < mw.range && d < nd) { nd = d; nearest = z; }
  });
  if (!nearest) return;

  nextMeleeTime = now + mw.cooldown;
  const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);

  // 扇形の範囲内ゾンビ全員にダメージ
  zombies.forEach(z => {
    const d = Math.hypot(z.x - player.x, z.y - player.y);
    if (d > mw.range) return;
    let diff = Math.atan2(z.y - player.y, z.x - player.x) - baseAngle;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > mw.arc / 2) return;

    z.hp -= mw.damage;
    addParticle(z.x, z.y, '#cc3311', 6);
    if (z.hp <= 0) zombieDie(z);
  });

  // スイングアニメーション
  meleeAnim = {
    x: player.x, y: player.y,
    angle: baseAngle, range: mw.range, arc: mw.arc,
    timer: 12, maxTimer: 12, color: mw.color,
  };
}

// ─── 鍵ピックアップ ───────────────────────────────────────────
function updateKeyPickups() {
  droppedKeys = droppedKeys.filter(k => {
    if (Math.hypot(k.x - player.x, k.y - player.y) < player.r + 14) {
      playerKeys++;
      addFloat(k.x, k.y - 16, '鍵 入手!', '#EF9F27');
      document.getElementById('hKey').textContent = playerKeys;
      return false;
    }
    return true;
  });
}

// ─── 床アイテムピックアップ ───────────────────────────────────
function updateFloorItemPickups() {
  floorItems = floorItems.filter(fi => {
    // 鍵付き部屋のアイテムは解錠されていないと拾えない
    if (fi.roomId && !lockedRoomState[fi.roomId]) return true;
    if (Math.hypot(fi.x - player.x, fi.y - player.y) > player.r + 18) return true;

    const emptyIdx = itemSlots.findIndex(s => s === null);
    if (emptyIdx !== -1) {
      itemSlots[emptyIdx] = { ...fi.item };
      addFloat(fi.x, fi.y - 20, fi.item.name + ' 入手!', '#63c422');
      updateItemHUD();
      return false;
    }
    // 非アクティブスロットと強制交換
    const swapIdx = activeSlot === 0 ? 1 : 0;
    const dropped = itemSlots[swapIdx];
    itemSlots[swapIdx] = { ...fi.item };
    addFloat(fi.x, fi.y - 20, fi.item.name + ' 入手! (交換)', '#EF9F27');
    if (dropped) addFloat(fi.x, fi.y - 34, dropped.name + ' 捨てた', '#888');
    updateItemHUD();
    return false;
  });
}

// ─── 鍵ドアに近づいたら自動解錠 ──────────────────────────────
function tryUnlockNearby() {
  if (playerKeys <= 0) return;
  LOCKED_ROOMS.forEach(room => {
    if (lockedRoomState[room.id]) return;
    const d = room.door;
    const cx = d.x + d.w / 2, cy = d.y + d.h / 2;
    if (Math.hypot(cx - player.x, cy - player.y) < 52) {
      lockedRoomState[room.id] = true;
      playerKeys--;
      document.getElementById('hKey').textContent = playerKeys;
      addFloat(cx, cy - 20, room.label + ' 解錠!', '#EF9F27');
      _wallCache = null;
    }
  });
}
