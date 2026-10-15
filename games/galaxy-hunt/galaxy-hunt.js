const output = document.getElementById('output');
const form = document.getElementById('command-form');
const input = document.getElementById('command');

window.onerror = function(msg) {
  if (output) output.value += '\nERROR: ' + msg + '\n';
};

let audioCtx;
function beep(freq = 440, duration = 0.1, type = 'square') {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function print(text) {
  output.value += text + '\n';
  output.scrollTop = output.scrollHeight;
}

function clear() { output.value = ''; }

const systems = {
  warp: 0, sensors: 0, beams: 0, missiles: 0, shields: 0, computer: 0
};

let energy, missiles, shields, quadX, quadY, secX, secY, date, timeLeft, docked, galaxy;

function resetGame() {
  energy = 3000;
  missiles = 10;
  shields = 0;
  quadX = 4; quadY = 4;
  secX = 4; secY = 4;
  date = 3500;
  timeLeft = 40;
  docked = false;
  Object.keys(systems).forEach(k => systems[k] = 0);

  galaxy = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => ({ raiders: 0, outpost: false, stars: 1 + Math.floor(Math.random() * 8) }))
  );
  initGalaxy();

  clear();
  print('🚀 Galaxy Hunt — extended');
  print('Destroy all raiders. Type help for commands.');
  print('');
  status();
  print('');
  try {
    shortScan();
  } catch (e) {
    print('(short scan failed: ' + e.message + ')');
  }
  input.disabled = false;
  input.focus();
}

function initGalaxy() {
  let raidersLeft = 12;
  let outpostsLeft = 3;
  while (raidersLeft > 0 || outpostsLeft > 0) {
    const x = Math.floor(Math.random() * 8);
    const y = Math.floor(Math.random() * 8);
    if (raidersLeft > 0 && galaxy[y][x].raiders === 0 && Math.random() > 0.6) {
      galaxy[y][x].raiders = 1 + Math.floor(Math.random() * 3);
      raidersLeft -= galaxy[y][x].raiders;
    } else if (outpostsLeft > 0 && !galaxy[y][x].outpost && Math.random() > 0.8) {
      galaxy[y][x].outpost = true;
      outpostsLeft--;
    }
  }
}

function totalRaiders() {
  return galaxy.flat().reduce((s, q) => s + q.raiders, 0);
}

function status() {
  print(`\n🚀 Starship Status  (Stardate ${date.toFixed(1)})`);
  print(`Energy: ${energy}   Missiles: ${missiles}   Shields: ${shields}`);
  print(`Quadrant ${quadX},${quadY}  Sector ${secX},${secY}`);
  print(`Raiders remaining: ${totalRaiders()}   Time left: ${timeLeft}`);
  print(`Docked: ${docked ? 'yes' : 'no'}`);
  const dmg = Object.entries(systems).filter(([, v]) => v > 0);
  if (dmg.length) print('Damaged: ' + dmg.map(([k, v]) => `${k}(${v})`).join(', '));
}

function longScan() {
  if (systems.sensors > 0) { print('Sensors damaged'); return; }
  print(`\n📡 Long-range scan:`);
  for (let dy = -1; dy <= 1; dy++) {
    let line = '';
    for (let dx = -1; dx <= 1; dx++) {
      const y = quadY - 1 + dy, x = quadX - 1 + dx;
      if (y < 0 || y > 7 || x < 0 || x > 7) line += '   ';
      else {
        const q = galaxy[y][x];
        line += `${q.raiders}${q.outpost ? 'O' : '·'}${q.stars} `;
      }
    }
    print(line);
  }
  beep(300, 0.08);
}

function shortScan() {
  if (systems.sensors > 0) { print('Sensors damaged'); return; }
  const q = galaxy[quadY - 1][quadX - 1];
  print(`\n🔍 Short-range scan of quadrant ${quadX},${quadY}`);
  print(`Raiders: ${q.raiders}  Outpost: ${q.outpost ? 'yes' : 'no'}  Stars: ${q.stars}`);
  print(`You are in sector ${secX},${secY}`);
  for (let y = 1; y <= 8; y++) {
    let line = '';
    for (let x = 1; x <= 8; x++) {
      if (x === secX && y === secY) line += '🚀';
      else if (q.raiders > 0 && Math.random() > 0.85) line += '👾';
      else if (q.outpost && Math.random() > 0.9) line += '🛡️';
      else if (Math.random() > 0.92) line += '⭐';
      else line += '· ';
    }
    print(line);
  }
  beep(320, 0.08);
}

function navigate(course, warp) {
  if (systems.warp > 0) { print('Warp engines damaged'); return; }
  if (docked) { print('You must leave the outpost first'); return; }
  if (warp < 0.1 || warp > 8) { print('Warp 0.1–8'); return; }
  const cost = Math.floor(warp * 8 + Math.random() * 5);
  if (energy < cost) { print('Insufficient energy'); return; }
  energy -= cost;
  const rad = (course - 1) * Math.PI / 4;
  secX += Math.round(Math.cos(rad) * warp * 2);
  secY += Math.round(Math.sin(rad) * warp * 2);
  while (secX < 1) { secX += 8; quadX = Math.max(1, quadX - 1); }
  while (secX > 8) { secX -= 8; quadX = Math.min(8, quadX + 1); }
  while (secY < 1) { secY += 8; quadY = Math.max(1, quadY - 1); }
  while (secY > 8) { secY -= 8; quadY = Math.min(8, quadY + 1); }
  date += warp * 0.1;
  timeLeft -= 1;
  docked = false;
  print(`Course ${course}, warp ${warp}… arrived at ${quadX},${quadY} / ${secX},${secY}`);
  beep(180, 0.15);
  const q = galaxy[quadY - 1][quadX - 1];
  if (q.raiders > 0) print(`👾 ${q.raiders} raider(s) in this quadrant!`);
  if (q.outpost) print('🛡️ Outpost in this quadrant. Dock to resupply.');
  if (Math.random() < 0.08) damageRandom();
}

