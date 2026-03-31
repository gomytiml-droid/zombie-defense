// ============================================================
// shop.js — ショップUI・アップグレード管理
// ゲーム画面右サイドパネルに表示。購入でステータスが上昇する
// ============================================================

const SHOP_ITEMS = [
  {
    id: 'pistol_dmg', label: 'ピストル ダメージ+8',
    cost: () => 40 + WEAPONS[0].upgDmg * 30,
    action: () => WEAPONS[0].upgDmg++,
    max: 5, cur: () => WEAPONS[0].upgDmg,
  },
  {
    id: 'shotgun_rate', label: 'ショットガン 速度+',
    cost: () => 50 + WEAPONS[1].upgRate * 35,
    action: () => WEAPONS[1].upgRate++,
    max: 4, cur: () => WEAPONS[1].upgRate,
  },
  {
    id: 'mg_dmg', label: 'マシンガン ダメージ+8',
    cost: () => 45 + WEAPONS[2].upgDmg * 30,
    action: () => WEAPONS[2].upgDmg++,
    max: 5, cur: () => WEAPONS[2].upgDmg,
  },
  {
    id: 'speed', label: '移動速度アップ',
    cost: () => 60 + upgrades.speed * 40,
    action: () => upgrades.speed++,
    max: 4, cur: () => upgrades.speed,
  },
  {
    id: 'armor', label: '防具 ダメージ-8%',
    cost: () => 80 + upgrades.armor * 50,
    action: () => upgrades.armor++,
    max: 5, cur: () => upgrades.armor,
  },
  {
    id: 'coinmag', label: 'コイン吸引範囲+',
    cost: () => 35 + upgrades.coinMag * 25,
    action: () => upgrades.coinMag++,
    max: 5, cur: () => upgrades.coinMag,
  },
  {
    id: 'hp', label: 'HP回復 +30',
    cost: () => 50,
    action: () => { player.hp = Math.min(player.maxHp, player.hp + 30); },
    max: 99, cur: () => 0,
  },
];

// ─── ショップを開く（アイテム一覧を動的生成）─────────────────
function openShop() {
  if (!gameRunning) return;
  const items = document.getElementById('shop-items');
  items.innerHTML = '';
  SHOP_ITEMS.forEach(item => {
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

// ─── アイテム購入 ─────────────────────────────────────────────
function buyItem(id) {
  const item = SHOP_ITEMS.find(i => i.id === id);
  if (!item) return;
  const cost = item.cost();
  if (money < cost || item.cur() >= item.max) return;
  money -= cost;
  item.action();
  openShop(); // リストを再描画
}

// ─── ショップを閉じる ─────────────────────────────────────────
function closeShop() {
  document.getElementById('shop-panel').classList.remove('show');
}
