// ============================================================
// input.js — 入力管理（キーボード・フローティングタッチスティック）
// ============================================================

let moveX = 0, moveY = 0;

// [TASK-11] フローティングスティック
const FLOAT_MAX_R = 60;   // px: この距離でmoveが±1.0
let stickId    = -1;
let originX    = 0;
let originY    = 0;

const canvasWrap = document.getElementById('canvas-wrap'); // [TASK-11]

canvasWrap.addEventListener('touchstart', e => { // [TASK-11]
  e.preventDefault();
  if (stickId !== -1) return;           // 既に操作中なら無視
  const t = e.changedTouches[0];
  stickId = t.identifier;
  originX = t.clientX;
  originY = t.clientY;
  moveX = 0;
  moveY = 0;
}, { passive: false });

document.addEventListener('touchmove', e => { // [TASK-11]
  for (const t of e.changedTouches) {
    if (t.identifier !== stickId) continue;
    const dx = t.clientX - originX;
    const dy = t.clientY - originY;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) { moveX = 0; moveY = 0; continue; }
    const ratio = Math.min(dist, FLOAT_MAX_R) / FLOAT_MAX_R;
    moveX = (dx / dist) * ratio;
    moveY = (dy / dist) * ratio;
  }
}, { passive: true });

document.addEventListener('touchend', e => { // [TASK-11]
  for (const t of e.changedTouches) {
    if (t.identifier !== stickId) continue;
    stickId = -1;
    moveX = 0;
    moveY = 0;
  }
}, { passive: true });

document.addEventListener('touchcancel', e => { // [TASK-11]
  for (const t of e.changedTouches) {
    if (t.identifier !== stickId) continue;
    stickId = -1;
    moveX = 0;
    moveY = 0;
  }
}, { passive: true });

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'a') moveX = -1;
  if (e.key === 'ArrowRight' || e.key === 'd') moveX =  1;
  if (e.key === 'ArrowUp'    || e.key === 'w') moveY = -1;
  if (e.key === 'ArrowDown'  || e.key === 's') moveY =  1;
  if (e.key === 'Tab' || e.key === 'q' || e.key === 'Q') { e.preventDefault(); swapSlots(); }
  if (e.key === 'Escape') closeShop();
});

document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') moveX = 0;
  if (e.key === 'ArrowUp'    || e.key === 'w' || e.key === 'ArrowDown'  || e.key === 's') moveY = 0;
});

window.addEventListener('resize', () => { if (gameRunning) resize(); });
