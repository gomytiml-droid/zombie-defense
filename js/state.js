// ============================================================
// state.js — グローバル状態変数・DOM参照の一元管理
// ゲーム全体で共有する可変データをここで宣言する
// ============================================================

// ─── DOM参照 ──────────────────────────────────────────────────
const canvas = document.getElementById('c');
const ctx    = canvas.getContext('2d');
const CWRAP  = document.getElementById('canvas-wrap');

// ─── ビューポート・カメラ ─────────────────────────────────────
let VW, VH;
let camX = 0, camY = 0;

// ─── ゲームオブジェクト ───────────────────────────────────────
let player;       // {x,y,r,hp,maxHp,speed}
let zombies  = [];
let bullets  = [];
let coins    = [];
let particles = [];
let floatTexts = [];

// ─── ゲームスコア・進行 ───────────────────────────────────────
let score, kills, wave, money;
let waveTimer, spawnTimer, nextFireTime;

// ─── プレイヤー操作状態 ───────────────────────────────────────
let currentWeapon = 0;
let gameRunning   = false;

// ─── 修理状態 ─────────────────────────────────────────────────
let repairing    = false;
let repairTimer  = 0;
let repairTarget = null;

// ─── 窓・アップグレード ───────────────────────────────────────
let windows  = [];
let upgrades = {speed:0, armor:0, coinMag:0};

// ─── アニメーション ───────────────────────────────────────────
let animId;
let waveClearAnim  = 0;
let waveClearBonus = {score:0, money:0, wave:0};

// ─── 壁衝突キャッシュ（毎フレームリセット）────────────────────
let _wallCache = null;

// ─── スプライト画像（ロード後に描画で使用）────────────────────
let zombieSpriteCanvas = null; // 白背景を透明にした処理済みキャンバス

// スプライトシート内の各スプライト座標（px）
// 元画像: 1024×559, VIEW1(TOP-DOWN) の 4方向が 1行目に並ぶ
// ずれる場合は sx/sy/sw/sh を調整してください
const SPRITE = {
  // col × 256, row × 186 が各スプライトの大まかな開始位置
  // FRONT: 1列目, TOP-DOWN: 1行目
  front: { sx: 20,  sy: 28,  sw: 215, sh: 145 },
  back:  { sx: 276, sy: 28,  sw: 215, sh: 145 },
  left:  { sx: 532, sy: 28,  sw: 215, sh: 145 },
  right: { sx: 788, sy: 28,  sw: 215, sh: 145 },
};

(function loadZombieSprite() {
  const img = new Image();
  img.onload = () => {
    const oc = document.createElement('canvas');
    oc.width  = img.naturalWidth;
    oc.height = img.naturalHeight;
    const oc_ctx = oc.getContext('2d');
    oc_ctx.drawImage(img, 0, 0);
    const imageData = oc_ctx.getImageData(0, 0, oc.width, oc.height);
    const d = imageData.data;
    // 白に近いピクセルを透明にする
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > 220 && d[i+1] > 220 && d[i+2] > 220) d[i+3] = 0;
    }
    oc_ctx.putImageData(imageData, 0, 0);
    zombieSpriteCanvas = oc;
  };
  img.src = 'images/zombie_sprite.jpg';
})();
