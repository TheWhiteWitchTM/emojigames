// Witch Hunt — 10 levels
const term = new Terminal({ cols: 40, rows: 22, showCursor: false, hideMouse: true });
document.getElementById('game').appendChild(term.wrap);
term.focus();

function beep(freq = 440, dur = 0.08, type = 'square') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0.08;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  } catch (e) {}
}

const COLS = 40, ROWS = 22;
let state = 'menu'; // menu | play | dead | won
let level = 1;
let witch, chasers, ghosts, pellets, powerUps, maze, spellCd;

function makeMaze(lv) {
  const m = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  for (let y = 0; y < ROWS; y++) m[y][0] = m[y][COLS - 1] = 1;
  for (let x = 0; x < COLS; x++) m[0][x] = m[ROWS - 1][x] = 1;

  const density = 0.08 + lv * 0.012;
  for (let y = 2; y < ROWS - 2; y++) {
    for (let x = 2; x < COLS - 2; x++) {
      if (Math.random() < density && (x + y) % 3 !== 0) m[y][x] = 1;
    }
  }
  for (let y = 9; y <= 12; y++)
    for (let x = 16; x <= 23; x++) m[y][x] = 0;
  return m;
}

function startLevel(lv) {
  level = lv;
  maze = makeMaze(lv);
  pellets = new Set();
  powerUps = new Map();
  for (let y = 1; y < ROWS - 1; y++) {
    for (let x = 1; x < COLS - 1; x++) {
      if (maze[y][x] === 0 && Math.random() < 0.12) pellets.add(`${x},${y}`);
    }
  }
  const ups = Math.min(3 + Math.floor(lv / 2), 6);
  for (let i = 0; i < ups; i++) {
    let x, y, tries = 0;
    do {
      x = 2 + Math.floor(Math.random() * (COLS - 4));
      y = 2 + Math.floor(Math.random() * (ROWS - 4));
      tries++;
    } while ((maze[y][x] !== 0 || powerUps.has(`${x},${y}`)) && tries < 40);
    if (maze[y][x] === 0) powerUps.set(`${x},${y}`, Math.random() < 0.6 ? 'energy' : 'immunity');
  }

  witch = { x: 20, y: 11, energy: 3, maxEnergy: 5, immunity: 0, score: witch?.score || 0 };
  const count = Math.min(2 + Math.floor(lv / 2), 6);
  const symbols = ['✝️', '☪️', '✡️', '🕉️', '🙏', '⛪'];
  chasers = [];
  for (let i = 0; i < count; i++) {
    chasers.push({
      x: i % 2 === 0 ? 2 : COLS - 3,
      y: i < 3 ? 2 : ROWS - 3,
      sym: symbols[i % symbols.length],
      alive: true
    });
  }
  ghosts = [];
  spellCd = 0;
  state = 'play';
}

function open(x, y) {
  return x > 0 && x < COLS - 1 && y > 0 && y < ROWS - 1 && maze[y][x] === 0;
}
function dist(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function updateHUD() {
  if (state === 'menu') {
    term.titleText.textContent = 'Witch Hunt';
    term.headerMiddleEl.textContent = '';
    term.footerEl.textContent = 'Press Enter to start';
  } else if (state === 'play') {
    term.titleText.textContent = 'Witch Hunt';
    term.headerMiddleEl.textContent = `Level ${level}/10`;
    term.footerEl.innerHTML = `Energy: ${witch.energy}/${witch.maxEnergy} &nbsp;&nbsp; Score: ${witch.score} &nbsp;&nbsp; ${witch.immunity > 0 ? 'IMMUNE' : 'Space = Spell'}`;
  } else if (state === 'dead') {
    term.titleText.textContent = 'Witch Hunt';
    term.headerMiddleEl.textContent = `Level ${level} — Caught`;
    term.footerEl.textContent = 'R to restart';
  } else if (state === 'won') {
    term.titleText.textContent = 'Witch Hunt';
    term.headerMiddleEl.textContent = 'YOU WON';
    term.footerEl.textContent = `Score: ${witch.score}   R to play again`;
  }
}

function draw() {
  term.beginFrame();
  term.clear();

  if (state === 'menu') {
    term.writeAt(12, 8, 'WITCH HUNT');
    term.writeAt(8, 10, 'Religious symbols chase you.');
    term.writeAt(6, 12, 'Collect pellets, cast spells, survive.');
    term.writeAt(10, 14, '10 levels to win.');
    term.writeAt(11, 17, 'Press Enter');
    term.endFrame();
    updateHUD();
    return;
  }

  if (state === 'dead') {
    term.writeAt(14, 10, 'CAUGHT');
    term.writeAt(10, 12, `Level ${level}   Score: ${witch.score}`);
    term.writeAt(11, 15, 'R to restart');
    term.endFrame();
    updateHUD();
    return;
  }

  if (state === 'won') {
    term.writeAt(13, 9, 'YOU WON');
    term.writeAt(8, 11, 'All 10 levels cleared');
    term.writeAt(10, 13, `Final Score: ${witch.score}`);
    term.writeAt(11, 16, 'R to play again');
    term.endFrame();
    updateHUD();
    return;
  }

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (maze[y][x] === 1) {
        term.set(x, y, { ch: '█', fg: 4 });
      } else {
        const key = `${x},${y}`;
        if (powerUps.has(key)) {
          term.set(x, y, { ch: powerUps.get(key) === 'energy' ? '⚡' : '🛡️' });
        } else if (pellets.has(key)) {
          term.set(x, y, { ch: '·', fg: 11 });
        }
      }
    }
  }

  ghosts.forEach(g => term.set(g.x, g.y, { ch: '👻' }));
  chasers.forEach(c => { if (c.alive) term.set(c.x, c.y, { ch: c.sym }); });
  term.set(witch.x, witch.y, { ch: '🧙‍♀️' });

  term.endFrame();
  updateHUD();
}

