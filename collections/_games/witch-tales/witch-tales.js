// A Witch's Tale — chaptered tile RPG on the site terminal.
const COLS = 52;
const ROWS = 22;
const MAP_W = 34;
const MAP_H = 14;
const STAT_X = 34;
const STAT_W = 18;
const MSG_Y = 14;
const MSG_H = 8;
const SAVE_KEY = 'emojigames-witch-tales';

const gameEl = document.getElementById('game');
const BASE = (gameEl && gameEl.getAttribute('data-base')) || '/games/witch-tales/';

const term = new Glass({
  cols: COLS,
  rows: ROWS,
  cellWidth: 18,
  cellHeight: 22,
  title: "🧙 A Witch's Tale",
  border: "#c9a227",
  showCursor: false,
  bg: "#0c0612",
  footer: "Arrows or WASD. T talk. L look. I items. F5 save."
});
gameEl.appendChild(term.wrap);
term.focus();

const PAL = {
  ink: { r: 12, g: 6, b: 18 },
  panel: { r: 24, g: 12, b: 40 },
  wall: { r: 96, g: 58, b: 148 },
  floor: { r: 44, g: 28, b: 56 },
  grass: { r: 30, g: 74, b: 40 },
  path: { r: 112, g: 78, b: 44 },
  tree: { r: 16, g: 46, b: 22 },
  water: { r: 40, g: 78, b: 150 },
  wood: { r: 98, g: 58, b: 32 },
  cream: { r: 236, g: 228, b: 210 },
  gold: { r: 255, g: 214, b: 90 },
  witch: { r: 214, g: 148, b: 255 },
  blood: { r: 204, g: 52, b: 68 },
  shade: { r: 88, g: 88, b: 112 },
  crow: { r: 255, g: 212, b: 72 },
  dim: { r: 150, g: 128, b: 168 },
  white: { r: 255, g: 255, b: 255 }
};

const TILES = {
  '#': { walk: false, ch: '🧱', name: 'a wall', fg: PAL.wall, bg: PAL.ink },
  '.': { walk: true, ch: '·', name: 'the floor', fg: PAL.dim, bg: PAL.floor },
  ',': { walk: true, ch: '🌿', name: 'grass', fg: PAL.gold, bg: PAL.grass },
  '=': { walk: true, ch: '🟫', name: 'the path', fg: PAL.gold, bg: PAL.path },
  '+': { walk: true, ch: '🚪', name: 'a door', fg: PAL.gold, bg: PAL.wood },
  '*': { walk: true, ch: '🛌', name: 'your bed', fg: PAL.cream, bg: PAL.floor },
  t: { walk: false, ch: '🍵', name: 'the table', fg: PAL.gold, bg: PAL.floor },
  T: { walk: false, ch: '🌲', name: 'a tree', fg: PAL.grass, bg: PAL.tree },
  W: { walk: false, ch: '🪣', name: 'the well', fg: PAL.cream, bg: PAL.water },
  H: { walk: false, ch: '🛖', name: 'the shed', fg: PAL.gold, bg: PAL.wood },
  G: { walk: 'key', ch: '🔒', name: 'the iron gate', fg: PAL.gold, bg: PAL.wood },
  X: { walk: true, ch: '🌙', name: 'the lane', fg: PAL.gold, bg: PAL.path, exit: true }
};

const DIRS = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  A: { x: -1, y: 0 },
  D: { x: 1, y: 0 },
  W: { x: 0, y: -1 },
  S: { x: 0, y: 1 }
};

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
    g.gain.setValueAtTime(vol == null ? 0.04 : vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(audioCtx.destination);
    o.start(t);
    o.stop(t + dur);
  } catch (e) {}
}

function rnd(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

function paint(x, y, ch, fg, bg) {
  if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
  term.core.set(x, y, {
    ch: ch == null ? ' ' : ch,
    fg: 7,
    bg: 0,
    fgRgb: fg || PAL.cream,
    bgRgb: bg || PAL.ink,
    bright: false
  });
}

function glen(text) {
  return Array.from(String(text)).length;
}

function textAt(x, y, str, fg, bg) {
  const chars = [...String(str)];
  for (let i = 0; i < chars.length; i++) paint(x + i, y, chars[i], fg, bg);
}

function fillRect(x, y, w, h, ch, fg, bg) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) paint(xx, yy, ch, fg, bg);
  }
}

