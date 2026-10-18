// Witch Hunt — ten maze levels. Hunters wait in the pen, then chase like ghosts.
// scale 2 draws each cell at four times the area (2×2). fitWidth grows the
// window to the column, and the desk shrinks it so the whole maze stays on screen.
const term = new Terminal({
  cols: 40,
  rows: 22,
  showCursor: false,
  hideMouse: true,
  scale: 2,
  fitWidth: true
});
document.getElementById('game').appendChild(term.wrap);
term.focus();
term.titleText.textContent = '🧙 Witch Hunt';

let audioCtx = null;
function beep(freq, dur, type, vol) {
  try {
    const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AC) return;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type || 'square';
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol == null ? 0.045 : vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + dur);
  } catch (e) {}
}

const COLS = 40;
const ROWS = 22;
const TUNNEL_Y = 13;
// Milliseconds per cell. Level 1 gives you time to turn a corner. Each later
// level trims a little. The witch stays quicker than a hunter in a straight
// hall, and that lead shrinks as the levels rise.
const INTRO_MS = 1100;
const DYING_MS = 900;
const CLEAR_MS = 800;
const IMMUNE_MS = 6800;
const SPAWN_MS = 1400;
const SPELL_RANGE = 2;
const BEST_KEY = 'emojigames-witch-hunt-best';

const WALL = { r: 132, g: 82, b: 204 };
const PELLET_C = { r: 255, g: 198, b: 72 };
const DOOR_C = { r: 236, g: 186, b: 255 };
const PEN_C = { r: 42, g: 14, b: 58 };
const GOLD = { r: 255, g: 214, b: 90 };
const CREAM = { r: 236, g: 228, b: 210 };
const INK = { r: 16, g: 0, b: 24 };

const MAP = [
  '########################################',
  '#o....................................o#',
  '#.#######.#######.####.#######.#######.#',
  '#.#######.#######.####.#######.#######.#',
  '#......................................#',
  '#.###.#######.###.####.###.#######.###.#',
  '#.###.#######.###.####.###.#######.###.#',
  '#......................................#',
  '#.###.###.###.#####DD#####.###.###.###.#',
  '#.###.###.###.#pppppppppp#.###.###.###.#',
  '#....e........#pppppppppp#........e....#',
  '#.###.###.###.#pppppppppp#.###.###.###.#',
  '#.###.###.###.############.###.###.###.#',
  '<.............############.............>',
  '#.#######.###.############.###.#######.#',
  '#.#######.###.############.###.#######.#',
  '#..................W...................#',
  '#.###.###.###.############.###.###.###.#',
  '#.............############.............#',
  '#.###.###.###.############.###.###.###.#',
  '#o....................................o#',
  '########################################'
];

const PREF = [
  { x: 0, y: -1 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 1, y: 0 }
];

const KINDS = [
  { sym: '✝️', kind: 'chase', corner: { x: 48, y: -8 } },
  { sym: '☪️', kind: 'ambush', corner: { x: -10, y: -8 } },
  { sym: '✡️', kind: 'flank', corner: { x: 48, y: 30 } },
  { sym: '🕉️', kind: 'shy', corner: { x: -10, y: 30 } }
];

let state = 'menu';
let level = 1;
let lives = 3;
let best = 0;
let witch = null;
let chasers = [];
let pellets = new Set();
let powerUps = new Map();
let puffs = [];
let dir = { x: 0, y: 0 };
let nextDir = { x: 0, y: 0 };
let witchAcc = 0;
let spellCd = 0;
let spellFx = 0;
let spawnSafe = 0;
let introLeft = 0;
let dyingLeft = 0;
let clearLeft = 0;
let levelTime = 0;
let globalMode = 'scatter';
let modeLeft = 0;
let frightEats = 0;
let pausedFrom = 'play';
let toast = '';
let toastLeft = 0;
let exitCell = { x: 19, y: 7 };

