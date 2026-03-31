const canvas=document.getElementById('c');
const ctx=canvas.getContext('2d');
const CWRAP=document.getElementById('canvas-wrap');
const MAP_W=900,MAP_H=700;
let VW,VH,camX=0,camY=0;

// ─── Audio ────────────────────────────────────────────────────
let audioCtx=null;
function getAC(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();return audioCtx;}
let lastMGSnd=0;
function playShoot(wpIdx){
  const ac=getAC();
  if(wpIdx===2){const n=Date.now();if(n-lastMGSnd<90)return;lastMGSnd=n;}
  const o=ac.createOscillator(),g=ac.createGain();
  o.connect(g);g.connect(ac.destination);
  if(wpIdx===0){o.type='square';o.frequency.setValueAtTime(900,ac.currentTime);o.frequency.exponentialRampToValueAtTime(180,ac.currentTime+0.07);g.gain.setValueAtTime(0.28,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.09);o.start();o.stop(ac.currentTime+0.09);}
  else if(wpIdx===1){o.type='sawtooth';o.frequency.setValueAtTime(180,ac.currentTime);o.frequency.exponentialRampToValueAtTime(55,ac.currentTime+0.18);g.gain.setValueAtTime(0.55,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.22);o.start();o.stop(ac.currentTime+0.22);}
  else{o.type='square';o.frequency.setValueAtTime(650,ac.currentTime);o.frequency.exponentialRampToValueAtTime(280,ac.currentTime+0.04);g.gain.setValueAtTime(0.14,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.05);o.start();o.stop(ac.currentTime+0.05);}
}
function playDeath(){const ac=getAC();const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sawtooth';o.frequency.setValueAtTime(320,ac.currentTime);o.frequency.exponentialRampToValueAtTime(70,ac.currentTime+0.22);g.gain.setValueAtTime(0.22,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.25);o.start();o.stop(ac.currentTime+0.25);}
let lastCoinSnd=0;
function playCoin(){const n=Date.now();if(n-lastCoinSnd<80)return;lastCoinSnd=n;const ac=getAC();const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.setValueAtTime(880,ac.currentTime);o.frequency.setValueAtTime(1100,ac.currentTime+0.05);g.gain.setValueAtTime(0.14,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.13);o.start();o.stop(ac.currentTime+0.13);}
function playWindowBreak(){const ac=getAC();const buf=ac.createBuffer(1,Math.floor(ac.sampleRate*0.28),ac.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const s=ac.createBufferSource(),g=ac.createGain();s.buffer=buf;s.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(0.45,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.28);s.start();s.stop(ac.currentTime+0.28);}
function playRepairDone(){const ac=getAC();[523,659,784].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.value=f;const t=ac.currentTime+i*0.1;g.gain.setValueAtTime(0.2,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.18);o.start(t);o.stop(t+0.18);});}
function playWaveClear(){const ac=getAC();[523,659,784,1046].forEach((f,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sine';o.frequency.value=f;const t=ac.currentTime+i*0.13;g.gain.setValueAtTime(0.26,t);g.gain.exponentialRampToValueAtTime(0.001,t+0.22);o.start(t);o.stop(t+0.22);});}
let lastHurtSnd=0;
function playHurt(){const n=Date.now();if(n-lastHurtSnd<280)return;lastHurtSnd=n;const ac=getAC();const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type='sawtooth';o.frequency.setValueAtTime(160,ac.currentTime);o.frequency.exponentialRampToValueAtTime(80,ac.currentTime+0.11);g.gain.setValueAtTime(0.18,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.13);o.start();o.stop(ac.currentTime+0.13);}

// ─── Weapons ─────────────────────────────────────────────────
const WEAPONS=[
  {name:'ピストル',fireRate:500,damage:25,range:160,spread:0.05,bullets:1,color:'#FAC775',upgDmg:0,upgRate:0,upgRange:0},
  {name:'ショットガン',fireRate:1100,damage:18,range:110,spread:0.45,bullets:5,color:'#F0997B',upgDmg:0,upgRate:0,upgRange:0},
  {name:'マシンガン',fireRate:120,damage:10,range:130,spread:0.18,bullets:1,color:'#9FE1CB',upgDmg:0,upgRate:0,upgRange:0},
];

// ─── Zombie types (type0 speed = 60% of base) ─────────────────
const ZOMBIE_TYPES=[
  {r:10, spdMul:0.60, hpMul:1.0,  body:'#2d5a2d',head:'#4a8a4a',scoreMul:1,  coinMul:1,  label:''},
  {r:8,  spdMul:1.85, hpMul:0.55, body:'#5a5a2a',head:'#8a8a3a',scoreMul:1.5,coinMul:0.8,label:'速'},
  {r:14, spdMul:0.52, hpMul:2.6,  body:'#5a2d2d',head:'#8a4040',scoreMul:2.5,coinMul:2.0,label:'重'},
];

// ─── Map rooms ────────────────────────────────────────────────
const ROOMS=[
  {x:76,y:76,w:196,h:136,label:'寝室',color:'#2e2a26'},
  {x:328,y:76,w:184,h:136,label:'子供部屋',color:'#2a2e26'},
  {x:568,y:76,w:256,h:136,label:'リビング',color:'#2a2826'},
  {x:76,y:268,w:136,h:184,label:'書斎',color:'#26292e'},
  {x:268,y:268,w:244,h:184,label:'廊下',color:'#222'},
  {x:568,y:268,w:124,h:184,label:'洗面',color:'#26282e'},
  {x:748,y:268,w:84,h:184,label:'WC',color:'#262e2a'},
  {x:76,y:508,w:236,h:144,label:'キッチン',color:'#2e2a22'},
  {x:368,y:508,w:224,h:144,label:'ダイニング',color:'#2a2e28'},
  {x:648,y:508,w:184,h:144,label:'バスルーム',color:'#22262e'},
];

// ─── Windows ──────────────────────────────────────────────────
const WIN_DEFS=[
  {x:170,y:60,dir:'n'},{x:420,y:60,dir:'n'},{x:650,y:60,dir:'n'},
  {x:60,y:160,dir:'w'},{x:60,y:380,dir:'w'},{x:60,y:580,dir:'w'},
  {x:840,y:160,dir:'e'},{x:840,y:380,dir:'e'},{x:840,y:580,dir:'e'},
  {x:200,y:660,dir:'s'},{x:480,y:660,dir:'s'},{x:730,y:660,dir:'s'},
];

// ─── Wall collision system ─────────────────────────────────────
// Outer walls: 16px thick, centered on building boundary (60/840/660)
// Gaps are 32px wide at each window (entity r ≤ 14 fits through 32px gap)
const OUTER_WALLS=[
  // corner blocks
  {x:44,y:44,w:24,h:24},{x:832,y:44,w:24,h:24},
  {x:44,y:632,w:24,h:24},{x:832,y:632,w:24,h:24},
  // north (y:52-68), gaps at x:154-186, 404-436, 634-666
  {x:60,y:52,w:94,h:16},{x:186,y:52,w:218,h:16},{x:436,y:52,w:198,h:16},{x:666,y:52,w:174,h:16},
  // south (y:652-668), gaps at x:184-216, 464-496, 714-746
  {x:60,y:652,w:124,h:16},{x:216,y:652,w:248,h:16},{x:496,y:652,w:218,h:16},{x:746,y:652,w:94,h:16},
  // west (x:52-68), gaps at y:144-176, 364-396, 564-596
  {x:52,y:60,w:16,h:84},{x:52,y:176,w:16,h:188},{x:52,y:396,w:16,h:168},{x:52,y:596,w:16,h:64},
  // east (x:832-848), gaps at y:144-176, 364-396, 564-596
  {x:832,y:60,w:16,h:84},{x:832,y:176,w:16,h:188},{x:832,y:396,w:16,h:168},{x:832,y:596,w:16,h:64},
];
// Window gap walls — active only when window is intact (!open)
// Index matches WIN_DEFS order
const WIN_GAPS=[
  {x:154,y:52,w:32,h:16,wi:0},{x:404,y:52,w:32,h:16,wi:1},{x:634,y:52,w:32,h:16,wi:2},
  {x:52,y:144,w:16,h:32,wi:3},{x:52,y:364,w:16,h:32,wi:4},{x:52,y:564,w:16,h:32,wi:5},
  {x:832,y:144,w:16,h:32,wi:6},{x:832,y:364,w:16,h:32,wi:7},{x:832,y:564,w:16,h:32,wi:8},
  {x:184,y:652,w:32,h:16,wi:9},{x:464,y:652,w:32,h:16,wi:10},{x:714,y:652,w:32,h:16,wi:11},
];
// Inner walls with doorways
const INNER_WALLS=[
  // x:280-320 (寝室|子供部屋), doorway y:120-160
  {x:280,y:60,w:40,h:60},{x:280,y:160,w:40,h:60},
  // x:520-560 (子供部屋|リビング), doorway y:120-160
  {x:520,y:60,w:40,h:60},{x:520,y:160,w:40,h:60},
  // y:220-260 (row1|row2), doorways x:130-170, 400-440, 660-700
  {x:60,y:220,w:70,h:40},{x:170,y:220,w:230,h:40},{x:440,y:220,w:220,h:40},{x:700,y:220,w:140,h:40},
  // x:220-260 (書斎|廊下), doorway y:340-380
  {x:220,y:260,w:40,h:80},{x:220,y:380,w:40,h:80},
  // x:520-560 (廊下|洗面), doorway y:340-380
  {x:520,y:260,w:40,h:80},{x:520,y:380,w:40,h:80},
  // x:700-740 (洗面|WC), doorway y:340-380
  {x:700,y:260,w:40,h:80},{x:700,y:380,w:40,h:80},
  // y:460-500 (row2|row3), doorways x:120-160, 420-460, 680-720, 760-800
  {x:60,y:460,w:60,h:40},{x:160,y:460,w:260,h:40},{x:460,y:460,w:220,h:40},
  {x:720,y:460,w:40,h:40},{x:800,y:460,w:40,h:40},
  // x:320-360 (キッチン|ダイニング), doorway y:560-600
  {x:320,y:500,w:40,h:60},{x:320,y:600,w:40,h:60},
  // x:600-640 (ダイニング|バスルーム), doorway y:560-600
  {x:600,y:500,w:40,h:60},{x:600,y:600,w:40,h:60},
];

let _wallCache=null;
function getActiveWalls(){
  if(_wallCache)return _wallCache;
  _wallCache=[...OUTER_WALLS,...INNER_WALLS];
  WIN_GAPS.forEach(wg=>{if(!windows[wg.wi].open)_wallCache.push(wg);});
  return _wallCache;
}
function resolveWalls(entity){
  const walls=getActiveWalls();
  for(let iter=0;iter<3;iter++){
    walls.forEach(w=>{
      const nx=Math.max(w.x,Math.min(entity.x,w.x+w.w));
      const ny=Math.max(w.y,Math.min(entity.y,w.y+w.h));
      const dx=entity.x-nx,dy=entity.y-ny;
      const dist=Math.hypot(dx,dy);
      if(dist<entity.r){
        if(dist>0.001){const push=entity.r-dist;entity.x+=dx/dist*push;entity.y+=dy/dist*push;}
        else{
          const eL=entity.x-w.x,eR=w.x+w.w-entity.x,eT=entity.y-w.y,eB=w.y+w.h-entity.y;
          const m=Math.min(eL,eR,eT,eB);
          if(m===eL)entity.x=w.x-entity.r;
          else if(m===eR)entity.x=w.x+w.w+entity.r;
          else if(m===eT)entity.y=w.y-entity.r;
          else entity.y=w.y+w.h+entity.r;
        }
      }
    });
  }
}

// ─── State ────────────────────────────────────────────────────
let player,zombies,bullets,coins,particles,floatTexts;
let score,kills,wave,money,waveTimer,spawnTimer,nextFireTime;
let currentWeapon=0,gameRunning=false,repairing=false,repairTimer=0,repairTarget=null;
let windows=[];
let upgrades={speed:0,armor:0,coinMag:0};
let animId;
let waveClearAnim=0,waveClearBonus={score:0,money:0,wave:0};

function resize(){VW=CWRAP.clientWidth;VH=Math.round(VW*0.65);canvas.width=VW;canvas.height=VH;}

function initWindows(){
  windows=WIN_DEFS.map(w=>({x:w.x,y:w.y,dir:w.dir,hp:Math.random()<0.5?0:60,maxHp:60,open:false}));
  windows.forEach(w=>{if(w.hp<=0)w.open=true;});
}

function startGame(){
  resize();
  document.getElementById('overlay').classList.remove('show');
  closeShop();
  player={x:MAP_W/2,y:MAP_H/2,r:11,hp:100,maxHp:100,speed:2.4};
  zombies=[];bullets=[];coins=[];particles=[];floatTexts=[];
  score=0;kills=0;wave=1;money=0;waveTimer=0;spawnTimer=0;nextFireTime=0;
  currentWeapon=0;repairing=false;repairTimer=0;repairTarget=null;
  upgrades={speed:0,armor:0,coinMag:0};waveClearAnim=0;
  WEAPONS.forEach(w=>{w.upgDmg=0;w.upgRate=0;w.upgRange=0;});
  setWeapon(0);
  initWindows();
  _wallCache=null;
  gameRunning=true;
  if(animId)cancelAnimationFrame(animId);
  loop();
}

function setWeapon(i){currentWeapon=i;document.querySelectorAll('.wbtn').forEach((b,j)=>b.classList.toggle('active',i===j));}

function spawnZombie(){
  const open=windows.filter(w=>w.open);
  if(!open.length)return;
  const win=open[Math.floor(Math.random()*open.length)];
  // Spawn outside the building
  let sx=win.x,sy=win.y;
  if(win.dir==='n')sy=28;
  else if(win.dir==='s')sy=692;
  else if(win.dir==='w')sx=28;
  else sx=872;

  let type=0;
  const r=Math.random();
  if(wave>=5&&r<0.20)type=2;
  else if(wave>=3&&r<0.40)type=1;
  const cfg=ZOMBIE_TYPES[type];
  const baseSpd=0.55+wave*0.12+Math.random()*0.25;
  const baseHp=25+wave*14;
  zombies.push({
    x:sx,y:sy,r:cfg.r,hp:baseHp*cfg.hpMul,maxHp:baseHp*cfg.hpMul,
    speed:baseSpd*cfg.spdMul,type,body:cfg.body,head:cfg.head,
    scoreMul:cfg.scoreMul,coinMul:cfg.coinMul,label:cfg.label,attacking:false
  });
}

function addParticle(x,y,color,n=6){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*2.5;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:22,maxLife:22,color,r:2+Math.random()*2});}}
function addFloat(x,y,text,color){floatTexts.push({x,y,text,color,life:50,maxLife:50});}

