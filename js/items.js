// ============================================================
// items.js — 鍵・鍵付き部屋・床アイテム・近接攻撃を管理する
// ============================================================

// [TASK-13a] ドア操作クールダウン管理
let lastDoorActionTime = 0;
const DOOR_ACTION_COOLDOWN = 300; // ms (0.3秒)

// [TASK-15a] 物理攻撃中断管理
const MELEE_INTERRUPT_DURATION = 500; // ms — 物理攻撃後に自動迎撃を中断する時間
let meleeInterruptEndTime = 0;        // この時刻まで自動迎撃を中断

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

// ─── どちらかのスロットにある近接武器を返す（物理攻撃ボタン用） [TASK-15a]
function getAnyMelee() {
  for (let i = 0; i < itemSlots.length; i++) {
    const s = itemSlots[i];
    if (s && s.type === 'melee') return MELEE_WEAPONS[s.meleeIdx];
  }
  return null; // 近接武器なし → 素手
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

// ─── 近接攻撃共通実行（doMeleeAuto / doPhysicalAttack 共用）─── [TASK-15a]
function _executeMeleeAttack(damage, range, arc, color) {
  if (!zombies.length) return;
  let nearest = null, nd = Infinity;
  zombies.forEach(z => {
    const d = Math.hypot(z.x - player.x, z.y - player.y);
    if (d < range && d < nd) { nd = d; nearest = z; }
  });
  if (!nearest) return;

  const baseAngle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
  zombies.forEach(z => {
    const d = Math.hypot(z.x - player.x, z.y - player.y);
    if (d > range) return;
    let diff = Math.atan2(z.y - player.y, z.x - player.x) - baseAngle;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) > arc / 2) return;
    z.hp -= damage;
    addParticle(z.x, z.y, '#cc3311', 6);
    if (z.hp <= 0) zombieDie(z);
  });
  meleeAnim = { x: player.x, y: player.y, angle: baseAngle, range, arc, timer: 12, maxTimer: 12, color };
}

// ─── 自動近接攻撃（アクティブスロットが近接武器の時） ─────────── [TASK-15a]
function doMeleeAuto(now) {
  if (now < meleeInterruptEndTime) return; // 物理攻撃中断中はスキップ
  const mw = getActiveMelee();
  if (!mw || now < nextMeleeTime) return;
  nextMeleeTime = now + mw.cooldown;
  _executeMeleeAttack(mw.damage, mw.range, mw.arc, mw.color);
}

// ─── 物理攻撃（ボタン発動）────────────────────────────────────── [TASK-15a]
// 武器なし → 素手殴打 / 近接武器所持 → 武器攻撃（1.3倍ダメージ）
function doPhysicalAttack() {
  if (!gameRunning) return;
  const now = performance.now();
  if (now < nextMeleeTime) return; // クールダウン中

  // 自動迎撃を一時中断
  meleeInterruptEndTime = now + MELEE_INTERRUPT_DURATION;

  const mw = getAnyMelee();
  if (mw) {
    // 近接武器あり: 1.3倍強化攻撃
    nextMeleeTime = now + mw.cooldown;
    _executeMeleeAttack(Math.round(mw.damage * 1.3), mw.range, mw.arc, mw.color);
    addFloat(player.x, player.y - 28, mw.name + '!', mw.color);
  } else {
    // 素手殴打: 範囲狭い・ダメージそこそこ
    nextMeleeTime = now + 600;
    _executeMeleeAttack(30, 35, Math.PI * 0.9, '#ffaa44');
    addFloat(player.x, player.y - 28, '素手!', '#ffaa44');
  }
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

// ─── 鍵ドアを手動でトグル開閉（タップ操作） ──────────────────────────────
// [TASK-13a]
function tryToggleDoor() {
  if (playerKeys <= 0) return;
  const now = performance.now();
  if (now - lastDoorActionTime < DOOR_ACTION_COOLDOWN) return;

  let acted = false;
  LOCKED_ROOMS.forEach(room => {
    if (acted) return;
    const d = room.door;
    const cx = d.x + d.w / 2, cy = d.y + d.h / 2;
    if (Math.hypot(cx - player.x, cy - player.y) < 52) {
      lockedRoomState[room.id] = !lockedRoomState[room.id];
      _wallCache = null;
      lastDoorActionTime = now;
      acted = true;
      const label = lockedRoomState[room.id]
        ? room.label + ' 解錠!'
        : room.label + ' 施錠';
      const color = lockedRoomState[room.id] ? '#EF9F27' : '#aaaaaa';
      addFloat(cx, cy - 20, label, color);
    }
  });
}

// ─── 近くにドアがあるか判定（UIボタンの active 制御用） ────────
// [TASK-13a]
function isNearDoor() {
  if (playerKeys <= 0) return false;
  return LOCKED_ROOMS.some(room => {
    const d = room.door;
    const cx = d.x + d.w / 2, cy = d.y + d.h / 2;
    return Math.hypot(cx - player.x, cy - player.y) < 52;
  });
}