function loadBest() {
  try {
    best = Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch (e) {
    best = 0;
  }
}

function saveBest() {
  if (!witch || witch.score <= best) return;
  best = witch.score;
  try {
    localStorage.setItem(BEST_KEY, String(best));
  } catch (e) {}
}

function hunterCount(lv) {
  if (lv <= 2) return 2;
  if (lv <= 5) return 3;
  return 4;
}

function releaseAt(lv, i) {
  const first = Math.max(1000, 2000 - (lv - 1) * 80);
  const gap = Math.max(1400, 2800 - (lv - 1) * 120);
  return first + i * gap;
}

function scatterMs(lv) {
  return Math.max(2200, 5600 - (lv - 1) * 300);
}

function playerMs() {
  return Math.max(156, 280 - (level - 1) * 14);
}

function enemyMs(c) {
  if (c.mode === 'eyes') return 110;
  if (c.mode === 'exit') return playerMs();
  const gap = Math.max(48, 150 - (level - 1) * 10);
  if (c.mode === 'roam' && witch && witch.immunity > 0) return playerMs() + gap + 80;
  return playerMs() + gap;
}

function normalize(x, y) {
  if (y === TUNNEL_Y) {
    if (x < 0) x = COLS - 1;
    else if (x >= COLS) x = 0;
  }
  return { x, y };
}

function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < COLS && y < ROWS;
}

function tile(x, y) {
  if (!inBounds(x, y)) return '#';
  return MAP[y][x];
}

function witchOpen(x, y) {
  if (!inBounds(x, y)) return false;
  const t = tile(x, y);
  return t !== '#' && t !== 'D' && t !== 'p';
}

function ghostOpen(x, y, c) {
  if (!inBounds(x, y)) return false;
  const t = tile(x, y);
  if (t === '#') return false;
  if (t === 'D' || t === 'p') return c.mode === 'pen' || c.mode === 'exit' || c.mode === 'eyes';
  return true;
}

function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function findChar(ch) {
  for (let y = 0; y < ROWS; y++) {
    const x = MAP[y].indexOf(ch);
    if (x >= 0) return { x, y };
  }
  return { x: 19, y: 16 };
}

function loadBoard() {
  pellets = new Set();
  powerUps = new Map();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = MAP[y][x];
      const key = x + ',' + y;
      if (t === '.') pellets.add(key);
      else if (t === 'o') powerUps.set(key, 'immunity');
      else if (t === 'e') powerUps.set(key, 'energy');
    }
  }
  const door = findChar('D');
  exitCell = { x: door.x, y: door.y - 1 };
}

function homeList(n) {
  const rows = {
    2: [18, 21],
    3: [16, 19, 22],
    4: [15, 18, 21, 24]
  };
  return (rows[n] || rows[4]).map(x => ({ x, y: 10 }));
}

function seatChasers() {
  const n = hunterCount(level);
  const homes = homeList(n);
  chasers = [];
  for (let i = 0; i < n; i++) {
    const k = KINDS[i];
    chasers.push({
      x: homes[i].x,
      y: homes[i].y,
      home: { x: homes[i].x, y: homes[i].y },
      dir: { x: 0, y: 0 },
      sym: k.sym,
      kind: k.kind,
      corner: k.corner,
      mode: 'pen',
      slot: i,
      exitAt: releaseAt(level, i),
      acc: i * 40,
      reverse: false,
      prevX: homes[i].x,
      prevY: homes[i].y
    });
  }
}

function beginRun() {
  lives = 3;
  witch = { x: 19, y: 16, energy: 3, maxEnergy: 5, immunity: 0, score: 0 };
  dir = { x: 0, y: 0 };
  nextDir = { x: 0, y: 0 };
  frightEats = 0;
  toast = '';
  startLevel(1);
  beep(440, 0.09, 'square', 0.05);
}

function startLevel(lv) {
  level = lv;
  loadBoard();
  const start = findChar('W');
  witch.x = start.x;
  witch.y = start.y;
  witch.immunity = 0;
  dir = { x: 0, y: 0 };
  nextDir = { x: 0, y: 0 };
  witchAcc = 0;
  spellCd = 0;
  spellFx = 0;
  spawnSafe = 0;
  puffs = [];
  frightEats = 0;
  levelTime = 0;
  globalMode = 'scatter';
  modeLeft = scatterMs(level);
  introLeft = INTRO_MS;
  state = 'intro';
  seatChasers();
}