function fireAuto(now){
  const wp=WEAPONS[currentWeapon];
  const rate=Math.max(60,wp.fireRate-wp.upgRate*80);
  const dmg=wp.damage+wp.upgDmg*8;
  const range=(wp.range+wp.upgRange*20)*1.5;
  if(now<nextFireTime)return;
  nextFireTime=now+rate;
  if(!zombies.length)return;
  let nearest=null,nd=Infinity;
  zombies.forEach(z=>{const d=Math.hypot(z.x-player.x,z.y-player.y);if(d<range&&d<nd){nd=d;nearest=z;}});
  if(!nearest)return;
  const baseAngle=Math.atan2(nearest.y-player.y,nearest.x-player.x);
  for(let i=0;i<wp.bullets;i++){
    const ang=baseAngle+(Math.random()-0.5)*wp.spread;
    bullets.push({x:player.x,y:player.y,vx:Math.cos(ang)*8,vy:Math.sin(ang)*8,dmg,life:Math.round(range/8),color:wp.color});
  }
  playShoot(currentWeapon);
}

function nearestDamagedWindow(){
  let best=null,bd=Infinity;
  windows.forEach(w=>{
    if(w.hp>=w.maxHp)return;
    const d=Math.hypot(w.x-player.x,w.y-player.y);
    if(d<bd){bd=d;best=w;}
  });
  return best?{win:best,dist:bd}:null;
}

