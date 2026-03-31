// ============================================================
// shop.js — ショップUI・アップグレード管理
// ============================================================

const SHOP_ITEMS = [
  {
    id: 'pistol_dmg', label: 'ピストル ダメージ+8', weaponFilter: 0,
    cost: () => 40 + WEAPONS[0].upgDmg * 30,
    action: () => WEAPONS[0].upgDmg++,
    max: 5, cur: () => WEAPONS[0].upgDmg,
  },
  {
    id: 'pistol_rate', label: 'ピストル 速度+', weaponFilter: 0,
    cost: () => 50 + WEAPONS[0].upgRate * 35,
    action: () => WEAPONS[0].upgRate++,
    max: 4, cur: () => WEAPONS[0].upgRate,
  },
  {
    id: 'shotgun_dmg', label: 'ショットガン ダメージ+8', weaponFilter: 1,
    cost: () => 45 + WEAPONS[1].upgDmg * 30,
    action: () => WEAPONS[1].upgDmg++,
    max: 5, cur: () => WEAPONS[1].upgDmg,
  },
  {
    id: 'shotgun_rate', label: 'ショットガン 速度+', weaponFilter: 1,
    cost: () => 50 + WEAPONS[1].upgRate * 35,
    action: () => WEAPONS[1].upgRate++,
    max: 4, cur: () => WEAPONS[1].upgRate,
  },
  {
    id: 'mg_dmg', label: 'マシンガン ダメージ+8', weaponFilter: 2,
    cost: () => 45 + WEAPONS[2].upgDmg * 30,
    action: () => WEAPONS[2].upgDmg++,
    max: 5, cur: () => WEAPONS[2].upgDmg,
  },
  {
    id: 'speed', label: '移動速度アップ', weaponFilter: null,
    cost: () => 60 + upgrades.speed * 40,
    action: () => upgrades.speed++,
    max: 4, cur: () => upgrades.speed,
  },
  {
    id: 'armor', label: '防具 ダメージ-8%', weaponFilter: null,
    cost: () => 80 + upgrades.armor * 50,
    action: () => upgrades.armor++,
    max: 5, cur: () => upgrades.armor,
  },
  {
    id: 'coinmag', label: 'コイン吸引範囲+', weaponFilter: null,
    cost: () => 35 + upgrades.coinMag * 25,
    action: () => upgrades.coinMag++,
    max: 5, cur: () => upgrades.coinMag,
  },
  {
    id: 'hp', label: 'HP回復 +30', weaponFilter: null,
    cost: () => 50,
    action: () => { player.hp = Math.min(player.maxHp, player.hp + 30); },
    max: 99, cur: () => 0,
  },
];

function openShop() {
  if (!gameRunning) return;
  // 所持している銃のインデックスセット
  const ownedGuns = new Set(
    itemSlots.filter(s => s && s.type === 'gun').map(s => s.weaponIdx)
  );
  const items = document.getElementById('shop-items');
  items.innerHTML = '';
  SHOP_ITEMS.forEach(item => {
    // 銃アップグレードは所持している銃だけ表示
    if (item.weaponFilter !== null && !ownedGuns.has(item.weaponFilter)) return;
    const cost = item.cost(), cur = item.cur();
    const maxed = cur >= item.max, affordable = money >= cost;
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.innerHTML = `
      <div class="shop-info">
        <b>${item.label}</b>
        Lv ${cur}/${item.max} — $${cost}
      </div>
      <button class="shop-btn"
        ${maxed || !affordable ? 'disabled' : ''}
        onclick="buyItem('${item.id}')">
        ${maxed ? 'MAX' : affordable ? '購入' : '不足'}
      </button>`;
    items.appendChild(div);
  });
  document.getElementById('shop-panel').classList.add('show');
}

function buyItem(id) {
  const item = SHOP_ITEMS.find(i => i.id === id);
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
