// ============================================================
// audio.js — Web Audio API を使った効果音合成
// 外部ファイル不要。すべて oscillator / noise で生成する
// ============================================================

let audioCtx = null;
function getAC() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// ─── 発射音（武器ごとに音色を変える）─────────────────────────
let lastMGSnd = 0;
function playShoot(wpIdx) {
  const ac = getAC();
  if (wpIdx === 2) { const n = Date.now(); if (n - lastMGSnd < 90) return; lastMGSnd = n; }
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  if (wpIdx === 0) {        // ピストル: 高音シャープなクリック
    o.type = 'square';
    o.frequency.setValueAtTime(900, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.07);
    g.gain.setValueAtTime(0.28, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.09);
    o.start(); o.stop(ac.currentTime + 0.09);
  } else if (wpIdx === 1) { // ショットガン: 低音ブーム
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(55, ac.currentTime + 0.18);
    g.gain.setValueAtTime(0.55, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
    o.start(); o.stop(ac.currentTime + 0.22);
  } else {                  // マシンガン: 軽いタタタ音
    o.type = 'square';
    o.frequency.setValueAtTime(650, ac.currentTime);
    o.frequency.exponentialRampToValueAtTime(280, ac.currentTime + 0.04);
    g.gain.setValueAtTime(0.14, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.05);
    o.start(); o.stop(ac.currentTime + 0.05);
  }
}

// ─── ゾンビ死亡音 ─────────────────────────────────────────────
function playDeath() {
  const ac = getAC();
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(320, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(70, ac.currentTime + 0.22);
  g.gain.setValueAtTime(0.22, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.25);
  o.start(); o.stop(ac.currentTime + 0.25);
}

// ─── コイン取得音（連打防止付き）─────────────────────────────
let lastCoinSnd = 0;
function playCoin() {
  const n = Date.now(); if (n - lastCoinSnd < 80) return; lastCoinSnd = n;
  const ac = getAC();
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = 'sine';
  o.frequency.setValueAtTime(880, ac.currentTime);
  o.frequency.setValueAtTime(1100, ac.currentTime + 0.05);
  g.gain.setValueAtTime(0.14, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.13);
  o.start(); o.stop(ac.currentTime + 0.13);
}

// ─── 窓破壊音（ノイズバースト）───────────────────────────────
function playWindowBreak() {
  const ac = getAC();
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.28), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = ac.createBufferSource(), g = ac.createGain();
  s.buffer = buf; s.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(0.45, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.28);
  s.start(); s.stop(ac.currentTime + 0.28);
}

// ─── 修理完了音（ド・ミ・ソ上昇）─────────────────────────────
function playRepairDone() {
  const ac = getAC();
  [523, 659, 784].forEach((f, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine'; o.frequency.value = f;
    const t = ac.currentTime + i * 0.1;
    g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.start(t); o.stop(t + 0.18);
  });
}

// ─── ウェーブクリア音（ファンファーレ）───────────────────────
function playWaveClear() {
  const ac = getAC();
  [523, 659, 784, 1046].forEach((f, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine'; o.frequency.value = f;
    const t = ac.currentTime + i * 0.13;
    g.gain.setValueAtTime(0.26, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.start(t); o.stop(t + 0.22);
  });
}

// ─── 被弾音（連打防止付き）───────────────────────────────────
let lastHurtSnd = 0;
function playHurt() {
  const n = Date.now(); if (n - lastHurtSnd < 280) return; lastHurtSnd = n;
  const ac = getAC();
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(160, ac.currentTime);
  o.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.11);
  g.gain.setValueAtTime(0.18, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.13);
  o.start(); o.stop(ac.currentTime + 0.13);
}