function box(x, y, w, h, fg, bg) {
  const b = ['┌', '─', '┐', '│', '└', '┘'];
  for (let i = 0; i < w; i++) {
    paint(x + i, y, i === 0 ? b[0] : i === w - 1 ? b[2] : b[1], fg, bg);
    paint(x + i, y + h - 1, i === 0 ? b[4] : i === w - 1 ? b[5] : b[1], fg, bg);
  }
  for (let i = 1; i < h - 1; i++) {
    paint(x, y + i, b[3], fg, bg);
    paint(x + w - 1, y + i, b[3], fg, bg);
  }
}

const chapters = () => window.WITCH_TALES_CHAPTERS || {};

let state = 'title';
let chapter = null;
let player = null;
let messages = [];
let lastDir = { x: 0, y: 1 };
let combat = null;
let waitingNext = false;
let notifiedNext = false;

function hasSave() {
  try {
    return !!localStorage.getItem(SAVE_KEY);
  } catch (e) {
    return false;
  }
}

function save() {
  if (!player || !chapter) return;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      chapter: chapter.number,
      map: player.map,
      x: player.x,
      y: player.y,
      hp: player.hp,
      spark: player.spark,
      flags: player.flags,
      items: player.items,
      notifiedNext
    }));
  } catch (e) {}
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function log(text) {
  const width = COLS - 4;
  const words = String(text).split(/\s+/);
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (glen(next) > width) {
      if (line) messages.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) messages.push(line);
  while (messages.length > MSG_H - 2) messages.shift();
}

function mapRows(name) {
  return chapter.maps[name] || [];
}

function mapSize(name) {
  const rows = mapRows(name);
  return { w: rows[0] ? rows[0].length : 0, h: rows.length };
}

function tileChar(name, x, y) {
  const rows = mapRows(name);
  if (y < 0 || y >= rows.length) return ' ';
  const row = rows[y];
  if (x < 0 || x >= row.length) return ' ';
  return row[x];
}

function tileInfo(ch) {
  return TILES[ch] || { walk: false, ch: ' ', name: 'nothing', fg: PAL.dim, bg: PAL.ink };
}

function hasFlag(id) {
  return !!(player && player.flags[id]);
}

function setFlag(id) {
  player.flags[id] = true;
}

function hasItem(id) {
  return player.items.some(it => it.id === id);
}

function giveItem(item) {
  if (hasItem(item.id)) return;
  player.items.push({ id: item.id, name: item.name });
  if (item.flag) setFlag(item.flag);
}

function npcList() {
  return (chapter.npcs || []).filter(n => n.map === player.map);
}

function enemyList() {
  return (chapter.enemies || []).filter(e => e.map === player.map && !hasFlag(e.flag));
}

function npcAt(x, y) {
  return npcList().find(n => n.x === x && n.y === y);
}

function enemyAt(x, y) {
  return enemyList().find(e => e.x === x && e.y === y);
}

function specialAt(x, y) {
  return (chapter.specials || []).find(s => s.map === player.map && s.x === x && s.y === y);
}

function exitAt(x, y) {
  return (chapter.exits || []).find(e => e.map === player.map && e.x === x && e.y === y);
}

function walkable(x, y) {
  const ch = tileChar(player.map, x, y);
  const info = tileInfo(ch);
  if (info.walk === 'key') return hasFlag('has_the_key') || hasItem('iron-key');
  return !!info.walk;
}

function freshPlayer() {
  return {
    map: chapter.start.map,
    x: chapter.start.x,
    y: chapter.start.y,
    hp: chapter.maxHp,
    maxHp: chapter.maxHp,
    spark: chapter.maxSpark,
    maxSpark: chapter.maxSpark,
    flags: {},
    items: []
  };
}

function applySave(data) {
  player = freshPlayer();
  player.map = data.map;
  player.x = data.x;
  player.y = data.y;
  player.hp = Math.min(data.hp, player.maxHp);
  player.spark = Math.min(data.spark, player.maxSpark);
  player.flags = data.flags || {};
  player.items = data.items || [];
  notifiedNext = !!data.notifiedNext;
}

