# TASK-09｜武器パターン化リファクタリング

## 目的

武器を1本追加するとき **`js/weapons.js` だけ編集すれば完結する** 構造にする。
現状は constants.js と shop.js の2ファイルを同時に触る必要があり非効率。

---

## やること（3ステップ）

---

### STEP 1 — `js/weapons.js` を新規作成

以下の内容でファイルを作る。

```js
// ============================================================
// weapons.js — 武器マスターデータ（銃・近接）＋アップグレード定義
// 武器を追加するときはこのファイルだけ編集すればよい
// ============================================================

// ─── 銃マスター ───────────────────────────────────────────────
// shopUpgrades: ショップに表示するアップグレード項目
//   stat    : WEAPONSオブジェクトのプロパティ名（直接インクリメント）
//   label   : ショップ表示名
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
```

---

### STEP 2 — `js/constants.js` から武器データを削除

constants.js の中から以下の2ブロックを**削除**する（weapons.jsに移したため）：

- `const WEAPONS = [...]` ブロック全体
- `const MELEE_WEAPONS = [...]` ブロック全体

それ以外（MAP_W/H、ROOMS、WIN_DEFS、OUTER_WALLS、WIN_GAPS、INNER_WALLS、LOCKED_ROOMS、HALLWAY_ITEM）は**変更しない**。

---

### STEP 3 — `js/shop.js` のSHOP_ITEMSを自動生成に変更

`openShop()` 関数の先頭で WEAPONS.shopUpgrades から武器ショップ項目を動的生成し、
固定アイテム（speed/armor/coinmag/hp）と結合する。

```js
// ============================================================
// shop.js — ショップUI・アップグレード管理
// ============================================================

// 固定ショップアイテム（武器以外）
const SHOP_ITEMS_BASE = [
  {
    id:'speed', label:'移動速度アップ', weaponFilter:null,
    cost:()=>60+upgrades.speed*40, action:()=>upgrades.speed++,
    max:4, cur:()=>upgrades.speed,
  },
  {
    id:'armor', label:'防具 ダメージ-8%', weaponFilter:null,
    cost:()=>80+upgrades.armor*50, action:()=>upgrades.armor++,
    max:5, cur:()=>upgrades.armor,
  },
  {
    id:'coinmag', label:'コイン吸引範囲+', weaponFilter:null,
    cost:()=>35+upgrades.coinMag*25, action:()=>upgrades.coinMag++,
    max:5, cur:()=>upgrades.coinMag,
  },
  {
    id:'hp', label:'HP回復 +30', weaponFilter:null,
    cost:()=>50,
    action:()=>{ player.hp=Math.min(player.maxHp, player.hp+30); },
    max:99, cur:()=>0,
  },
];

// WEAPONS.shopUpgradesから武器ショップ項目を動的生成
function buildWeaponShopItems(ownedGuns) {
  const items = [];
  WEAPONS.forEach(wp => {
    if (!ownedGuns.has(wp.idx)) return;
    wp.shopUpgrades.forEach(upg => {
      items.push({
        id:           upg.id,
        label:        wp.name + ' ' + upg.label,
        weaponFilter: wp.idx,
        cost:         () => upg.cost0 + wp[upg.stat] * upg.step,
        action:       () => wp[upg.stat]++,
        max:          upg.max,
        cur:          () => wp[upg.stat],
      });
    });
  });
  return items;
}

function openShop() {
  if (!gameRunning) return;
  const ownedGuns = new Set(
    itemSlots.filter(s => s && s.type === 'gun').map(s => s.weaponIdx)
  );
  // 武器アップグレード（所持分のみ）＋固定アイテムを結合
  const allItems = [...buildWeaponShopItems(ownedGuns), ...SHOP_ITEMS_BASE];

  const items = document.getElementById('shop-items');
  items.innerHTML = '';
  allItems.forEach(item => {
    const cost=item.cost(), cur=item.cur();
    const maxed=cur>=item.max, affordable=money>=cost;
    const div=document.createElement('div');
    div.className='shop-item';
    div.innerHTML=`
      <div class="shop-info">
        <b>${item.label}</b>
        Lv ${cur}/${item.max} — $${cost}
      </div>
      <button class="shop-btn"
        ${maxed||!affordable?'disabled':''}
        onclick="buyItem('${item.id}')">
        ${maxed?'MAX':affordable?'購入':'不足'}
      </button>`;
    items.appendChild(div);
  });
  document.getElementById('shop-panel').classList.add('show');
}

function buyItem(id) {
  // 武器アップグレードと固定アイテム両方から検索
  const ownedGuns = new Set(
    itemSlots.filter(s => s && s.type === 'gun').map(s => s.weaponIdx)
  );
  const allItems = [...buildWeaponShopItems(ownedGuns), ...SHOP_ITEMS_BASE];
  const item = allItems.find(i => i.id === id);
  if (!item) return;
  const cost = item.cost();
  if (money < cost || item.cur() >= item.max) return;
  money -= cost;
  item.action();
  openShop();
}

function closeShop() {
  document.getElementById('shop-panel').classList.remove('show');
}
```

---

### STEP 4 — `zombie_defense_v2.html` に weapons.js を追加

`<script src="js/constants.js"></script>` の**前**に1行追加する：

```html
<script src="js/weapons.js"></script>
```

---

### STEP 5 — `js/game.js` の startGame() の武器リセットを修正

```js
// 変更前
WEAPONS.forEach(w => { w.upgDmg = 0; w.upgRate = 0; w.upgRange = 0; });

// 変更後（shopUpgradesのstatを使って汎用的にリセット）
WEAPONS.forEach(w => {
  w.shopUpgrades.forEach(upg => { w[upg.stat] = 0; }); // [TASK-09]
});
```

---

## 完了確認チェックリスト

- [ ] `js/weapons.js` が新規作成されている
- [ ] WEAPONS[0/1/2] それぞれに `shopUpgrades[]` が定義されている
- [ ] `js/constants.js` から WEAPONS・MELEE_WEAPONS が削除されている
- [ ] `js/shop.js` に SHOP_ITEMS_BASE と buildWeaponShopItems() がある
- [ ] openShop() が buildWeaponShopItems() を使って動的生成している
- [ ] buyItem() が allItems から検索している
- [ ] `zombie_defense_v2.html` に `<script src="js/weapons.js">` が追加されている
- [ ] `js/game.js` の武器リセットが shopUpgrades ベースになっている
- [ ] ブラウザで開いてショップが正常に表示・購入できる

---

## 武器追加時の手順（TASK-09完了後）

新しい武器「スナイパーライフル」を追加する場合：

```js
// weapons.js の WEAPONS[] に追加するだけ
{
  id:'sniper', name:'スナイパー', idx:3,
  fireRate:2000, damage:120, range:300, spread:0.01, bullets:1, color:'#A8D8EA',
  upgDmg:0, upgRate:0, upgRange:0,
  shopUpgrades:[
    {id:'sniper_dmg', stat:'upgDmg', label:'ダメージ+15', cost0:80, step:50, max:4},
  ],
},
```

**他ファイルの変更は不要。**