function castSpell() {
  if (state !== 'play' || witch.energy <= 0 || spellCd > 0) return;
  witch.energy--;
  spellCd = 18;
  beep(520, 0.1);

  chasers.forEach(c => {
    if (!c.alive) return;
    if (dist(witch, c) <= 2) {
      c.alive = false;
      witch.score += 50 + level * 10;
      ghosts.push({ x: c.x, y: c.y, life: 35 });
      beep(160, 0.12);
    }
  });
}

function update() {
  if (state !== 'play') return;

  if (spellCd > 0) spellCd--;
  if (witch.immunity > 0) witch.immunity--;

  let nx = witch.x, ny = witch.y;
  if (term.isKeyDown('ArrowLeft')) nx--;
  if (term.isKeyDown('ArrowRight')) nx++;
  if (term.isKeyDown('ArrowUp')) ny--;
  if (term.isKeyDown('ArrowDown')) ny++;
  if ((nx !== witch.x || ny !== witch.y) && open(nx, ny)) {
    witch.x = nx;
    witch.y = ny;
  }

  const key = `${witch.x},${witch.y}`;
  if (pellets.has(key)) {
    pellets.delete(key);
    witch.score += 5;
    beep(640, 0.04);
    if (pellets.size === 0) {
      if (level >= 10) {
        state = 'won';
        beep(880, 0.3);
      } else {
        startLevel(level + 1);
        beep(700, 0.15);
      }
      return;
    }
  }
  if (powerUps.has(key)) {
    const t = powerUps.get(key);
    powerUps.delete(key);
    if (t === 'energy' && witch.energy < witch.maxEnergy) {
      witch.energy++;
      beep(860, 0.08);
    }
    if (t === 'immunity') {
      witch.immunity = 70;
      beep(980, 0.12);
    }
  }

  chasers.forEach(c => {
    if (!c.alive) return;
    let best = null, bestD = 999;
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
      const tx = c.x + dx, ty = c.y + dy;
      if (!open(tx, ty)) return;
      const d = dist({ x: tx, y: ty }, witch);
      if (d < bestD) { bestD = d; best = { x: tx, y: ty }; }
    });
    const speed = 0.55 + level * 0.03;
    if (best && Math.random() < speed) {
      c.x = best.x;
      c.y = best.y;
    }
    if (c.x === witch.x && c.y === witch.y && witch.immunity <= 0) {
      state = 'dead';
      beep(70, 0.4);
    }
  });

  for (let i = ghosts.length - 1; i >= 0; i--) {
    ghosts[i].life--;
    if (ghosts[i].life <= 0) ghosts.splice(i, 1);
  }

  if (Math.random() < 0.006 + level * 0.001) {
    const dead = chasers.find(c => !c.alive);
    if (dead) {
      dead.alive = true;
      dead.x = 2 + Math.floor(Math.random() * 6);
      dead.y = 2 + Math.floor(Math.random() * 4);
    }
  }
}

term.onKey(e => {
  if (state === 'menu' && (e.key === 'Enter' || e.key === 'Return')) {
    witch = { score: 0 };
    startLevel(1);
    beep(440, 0.1);
  }
  if ((state === 'dead' || state === 'won') && (e.key === 'r' || e.key === 'R')) {
    state = 'menu';
    witch = { score: 0 };
    beep(330, 0.1);
  }
  if (state === 'play' && (e.key === ' ' || e.key === 'Space')) {
    e.preventDefault();
    castSpell();
  }
});

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