function respawn() {
  const start = findChar('W');
  witch.x = start.x;
  witch.y = start.y;
  witch.immunity = 0;
  dir = { x: 0, y: 0 };
  nextDir = { x: 0, y: 0 };
  witchAcc = 0;
  spellCd = 0;
  spawnSafe = SPAWN_MS;
  frightEats = 0;
  levelTime = 0;
  globalMode = 'scatter';
  modeLeft = scatterMs(level);
  state = 'play';
  seatChasers();
}

function queueDir(d) {
  nextDir = d;
  if (state !== 'play' && state !== 'intro') return;
  if (!dir.x && !dir.y) {
    dir = d;
    witchAcc = Math.max(witchAcc, playerMs());
  } else if (d.x === -dir.x && d.y === -dir.y) {
    dir = d;
  }
}

function press(key, repeat) {
  if (repeat && (key === 'r' || key === 'R' || key === 'Enter' || key === ' ')) return;

  if (key === 'p' || key === 'P') {
    if (state === 'play' || state === 'intro') {
      pausedFrom = state;
      state = 'pause';
    } else if (state === 'pause') {
      state = pausedFrom;
    }
    return;
  }

  const arrows = {
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    A: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
    D: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    W: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    S: { x: 0, y: 1 }
  };
  if (arrows[key]) {
    queueDir(arrows[key]);
    return;
  }

  const restart = state === 'dead' || state === 'won' || (state === 'dying' && lives <= 0);
  if ((key === 'r' || key === 'R') && restart) {
    beginRun();
    return;
  }
  if (key === 'Enter' && (state === 'menu' || restart)) {
    beginRun();
    return;
  }
  if ((key === ' ' || key === 'Space') && state === 'play') castSpell();
}

function castSpell() {
  if (spellCd > 0) return;
  if (witch.energy <= 0) {
    beep(90, 0.05, 'square', 0.03);
    return;
  }
  witch.energy--;
  spellCd = 420;
  spellFx = 200;
  beep(520, 0.1, 'square', 0.05);
  chasers.forEach(c => {
    if (c.mode !== 'roam') return;
    const d = Math.max(Math.abs(c.x - witch.x), Math.abs(c.y - witch.y));
    if (d > SPELL_RANGE) return;
    puffs.push({ x: c.x, y: c.y, life: 560 });
    witch.score += 50 + level * 10;
    showToast('+' + (50 + level * 10));
    sendHome(c);
    beep(170, 0.12, 'triangle', 0.06);
  });
}

function showToast(text) {
  toast = text;
  toastLeft = 700;
}

function sendHome(c) {
  c.mode = 'eyes';
  c.reverse = false;
  c.dir = { x: 0, y: 0 };
}

function grantImmunity() {
  const fresh = witch.immunity <= 0;
  witch.immunity = IMMUNE_MS;
  frightEats = 0;
  if (fresh) {
    chasers.forEach(c => {
      if (c.mode === 'roam') c.reverse = true;
    });
  }
  beep(980, 0.12, 'square', 0.05);
}

function eatHunter(c) {
  const pts = 100 * (2 ** Math.min(frightEats, 3));
  frightEats++;
  witch.score += pts;
  showToast('+' + pts);
  puffs.push({ x: c.x, y: c.y, life: 400 });
  sendHome(c);
  beep(640, 0.08, 'square', 0.05);
}

function catchWitch() {
  if (state !== 'play' && state !== 'intro') return;
  lives -= 1;
  state = 'dying';
  dyingLeft = DYING_MS;
  beep(70, 0.38, 'sawtooth', 0.07);
}

function overlap() {
  if (state !== 'play' && state !== 'intro') return;
  for (const c of chasers) {
    if (c.mode !== 'roam') continue;
    if (c.x !== witch.x || c.y !== witch.y) continue;
    if (witch.immunity > 0) eatHunter(c);
    else if (spawnSafe <= 0) catchWitch();
  }
}

function collect() {
  const key = witch.x + ',' + witch.y;
  if (pellets.has(key)) {
    pellets.delete(key);
    witch.score += 5;
    beep(760, 0.025, 'square', 0.018);
    if (pellets.size === 0) clearLevel();
  }
  if (!powerUps.has(key) || state === 'cleared' || state === 'won') return;
  const kind = powerUps.get(key);
  if (kind === 'energy') {
    if (witch.energy >= witch.maxEnergy) return;
    powerUps.delete(key);
    witch.energy++;
    beep(860, 0.08, 'square', 0.05);
    return;
  }
  powerUps.delete(key);
  grantImmunity();
}