function updateCamera(){
  const marginX=VW/3,marginY=VH/3;
  const px=player.x-camX,py=player.y-camY;
  if(px<marginX)camX=player.x-marginX;
  if(px>VW-marginX)camX=player.x-(VW-marginX);
  if(py<marginY)camY=player.y-marginY;
  if(py>VH-marginY)camY=player.y-(VH-marginY);
  camX=Math.max(0,Math.min(MAP_W-VW,camX));
  camY=Math.max(0,Math.min(MAP_H-VH,camY));
}

function loop(){
  const now=Date.now();
  animId=requestAnimationFrame(loop);
  if(!gameRunning)return;
  _wallCache=null; // invalidate each frame

  waveTimer++;
  if(waveTimer>360+wave*30){
    const completedWave=wave;
    waveTimer=0;wave++;
    document.getElementById('hWave').textContent=wave;
    const bScore=completedWave*50,bMoney=completedWave*30;
    score+=bScore;money+=bMoney;
    waveClearBonus={score:bScore,money:bMoney,wave:completedWave};
    waveClearAnim=200;playWaveClear();
  }
  if(waveClearAnim>0)waveClearAnim--;

  spawnTimer++;
  const sr=Math.max(25,80-wave*5);
  if(spawnTimer>=sr){spawnTimer=0;spawnZombie();if(wave>2)spawnZombie();}

  // Player movement + wall collision
  const spd=(player.speed+upgrades.speed*0.3)*(moveX!==0&&moveY!==0?0.707:1);
  player.x=Math.max(player.r,Math.min(MAP_W-player.r,player.x+moveX*spd));
  player.y=Math.max(player.r,Math.min(MAP_H-player.r,player.y+moveY*spd));
  resolveWalls(player);
  updateCamera();
  fireAuto(now);

  // Auto-repair: start when player is near a damaged window with enough money
  if(!repairing&&!repairTarget){
    const near=nearestDamagedWindow();
    if(near&&near.dist<55&&money>=20){
      repairing=true;repairTarget=near.win;repairTimer=0;
      document.getElementById('repairBtn').classList.add('active');
    }
  }

  // Repair progress
  if(repairing&&repairTarget){
    const d=Math.hypot(repairTarget.x-player.x,repairTarget.y-player.y);
    if(d>60||money<20){
      repairing=false;repairTarget=null;
      document.getElementById('repairBtn').classList.remove('active');
    } else {
      repairTimer++;
      if(repairTimer>=180){
        repairTarget.hp=repairTarget.maxHp;
        repairTarget.open=false;
        money=Math.max(0,money-20);
        addFloat(repairTarget.x,repairTarget.y-20,'窓修理完了!','#63c422');
        playRepairDone();
        repairing=false;repairTarget=null;repairTimer=0;
        document.getElementById('repairBtn').classList.remove('active');
        _wallCache=null;
      }
    }
  }

  // Bullets
  bullets.forEach(b=>{b.x+=b.vx;b.y+=b.vy;b.life--;});
  bullets=bullets.filter(b=>b.life>0&&b.x>-20&&b.x<MAP_W+20&&b.y>-20&&b.y<MAP_H+20);

  // Zombies attack windows (from outside)
  windows.forEach(w=>{
    if(w.open||w.hp<=0)return;
    zombies.forEach(z=>{
      if(Math.hypot(z.x-w.x,z.y-w.y)<30){
        w.hp-=0.08;
        if(w.hp<=0){w.hp=0;w.open=true;addFloat(w.x,w.y-15,'窓破壊!','#e24b4a');playWindowBreak();_wallCache=null;}
      }
    });
  });

  // Zombies move + wall collision
  zombies.forEach(z=>{
    const ang=Math.atan2(player.y-z.y,player.x-z.x);
    z.x+=Math.cos(ang)*z.speed;z.y+=Math.sin(ang)*z.speed;
    z.x=Math.max(z.r,Math.min(MAP_W-z.r,z.x));
    z.y=Math.max(z.r,Math.min(MAP_H-z.r,z.y));
    resolveWalls(z);
    if(Math.hypot(z.x-player.x,z.y-player.y)<player.r+z.r){
      const armor=upgrades.armor*0.08;
      player.hp-=(0.25*(1-armor));
      playHurt();
      if(player.hp<=0){player.hp=0;endGame();}
    }
  });

  // Bullets hit zombies
  bullets.forEach(b=>{
    zombies.forEach(z=>{
      if(z.dead)return;
      if(Math.hypot(b.x-z.x,b.y-z.y)<z.r+4){
        z.hp-=b.dmg;b.life=0;
        addParticle(z.x,z.y,'#8b2020',4);
        if(z.hp<=0){
          z.dead=true;
          const pts=Math.round((10+wave*2)*z.scoreMul);
          score+=pts;kills++;
          const coinAmt=Math.floor((Math.random()*8+4+wave)*z.coinMul);
          const magR=upgrades.coinMag*15+30;
          coins.push({x:z.x,y:z.y,val:coinAmt,r:7,magR});
          addFloat(z.x,z.y-16,'$'+coinAmt,'#EF9F27');
          addParticle(z.x,z.y,'#4a4a4a',8);
          playDeath();
        }
      }
    });
  });
  zombies=zombies.filter(z=>!z.dead);

  // Coins
  coins=coins.filter(c=>{
    const d=Math.hypot(c.x-player.x,c.y-player.y);
    if(d<c.magR){const ang=Math.atan2(player.y-c.y,player.x-c.x);c.x+=Math.cos(ang)*5;c.y+=Math.sin(ang)*5;}
    if(d<player.r+c.r){money+=c.val;playCoin();return false;}
    return true;
  });

  particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life--;p.vx*=0.92;p.vy*=0.92;});
  particles=particles.filter(p=>p.life>0);
  floatTexts.forEach(f=>{f.y-=0.6;f.life--;});
  floatTexts=floatTexts.filter(f=>f.life>0);

  document.getElementById('hScore').textContent=score;
  document.getElementById('hKills').textContent=kills;
  document.getElementById('hMoney').textContent='$'+money;
  const hpPct=Math.max(0,player.hp/player.maxHp*100);
  document.getElementById('hHp').textContent=Math.ceil(player.hp);
  document.getElementById('hHp').style.color=hpPct>50?'#63c422':hpPct>25?'#EF9F27':'#e24b4a';

  // Repair button status
  const near=nearestDamagedWindow();
  const repBtn=document.getElementById('repairBtn');
  if(repairing){
    repBtn.style.borderColor='#63c422';repBtn.style.color='#63c422';
    repBtn.innerHTML=`修理中 ${Math.floor(repairTimer/180*100)}%<br><span style="font-size:9px">$20 離れないで</span>`;
  } else if(near&&near.dist<55&&money>=20){
    repBtn.style.borderColor='#63c422';repBtn.style.color='#63c422';
    repBtn.innerHTML='窓修理<br><span style="font-size:9px">自動開始中...</span>';
  } else if(near&&near.dist<55){
    repBtn.style.borderColor='#e24b4a';repBtn.style.color='#e24b4a';
    repBtn.innerHTML='窓修理<br><span style="font-size:9px">お金が足りない</span>';
  } else {
    repBtn.style.borderColor='#333';repBtn.style.color='#888';
    repBtn.innerHTML='窓修理<br><span style="font-size:9px">窓に近づくと自動</span>';
  }

  draw();
}

