// ============================================================
// game.js — ゲームループ・状態管理・初期化・終了処理
// startGame() でリセット、loop() が毎フレーム全ロジックを駆動する
// ============================================================

// ─── リサイズ（canvas をラッパー幅に合わせる）─────────────────
function resize() {
  VW = CWRAP.clientWidth;
  VH = Math.round(VW * 0.65);
  canvas.width  = VW;
  canvas.height = VH;
}

// ─── 窓オブジェクトを WIN_DEFS から生成 ───────────────────────
function initWindows() {
  windows = WIN_DEFS.map(w => ({
    x: w.x, y: w.y, dir: w.dir,
    hp: Math.random() < 0.5 ? 0 : 60,
    maxHp: 60, open: false,
  }));
  windows.forEach(w => { if (w.hp <= 0) w.open = true; });
}

// ─── 武器切り替え（ボタンハイライト更新）─────────────────────
function setWeapon(i) {
  currentWeapon = i;
  document.querySelectorAll('.wbtn').forEach((b, j) => b.classList.toggle('active', i === j));
}

// ─── ゲーム開始・リセット ─────────────────────────────────────
function startGame() {
  resize();
  document.getElementById('overlay').classList.remove('show');
  closeShop();
  player = { x: MAP_W / 2, y: MAP_H / 2, r: 11, hp: 100, maxHp: 100, speed: 2.4 };
  zombies = []; bullets = []; coins = []; particles = []; floatTexts = [];
  score = 0; kills = 0; wave = 1; money = 0;
  waveTimer = 0; spawnTimer = 0; nextFireTime = 0;
  currentWeapon = 0; repairing = false; repairTimer = 0; repairTarget = null;
  upgrades = { speed: 0, armor: 0, coinMag: 0 };
  waveClearAnim = 0;
  WEAPONS.forEach(w => { w.upgDmg = 0; w.upgRate = 0; w.upgRange = 0; });
  setWeapon(0);
  initWindows();
  _wallCache = null;
  gameRunning = true;
  if (animId) cancelAnimationFrame(animId);
  loop();
}

// ─── ゲームオーバー ───────────────────────────────────────────
function endGame() {
  gameRunning = false;
  document.getElementById('ovTitle').textContent = 'GAME OVER';
  document.getElementById('ovSub').textContent =
    `スコア: ${score}  |  WAVE ${wave}  |  ${kills}体撃破  |  $${money}`;
  document.getElementById('overlay').classList.add('show');
}