function startChapter(num, fromSave) {
  const data = chapters()[num];
  if (!data) return false;
  chapter = data;
  waitingNext = false;
  if (!fromSave) {
    player = freshPlayer();
    notifiedNext = false;
    messages = [];
    (chapter.opening || []).forEach(log);
  }
  lastDir = { x: 0, y: 1 };
  combat = null;
  state = 'play';
  save();
  draw();
  return true;
}

async function tryNextChapter() {
  if (waitingNext) return;
  const n = chapter.number + 1;
  if (chapters()[n]) {
    startChapter(n, false);
    return;
  }
  if (notifiedNext) {
    log('The next part has not been written yet. Your save is kept.');
    draw();
    return;
  }
  notifiedNext = true;
  log('The road continues. The next part has not been written yet.');
  log('Your save is kept. Come back when the next chapter arrives.');
  beep(240, 0.18, 'square', 0.04);
  save();
  draw();
  waitingNext = true;
  const folder = chapter.nextFolder || String(n).padStart(2, '0');
  try {
    const res = await fetch(BASE + 'chapters/' + folder + '/chapter.json', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      window.WITCH_TALES_CHAPTERS[data.number || n] = data;
      notifiedNext = false;
      waitingNext = false;
      startChapter(data.number || n, false);
      return;
    }
  } catch (e) {}
  waitingNext = false;
}

function lookAt(x, y) {
  const enemy = enemyAt(x, y);
  if (enemy) return enemy.look || ('You see ' + enemy.name + '.');
  const npc = npcAt(x, y);
  if (npc) return npc.look || ('You see ' + npc.name + '.');
  const spec = specialAt(x, y);
  if (spec && spec.look) return spec.look;
  const info = tileInfo(tileChar(player.map, x, y));
  return 'You see ' + info.name + '.';
}

function doLook() {
  const fx = player.x + lastDir.x;
  const fy = player.y + lastDir.y;
  let text = lookAt(fx, fy);
  const here = lookAt(player.x, player.y);
  const facingEmpty = text.indexOf('nothing') !== -1 || text === 'You see the floor.' || text === 'You see grass.' || text === 'You see the path.';
  if (facingEmpty && here && here !== text) text = here;
  log(text);
  beep(520, 0.04, 'square', 0.02);
  draw();
}

function adjacentNpcs() {
  const spots = [
    [player.x, player.y],
    [player.x + 1, player.y],
    [player.x - 1, player.y],
    [player.x, player.y + 1],
    [player.x, player.y - 1]
  ];
  const found = [];
  for (const [x, y] of spots) {
    const n = npcAt(x, y);
    if (n && !found.includes(n)) found.push(n);
  }
  return found;
}

function doTalk() {
  const found = adjacentNpcs();
  if (!found.length) {
    log('No one to talk to.');
    draw();
    return;
  }
  const npc = found[0];
  if (hasFlag(npc.flag) && npc.talkAgain) {
    log(npc.name[0].toUpperCase() + npc.name.slice(1) + ': ' + npc.talkAgain);
  } else {
    const lines = Array.isArray(npc.talk) ? npc.talk : [npc.talk];
    lines.forEach(line => log(npc.name[0].toUpperCase() + npc.name.slice(1) + ': ' + line));
    if (npc.flag) setFlag(npc.flag);
  }
  beep(660, 0.06, 'square', 0.03);
  save();
  draw();
}

function doItems() {
  if (!player.items.length) log('Your pockets are honest and empty.');
  else log('You carry: ' + player.items.map(it => it.name).join(', ') + '.');
  draw();
}

function beginCombat(enemy) {
  combat = {
    enemy,
    hp: enemy.hp,
    maxHp: enemy.hp
  };
  state = 'combat';
  log(enemy.intro || (enemy.name[0].toUpperCase() + enemy.name.slice(1) + ' regards you.'));
  beep(140, 0.16, 'sawtooth', 0.05);
  draw();
}

