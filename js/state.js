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