function draw(){
  ctx.clearRect(0,0,VW,VH);
  ctx.save();
  ctx.translate(-camX,-camY);

  // Map background (exterior)
  ctx.fillStyle='#111';ctx.fillRect(0,0,MAP_W,MAP_H);

  // Room floors
  ROOMS.forEach(r=>{
    ctx.fillStyle=r.color;ctx.fillRect(r.x,r.y,r.w,r.h);
    ctx.strokeStyle='#3a3530';ctx.lineWidth=1;ctx.strokeRect(r.x,r.y,r.w,r.h);
    ctx.fillStyle='rgba(255,255,255,0.08)';ctx.font='10px sans-serif';ctx.textAlign='center';
    ctx.fillText(r.label,r.x+r.w/2,r.y+r.h/2);
  });

  // Inner walls
  ctx.fillStyle='#252018';
  INNER_WALLS.forEach(w=>ctx.fillRect(w.x,w.y,w.w,w.h));

  // Outer walls
  ctx.fillStyle='#2c2820';
  OUTER_WALLS.forEach(w=>ctx.fillRect(w.x,w.y,w.w,w.h));

  // Windows (drawn on top of walls)
  windows.forEach(w=>{
    const pct=w.hp/w.maxHp;
    ctx.fillStyle=w.open?'#4a0000':pct>0.6?'#85B7EB':pct>0.3?'#EF9F27':'#e24b4a';
    ctx.fillRect(w.x-8,w.y-8,16,16);
    ctx.strokeStyle=w.open?'#8b0000':'#555';ctx.lineWidth=1;ctx.strokeRect(w.x-8,w.y-8,16,16);
    if(!w.open&&w.hp<w.maxHp){
      ctx.fillStyle='#111';ctx.fillRect(w.x-6,w.y+4,12,3);
      ctx.fillStyle=pct>0.5?'#63c422':'#e24b4a';ctx.fillRect(w.x-6,w.y+4,12*pct,3);
    }
    if(w.open){ctx.fillStyle='rgba(200,0,0,0.2)';ctx.beginPath();ctx.arc(w.x,w.y,25,0,Math.PI*2);ctx.fill();}
    if(repairing&&repairTarget===w){
      ctx.strokeStyle='#63c422';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(w.x,w.y,14,-Math.PI/2,-Math.PI/2+Math.PI*2*(repairTimer/180));ctx.stroke();
    }
  });

  // Coins
  coins.forEach(c=>{
    ctx.fillStyle='#EF9F27';ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#FAC775';ctx.font='8px sans-serif';ctx.textAlign='center';ctx.fillText('$',c.x,c.y+3);
  });

  // Particles
  particles.forEach(p=>{ctx.globalAlpha=p.life/p.maxLife;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();});
  ctx.globalAlpha=1;

  // Zombies
  zombies.forEach(z=>{
    ctx.fillStyle=z.body;ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=z.head;ctx.beginPath();ctx.arc(z.x,z.y-z.r*0.3,z.r*0.65,0,Math.PI*2);ctx.fill();
    if(z.label){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.font=`bold ${z.r}px sans-serif`;ctx.textAlign='center';ctx.fillText(z.label,z.x,z.y+z.r*0.35);}
    ctx.fillStyle='#111';ctx.fillRect(z.x-z.r,z.y-z.r-7,z.r*2,4);
    ctx.fillStyle=z.hp/z.maxHp>0.5?'#63c422':'#e24b4a';ctx.fillRect(z.x-z.r,z.y-z.r-7,z.r*2*(z.hp/z.maxHp),4);
  });

  // Bullets
  bullets.forEach(b=>{ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,3,0,Math.PI*2);ctx.fill();});

  // Player
  ctx.fillStyle='#1a4a7a';ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#378add';ctx.beginPath();ctx.arc(player.x,player.y,player.r-3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#85B7EB';ctx.beginPath();ctx.arc(player.x,player.y,5,0,Math.PI*2);ctx.fill();

  // Range circle
  const wp=WEAPONS[currentWeapon];
  const range=(wp.range+wp.upgRange*20)*1.5;
  ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(player.x,player.y,range,0,Math.PI*2);ctx.stroke();

  // Float texts
  floatTexts.forEach(f=>{ctx.globalAlpha=f.life/f.maxLife;ctx.fillStyle=f.color;ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(f.text,f.x,f.y);});
  ctx.globalAlpha=1;
  ctx.restore();

  // Minimap
  const MM=60,MX=VW-MM-6,MY=VH-MM-6,sx=MM/MAP_W,sy=MM/MAP_H;
  ctx.fillStyle='rgba(0,0,0,0.65)';ctx.fillRect(MX,MY,MM,MM);
  ctx.strokeStyle='#444';ctx.lineWidth=1;ctx.strokeRect(MX,MY,MM,MM);
  windows.forEach(w=>{ctx.fillStyle=w.open?'#8b0000':'#378add';ctx.fillRect(MX+w.x*sx-1,MY+w.y*sy-1,3,3);});
  zombies.forEach(z=>{ctx.fillStyle=z.type===1?'#8a8a3a':z.type===2?'#8a4040':'#4a8a4a';ctx.fillRect(MX+z.x*sx-1,MY+z.y*sy-1,2,2);});
  ctx.fillStyle='#378add';ctx.beginPath();ctx.arc(MX+player.x*sx,MY+player.y*sy,2,0,Math.PI*2);ctx.fill();

  // Wave clear banner
  if(waveClearAnim>0){
    const total=200;
    let a=waveClearAnim>total-25?(total-waveClearAnim)/25:waveClearAnim<35?waveClearAnim/35:1;
    ctx.globalAlpha=a;
    ctx.fillStyle='rgba(0,0,0,0.55)';ctx.fillRect(0,VH/2-54,VW,88);
    ctx.fillStyle='#EF9F27';ctx.font=`bold ${Math.round(VW*0.062)}px sans-serif`;ctx.textAlign='center';
    ctx.fillText(`WAVE ${waveClearBonus.wave} クリア!`,VW/2,VH/2-14);
    ctx.fillStyle='#63c422';ctx.font=`${Math.round(VW*0.038)}px sans-serif`;
    ctx.fillText(`ボーナス  +${waveClearBonus.score}点  +$${waveClearBonus.money}`,VW/2,VH/2+20);
    ctx.globalAlpha=1;
  }
}