function endCombat(won) {
  const enemy = combat.enemy;
  combat = null;
  state = 'play';
  if (won) {
    setFlag(enemy.flag);
    if (enemy.loot) giveItem(enemy.loot);
    log(enemy.win || (enemy.name[0].toUpperCase() + enemy.name.slice(1) + ' is gone.'));
    beep(880, 0.12, 'square', 0.05);
    save();
  }
  draw();
}

function playerDied() {
  combat = null;
  log('You fall. The cottage is still there when you open your eyes.');
  player.map = chapter.start.map;
  player.x = chapter.start.x;
  player.y = chapter.start.y;
  player.hp = player.maxHp;
  player.spark = player.maxSpark;
  lastDir = { x: 0, y: 1 };
  state = 'play';
  beep(70, 0.3, 'sawtooth', 0.06);
  save();
  draw();
}

function enemyStrike() {
  const dmg = rnd(combat.enemy.atkMin, combat.enemy.atkMax);
  player.hp = Math.max(0, player.hp - dmg);
  log('A cold hand, or the idea of one. (' + dmg + ')');
  if (player.hp <= 0) playerDied();
  else draw();
}

function combatChoice(n) {
  if (n === 3) {
    log('You step back. It does not follow. Not yet.');
    combat = null;
    state = 'play';
    beep(300, 0.08, 'square', 0.03);
    draw();
    return;
  }
  if (n === 2) {
    if (player.spark <= 0) {
      log('The spark is spent.');
      draw();
      return;
    }
    player.spark--;
    const dmg = rnd(4, 6);
    combat.hp -= dmg;
    log('Violet light. It hates that. (' + dmg + ')');
    beep(980, 0.1, 'square', 0.05);
  } else {
    const dmg = rnd(2, 4);
    combat.hp -= dmg;
    log('You cut. It feels like hitting fog that minds. (' + dmg + ')');
    beep(420, 0.07, 'square', 0.04);
  }
  if (combat.hp <= 0) {
    endCombat(true);
    return;
  }
  enemyStrike();
}

function tryMove(dx, dy) {
  lastDir = { x: dx, y: dy };
  const nx = player.x + dx;
  const ny = player.y + dy;
  const bumpNpc = npcAt(nx, ny);
  if (bumpNpc) {
    doTalk();
    return;
  }
  const enemy = enemyAt(nx, ny);
  if (enemy) {
    beginCombat(enemy);
    return;
  }
  const ch = tileChar(player.map, nx, ny);
  const info = tileInfo(ch);
  if (info.walk === 'key' && !(hasFlag('has_the_key') || hasItem('iron-key'))) {
    log('The gate is shut. The lock wants iron.');
    beep(180, 0.08, 'square', 0.03);
    draw();
    return;
  }
  if (!walkable(nx, ny)) {
    log('That way is shut.');
    draw();
    return;
  }
  if (info.exit) {
    tryNextChapter();
    return;
  }
  const ex = exitAt(nx, ny);
  player.x = nx;
  player.y = ny;
  if (ex) {
    player.map = ex.toMap;
    player.x = ex.toX;
    player.y = ex.toY;
    beep(500, 0.04, 'square', 0.02);
    save();
    draw();
    return;
  }
  save();
  draw();
}

function camera() {
  const { w, h } = mapSize(player.map);
  let cx = 0;
  let cy = 0;
  let ox = 0;
  let oy = 0;
  if (w >= MAP_W) cx = Math.max(0, Math.min(w - MAP_W, player.x - Math.floor(MAP_W / 2)));
  else ox = Math.floor((MAP_W - w) / 2);
  if (h >= MAP_H) cy = Math.max(0, Math.min(h - MAP_H, player.y - Math.floor(MAP_H / 2)));
  else oy = Math.floor((MAP_H - h) / 2);
  return { cx, cy, ox, oy, w, h };
}

function screenPos(mx, my, cam) {
  return { x: mx - cam.cx + cam.ox, y: my - cam.cy + cam.oy };
}

