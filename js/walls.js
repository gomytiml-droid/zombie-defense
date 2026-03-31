// ============================================================
// walls.js — 壁の衝突判定システム
// AABB（軸平行境界ボックス）と円の衝突を検出し押し出す
// ============================================================

// ─── アクティブな壁リストを取得（毎フレームキャッシュ）─────────
function getActiveWalls() {
  if (_wallCache) return _wallCache;
  _wallCache = [...OUTER_WALLS, ...INNER_WALLS];
  // 窓ギャップ: 窓が開いていない時だけ壁として追加
  WIN_GAPS.forEach(wg => {
    if (!windows[wg.wi].open) _wallCache.push(wg);
  });
  // 鍵付きドア: 未解錠の部屋の入口を壁として追加
  LOCKED_ROOMS.forEach(room => {
    if (!lockedRoomState[room.id]) _wallCache.push(room.door);
  });
  return _wallCache;
}

// ─── エンティティを壁から押し出す ─────────────────────────────
// 3回反復することでコーナー挟まりを解消する
function resolveWalls(entity) {
  const walls = getActiveWalls();
  for (let iter = 0; iter < 3; iter++) {
    walls.forEach(w => {
      const nx = Math.max(w.x, Math.min(entity.x, w.x + w.w));
      const ny = Math.max(w.y, Math.min(entity.y, w.y + w.h));
      const dx = entity.x - nx, dy = entity.y - ny;
      const dist = Math.hypot(dx, dy);
      if (dist < entity.r) {
        if (dist > 0.001) {
          const push = entity.r - dist;
          entity.x += (dx / dist) * push;
          entity.y += (dy / dist) * push;
        } else {
          const eL = entity.x - w.x,        eR = w.x + w.w - entity.x;
          const eT = entity.y - w.y,        eB = w.y + w.h - entity.y;
          const m  = Math.min(eL, eR, eT, eB);
          if      (m === eL) entity.x = w.x         - entity.r;
          else if (m === eR) entity.x = w.x + w.w   + entity.r;
          else if (m === eT) entity.y = w.y         - entity.r;
          else               entity.y = w.y + w.h   + entity.r;
        }
      }
    });
  }
}