function endGame(){
  gameRunning=false;
  document.getElementById('ovTitle').textContent='GAME OVER';
  document.getElementById('ovSub').textContent=`スコア: ${score}  |  WAVE ${wave}  |  ${kills}体撃破  |  $${money}`;
  document.getElementById('overlay').classList.add('show');
}

// ─── Shop ─────────────────────────────────────────────────────
const SHOP_ITEMS=[
  {id:'pistol_dmg',label:'ピストル ダメージ+8',cost:()=>40+WEAPONS[0].upgDmg*30,action:()=>WEAPONS[0].upgDmg++,max:5,cur:()=>WEAPONS[0].upgDmg},
  {id:'shotgun_rate',label:'ショットガン 速度+',cost:()=>50+WEAPONS[1].upgRate*35,action:()=>WEAPONS[1].upgRate++,max:4,cur:()=>WEAPONS[1].upgRate},
  {id:'mg_dmg',label:'マシンガン ダメージ+8',cost:()=>45+WEAPONS[2].upgDmg*30,action:()=>WEAPONS[2].upgDmg++,max:5,cur:()=>WEAPONS[2].upgDmg},
  {id:'speed',label:'移動速度アップ',cost:()=>60+upgrades.speed*40,action:()=>upgrades.speed++,max:4,cur:()=>upgrades.speed},
  {id:'armor',label:'防具 ダメージ-8%',cost:()=>80+upgrades.armor*50,action:()=>upgrades.armor++,max:5,cur:()=>upgrades.armor},
  {id:'coinmag',label:'コイン吸引範囲+',cost:()=>35+upgrades.coinMag*25,action:()=>upgrades.coinMag++,max:5,cur:()=>upgrades.coinMag},
  {id:'hp',label:'HP回復 +30',cost:()=>50,action:()=>player.hp=Math.min(player.maxHp,player.hp+30),max:99,cur:()=>0},
];
function openShop(){
  if(!gameRunning)return;
  const items=document.getElementById('shop-items');
  items.innerHTML='';
  SHOP_ITEMS.forEach(item=>{
    const cost=item.cost(),cur=item.cur(),maxed=cur>=item.max,affordable=money>=cost;
    const div=document.createElement('div');div.className='shop-item';
    div.innerHTML=`<div class="shop-info"><b>${item.label}</b>Lv ${cur}/${item.max} — $${cost}</div>
    <button class="shop-btn" ${maxed||!affordable?'disabled':''} onclick="buyItem('${item.id}')">${maxed?'MAX':affordable?'購入':'不足'}</button>`;
    items.appendChild(div);
  });
  document.getElementById('shop-panel').classList.add('show');
}
function buyItem(id){
  const item=SHOP_ITEMS.find(i=>i.id===id);if(!item)return;
  const cost=item.cost();if(money<cost||item.cur()>=item.max)return;
  money-=cost;item.action();openShop();
}
function closeShop(){document.getElementById('shop-panel').classList.remove('show');}

