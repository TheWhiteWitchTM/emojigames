const output = document.getElementById('output');
const statusEl = document.getElementById('status');

const W = 58, H = 16;
let map, player, monsters, items, level, messages, gameOver;
let audioCtx;

function beep(f=440, d=0.05, vol=0.12) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'square'; o.frequency.value = f;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + d);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + d);
  } catch(e) {}
}

const MONSTERS = [
  {ch:'👺', name:'kobold', hp:4, dmg:2, xp:1},
  {ch:'👹', name:'orc', hp:7, dmg:3, xp:2},
  {ch:'🧟', name:'zombie', hp:10, dmg:3, xp:3},
  {ch:'🐉', name:'dragon', hp:25, dmg:7, xp:10}
];

function init() {
  level = 1; messages = []; gameOver = false;
  player = {x:4, y:8, hp:12, maxHp:12, gold:0, xp:0, inv:[]};
  newLevel();
  draw();
}

function newLevel() {
  map = Array.from({length:H}, () => Array(W).fill('·'));
  for (let x=0; x<W; x++) { map[0][x]='⬛'; map[H-1][x]='⬛'; }
  for (let y=0; y<H; y++) { map[y][0]='⬛'; map[y][W-1]='⬛'; }
  monsters = []; items = [];
  player.x = 3; player.y = 8;

  for (let i=0; i<4+level; i++) {
    const m = MONSTERS[Math.min(3, Math.floor(Math.random()* (level+1)))];
    monsters.push({
      ...m,
      x: 6+Math.floor(Math.random()*(W-10)),
      y: 2+Math.floor(Math.random()*(H-4)),
      hp: m.hp
    });
  }
  for (let i=0; i<3; i++) {
    items.push({
      ch: Math.random()<0.5 ? '🧪' : '💰',
      name: Math.random()<0.5 ? 'potion' : 'gold',
      type: Math.random()<0.5 ? 'potion' : 'gold',
      amount: 10+Math.floor(Math.random()*20),
      x: 5+Math.floor(Math.random()*(W-10)),
      y: 2+Math.floor(Math.random()*(H-4))
    });
  }
  if (level < 6) map[H-3][W-4] = '🔽';
  else items.push({x:W-5, y:8, ch:'💎', name:'Amulet', type:'amulet'});

  message('Level ' + level);
  beep(320, 0.08, 0.14);
}

function message(m) {
  messages = [m].concat(messages).slice(0, 2);
}

function move(dx, dy) {
  if (gameOver) return;
  const nx = player.x + dx, ny = player.y + dy;
  if (map[ny][nx] === '⬛') { beep(80, 0.03, 0.08); return; }

  const mon = monsters.find(m => m.x === nx && m.y === ny);
  if (mon) {
    mon.hp -= 3;
    message('Hit ' + mon.name);
    beep(460, 0.07, 0.15);
    if (mon.hp <= 0) {
      monsters = monsters.filter(m => m !== mon);
      player.xp += mon.xp;
      message('Killed ' + mon.name);
      beep(680, 0.1, 0.16);
    }
  } else {
    player.x = nx; player.y = ny;
    beep(210, 0.04, 0.1);
    const it = items.find(i => i.x === nx && i.y === ny);
    if (it) {
      if (it.type === 'gold') player.gold += it.amount;
      else if (it.type === 'amulet') { message('You win!'); gameOver = true; }
      else player.inv.push(it);
      items = items.filter(i => i !== it);
      beep(540, 0.08, 0.14);
    }
    if (map[ny][nx] === '🔽') { level++; newLevel(); return; }
  }

  monsters.forEach(m => {
    if (Math.abs(m.x - player.x) + Math.abs(m.y - player.y) === 1) {
      player.hp -= 2;
      message(m.name + ' hits');
      beep(130, 0.09, 0.13);
      if (player.hp <= 0) { message('Died'); gameOver = true; }
    } else if (Math.random() < 0.5) {
      const mx = m.x + Math.sign(player.x - m.x);
      const my = m.y + Math.sign(player.y - m.y);
      if (map[my] && map[my][mx] === '·') { m.x = mx; m.y = my; }
    }
  });
  draw();
}

function draw() {
  let t = '';
  for (let y = 0; y < H; y++) {
    let line = '';
    for (let x = 0; x < W; x++) {
      let c = map[y][x];
      if (x === player.x && y === player.y) c = '🧑';
      else {
        const mon = monsters.find(m => m.x === x && m.y === y);
        const it = items.find(i => i.x === x && i.y === y);
        if (mon) c = mon.ch;
        else if (it) c = it.ch;
      }
      line += c;
    }
    t += line + '\n';
  }
  t += '\n' + messages.join(' | ');
  if (gameOver) t += '\nR = restart';
  output.value = t;
  statusEl.textContent = `Level ${level}   HP ${player.hp}/${player.maxHp}   Gold ${player.gold}`;
}

document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'r') { init(); return; }
  if (gameOver) return;
  if (k === 'arrowup' || k === 'w') move(0, -1);
  else if (k === 'arrowdown' || k === 's') move(0, 1);
  else if (k === 'arrowleft' || k === 'a') move(-1, 0);
  else if (k === 'arrowright' || k === 'd') move(1, 0);
  else if (k === 'q') {
    const p = player.inv.find(i => i.type === 'potion');
    if (p) {
      player.hp = Math.min(player.maxHp, player.hp + 6);
      player.inv = player.inv.filter(i => i !== p);
      message('Healed');
    }
    draw();
  }
  e.preventDefault();
});

init();
