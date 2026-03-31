# TASK-02｜武器バランス調整

## あなたへの指示

`zombie_defense_v2.js` を読み込んで、以下の変更を加えてください。
変更した箇所には必ずコメント `// [TASK-02]` を付けてください。
**それ以外の箇所は一切変更しないでください。**

---

## 変更内容

### 1. `WEAPONS` 定数を丸ごと置き換え

```js
// 変更後（配列全体を置き換え）
const WEAPONS=[ // [TASK-02]
  {name:'ピストル',  fireRate:420, damage:22, range:155, spread:0.06, bullets:1, color:'#FAC775', upgDmg:0,upgRate:0,upgRange:0},
  {name:'ショットガン',fireRate:750, damage:16, range:100, spread:0.42, bullets:6, color:'#F0997B', upgDmg:0,upgRate:0,upgRange:0},
  {name:'マシンガン', fireRate:95,  damage:8,  range:150, spread:0.14, bullets:1, color:'#9FE1CB', upgDmg:0,upgRate:0,upgRange:0},
];
```

### 2. `fireAuto()` の計算式を修正

```js
// 変更前
const rate=Math.max(60,wp.fireRate-wp.upgRate*80);
const dmg=wp.damage+wp.upgDmg*8;
const range=(wp.range+wp.upgRange*20)*1.5;

// 変更後
const rate=Math.max(currentWeapon===1?300:60, wp.fireRate-wp.upgRate*70); // [TASK-02] SG最短300ms
const dmg=(wp.damage+wp.upgDmg*(currentWeapon===2?4:6)); // [TASK-02] MG+4/段、他+6/段
const range=(wp.range+wp.upgRange*25)*1.5; // [TASK-02] upgRange反映を25に
```

### 3. `SHOP_ITEMS` の武器強化項目を置き換え

以下の4項目（`pistol_dmg` `shotgun_rate` `mg_dmg` の既存3項目）を下記で置き換えてください：

```js
{id:'pistol_dmg',   label:'ピストル ダメージ+6',  cost:()=>35+WEAPONS[0].upgDmg*25, action:()=>WEAPONS[0].upgDmg++, max:6, cur:()=>WEAPONS[0].upgDmg}, // [TASK-02]
{id:'shotgun_rate', label:'ショットガン 速度アップ',cost:()=>45+WEAPONS[1].upgRate*30, action:()=>WEAPONS[1].upgRate++, max:5, cur:()=>WEAPONS[1].upgRate}, // [TASK-02]
{id:'mg_range',     label:'マシンガン 射程+',      cost:()=>40+WEAPONS[2].upgRange*28,action:()=>WEAPONS[2].upgRange++,max:5, cur:()=>WEAPONS[2].upgRange}, // [TASK-02]
{id:'mg_dmg',       label:'マシンガン ダメージ+4', cost:()=>50+WEAPONS[2].upgDmg*35, action:()=>WEAPONS[2].upgDmg++, max:4, cur:()=>WEAPONS[2].upgDmg},   // [TASK-02]
```

※ `mg_dmg` が新規追加になるので、`SHOP_ITEMS` の配列に項目が1つ増えます。

---

## 完了確認

- [ ] `WEAPONS` の3武器のパラメータが新しい値になっている
- [ ] ショットガンの `fireRate` が 750 になっている
- [ ] `fireAuto()` の `rate` 計算でSGに300msフロアがある
- [ ] `dmg` 計算でMGは+4/段、他は+6/段になっている
- [ ] `SHOP_ITEMS` に `mg_range` が追加されている（4武器強化項目）
- [ ] 変更箇所すべてに `// [TASK-02]` コメントがある
