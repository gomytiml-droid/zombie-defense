// ============================================================
// input.js — 入力管理（キーボード・タッチジョイスティック）
// ============================================================

let moveX = 0, moveY = 0;

const pad  = document.getElementById('stick-pad');
const knob = document.getElementById('stick-knob');
let stickId = -1;
const maxR = 22;

function updStick(cx, cy) {
  const rect = pad.getBoundingClientRect();
  const dx = cx - (rect.left + rect.width / 2);
  const dy = cy - (rect.top  + rect.height / 2);
  const dist = Math.hypot(dx, dy);
  const ang  = Math.atan2(dy, dx);
  const cl   = Math.min(dist, maxR);
  knob.style.transform = `translate(calc(-50% + ${Math.cos(ang)*cl}px), calc(-50% + ${Math.sin(ang)*cl}px))`;
  moveX = Math.cos(ang) * (Math.min(dist, maxR) / maxR);
  moveY = Math.sin(ang) * (Math.min(dist, maxR) / maxR);
}

pad.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.changedTouches[0];
  stickId = t.identifier;
  updStick(t.clientX, t.clientY);
}, { passive: false });

document.addEventListener('touchmove', e => {
  for (let t of e.changedTouches) { if (t.identifier === stickId) updStick(t.clientX, t.clientY); }
}, { passive: true });

document.addEventListener('touchend', e => {
  for (let t of e.changedTouches) {
    if (t.identifier === stickId) {
      stickId = -1; moveX = 0; moveY = 0;
      knob.style.transform = 'translate(-50%, -50%)';
    }
  }
}, { passive: true });

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'a') moveX = -1;
  if (e.key === 'ArrowRight' || e.key === 'd') moveX =  1;
  if (e.key === 'ArrowUp'    || e.key === 'w') moveY = -1;
  if (e.key === 'ArrowDown'  || e.key === 's') moveY =  1;
  // Tab/Q: スロット入れ替え
  if (e.key === 'Tab' || e.key === 'q' || e.key === 'Q') { e.preventDefault(); swapSlots(); }
  if (e.key === 'Escape') closeShop();
});

document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') moveX = 0;
  if (e.key === 'ArrowUp'    || e.key === 'w' || e.key === 'ArrowDown'  || e.key === 's') moveY = 0;
});

window.addEventListener('resize', () => { if (gameRunning) resize(); });
