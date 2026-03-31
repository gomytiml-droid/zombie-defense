// ============================================================
// render.js — 描画システム（カメラ・マップ・UI・エフェクト）
// canvas 2D APIを使い、毎フレーム全オブジェクトを描画する
// ============================================================

// ─── カメラ追従 ───────────────────────────────────────────────
// プレイヤーが画面の1/3より端に近づいたらカメラを動かす
function updateCamera() {
  const marginX = VW / 3, marginY = VH / 3;
  const px = player.x - camX, py = player.y - camY;
  if (px < marginX)      camX = player.x - marginX;
  if (px > VW - marginX) camX = player.x - (VW - marginX);
  if (py < marginY)      camY = player.y - marginY;
  if (py > VH - marginY) camY = player.y - (VH - marginY);
  camX = Math.max(0, Math.min(MAP_W - VW, camX));
  camY = Math.max(0, Math.min(MAP_H - VH, camY));
}

// ─── メイン描画 ───────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, VW, VH);
  ctx.save();
  ctx.translate(-camX, -camY);

  // マップ背景（建物外: 暗い）
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, MAP_W, MAP_H);

  // 部屋（床）
  ROOMS.forEach(r => {
    ctx.fillStyle = r.color;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = '#3a3530'; ctx.lineWidth = 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(r.label, r.x + r.w/2, r.y + r.h/2);
  });

  // 内壁（扉付き）
  ctx.fillStyle = '#252018';
  INNER_WALLS.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

  // 外壁
  ctx.fillStyle = '#2c2820';
  OUTER_WALLS.forEach(w => ctx.fillRect(w.x, w.y, w.w, w.h));

  // 窓（壁の上に描画）
  windows.forEach(w => {
    const pct = w.hp / w.maxHp;
    ctx.fillStyle = w.open ? '#4a0000' : pct > 0.6 ? '#85B7EB' : pct > 0.3 ? '#EF9F27' : '#e24b4a';
    ctx.fillRect(w.x-8, w.y-8, 16, 16);
    ctx.strokeStyle = w.open ? '#8b0000' : '#555'; ctx.lineWidth = 1;
    ctx.strokeRect(w.x-8, w.y-8, 16, 16);
    // HP バー
    if (!w.open && w.hp < w.maxHp) {
      ctx.fillStyle = '#111'; ctx.fillRect(w.x-6, w.y+4, 12, 3);
      ctx.fillStyle = pct > 0.5 ? '#63c422' : '#e24b4a';
      ctx.fillRect(w.x-6, w.y+4, 12*pct, 3);
    }
    // 開口部の赤いオーラ
    if (w.open) {
      ctx.fillStyle = 'rgba(200,0,0,0.2)';
      ctx.beginPath(); ctx.arc(w.x, w.y, 25, 0, Math.PI*2); ctx.fill();
    }
    // 修理進捗アーク
    if (repairing && repairTarget === w) {
      ctx.strokeStyle = '#63c422'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w.x, w.y, 14, -Math.PI/2, -Math.PI/2 + Math.PI*2*(repairTimer/180));
      ctx.stroke();
    }
  });

  // コイン
  coins.forEach(c => {
    ctx.fillStyle = '#EF9F27';
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#FAC775'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('$', c.x, c.y+3);
  });

  // パーティクル
  particles.forEach(p => {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  // ゾンビ（スプライト優先、なければ丸フォールバック）
  zombies.forEach(z => {
    const size = z.r * 2.8;
    const src  = zombieSpriteCanvas || zombieSpriteImg; // どちらか使えるほうを使う

    if (src) {
      // 移動方向に応じて 4 方向スプライトを切り替える
      let sp;
      if (z.angle !== undefined) {
        const a = ((z.angle % (Math.PI*2)) + Math.PI*2) % (Math.PI*2);
        if      (a < Math.PI*0.25 || a >= Math.PI*1.75) sp = SPRITE.right;
        else if (a < Math.PI*0.75)                       sp = SPRITE.front;
        else if (a < Math.PI*1.25)                       sp = SPRITE.left;
        else                                             sp = SPRITE.back;
      } else {
        sp = SPRITE.front;
      }

      if (zombieSpriteImg && !zombieSpriteCanvas) {
        // file:// フォールバック: multiply で白を暗くしてなじませる
        ctx.globalCompositeOperation = 'multiply';
      }
      ctx.drawImage(src, sp.sx, sp.sy, sp.sw, sp.sh,
                    z.x - size/2, z.y - size/2, size, size);
      ctx.globalCompositeOperation = 'source-over';

      // タイプ別オーラ
      if (z.type === 2) {
        ctx.globalAlpha = 0.25; ctx.fillStyle = '#ff2222';
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r + 2, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (z.type === 1) {
        ctx.globalAlpha = 0.20; ctx.fillStyle = '#ffee00';
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r + 1, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    } else {
      // スプライト未ロード: 丸で描画
      ctx.fillStyle = z.body;
      ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = z.head;
      ctx.beginPath(); ctx.arc(z.x, z.y - z.r*0.3, z.r*0.65, 0, Math.PI*2); ctx.fill();
      if (z.label) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.font = `bold ${z.r}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText(z.label, z.x, z.y + z.r*0.35);
      }
    }
    // HP バー（共通）
    ctx.fillStyle = '#111'; ctx.fillRect(z.x-z.r, z.y-z.r-7, z.r*2, 4);
    ctx.fillStyle = z.hp/z.maxHp > 0.5 ? '#63c422' : '#e24b4a';
    ctx.fillRect(z.x-z.r, z.y-z.r-7, z.r*2*(z.hp/z.maxHp), 4);
  });

  // 弾
  bullets.forEach(b => {
    ctx.fillStyle = b.color;
    ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI*2); ctx.fill();
  });

  // プレイヤー（青い同心円）
  ctx.fillStyle = '#1a4a7a'; ctx.beginPath(); ctx.arc(player.x, player.y, player.r,   0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#378add'; ctx.beginPath(); ctx.arc(player.x, player.y, player.r-3, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#85B7EB'; ctx.beginPath(); ctx.arc(player.x, player.y, 5,           0, Math.PI*2); ctx.fill();

  // 射程サークル
  const wp = WEAPONS[currentWeapon];
  const range = (wp.range + wp.upgRange*20) * 1.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(player.x, player.y, range, 0, Math.PI*2); ctx.stroke();

  // フロートテキスト
  floatTexts.forEach(f => {
    ctx.globalAlpha = f.life / f.maxLife;
    ctx.fillStyle = f.color;
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y);
  });
  ctx.globalAlpha = 1;
  ctx.restore();

  // ─── ミニマップ（スクリーン固定）──────────────────────────
  const MM = 60, MX = VW-MM-6, MY = VH-MM-6;
  const sx = MM/MAP_W, sy = MM/MAP_H;
  ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(MX, MY, MM, MM);
  ctx.strokeStyle = '#444'; ctx.lineWidth = 1; ctx.strokeRect(MX, MY, MM, MM);
  windows.forEach(w => {
    ctx.fillStyle = w.open ? '#8b0000' : '#378add';
    ctx.fillRect(MX+w.x*sx-1, MY+w.y*sy-1, 3, 3);
  });
  zombies.forEach(z => {
    ctx.fillStyle = z.type===1 ? '#8a8a3a' : z.type===2 ? '#8a4040' : '#4a8a4a';
    ctx.fillRect(MX+z.x*sx-1, MY+z.y*sy-1, 2, 2);
  });
  ctx.fillStyle = '#378add';
  ctx.beginPath(); ctx.arc(MX+player.x*sx, MY+player.y*sy, 2, 0, Math.PI*2); ctx.fill();

  // ─── ウェーブクリアバナー ──────────────────────────────────
  if (waveClearAnim > 0) {
    const total = 200;
    let a = waveClearAnim > total-25 ? (total-waveClearAnim)/25 : waveClearAnim < 35 ? waveClearAnim/35 : 1;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, VH/2-54, VW, 88);
    ctx.fillStyle = '#EF9F27';
    ctx.font = `bold ${Math.round(VW*0.062)}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${waveClearBonus.wave} クリア!`, VW/2, VH/2-14);
    ctx.fillStyle = '#63c422';
    ctx.font = `${Math.round(VW*0.038)}px sans-serif`;
    ctx.fillText(`ボーナス  +${waveClearBonus.score}点  +$${waveClearBonus.money}`, VW/2, VH/2+20);
    ctx.globalAlpha = 1;
  }
}
