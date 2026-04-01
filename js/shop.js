// ============================================================
// shop.js — ショップUI・アップグレード管理
// 武器アップグレードは weapons.js の shopUpgrades から自動生成
// ============================================================

// ─── 固定ショップアイテム（武器以外）─────────────────────────
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

// ─── 武器アップグレード動的生成 ──────────────────────────────
// WEAPONS[].shopUpgrades から所持銃分だけ生成する
// 武器を追加しても weapons.js だけ編集すればOK
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
        action:       () => { wp[upg.stat]++; },
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
