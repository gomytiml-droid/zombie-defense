// ============================================================
// weapons.js — 武器マスターデータ（銃・近接）＋アップグレード定義
// 武器を追加するときはこのファイルだけ編集すればよい
// ============================================================

// ─── 銃マスター ───────────────────────────────────────────────
// shopUpgrades: ショップに表示するアップグレード項目
//   stat    : WEAPONSオブジェクトのプロパティ名（直接インクリメント）
//   label   : ショップ表示名（"武器名 ラベル" で表示される）
//   cost0   : 初期コスト
//   step    : レベルごとのコスト増加
//   max     : 最大レベル
const WEAPONS = [
  {
    id:'pistol', name:'ピストル', idx:0,
    fireRate:500, damage:25, range:160, spread:0.05, bullets:1, color:'#FAC775',
    upgDmg:0, upgRate:0, upgRange:0,
    shopUpgrades:[
      {id:'pistol_dmg',  stat:'upgDmg',  label:'ダメージ+8', cost0:40, step:30, max:5},
      {id:'pistol_rate', stat:'upgRate', label:'速度アップ',  cost0:50, step:35, max:4},
    ],
  },
  {
    id:'shotgun', name:'ショットガン', idx:1,
    fireRate:1100, damage:18, range:110, spread:0.45, bullets:5, color:'#F0997B',
    upgDmg:0, upgRate:0, upgRange:0,
    shopUpgrades:[
      {id:'shotgun_dmg',  stat:'upgDmg',  label:'ダメージ+8', cost0:45, step:30, max:5},
      {id:'shotgun_rate', stat:'upgRate', label:'速度アップ',  cost0:50, step:35, max:4},
    ],
  },
  {
    id:'mg', name:'マシンガン', idx:2,
    fireRate:120, damage:10, range:130, spread:0.18, bullets:1, color:'#9FE1CB',
    upgDmg:0, upgRate:0, upgRange:0,
    shopUpgrades:[
      {id:'mg_dmg', stat:'upgDmg', label:'ダメージ+8', cost0:45, step:30, max:5},
    ],
  },
];

// ─── 近接武器マスター ─────────────────────────────────────────
const MELEE_WEAPONS = [
  {id:'nail_bat', name:'釘バット', damage:95, range:65, arc:Math.PI*0.75, cooldown:850, color:'#A0522D'},
  {id:'katana',   name:'刀',      damage:60, range:85, arc:Math.PI*1.20, cooldown:350, color:'#B8C8D8'},
];