function drawMap() {
  fillRect(0, 0, MAP_W, MAP_H, ' ', PAL.dim, PAL.ink);
  const cam = camera();
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const mx = cam.cx + (x - cam.ox);
      const my = cam.cy + (y - cam.oy);
      const ch = tileChar(player.map, mx, my);
      if (ch === ' ') {
        paint(x, y, ' ', PAL.dim, PAL.ink);
        continue;
      }
      const info = tileInfo(ch);
      let glyph = info.ch;
      if (ch === 'G' && (hasFlag('has_the_key') || hasItem('iron-key'))) glyph = '🔓';
      paint(x, y, glyph, info.fg, info.bg);
    }
  }
  for (const n of npcList()) {
    const p = screenPos(n.x, n.y, cam);
    if (p.x < 0 || p.y < 0 || p.x >= MAP_W || p.y >= MAP_H) continue;
    const fg = n.id === 'crow' ? PAL.crow : PAL.cream;
    paint(p.x, p.y, n.ch, fg, tileInfo(tileChar(player.map, n.x, n.y)).bg);
  }
  for (const e of enemyList()) {
    const p = screenPos(e.x, e.y, cam);
    if (p.x < 0 || p.y < 0 || p.x >= MAP_W || p.y >= MAP_H) continue;
    paint(p.x, p.y, e.ch, PAL.shade, tileInfo(tileChar(player.map, e.x, e.y)).bg);
  }
  const p = screenPos(player.x, player.y, cam);
  if (p.x >= 0 && p.y >= 0 && p.x < MAP_W && p.y < MAP_H) {
    paint(p.x, p.y, '🧙', PAL.witch, tileInfo(tileChar(player.map, player.x, player.y)).bg);
  }
}

function bar(cur, max, width) {
  const n = Math.round((Math.max(0, cur) / max) * width);
  let s = '';
  for (let i = 0; i < width; i++) s += i < n ? '●' : '·';
  return s;
}

function clipGlyphs(text, n) {
  return Array.from(String(text)).slice(0, n).join('');
}

function drawStatus() {
  fillRect(STAT_X, 0, STAT_W, MAP_H, ' ', PAL.cream, PAL.panel);
  box(STAT_X, 0, STAT_W, MAP_H, PAL.gold, PAL.panel);
  const x = STAT_X + 2;
  textAt(x, 1, '🧙 Tale', PAL.gold, PAL.panel);
  textAt(x, 2, 'Ch.' + String(chapter.number).padStart(2, '0'), PAL.cream, PAL.panel);
  textAt(x, 3, clipGlyphs(chapter.title, 14), PAL.cream, PAL.panel);
  textAt(x, 5, '💖 ' + bar(player.hp, player.maxHp, 8), PAL.blood, PAL.panel);
  textAt(x, 6, player.hp + '/' + player.maxHp, PAL.cream, PAL.panel);
  textAt(x, 8, '✨ ' + bar(player.spark, player.maxSpark, 8), PAL.witch, PAL.panel);
  textAt(x, 9, player.spark + '/' + player.maxSpark, PAL.cream, PAL.panel);
  textAt(x, 11, '🎒', PAL.gold, PAL.panel);
  if (!player.items.length) textAt(x, 12, '(empty)', PAL.dim, PAL.panel);
  else textAt(x, 12, clipGlyphs(player.items[0].name, 14), PAL.cream, PAL.panel);
}

function drawMessages() {
  fillRect(0, MSG_Y, COLS, MSG_H, ' ', PAL.cream, PAL.panel);
  box(0, MSG_Y, COLS, MSG_H, PAL.gold, PAL.panel);
  const lines = messages.slice(-(MSG_H - 2));
  for (let i = 0; i < lines.length; i++) {
    textAt(2, MSG_Y + 1 + i, lines[i], PAL.cream, PAL.panel);
  }
}

function drawCombat() {
  const w = COLS - 4;
  const h = 11;
  const x = 2;
  const y = 1;
  fillRect(x, y, w, h, ' ', PAL.cream, PAL.ink);
  box(x, y, w, h, PAL.blood, PAL.ink);
  textAt(x + 2, y + 1, combat.enemy.ch + ' ' + combat.enemy.name, PAL.gold, PAL.ink);
  textAt(x + 2, y + 2, '💖 ' + bar(combat.hp, combat.maxHp, 14) + ' ' + Math.max(0, combat.hp) + '/' + combat.maxHp, PAL.blood, PAL.ink);
  textAt(x + 2, y + 4, '1  ⚔ Strike', PAL.cream, PAL.ink);
  const sparkLine = player.spark > 0 ? '2  ✨ Spark' : '2  ✨ Spark  (spent)';
  textAt(x + 2, y + 5, sparkLine, player.spark > 0 ? PAL.witch : PAL.dim, PAL.ink);
  textAt(x + 2, y + 6, '3  🏃 Run', PAL.cream, PAL.ink);
  textAt(x + 2, y + 8, 'It has no breath.', PAL.dim, PAL.ink);
}