// ─── メインループ（毎フレーム呼ばれる）───────────────────────
function loop() {
  const now = Date.now();
  animId = requestAnimationFrame(loop);
  if (!gameRunning) return;
  _wallCache = null; // 壁キャッシュを毎フレーム無効化

  // ウェーブ進行
  waveTimer++;
  if (waveTimer > 360 + wave * 30) {
    const completedWave = wave;
    waveTimer = 0; wave++;
    document.getElementById('hWave').textContent = wave;
    const bScore = completedWave * 50, bMoney = completedWave * 30;
    score += bScore; money += bMoney;
    waveClearBonus = { score: bScore, money: bMoney, wave: completedWave };
    waveClearAnim = 200;
    playWaveClear();
  }
  if (waveClearAnim > 0) waveClearAnim--;

  // ゾンビスポーン
  spawnTimer++;
  const sr = Math.max(25, 80 - wave * 5);
  if (spawnTimer >= sr) {
    spawnTimer = 0;
    spawnZombie();
    if (wave > 2) spawnZombie();
  }

  // プレイヤー移動 + 壁衝突
  const spd = (player.speed + upgrades.speed * 0.3) * (moveX !== 0 && moveY !== 0 ? 0.707 : 1);
  player.x = Math.max(player.r, Math.min(MAP_W - player.r, player.x + moveX * spd));
  player.y = Math.max(player.r, Math.min(MAP_H - player.r, player.y + moveY * spd));
  resolveWalls(player);
  updateCamera();
  fireAuto(now);

  // 自動修理: 近くの破損窓に自動で修理開始
  if (!repairing && !repairTarget) {
    const near = nearestDamagedWindow();
    if (near && near.dist < 55 && money >= 20) {
      repairing = true; repairTarget = near.win; repairTimer = 0;
      document.getElementById('repairBtn').classList.add('active');
    }
  }

  // 修理進行
  if (repairing && repairTarget) {
    const d = Math.hypot(repairTarget.x - player.x, repairTarget.y - player.y);
    if (d > 60 || money < 20) {
      repairing = false; repairTarget = null;
      document.getElementById('repairBtn').classList.remove('active');
    } else {
      repairTimer++;
      if (repairTimer >= 180) {
        repairTarget.hp = repairTarget.maxHp;
        repairTarget.open = false;
        money = Math.max(0, money - 20);
        addFloat(repairTarget.x, repairTarget.y - 20, '窓修理完了!', '#63c422');
        playRepairDone();
        repairing = false; repairTarget = null; repairTimer = 0;
        document.getElementById('repairBtn').classList.remove('active');
        _wallCache = null;
      }
    }
  }

  // 弾の移動・寿命管理
  bullets.forEach(b => { b.x += b.vx; b.y += b.vy; b.life--; });
  bullets = bullets.filter(b => b.life > 0 && b.x > -20 && b.x < MAP_W + 20 && b.y > -20 && b.y < MAP_H + 20);

  // ゾンビが窓を攻撃
  windows.forEach(w => {
    if (w.open || w.hp <= 0) return;
    zombies.forEach(z => {
      if (Math.hypot(z.x - w.x, z.y - w.y) < 30) {
        w.hp -= 0.08;
        if (w.hp <= 0) {
          w.hp = 0; w.open = true;
          addFloat(w.x, w.y - 15, '窓破壊!', '#e24b4a');
          playWindowBreak();
          _wallCache = null;
        }
      }
    });
  });

  // ゾンビ移動 + 壁衝突 + プレイヤー攻撃
  zombies.forEach(z => {
    const ang = Math.atan2(player.y - z.y, player.x - z.x);
    z.angle = ang; // スプライト方向切替のために保存
    z.x += Math.cos(ang) * z.speed;
    z.y += Math.sin(ang) * z.speed;
    z.x = Math.max(z.r, Math.min(MAP_W - z.r, z.x));
    z.y = Math.max(z.r, Math.min(MAP_H - z.r, z.y));
    resolveWalls(z);
    if (Math.hypot(z.x - player.x, z.y - player.y) < player.r + z.r) {
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
      if (Math.hypot(b.x - z.x, b.y - z.y) < z.r + 4) {
        z.hp -= b.dmg; b.life = 0;
        addParticle(z.x, z.y, '#8b2020', 4);
        if (z.hp <= 0) {
          z.dead = true;
          const pts = Math.round((10 + wave * 2) * z.scoreMul);
          score += pts; kills++;
          const coinAmt = Math.floor((Math.random() * 8 + 4 + wave) * z.coinMul);
          const magR = upgrades.coinMag * 15 + 30;
          coins.push({ x: z.x, y: z.y, val: coinAmt, r: 7, magR });
          addFloat(z.x, z.y - 16, '$' + coinAmt, '#EF9F27');
          addParticle(z.x, z.y, '#4a4a4a', 8);
          playDeath();
        }
      }
    });
  });
  zombies = zombies.filter(z => !z.dead);

  // コイン吸引・取得
  coins = coins.filter(c => {
    const d = Math.hypot(c.x - player.x, c.y - player.y);
    if (d < c.magR) {
      const ang = Math.atan2(player.y - c.y, player.x - c.x);
      c.x += Math.cos(ang) * 5; c.y += Math.sin(ang) * 5;
    }
    if (d < player.r + c.r) { money += c.val; playCoin(); return false; }
    return true;
  });

  // パーティクル・フロートテキスト更新
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life--; p.vx *= 0.92; p.vy *= 0.92; });
  particles = particles.filter(p => p.life > 0);
  floatTexts.forEach(f => { f.y -= 0.6; f.life--; });
  floatTexts = floatTexts.filter(f => f.life > 0);

  // HUD 更新
  document.getElementById('hScore').textContent  = score;
  document.getElementById('hKills').textContent  = kills;
  document.getElementById('hMoney').textContent  = '$' + money;
  const hpPct = Math.max(0, player.hp / player.maxHp * 100);
  document.getElementById('hHp').textContent     = Math.ceil(player.hp);
  document.getElementById('hHp').style.color     = hpPct > 50 ? '#63c422' : hpPct > 25 ? '#EF9F27' : '#e24b4a';

  // 修理ボタン状態
  const near = nearestDamagedWindow();
  const repBtn = document.getElementById('repairBtn');
  if (repairing) {
    repBtn.style.borderColor = '#63c422'; repBtn.style.color = '#63c422';
    repBtn.innerHTML = `修理中 ${Math.floor(repairTimer / 180 * 100)}%<br><span style="font-size:9px">$20 離れないで</span>`;
  } else if (near && near.dist < 55 && money >= 20) {
    repBtn.style.borderColor = '#63c422'; repBtn.style.color = '#63c422';
    repBtn.innerHTML = '窓修理<br><span style="font-size:9px">自動開始中...</span>';
  } else if (near && near.dist < 55) {
    repBtn.style.borderColor = '#e24b4a'; repBtn.style.color = '#e24b4a';
    repBtn.innerHTML = '窓修理<br><span style="font-size:9px">お金が足りない</span>';
  } else {
    repBtn.style.borderColor = '#333'; repBtn.style.color = '#888';
    repBtn.innerHTML = '窓修理<br><span style="font-size:9px">窓に近づくと自動</span>';
  }

  draw();
}

// ページ読み込み時にゲーム開始
startGame();
