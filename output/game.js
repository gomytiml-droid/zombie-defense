// ============================================================
// game.js — ゲームループ・状態管理・初期化・終了処理
// ============================================================

let currentRepairCost=20, repairRequired=180; // [TASK-05]
let waveStartKills=0; // [TASK-07] このWaveの開始時kills

function resize() {
  VW = CWRAP.clientWidth;
  VH = CWRAP.clientHeight; // [TASK-10] flexで決まった高さをそのまま使う
  canvas.width  = VW;
  canvas.height = VH;
}

function initWindows() {
  windows = WIN_DEFS.map(w => ({
    x: w.x, y: w.y, dir: w.dir,
    hp: Math.random() < 0.5 ? 0 : 60,
    maxHp: 60, open: false,
  }));
  windows.forEach(w => { if (w.hp <= 0) w.open = true; });
}

function startGame() {
  resize();
  document.getElementById('overlay').classList.remove('show');
  closeShop();
  player = { x: MAP_W/2, y: MAP_H/2, r: 11, hp: 100, maxHp: 100, speed: 2.4 };
  zombies = []; bullets = []; coins = []; particles = []; floatTexts = [];
  score = 0; kills = 0; wave = 1; money = 0;
  waveStartKills = 0; // [TASK-07]
  waveTimer = 0; spawnTimer = 0; nextFireTime = 0;
  repairing = false; repairTimer = 0; repairTarget = null;
  upgrades = { speed: 0, armor: 0, coinMag: 0 };
  waveClearAnim = 0;
  WEAPONS.forEach(w => { w.shopUpgrades.forEach(upg => { w[upg.stat] = 0; }); }); // [TASK-09]
  initWindows();
  initItems();   // アイテム・鍵・スロット初期化
  npcs = []; npcBullets = []; _npcSpawnTimer = 0;
  _wallCache = null;
  gameRunning = true;
  document.getElementById('hKey').textContent = '0';
  document.getElementById('hBest').textContent=localStorage.getItem('zombie_hi')||'0'; // [TASK-07]
  if (animId) cancelAnimationFrame(animId);
  loop();
}

function endGame() {
  gameRunning = false;
  // [TASK-07] ハイスコア保存
  const hiKey='zombie_hi';
  const prev=parseInt(localStorage.getItem(hiKey)||'0');
  const isHi=score>prev;
  if(isHi)localStorage.setItem(hiKey,score);
  document.getElementById('hBest').textContent=Math.max(score,prev);
  document.getElementById('ovTitle').textContent=isHi?'🏆 NEW RECORD!':'GAME OVER';
  document.getElementById('ovSub').textContent=
    `スコア: ${score}  |  WAVE ${wave}  |  ${kills}体撃破  |  $${money}\n`+
    (isHi?'新記録達成！':`ハイスコア: ${prev}`);
  document.getElementById('overlay').classList.add('show');
}

// [TASK-05] 修理コスト動的計算
function tryRepair(){
  if(!gameRunning)return;
  const near=nearestDamagedWindow();
  if(!near||near.dist>55){addFloat(player.x,player.y-20,'窓に近づいて','#e24b4a');return;}
  const w=near.win;
  const missingHp=w.maxHp-w.hp;
  currentRepairCost=w.open?35:Math.max(5,Math.ceil(missingHp/w.maxHp*20)); // [TASK-05]
  repairRequired=w.open?240:Math.ceil(missingHp/w.maxHp*180+60);           // [TASK-05]
  if(money<currentRepairCost){addFloat(player.x,player.y-20,`お金が足りない ($${currentRepairCost})`,'#e24b4a');return;}
  repairing=true;repairTarget=w;repairTimer=0;
  document.getElementById('repairBtn').classList.add('active');
}