// ─── Input ────────────────────────────────────────────────────
let moveX=0,moveY=0;
const pad=document.getElementById('stick-pad');
const knob=document.getElementById('stick-knob');
let stickId=-1;
const maxR=22;
function updStick(cx,cy){
  const rect=pad.getBoundingClientRect();
  const dx=cx-(rect.left+rect.width/2),dy=cy-(rect.top+rect.height/2);
  const dist=Math.hypot(dx,dy),ang=Math.atan2(dy,dx);
  const cl=Math.min(dist,maxR);
  knob.style.transform=`translate(calc(-50% + ${Math.cos(ang)*cl}px),calc(-50% + ${Math.sin(ang)*cl}px))`;
  moveX=Math.cos(ang)*(Math.min(dist,maxR)/maxR);
  moveY=Math.sin(ang)*(Math.min(dist,maxR)/maxR);
}
pad.addEventListener('touchstart',e=>{e.preventDefault();const t=e.changedTouches[0];stickId=t.identifier;updStick(t.clientX,t.clientY);},{passive:false});
document.addEventListener('touchmove',e=>{for(let t of e.changedTouches)if(t.identifier===stickId)updStick(t.clientX,t.clientY);},{passive:true});
document.addEventListener('touchend',e=>{for(let t of e.changedTouches)if(t.identifier===stickId){stickId=-1;moveX=0;moveY=0;knob.style.transform='translate(-50%,-50%)';}},{passive:true});
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'||e.key==='a')moveX=-1;
  if(e.key==='ArrowRight'||e.key==='d')moveX=1;
  if(e.key==='ArrowUp'||e.key==='w')moveY=-1;
  if(e.key==='ArrowDown'||e.key==='s')moveY=1;
  if(e.key==='1')setWeapon(0);if(e.key==='2')setWeapon(1);if(e.key==='3')setWeapon(2);
  if(e.key==='Escape')closeShop();
});
document.addEventListener('keyup',e=>{
  if(e.key==='ArrowLeft'||e.key==='a'||e.key==='ArrowRight'||e.key==='d')moveX=0;
  if(e.key==='ArrowUp'||e.key==='w'||e.key==='ArrowDown'||e.key==='s')moveY=0;
});
window.addEventListener('resize',()=>{if(gameRunning)resize();});
startGame();