function clearLevel() {
  witch.score += 100 * level;
  if (level >= 10) {
    state = 'won';
    saveBest();
    beep(880, 0.28, 'square', 0.06);
  } else {
    state = 'cleared';
    clearLeft = CLEAR_MS;
    beep(700, 0.14, 'square', 0.05);
  }
}

function stepWitch() {
  if (nextDir.x || nextDir.y) {
    const n = normalize(witch.x + nextDir.x, witch.y + nextDir.y);
    if (witchOpen(n.x, n.y)) dir = { x: nextDir.x, y: nextDir.y };
  }
  if (!dir.x && !dir.y) return;
  const n = normalize(witch.x + dir.x, witch.y + dir.y);
  if (!witchOpen(n.x, n.y)) return;
  witch.x = n.x;
  witch.y = n.y;
  collect();
  overlap();
}

function pollHeld() {
  const keys = [
    [['ArrowLeft', 'a', 'A'], { x: -1, y: 0 }],
    [['ArrowRight', 'd', 'D'], { x: 1, y: 0 }],
    [['ArrowUp', 'w', 'W'], { x: 0, y: -1 }],
    [['ArrowDown', 's', 'S'], { x: 0, y: 1 }]
  ];
  const held = keys.filter(([names]) => names.some(name => term.isKeyDown(name)));
  if (!held.length) return;
  const queued = held.find(([, d]) => d.x === nextDir.x && d.y === nextDir.y);
  queueDir((queued || held[0])[1]);
}

function moveWitch(dt) {
  if (state !== 'play' && state !== 'intro') return;
  pollHeld();
  witchAcc += dt;
  let guard = 0;
  while (witchAcc >= playerMs() && guard < 2 && (state === 'play' || state === 'intro')) {
    witchAcc -= playerMs();
    stepWitch();
    guard++;
  }
}

function targetFor(c) {
  if (c.mode === 'eyes') return c.home;
  if (c.mode === 'exit') return exitCell;
  if (witch.immunity > 0) return null;
  if (globalMode === 'scatter') return c.corner;
  if (c.kind === 'ambush') {
    return { x: witch.x + dir.x * 4, y: witch.y + dir.y * 4 };
  }
  if (c.kind === 'flank') {
    const lead = { x: witch.x + dir.x * 2, y: witch.y + dir.y * 2 };
    const b = chasers[0];
    return { x: lead.x + (lead.x - b.x), y: lead.y + (lead.y - b.y) };
  }
  if (c.kind === 'shy' && manhattan(c, witch) <= 8) return c.corner;
  return { x: witch.x, y: witch.y };
}

function legalDirs(c) {
  const out = [];
  for (const d of PREF) {
    const back = c.dir.x === -d.x && c.dir.y === -d.y && (c.dir.x || c.dir.y);
    if (back) continue;
    const n = normalize(c.x + d.x, c.y + d.y);
    if (ghostOpen(n.x, n.y, c)) out.push(d);
  }
  if (out.length) return out;
  if (c.dir.x || c.dir.y) {
    const d = { x: -c.dir.x, y: -c.dir.y };
    const n = normalize(c.x + d.x, c.y + d.y);
    if (ghostOpen(n.x, n.y, c)) return [d];
  }
  return out;
}

function firstDir(c, goal) {
  const startKey = c.x + ',' + c.y;
  if (c.x === goal.x && c.y === goal.y) return null;
  const q = [[c.x, c.y]];
  const prev = new Map([[startKey, null]]);
  let found = null;
  while (q.length) {
    const [x, y] = q.shift();
    for (const d of PREF) {
      const n = normalize(x + d.x, y + d.y);
      if (!ghostOpen(n.x, n.y, c)) continue;
      const k = n.x + ',' + n.y;
      if (prev.has(k)) continue;
      prev.set(k, { px: x, py: y, d });
      if (n.x === goal.x && n.y === goal.y) {
        found = k;
        break;
      }
      q.push([n.x, n.y]);
    }
    if (found) break;
  }
  if (!found) return null;
  let cur = found;
  let step = null;
  while (cur) {
    const p = prev.get(cur);
    if (!p) break;
    step = p.d;
    if (p.px === c.x && p.py === c.y) break;
    cur = p.px + ',' + p.py;
  }
  return step;
}