function damageRandom() {
  const keys = Object.keys(systems);
  const sys = keys[Math.floor(Math.random() * keys.length)];
  systems[sys] += 1 + Math.floor(Math.random() * 3);
  print(`⚠️ ${sys} damaged!`);
  beep(120, 0.2, 'sawtooth');
}

function fireBeam(amount) {
  if (systems.beams > 0) { print('Beam weapons damaged'); return; }
  if (energy < amount) { print('Not enough energy'); return; }
  energy -= amount;
  const q = galaxy[quadY - 1][quadX - 1];
  print(`💥 Beams (${amount})`);
  beep(600, 0.1);
  if (q.raiders > 0 && Math.random() > 0.35) {
    q.raiders--;
    print('👾 Raider destroyed!');
    beep(800, 0.15);
    if (q.raiders === 0) print('Quadrant clear.');
  } else print('Miss or no effect.');
  raiderReturnFire();
}

function fireMissile() {
  if (systems.missiles > 0) { print('Missile systems damaged'); return; }
  if (missiles < 1) { print('No missiles'); return; }
  missiles--;
  const q = galaxy[quadY - 1][quadX - 1];
  print('🚀 Missile away');
  beep(400, 0.12);
  if (q.raiders > 0 && Math.random() > 0.25) {
    q.raiders--;
    print('💥 Hit! Raider destroyed!');
    beep(750, 0.18);
  } else print('Miss.');
  raiderReturnFire();
}

function raiderReturnFire() {
  const q = galaxy[quadY - 1][quadX - 1];
  if (q.raiders === 0 || docked) return;
  const hit = 50 + Math.floor(Math.random() * 150) * q.raiders;
  if (shields >= hit) {
    shields -= hit;
    print(`🛡️ Shields absorbed ${hit}`);
    beep(200, 0.08);
  } else {
    const overflow = hit - shields;
    shields = 0;
    energy = Math.max(0, energy - overflow);
    print(`💥 Hit! Shields down, ${overflow} energy lost`);
    beep(100, 0.25, 'sawtooth');
    if (Math.random() < 0.3) damageRandom();
  }
}

function setShields(pct) {
  if (systems.shields > 0) { print('Shields damaged'); return; }
  pct = Math.max(0, Math.min(100, pct));
  const want = Math.floor(energy * pct / 100);
  energy -= want;
  shields = want;
  print(`🛡️ Shields set to ${pct}% (${shields})`);
  beep(280, 0.1);
}

function dock() {
  const q = galaxy[quadY - 1][quadX - 1];
  if (!q.outpost) { print('No outpost here'); return; }
  docked = true;
  energy = 3000;
  missiles = 10;
  shields = 0;
  Object.keys(systems).forEach(k => systems[k] = 0);
  print('🛡️ Docked at outpost. Energy, missiles and systems restored.');
  beep(500, 0.2);
}

function computer() {
  if (systems.computer > 0) { print('Computer damaged'); return; }
  print('\n🖥️ Computer');
  print(`Raiders remaining: ${totalRaiders()}`);
  print(`Outposts: ${galaxy.flat().filter(q => q.outpost).length}`);
  print(`Current date: ${date.toFixed(1)}`);
  beep(350, 0.08);
}

function help() {
  print(`\nCommands:`);
  print(`  status`);
  print(`  lscan          long-range scan`);
  print(`  sscan          short-range scan`);
  print(`  nav <1-8> <warp>`);
  print(`  beam <energy>`);
  print(`  missile`);
  print(`  shields <0-100>`);
  print(`  dock`);
  print(`  computer`);
  print(`  help`);
  print(`  restart`);
  print(`  quit`);
}

function gameOver(win) {
  print(win ? '\n🏆 All raiders destroyed. Victory!' : '\n💀 Mission failed.');
  print('Type restart to play again.');
  beep(win ? 700 : 80, 0.5, win ? 'square' : 'sawtooth');
  input.disabled = true;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const raw = input.value.trim().toLowerCase();
  input.value = '';
  if (!raw) return;
  print(`> ${raw}`);
  const p = raw.split(/\s+/);
  const v = p[0];

  if (v === 'status') status();
  else if (v === 'lscan') longScan();
  else if (v === 'sscan') shortScan();
  else if (v === 'nav' && p.length >= 3) navigate(+p[1], +p[2]);
  else if (v === 'beam' && p[1]) fireBeam(+p[1]);
  else if (v === 'missile') fireMissile();
  else if (v === 'shields' && p[1]) setShields(+p[1]);
  else if (v === 'dock') dock();
  else if (v === 'computer') computer();
  else if (v === 'help') help();
  else if (v === 'restart') resetGame();
  else if (v === 'quit') gameOver(false);
  else print('Unknown command. Type help.');

  Object.keys(systems).forEach(k => { if (systems[k] > 0 && Math.random() < 0.15) systems[k]--; });

  if (totalRaiders() <= 0) gameOver(true);
  else if (timeLeft <= 0 || energy <= 0) gameOver(false);
});

resetGame();
