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
// zombieSpriteCanvas: 白背景処理済みキャンバス（null の間はフォールバック描画）
// zombieSpriteImg:    生の img 要素（getImageData が使えない環境用）
let zombieSpriteCanvas = null;
let zombieSpriteImg    = null;

// スプライトシート座標 (1024×559, VIEW1 TOP-DOWN が 1行目)
// 4列 × 256px, 行高 ~186px
const SPRITE = {
  front: { sx:  15, sy: 22, sw: 230, sh: 145 },
  back:  { sx: 271, sy:  5, sw: 230, sh: 160 },
  left:  { sx: 527, sy:  5, sw: 230, sh: 160 },
  right: { sx: 783, sy:  5, sw: 230, sh: 160 },
};

(function loadZombieSprite() {
  const img = new Image();
  img.onload = () => {
    const oc     = document.createElement('canvas');
    oc.width     = img.naturalWidth;
    oc.height    = img.naturalHeight;
    const oc_ctx = oc.getContext('2d');
    oc_ctx.drawImage(img, 0, 0);
    try {
      // 白に近いピクセルを透明にする（同オリジン or GitHub Pages で動作）
      const imageData = oc_ctx.getImageData(0, 0, oc.width, oc.height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 218 && d[i+1] > 218 && d[i+2] > 218) d[i+3] = 0;
      }
      oc_ctx.putImageData(imageData, 0, 0);
      zombieSpriteCanvas = oc;
    } catch (_) {
      // file:// など SecurityError の場合: 生の img を使い multiply で白を消す
      zombieSpriteImg = img;
    }
  };
  img.onerror = () => console.warn('zombie_sprite.jpg を読み込めませんでした');
  img.src = 'images/zombie_sprite.jpg';
})();

// ─── アイテムスロット（メイン・サブ）──────────────────────────
// 各スロット: { type:'gun'|'melee', weaponIdx?:, meleeIdx?:, name: } | null
let itemSlots  = [{ type:'gun', weaponIdx:0, name:'ハンドガン' }, null];
let activeSlot = 0;

// ─── 床アイテム・鍵 ───────────────────────────────────────────
let floorItems  = [];  // { x, y, item, roomId }
let droppedKeys = [];  // { x, y } — ゾンビドロップ鍵
let playerKeys  = 0;

// ─── 鍵付き部屋の解錠状態 ─────────────────────────────────────
let lockedRoomState = {};  // { study:false, bathroom:false, wc:false }

// ─── 近接攻撃アニメーション ───────────────────────────────────
let meleeAnim     = null;  // { x,y,angle,range,arc,timer,maxTimer,color }
let nextMeleeTime = 0;