function drawPlay() {
  term.beginFrame();
  fillRect(0, 0, COLS, ROWS, ' ', PAL.cream, PAL.ink);
  drawMap();
  drawStatus();
  drawMessages();
  if (state === 'combat') drawCombat();
  term.endFrame();
}

function drawTitle() {
  term.beginFrame();
  fillRect(0, 0, COLS, ROWS, ' ', PAL.cream, PAL.ink);
  const saved = hasSave();
  const lines = [
    "🧙 A WITCH'S TALE",
    '',
    'Chapter 01  The Beginning',
    '',
    'You are a witch.',
    'The land has problems.',
    'You have opinions about them,',
    'and a certain set of skills.',
    '',
    saved ? '[Enter]  a new tale' : '[Enter]  begin',
    saved ? '[C]      continue' : '',
    '',
    'Arrows move.  T talk.  L look.  F5 save.'
  ];
  const top = 5;
  lines.forEach((line, i) => {
    const fg = i === 0 ? PAL.gold : (line.indexOf('[') === 0 ? PAL.witch : PAL.cream);
    const x = Math.max(0, Math.floor((COLS - glen(line)) / 2));
    textAt(x, top + i, line, fg, PAL.ink);
  });
  term.endFrame();
}

function draw() {
  if (state === 'title') drawTitle();
  else drawPlay();
}

function newTale() {
  if (!chapters()[1]) {
    log('Chapter 01 is missing.');
    return;
  }
  startChapter(1, false);
  beep(720, 0.08, 'square', 0.04);
}

function continueTale() {
  const data = loadSave();
  if (!data) {
    drawTitle();
    return;
  }
  const num = data.chapter || 1;
  if (!chapters()[num]) {
    if (!chapters()[1]) return;
    startChapter(1, false);
    return;
  }
  chapter = chapters()[num];
  applySave(data);
  messages = [];
  log('The kettle is still cold. You remember where you were.');
  combat = null;
  state = 'play';
  draw();
  beep(640, 0.08, 'square', 0.04);
}

term.onKey(e => {
  const k = e.key;
  if (state === 'title') {
    if (k === 'Enter' || k === 'n' || k === 'N') newTale();
    else if ((k === 'c' || k === 'C') && hasSave()) continueTale();
    return;
  }
  if (waitingNext) return;
  if (state === 'combat') {
    if (k === '1' || k === 'Enter') combatChoice(1);
    else if (k === '2') combatChoice(2);
    else if (k === '3' || k === 'Escape') combatChoice(3);
    return;
  }
  if (state !== 'play') return;
  if (DIRS[k]) {
    tryMove(DIRS[k].x, DIRS[k].y);
    return;
  }
  if (k === 't' || k === 'T' || k === ' ') {
    e.preventDefault();
    doTalk();
    return;
  }
  if (k === 'l' || k === 'L') {
    doLook();
    return;
  }
  if (k === 'i' || k === 'I') {
    doItems();
    return;
  }
  if (k === 'F1' || k === '?' || k === 'h' || k === 'H') {
    log('Arrows or WASD move. T talk. L look. I items. F5 save. R title.');
    draw();
    return;
  }
  if (k === 'F5') {
    save();
    log('Saved in this browser.');
    beep(700, 0.05, 'square', 0.03);
    draw();
    return;
  }
  if (k === 'r' || k === 'R') {
    state = 'title';
    draw();
  }
});

draw();

window.WitchTales = {
  get state() { return state; },
  get player() { return player; },
  get messages() { return messages; },
  get chapter() { return chapter; },
  get combat() { return combat; },
  newTale,
  continueTale,
  tryMove,
  doTalk,
  doLook,
  doItems,
  save,
  loadSave,
  hasSave,
  hasFlag
};