function pickDir(c) {
  if (c.mode === 'eyes' || c.mode === 'exit') {
    const goal = c.mode === 'eyes' ? c.home : exitCell;
    const step = firstDir(c, goal);
    if (step) return step;
  }
  const options = legalDirs(c);
  if (!options.length) return null;
  const goal = targetFor(c);
  if (!goal) return options[Math.floor(Math.random() * options.length)];
  let best = options[0];
  let bestD = Infinity;
  options.forEach(d => {
    const n = normalize(c.x + d.x, c.y + d.y);
    const dist = manhattan(n, goal);
    if (dist < bestD) {
      bestD = dist;
      best = d;
    }
  });
  return best;
}

function commitStep(c, n) {
  c.prevX = c.x;
  c.prevY = c.y;
  c.x = n.x;
  c.y = n.y;
  if (c.mode === 'exit' && c.x === exitCell.x && c.y === exitCell.y) {
    c.mode = 'roam';
    if (!c.dir.x && !c.dir.y) c.dir = { x: 0, y: -1 };
  }
  if (c.mode === 'eyes' && c.x === c.home.x && c.y === c.home.y) {
    c.mode = 'pen';
    c.dir = { x: 0, y: 0 };
    c.exitAt = levelTime + Math.max(900, 1800 - level * 60) + c.slot * 500;
  }
  overlap();
}

function stepChaser(c) {
  if (c.mode === 'pen') {
    if (levelTime >= c.exitAt) c.mode = 'exit';
    else return;
  }
  if (c.reverse) {
    c.reverse = false;
    const back = { x: -c.dir.x, y: -c.dir.y };
    if (back.x || back.y) {
      const n = normalize(c.x + back.x, c.y + back.y);
      if (ghostOpen(n.x, n.y, c)) {
        c.dir = back;
        commitStep(c, n);
        return;
      }
    }
  }
  const d = pickDir(c);
  if (!d) return;
  const n = normalize(c.x + d.x, c.y + d.y);
  if (!ghostOpen(n.x, n.y, c)) return;
  c.dir = d;
  commitStep(c, n);
}

function moveChasers(dt) {
  for (const c of chasers) {
    if (state !== 'play') return;
    c.acc += dt;
    const step = enemyMs(c);
    if (c.acc < step) continue;
    c.acc -= step;
    stepChaser(c);
  }
}

function tickCosmetics(dt) {
  if (spellCd > 0) spellCd = Math.max(0, spellCd - dt);
  if (spellFx > 0) spellFx = Math.max(0, spellFx - dt);
  if (toastLeft > 0) {
    toastLeft -= dt;
    if (toastLeft <= 0) toast = '';
  }
  for (let i = puffs.length - 1; i >= 0; i--) {
    puffs[i].life -= dt;
    if (puffs[i].life <= 0) puffs.splice(i, 1);
  }
}

function update(dt) {
  dt = Math.max(0, Math.min(50, dt));
  if (state === 'menu' || state === 'pause' || state === 'dead' || state === 'won') return;

  if (state === 'dying') {
    dyingLeft -= dt;
    if (dyingLeft <= 0) {
      if (lives > 0) respawn();
      else {
        state = 'dead';
        saveBest();
      }
    }
    return;
  }

  if (state === 'cleared') {
    clearLeft -= dt;
    if (clearLeft <= 0) startLevel(level + 1);
    return;
  }

  tickCosmetics(dt);

  if (state === 'intro') {
    introLeft -= dt;
    moveWitch(dt);
    if (introLeft <= 0 && state === 'intro') state = 'play';
    return;
  }

  if (state !== 'play') return;

  levelTime += dt;
  if (spawnSafe > 0) spawnSafe = Math.max(0, spawnSafe - dt);

  if (witch.immunity > 0) {
    witch.immunity = Math.max(0, witch.immunity - dt);
    if (witch.immunity === 0) {
      frightEats = 0;
      chasers.forEach(c => {
        if (c.mode === 'roam') c.reverse = true;
      });
    }
  } else {
    modeLeft -= dt;
    if (modeLeft <= 0) {
      globalMode = globalMode === 'scatter' ? 'chase' : 'scatter';
      modeLeft = globalMode === 'scatter' ? scatterMs(level) : 14000;
      chasers.forEach(c => {
        if (c.mode === 'roam') c.reverse = true;
      });
    }
  }

  moveWitch(dt);
  if (state !== 'play') return;
  moveChasers(dt);
  overlap();
}

