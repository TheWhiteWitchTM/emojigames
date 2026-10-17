// Galaxy Hunt — full Super Star Trek mechanics
// Classic green cursor prompt (same vibe as Adventureland / Pirate)

useEffect(() => {
  const gameEl = document.getElementById('game');
  if (!gameEl) return;

  const term = new Glass({
    cols: 72,
    rows: 24,
    title: '🚀 Galaxy Hunt',
    border: '#39ff14',
    footer: 'NAV  SRS  LRS  BEA  MIS  SHE  DAM  COM  STA  HELP  RESTART'
  });
  gameEl.appendChild(term.wrap);
  term.focus();

  let inputBuffer = '';
  let screen = 'intro';

  function print(text = '') {
    term.writeln(text);
  }
  function printAnsi(text) {
    term.writeAnsi(text);
  }
  function clearScreen() {
    term.clear();
  }
  function prompt() {
    term.resetAttr();
    term.setFg(10);          // bright green
    term.write('> ');
  }
  function beep(freq = 440, duration = 0.08) {
    term.tone(freq, duration);
  }

  function showIntro() {
    screen = 'intro';
    term.paintCard({
      kicker: 'Alliance Hunter',
      title: 'GALAXY HUNT',
      lines: [
        'Eight by eight. A stardate that does not wait.',
        'Destroy the raider fleet before time runs out.',
        'Dock at an outpost to repair and resupply.',
        'HELP lists the commands. RESTART begins again.'
      ],
      foot: 'Press Return'
    });
    term.tone(392, 0.08);
    setTimeout(() => term.tone(523, 0.1), 140);
  }

  function finish(reason) {
    if (screen === 'end') return;
    gameOver = true;
    screen = 'end';
    const won = reason === 'won';
    const titles = {
      won: 'THE GALAXY IS CLEAR',
      destroyed: 'HUNTER DESTROYED',
      time: 'STARDATE EXPIRED',
      quit: 'MISSION ABANDONED'
    };
    const lines = {
      won: 'Every raider is scrap.',
      destroyed: 'The hull gives out. The fleet is still out there.',
      time: 'The stardate runs out with raiders on the map.',
      quit: 'You turn the hunter for home.'
    };
    term.paintCard({
      title: titles[reason] || 'MISSION OVER',
      fg: won ? 10 : 9,
      lines: [
        lines[reason] || '',
        'Raiders left ' + totalRaidersLeft() + '    Energy ' + Math.floor(energy),
        'Stardate ' + date.toFixed(1)
      ],
      foot: 'Press R'
    });
    if (won) {
      term.tone(523, 0.1);
      setTimeout(() => term.tone(659, 0.12), 140);
      setTimeout(() => term.tone(784, 0.18), 280);
    } else {
      term.tone(70, 0.45);
    }
  }

  // ---- Game state ----
  const SYSTEMS = ['warp', 'srs', 'lrs', 'beams', 'missiles', 'damage', 'shields', 'computer'];
  let energy, missiles, shields, date, timeLeft;
  let quadX, quadY, secX, secY;
  let docked = false;
  let galaxy = [];
  let current = null;
  let damage = Array(8).fill(0);
  let totalRaiders = 0;
  let totalOutposts = 0;
  let gameOver = false;

  const COURSE = [
    null,
    {dx: 1, dy: 0},
    {dx: 1, dy: -1},
    {dx: 0, dy: -1},
    {dx: -1, dy: -1},
    {dx: -1, dy: 0},
    {dx: -1, dy: 1},
    {dx: 0, dy: 1},
    {dx: 1, dy: 1},
    {dx: 1, dy: 0}
  ];

  function rand(n) { return Math.floor(Math.random() * n); }
  function randf() { return Math.random(); }

  function resetGame() {
    gameOver = false;
    energy = 3000;
    missiles = 10;
    shields = 0;
    date = 2000 + rand(2000);
    timeLeft = 25 + rand(15);
    quadX = 1 + rand(8);
    quadY = 1 + rand(8);
    secX = 1 + rand(8);
    secY = 1 + rand(8);
    docked = false;
    damage.fill(0);

    galaxy = Array.from({length: 8}, () =>
      Array.from({length: 8}, () => ({raiders: 0, outpost: false, stars: 1 + rand(8), scanned: false}))
    );

    totalRaiders = 0;
    totalOutposts = 0;
    let rLeft = 15 + rand(8);
    let oLeft = 2 + rand(3);
    while (rLeft > 0 || oLeft > 0) {
      const x = rand(8), y = rand(8);
      if (rLeft > 0 && galaxy[y][x].raiders === 0 && randf() > 0.55) {
        const n = 1 + rand(3);
        galaxy[y][x].raiders = Math.min(n, rLeft);
        rLeft -= galaxy[y][x].raiders;
        totalRaiders += galaxy[y][x].raiders;
      } else if (oLeft > 0 && !galaxy[y][x].outpost && randf() > 0.75) {
        galaxy[y][x].outpost = true;
        oLeft--;
        totalOutposts++;
      }
    }

    enterQuadrant();
    clearScreen();
    printAnsi('\x1b[1;32m╔══════════════════════════════════════════════════════════════╗\x1b[0m');
    printAnsi('\x1b[1;32m║  GALAXY HUNT  —  Alliance Hunter vs. Raider Fleet           ║\x1b[0m');
    printAnsi('\x1b[1;32m╚══════════════════════════════════════════════════════════════╝\x1b[0m');
    print(`Mission: Destroy ${totalRaiders} raiders before stardate ${date + timeLeft}.`);
    print(`Outposts available: ${totalOutposts}`);
    print('Type HELP for commands and map legend.');
    print('');
    status();
    shortScan(true);
  }

  function enterQuadrant() {
    const q = galaxy[quadY - 1][quadX - 1];
    current = { raiders: [], outpost: null, stars: [], ship: {x: secX, y: secY} };
    const occupied = new Set();
    function place() {
      let x, y;
      do {
        x = 1 + rand(8);
        y = 1 + rand(8);
      } while (occupied.has(`${x},${y}`));
      occupied.add(`${x},${y}`);
      return {x, y};
    }
    for (let i = 0; i < q.raiders; i++) {
      const p = place();
      current.raiders.push({...p, energy: 200 + rand(200)});
    }
    if (q.outpost) current.outpost = place();
    for (let i = 0; i < q.stars; i++) current.stars.push(place());
    if (occupied.has(`${secX},${secY}`)) {
      const p = place();
      secX = p.x; secY = p.y;
    }
    current.ship = {x: secX, y: secY};
    q.scanned = true;
  }

  function totalRaidersLeft() {
    return galaxy.flat().reduce((s, q) => s + q.raiders, 0);
  }

  function status() {
    printAnsi(`\x1b[1;36mStarship Status  (Stardate ${date.toFixed(1)})\x1b[0m`);
    print('');   // <-- blank line after stardate
    print(`Energy: ${Math.floor(energy)}   Missiles: ${missiles}   Shields: ${Math.floor(shields)}`);
    print(`Quadrant ${quadX},${quadY}   Sector ${secX},${secY}`);
    print(`Raiders remaining: ${totalRaidersLeft()}   Time left: ${timeLeft}`);
    print(`Docked: ${docked ? 'YES' : 'no'}`);
    const dmg = SYSTEMS.filter((_, i) => damage[i] > 0);
    if (dmg.length) print('Damaged: ' + dmg.join(', '));
  }

  function shortScan(silent = false) {
    if (damage[1] > 0) { print('Short-range sensors damaged.'); return; }
    if (!silent) print(`\nShort-range scan — Quadrant ${quadX},${quadY}`);
    const map = Array.from({length: 8}, () => Array(8).fill('·'));
    current.stars.forEach(s => { map[s.y-1][s.x-1] = '⭐'; });
    if (current.outpost) map[current.outpost.y-1][current.outpost.x-1] = '🏢';
    current.raiders.forEach(r => { map[r.y-1][r.x-1] = '👾'; });
    map[secY-1][secX-1] = '🚀';
    for (let y = 0; y < 8; y++) print(map[y].join(' '));
    print(`Raiders: ${current.raiders.length}  Outpost: ${current.outpost ? 'yes' : 'no'}  Stars: ${current.stars.length}`);
    beep(320);
  }

  function longScan() {
    if (damage[2] > 0) { print('Long-range sensors damaged.'); return; }
    print('\nLong-range scan:');
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
    beep(300);
  }

  function navigate(course, warp) {
    if (damage[0] > 0) { print('Warp engines damaged.'); return; }
    if (docked) { print('Undock first (move away from outpost).'); return; }
    course = Math.round(course);
    if (course < 1 || course > 9) { print('Course 1–9.'); return; }
    if (warp < 0.1 || warp > 8) { print('Warp factor 0.1–8.'); return; }
    const cost = Math.floor(warp * 8 + rand(5));
    if (energy < cost) { print('Insufficient energy.'); beep(90, 0.08); return; }
    beep(196, 0.05);

    energy -= cost;
    date += warp * 0.1;
    timeLeft = Math.max(0, timeLeft - Math.ceil(warp * 0.2));

    const dir = COURSE[course];
    let steps = Math.round(warp * 8);
    let hitSomething = false;

    for (let s = 0; s < steps && !hitSomething; s++) {
      secX += dir.dx;
      secY += dir.dy;
      let crossed = false;
      if (secX < 1) { secX += 8; quadX = Math.max(1, quadX - 1); crossed = true; }
      if (secX > 8) { secX -= 8; quadX = Math.min(8, quadX + 1); crossed = true; }
      if (secY < 1) { secY += 8; quadY = Math.max(1, quadY - 1); crossed = true; }
      if (secY > 8) { secY -= 8; quadY = Math.min(8, quadY + 1); crossed = true; }
      if (crossed) enterQuadrant();

      if (current.stars.some(st => st.x === secX && st.y === secY)) {
        print('Collision with star! Movement stopped.');
        energy -= 50 + rand(50);
        hitSomething = true;
        beep(90, 0.18);
      } else if (current.raiders.some(r => r.x === secX && r.y === secY)) {
        print('Collision with raider! Both damaged.');
        energy -= 100;
        hitSomething = true;
        beep(110, 0.16);
      } else if (current.outpost && current.outpost.x === secX && current.outpost.y === secY) {
        docked = true;
        print('Docked at outpost. Resupplying...');
        energy = 3000;
        missiles = 10;
        shields = 0;
        damage.fill(0);
        hitSomething = true;
        beep(660, 0.12);
      }
    }

    if (!hitSomething) {
      print(`Course ${course}, warp ${warp} — arrived at Q${quadX},${quadY} S${secX},${secY}`);
    }
    if (current.raiders.length) print('Raiders detected in this quadrant!');
    if (current.outpost && !docked) print('Outpost present. Move onto its sector to dock.');
    if (randf() < 0.05) damageRandom();
    raiderTurn();
    checkEnd();
  }

  function damageRandom() {
    const idx = rand(8);
    damage[idx] += 1 + rand(3);
    print(`Damage to ${SYSTEMS[idx]}!`);
    beep(140, 0.1);
  }

  function raiderTurn() {
    if (!current.raiders.length || docked) return;
    beep(150, 0.05);
    current.raiders.forEach(r => {
      if (r.energy <= 0) return;
      const dist = Math.hypot(r.x - secX, r.y - secY) || 1;
      const hit = Math.floor((r.energy / 2) * (randf() * 0.4 + 0.6) / dist);
      shields -= hit;
      if (shields < 0) {
        energy += shields;
        shields = 0;
        if (randf() < 0.4) damageRandom();
      }
      print(`Raider fires — ${hit} damage. Shields now ${Math.floor(shields)}`);
      r.energy -= 10;
    });
    current.raiders = current.raiders.filter(r => r.energy > 0);
    galaxy[quadY-1][quadX-1].raiders = current.raiders.length;
  }

  function fireBeams(amount) {
    if (damage[3] > 0) { print('Beam control damaged.'); return; }
    if (!current.raiders.length) { print('No raiders in range.'); return; }
    if (amount <= 0 || amount > energy) { print('Invalid energy.'); return; }
    energy -= amount;
    print(`Firing beams with ${amount} energy...`);
    beep(880, 0.07);
    current.raiders.forEach(r => {
      const dist = Math.hypot(r.x - secX, r.y - secY) || 1;
      const dmg = Math.floor(amount * (randf() * 0.3 + 0.7) / (dist * current.raiders.length));
      r.energy -= dmg;
      print(`Raider at ${r.x},${r.y} takes ${dmg} damage (energy left: ${Math.max(0, r.energy)})`);
    });
    const before = current.raiders.length;
    current.raiders = current.raiders.filter(r => r.energy > 0);
    if (current.raiders.length < before) beep(520, 0.08);
    galaxy[quadY-1][quadX-1].raiders = current.raiders.length;
    if (!current.raiders.length) print('All raiders in quadrant destroyed!');
    raiderTurn();
    checkEnd();
  }

  function fireMissile(course) {
    if (damage[4] > 0) { print('Missile tubes damaged.'); return; }
    if (missiles <= 0) { print('No missiles left.'); return; }
    course = Math.round(course);
    if (course < 1 || course > 9) { print('Course 1–9.'); return; }
    missiles--;
    const dir = COURSE[course];
    let x = secX, y = secY;
    print(`Missile launched on course ${course}...`);
    beep(300, 0.06);
    for (let i = 0; i < 10; i++) {
      x += dir.dx;
      y += dir.dy;
      if (x < 1 || x > 8 || y < 1 || y > 8) { print('Missile missed (left quadrant).'); break; }
      if (current.stars.some(s => s.x === x && s.y === y)) { print('Missile absorbed by star.'); break; }
      const hit = current.raiders.findIndex(r => r.x === x && r.y === y);
      if (hit >= 0) {
        print(`Missile hits raider at ${x},${y}! Destroyed.`);
        beep(640, 0.1);
        current.raiders.splice(hit, 1);
        galaxy[quadY-1][quadX-1].raiders = current.raiders.length;
        break;
      }
      if (current.outpost && current.outpost.x === x && current.outpost.y === y) {
        print('Missile hits outpost!');
        current.outpost = null;
        galaxy[quadY-1][quadX-1].outpost = false;
        totalOutposts--;
        break;
      }
    }
    raiderTurn();
    checkEnd();
  }

  function setShields(amt) {
    if (damage[6] > 0) { print('Shield control damaged.'); return; }
    amt = Math.max(0, Math.min(amt, energy + shields));
    energy += shields - amt;
    shields = amt;
    print(`Shields set to ${Math.floor(shields)}. Energy remaining: ${Math.floor(energy)}`);
  }

  function computer() {
    if (damage[7] > 0) { print('Library computer damaged.'); return; }
    print('Computer functions:');
    print('0 - Cumulative galactic record');
    print('1 - Status report');
    print('2 - Missile data');
    print('3 - Navigation data');
    print('4 - Direction/distance calculator');
    print('5 - Galaxy map');
    print('\n--- Galactic Record ---');
    for (let y = 0; y < 8; y++) {
      let line = '';
      for (let x = 0; x < 8; x++) {
        const q = galaxy[y][x];
        line += q.scanned ? `${q.raiders}${q.outpost?'O':'·'}${q.stars} ` : '··· ';
      }
      print(line);
    }
    status();
  }

  function help() {
    clearScreen();
    printAnsi('\x1b[1;33mGALAXY HUNT\x1b[0m');
    print('NAV <1-9> <warp>  move            SRS  short-range scan');
    print('LRS               long-range scan BEA <energy>  beams');
    print('MIS <1-9>         missile         SHE <energy>  shields');
    print('DAM  damage   COM  computer   STA  status');
    print('HELP  this screen    RESTART  again, past the title    QUIT');
    print('');
    printAnsi('\x1b[1;36mMAP\x1b[0m');
    print('🚀 hunter   👾 raider   ⭐ star, it blocks   🏢 outpost   · empty');
    print('');
    print('Course rose:    3');
    print('              4   2');
    print('            5   *   1');
    print('              6   8');
    print('                7');
    print('');
    print('Dock on the outpost sector. Destroy every raider before the stardate.');
  }

  function checkEnd() {
    if (energy <= 0) finish('destroyed');
    else if (timeLeft <= 0) finish('time');
    else if (totalRaidersLeft() <= 0) finish('won');
  }

  function handle(raw) {
    if (gameOver) return;
    const upper = raw.trim().toUpperCase();
    if (!upper) return;
    const parts = upper.split(/\s+/);
    const cmd = parts[0];

    switch (cmd) {
      case 'NAV':
        navigate(parseFloat(parts[1]), parseFloat(parts[2]));
        break;
      case 'SRS': shortScan(); break;
      case 'LRS': longScan(); break;
      case 'BEA': fireBeams(parseFloat(parts[1]) || 0); break;
      case 'MIS': fireMissile(parseFloat(parts[1])); break;
      case 'SHE': setShields(parseFloat(parts[1]) || 0); break;
      case 'DAM':
        print('Damage report:');
        SYSTEMS.forEach((s, i) => print(`  ${s}: ${damage[i] > 0 ? damage[i] + ' (repairing)' : 'OK'}`));
        break;
      case 'COM': computer(); break;
      case 'STA': status(); break;
      case 'HELP': help(); break;
      case 'QUIT':
        finish('quit');
        break;
      case 'RESTART':
        screen = 'play';
        resetGame();
        break;
      default:
        print('Unknown command. Type HELP.');
    }
  }

  function onKey(e) {
    if (screen === 'intro') {
      if (isReturn(e.key) || isRestart(e.key)) {
        e.preventDefault();
        screen = 'play';
        resetGame();
        prompt();
      }
      return;
    }
    if (screen === 'end') {
      if (isRestart(e.key)) {
        e.preventDefault();
        screen = 'play';
        resetGame();
        prompt();
      }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      term.writeln('');
      handle(inputBuffer);
      inputBuffer = '';
      if (screen === 'play') prompt();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      if (inputBuffer.length) {
        inputBuffer = inputBuffer.slice(0, -1);
        term.write('\b');
      }
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      inputBuffer += e.key;
      term.setFg(10);          // bright green while typing
      term.write(e.key);
    }
  }

  term.onKey(onKey);

  showIntro();

  return () => {
    term.destroy();
  };
});