function loop() {
  const now = Date.now();
  animId = requestAnimationFrame(loop);
  if (!gameRunning) return;
  _wallCache = null;

  // ウェーブ進行
  waveTimer++;
  if (waveTimer > 360 + wave * 30) {
    const completedWave = wave;
    waveTimer = 0; wave++;
    waveStartKills = kills; // [TASK-07]
    document.getElementById('hWave').textContent = wave;
    const bScore = completedWave * 50, bMoney = completedWave * 30;
    score += bScore; money += bMoney;
    waveClearBonus = { score: bScore, money: bMoney, wave: completedWave, kills: kills - waveStartKills + 1 }; // [TASK-07]
    waveClearAnim = 200;
    playWaveClear();
  }
  if (waveClearAnim > 0) waveClearAnim--;

  // ゾンビスポーン
  spawnTimer++;
  const sr = Math.max(25, 80 - wave * 5);
  if (spawnTimer >= sr) { spawnTimer = 0; spawnZombie(); if (wave > 2) spawnZombie(); }

  // プレイヤー移動 + 壁衝突
  const spd = (player.speed + upgrades.speed * 0.3) * (moveX !== 0 && moveY !== 0 ? 0.707 : 1);
  const nx = Math.max(player.r, Math.min(MAP_W - player.r, player.x + moveX * spd));
  const ny = Math.max(player.r, Math.min(MAP_H - player.r, player.y + moveY * spd));
  // [TASK-06] WALLS との衝突判定
  let blocked = false;
  if (typeof WALLS !== 'undefined') {
    WALLS.forEach(wall => {
      if (wall.w === 0) return;
      if (nx+player.r>wall.x && nx-player.r<wall.x+wall.w &&
          ny+player.r>wall.y && ny-player.r<wall.y+wall.h) blocked = true;
    });
  }
  player.x = blocked ? player.x : nx;
  player.y = blocked ? player.y : ny;
  resolveWalls(player);
  updateCamera();

  // 射撃（銃）/ 近接（近接武器）
  fireAuto(now);
  doMeleeAuto(now);
  if (meleeAnim) { meleeAnim.timer--; if (meleeAnim.timer <= 0) meleeAnim = null; }

  // アイテム・鍵・解錠
  updateKeyPickups();
  updateFloorItemPickups();
  tryUnlockNearby();
  updateNPCs(now);

  // 自動修理
  if (!repairing && !repairTarget) {
    const near = nearestDamagedWindow();
    if (near && near.dist < 55 && money >= 20) {
      repairing = true; repairTarget = near.win; repairTimer = 0;
      document.getElementById('repairBtn').classList.add('active');
    }
  }
  if (repairing && repairTarget) {
    const d = Math.hypot(repairTarget.x - player.x, repairTarget.y - player.y);
    if (d > 60 || money < 20) {
      repairing = false; repairTarget = null;
      document.getElementById('repairBtn').classList.remove('active');
    } else {
      repairTimer++;
      if (repairTimer >= repairRequired) { // [TASK-05]
        repairTarget.hp = repairTarget.maxHp;
        repairTarget.open = false;
        money = Math.max(0, money - currentRepairCost); // [TASK-05]
        addFloat(repairTarget.x, repairTarget.y - 20, '窓修理完了!', '#63c422');
        playRepairDone();
        repairing = false; repairTarget = null; repairTimer = 0;
        document.getElementById('repairBtn').classList.remove('active');
        _wallCache = null;
      }
    }
  }

  // 弾
  bullets.forEach(b => { b.x += b.vx; b.y += b.vy; b.life--; });
  bullets = bullets.filter(b => b.life > 0 && b.x > -20 && b.x < MAP_W+20 && b.y > -20 && b.y < MAP_H+20);

  // ゾンビが窓を攻撃
  windows.forEach(w => {
    if (w.open || w.hp <= 0) return;
    zombies.forEach(z => {
      if (Math.hypot(z.x-w.x, z.y-w.y) < 30) {
        w.hp -= 0.08;
        if (w.hp <= 0) { w.hp = 0; w.open = true; addFloat(w.x, w.y-15, '窓破壊!', '#e24b4a'); playWindowBreak(); _wallCache = null; }
      }
    });
  });

  // ゾンビ移動 + 衝突 + プレイヤー攻撃
  zombies.forEach(z => {
    // [TASK-03] 分離ステアリング（ゾンビ同士が重ならない）
    let sepX = 0, sepY = 0;
    zombies.forEach(other => {
      if (other === z) return;
      const dx = z.x - other.x, dy = z.y - other.y;
      const d = Math.hypot(dx, dy);
      if (d < (z.r + other.r + 4) && d > 0) {
        sepX += dx / d * (z.r + other.r + 4 - d) * 0.4;
        sepY += dy / d * (z.r + other.r + 4 - d) * 0.4;
      }
    });
    z.x += sepX; z.y += sepY;

    // [TASK-03] type 2（重）: 窓ターゲットがある間は窓に向かう
    if (z.type === 2 && z.windowTarget && !z.windowTarget.open) {
      const distToWin = Math.hypot(z.windowTarget.x - z.x, z.windowTarget.y - z.y);
      if (distToWin > 20) {
        const a = Math.atan2(z.windowTarget.y - z.y, z.windowTarget.x - z.x);
        z.angle = a;
        z.x += Math.cos(a) * z.speed; z.y += Math.sin(a) * z.speed;
      }
    } else if (z.type === 1) {
      // [TASK-03] type 1（速）: ジグザグ移動
      const ang = Math.atan2(player.y - z.y, player.x - z.x);
      z.angle = ang;
      const zigzag = Math.sin(Date.now() / 200 + z.seed) * 0.8;
      const perpX = -Math.sin(ang), perpY = Math.cos(ang);
      z.x += (Math.cos(ang) + perpX * zigzag) * z.speed;
      z.y += (Math.sin(ang) + perpY * zigzag) * z.speed;
    } else {
      // [TASK-03] type 0（通常）: プレイヤーに直進（従来通り）
      const ang = Math.atan2(player.y - z.y, player.x - z.x);
      z.angle = ang;
      z.x += Math.cos(ang) * z.speed; z.y += Math.sin(ang) * z.speed;
    }

    z.x = Math.max(z.r, Math.min(MAP_W-z.r, z.x));
    z.y = Math.max(z.r, Math.min(MAP_H-z.r, z.y));
    resolveWalls(z);
    if (Math.hypot(z.x-player.x, z.y-player.y) < player.r + z.r) {
      const armor = upgrades.armor * 0.08;
      player.hp -= 0.25 * (1 - armor);
      playHurt();
      if (player.hp <= 0) { player.hp = 0; endGame(); }
    }
  });

  // 弾がゾンビに当たる
  bullets.forEach(b => {
    zombies.forEach(z => {
      if (z.dead) return;
      if (Math.hypot(b.x-z.x, b.y-z.y) < z.r + 4) {
        z.hp -= b.dmg; b.life = 0;
        addParticle(z.x, z.y, '#8b2020', 4);
        if (z.hp <= 0) zombieDie(z);
      }
    });
  });
  zombies = zombies.filter(z => !z.dead);

  // コイン
  coins = coins.filter(c => {
    const d = Math.hypot(c.x-player.x, c.y-player.y);
    if (d < c.magR) { const ang=Math.atan2(player.y-c.y, player.x-c.x); c.x+=Math.cos(ang)*5; c.y+=Math.sin(ang)*5; }
    if (d < player.r+c.r) { money+=c.val; playCoin(); return false; }
    return true;
  });

  // パーティクル・フロートテキスト
  particles.forEach(p => { p.x+=p.vx; p.y+=p.vy; p.life--; p.vx*=0.92; p.vy*=0.92; });
  particles = particles.filter(p => p.life > 0);
  floatTexts.forEach(f => { f.y-=0.6; f.life--; });
  floatTexts = floatTexts.filter(f => f.life > 0);

  // HUD
  document.getElementById('hScore').textContent = score;
  document.getElementById('hKills').textContent = kills;
  document.getElementById('hMoney').textContent = '$' + money;
  const hpPct = Math.max(0, player.hp / player.maxHp * 100);
  document.getElementById('hHp').textContent    = Math.ceil(player.hp);
  document.getElementById('hHp').style.color    = hpPct > 50 ? '#63c422' : hpPct > 25 ? '#EF9F27' : '#e24b4a';

  // 修理ボタン
  const near = nearestDamagedWindow();
  const repBtn = document.getElementById('repairBtn');
  if (near && near.dist < 55) {
    const w = near.win;
    const mHp = w.maxHp - w.hp;
    const cost = w.open ? 35 : Math.max(5, Math.ceil(mHp / w.maxHp * 20)); // [TASK-05]
    const req  = w.open ? 240 : Math.ceil(mHp / w.maxHp * 180 + 60);       // [TASK-05]
    const canAfford = money >= cost;
    repBtn.style.borderColor = canAfford ? '#63c422' : '#e24b4a';
    repBtn.style.color       = canAfford ? '#63c422' : '#e24b4a';
    if (repairing) repBtn.innerHTML = `修理中 ${Math.floor(repairTimer / repairRequired * 100)}%<br><span style="font-size:9px">$${currentRepairCost} 離れないで</span>`; // [TASK-05]
    else repBtn.innerHTML = `窓修理<br><span style="font-size:9px">${canAfford ? '$' + cost + 'でタップ' : 'お金不足 $' + cost}</span>`; // [TASK-05]
  } else {
    repBtn.style.borderColor = '#333'; repBtn.style.color = '#888';
    repBtn.innerHTML = '窓修理<br><span style="font-size:9px">近づいてタップ</span>';
  }

  draw();
}

startGame();