function paint(x, y, ch, fg, bg) {
  if (!inBounds(x, y)) return;
  const cell = { ch };
  if (fg) cell.fgRgb = fg;
  if (bg) cell.bgRgb = bg;
  cell.bright = true;
  term.set(x, y, cell);
}

function center(y, text, fg, bg) {
  const chars = [...text];
  const x = Math.max(0, Math.floor((COLS - chars.length) / 2));
  chars.forEach((ch, i) => paint(x + i, y, ch, fg, bg));
}

function banner(y, text) {
  const chars = [...text];
  const x = Math.floor((COLS - chars.length) / 2);
  for (let i = -1; i <= chars.length; i++) {
    paint(x + i, y, chars[i] || ' ', GOLD, INK);
  }
}

function drawMenu() {
  center(3, '🧙 WITCH HUNT', GOLD);
  center(5, 'Religious symbols hunt you.', CREAM);
  center(6, 'They do not all hunt the same way.', CREAM);
  center(8, 'Eat every pellet. Ten levels.', CREAM);
  center(9, 'Arrows or WASD move. Space casts.', CREAM);
  center(10, 'A spell spends energy.', CREAM);
  center(11, 'A crystal turns the hunt.', CREAM);
  center(13, 'Three lives. P pauses.', CREAM);
  if (best > 0) center(14, 'Best ' + best, GOLD);
  center(17, 'Press Enter', GOLD);
}

function drawEnd() {
  const lines = state === 'won'
    ? ['THE HUNT IS OVER', 'Ten levels cleared', 'Score ' + witch.score, 'Best ' + best, 'R plays again']
    : ['CAUGHT', 'Level ' + level, 'Score ' + witch.score, 'Best ' + best, 'R plays again'];
  const w = 28;
  const h = lines.length + 2;
  const x0 = Math.floor((COLS - w) / 2);
  const y0 = Math.floor((ROWS - h) / 2);
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) paint(x, y, ' ', CREAM, INK);
  }
  for (let x = x0; x < x0 + w; x++) {
    paint(x, y0, '─', DOOR_C, INK);
    paint(x, y0 + h - 1, '─', DOOR_C, INK);
  }
  for (let y = y0; y < y0 + h; y++) {
    paint(x0, y, '│', DOOR_C, INK);
    paint(x0 + w - 1, y, '│', DOOR_C, INK);
  }
  paint(x0, y0, '┌', DOOR_C, INK);
  paint(x0 + w - 1, y0, '┐', DOOR_C, INK);
  paint(x0, y0 + h - 1, '└', DOOR_C, INK);
  paint(x0 + w - 1, y0 + h - 1, '┘', DOOR_C, INK);
  lines.forEach((line, i) => {
    const chars = [...line];
    const x = x0 + Math.floor((w - chars.length) / 2);
    chars.forEach((ch, k) => paint(x + k, y0 + 1 + i, ch, i === 0 ? GOLD : CREAM, INK));
  });
}

function drawWorld() {
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const t = MAP[y][x];
      const key = x + ',' + y;
      if (t === '#') paint(x, y, '█', WALL);
      else if (t === 'p') paint(x, y, ' ', null, PEN_C);
      else if (t === 'D') paint(x, y, '─', DOOR_C, PEN_C);
      else if (powerUps.has(key)) {
        if (powerUps.get(key) === 'energy') paint(x, y, '⚡', { r: 255, g: 220, b: 70 });
        else paint(x, y, '🔮', { r: 110, g: 235, b: 255 });
      } else if (t === '<' || t === '>') paint(x, y, t === '<' ? '◀' : '▶', { r: 180, g: 140, b: 230 });
      else if (pellets.has(key)) paint(x, y, '•', PELLET_C);
    }
  }

  if (spellFx > 0) {
    for (let y = witch.y - SPELL_RANGE; y <= witch.y + SPELL_RANGE; y++) {
      for (let x = witch.x - SPELL_RANGE; x <= witch.x + SPELL_RANGE; x++) {
        if (!inBounds(x, y)) continue;
        if (Math.max(Math.abs(x - witch.x), Math.abs(y - witch.y)) > SPELL_RANGE) continue;
        term.set(x, y, { bgRgb: { r: 86, g: 36, b: 130 } });
      }
    }
  }

  puffs.forEach(p => paint(p.x, p.y, '👻'));

  chasers.forEach(c => {
    let ch = c.sym;
    if (c.mode === 'eyes') ch = '👀';
    else if (c.mode === 'roam' && witch.immunity > 0) ch = '🔵';
    paint(c.x, c.y, ch);
  });

  const hidden = spawnSafe > 0 && Math.floor(spawnSafe / 110) % 2 === 0;
  if (!hidden) {
    paint(
      witch.x,
      witch.y,
      '🧙',
      null,
      witch.immunity > 0 ? { r: 24, g: 48, b: 130 } : null
    );
  }
}

function draw() {
  term.beginFrame();
  term.clear();
  if (state === 'menu') drawMenu();
  else {
    drawWorld();
    if (state === 'pause') banner(4, 'PAUSED');
    if (state === 'dying') banner(4, lives > 0 ? 'CAUGHT' : 'NO LIVES');
    if (state === 'cleared') banner(4, 'LEVEL CLEAR');
    if (state === 'dead' || state === 'won') drawEnd();
  }
  term.endFrame();
  updateHUD();
}

function updateHUD() {
  if (state === 'menu') {
    term.headerMiddleEl.textContent = '';
    term.footerEl.textContent = 'Press Enter';
    return;
  }
  if (state === 'won') {
    term.headerMiddleEl.textContent = 'The hunt is over';
    term.footerEl.textContent = 'Score ' + witch.score + '    R plays again';
    return;
  }
  if (state === 'dead' || (state === 'dying' && lives <= 0)) {
    term.headerMiddleEl.textContent = 'Caught';
    term.footerEl.textContent = 'Score ' + witch.score + '    R plays again';
    return;
  }
  if (state === 'dying') {
    term.headerMiddleEl.textContent = 'Level ' + level + '/10';
    term.footerEl.textContent = 'Life lost    Lives ' + lives;
    return;
  }
  if (state === 'pause') {
    term.headerMiddleEl.textContent = 'Paused';
    term.footerEl.textContent = 'P resumes';
    return;
  }

  term.headerMiddleEl.textContent = 'Level ' + level + '/10';

  let hint = pellets.size + ' left   Space spell';
  if (toast) hint = toast;
  else if (witch.immunity > 0) hint = 'SHIELD ' + Math.ceil(witch.immunity / 1000) + 's';
  else if (spellCd > 0) hint = 'Spell cooling';
  else if (witch.energy <= 0) hint = 'No energy';
  term.footerEl.textContent = '⚡ ' + witch.energy + '/' + witch.maxEnergy + '   💖 ' + lives + '   ⭐ ' + witch.score + '   ' + hint;
}

function frameText() {
  draw();
  const rows = [];
  for (let y = 0; y < ROWS; y++) {
    let line = '';
    for (let x = 0; x < COLS; x++) line += term.get(x, y).ch;
    rows.push(line);
  }
  return rows;
}

term.onKey(e => {
  if (e.key === ' ' || e.key === 'Space') e.preventDefault();
  press(e.key, e.repeat);
});

loadBest();
draw();

let last = performance.now();
function loop(now) {
  const dt = Math.min(50, Math.max(0, now - last));
  last = now;
  if (!(window.GameDesk && window.GameDesk.live && !window.GameDesk.live())) {
    update(dt);
    draw();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

globalThis.WITCH = {
  press(key) { press(key, false); },
  update,
  draw,
  frame: frameText,
  get state() { return state; },
  set state(v) { state = v; },
  get level() { return level; },
  set level(v) { level = v; },
  get lives() { return lives; },
  set lives(v) { lives = v; },
  get mode() { return globalMode; },
  set mode(v) { globalMode = v; },
  get best() { return best; },
  get witch() { return witch; },
  get chasers() { return chasers; },
  get pellets() { return pellets; },
  get powerUps() { return powerUps; },
  get map() { return MAP; },
  get dir() { return dir; },
  playerMs,
  enemyMs
};
