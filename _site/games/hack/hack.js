useEffect(() => {
  const loading = document.getElementById('loading');
  if (loading) loading.remove();

  const gameEl = document.getElementById('game');
  if (!gameEl) return;

  const term = new Glass({
    cols: 40,
    rows: 18,
    cellWidth: 22,
    cellHeight: 26,
    title: '🗡 Hack',
    border: '#39ff14',
    autoRender: false,
    showCursor: false,
    footer: 'Arrows, WASD, or hjkl. P potion. Z scroll. R again.'
  });
  gameEl.appendChild(term.wrap);
  term.focus();

  const GLYPH = { '#': '🪨', '.': '·', '<': '🔼', '>': '🔽' };
  const OX = 1;
  const OY = 1;

  let tower = [];
  let level, player, depth = 1, messages = [], gameOver = false;
  let state = 'intro';

  function beep(freq = 440, duration = 0.06) {
    term.tone(freq, duration);
  }

  function clip(text, n) {
    return Array.from(String(text)).slice(0, n).join('');
  }

  function msg(text) {
    messages.push(text);
    if (messages.length > 2) messages.shift();
  }

  function cell(x, y, ch, fg) {
    term.core.set(x, y, { ch: ch, fg: fg == null ? 7 : fg, bg: 0, bright: false });
  }

  function showIntro() {
    term.clear();
    const lines = [
      [14, 3, '🗡 HACK', 11],
      [6, 6, 'Rooms, corridors, and worse.', 7],
      [4, 8, 'The Amulet of Yendor waits on', 2],
      [12, 9, 'the sixth floor.', 2],
      [8, 12, 'Press Return to descend', 10],
      [7, 15, 'Arrows, WASD, or hjkl', 8]
    ];
    lines.forEach((row) => {
      term.setFg(row[3]);
      term.writeAt(row[0], row[1], row[2]);
    });
    term.render();
    beep(440, 0.15);
  }

  function showDead() {
    term.clear();
    term.setFg(9);
    term.writeAt(12, 4, '💀  YOU DIED');
    term.setFg(7);
    term.writeAt(6, 7, 'The dungeon claims another.');
    term.setFg(8);
    term.writeAt(8, 9, 'Floor ' + depth + '    💰 ' + (player ? player.gold : 0));
    term.setFg(10);
    term.writeAt(11, 13, 'Press R to try again');
    term.render();
    beep(80, 0.4);
  }

  function showWin() {
    term.clear();
    term.setFg(11);
    term.writeAt(8, 4, '💎  THE AMULET');
    term.setFg(10);
    term.writeAt(6, 7, 'Yendor is in your hand.');
    term.setFg(7);
    term.writeAt(8, 9, 'The dungeon can wait.');
    term.setFg(10);
    term.writeAt(11, 13, 'Press R to play again');
    term.render();
    beep(600, 0.3);
  }

  function stand(spot) {
    if (!spot) return;
    player.x = spot.x;
    player.y = spot.y;
    level.monsters = level.monsters.filter((mon) => mon.x !== player.x || mon.y !== player.y);
  }

  function newGame() {
    depth = 1;
    gameOver = false;
    state = 'play';
    tower = [];
    level = new Level(depth);
    tower[depth] = level;
    const start = level.stairsUp || level.randomFloor() || { x: 2, y: 2 };
    player = new Player(start.x, start.y);
    messages = ['🧙 Down you go.'];
    beep(520, 0.1);
    draw();
    term.focus();
  }

  function draw() {
    if (state !== 'play') return;
    term.clear();
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const t = level.tiles[y][x];
        cell(OX + x, OY + y, GLYPH[t] || '·', t === '#' ? 8 : 2);
      }
    }
    level.items.forEach((item) => cell(OX + item.x, OY + item.y, item.ch || '❓', 11));
    level.monsters.forEach((mon) => {
      if (mon.hp > 0) cell(OX + mon.x, OY + mon.y, mon.emoji || '👾', 15);
    });
    cell(OX + player.x, OY + player.y, '🧙', 13);

    const gear = player.weapon ? player.weapon.ch + ' ' + player.weapon.name : '👊 fists';
    const armor = player.armor ? ' ' + player.armor.ch : '';
    const pots = player.inventory.filter((item) => item.type === 'potion').length;
    const scrolls = player.inventory.filter((item) => item.type === 'scroll').length;
    paintRow(16, '🏰 ' + depth + '  💖 ' + player.hp + '/' + player.maxHp + '  💰 ' + player.gold + '  ' + gear + armor, 10);
    paintRow(17, '🧪 ' + pots + '  📜 ' + scrolls + '  ' + (messages[messages.length - 1] || ''), 7);
    term.render();
  }

  function paintRow(row, text, fg) {
    const chars = Array.from(clip(text, term.cols));
    for (let x = 0; x < term.cols; x++) cell(x, row, chars[x] || ' ', fg);
  }

  function monstersTurn() {
    level.monsters.forEach((m) => {
      const res = m.act(level, player);
      if (res) msg(res);
    });
  }

  function checkDead() {
    if (player.hp > 0) return false;
    gameOver = true;
    state = 'dead';
    showDead();
    return true;
  }

  function goDown() {
    tower[depth] = level;
    depth += 1;
    if (!tower[depth]) tower[depth] = new Level(depth);
    level = tower[depth];
    stand(level.stairsUp || level.randomFloor());
    msg(depth === 6 ? '🔽 Floor 6. The Amulet of Yendor is here.' : '🔽 You descend to floor ' + depth + '.');
    beep(180, 0.12);
  }

  function goUp() {
    if (depth <= 1) {
      msg('🔼 The stairs end. The amulet is below.');
      beep(80, 0.04);
      return;
    }
    tower[depth] = level;
    depth -= 1;
    level = tower[depth];
    stand(level.stairsDown || level.randomFloor());
    msg('🔼 You climb to floor ' + depth + '.');
    beep(220, 0.12);
  }

  function playerMove(dx, dy) {
    if (state !== 'play' || gameOver) return;
    const nx = player.x + dx;
    const ny = player.y + dy;
    const mon = level.getMonsterAt(nx, ny);
    let shifted = false;
    if (mon) {
      const dmg = player.attack(mon);
      msg('⚔ You hit the ' + mon.name + ' for ' + dmg + '. ' + Math.max(0, mon.hp) + ' left.');
      beep(200, 0.05);
      if (mon.hp <= 0) {
        msg('💀 The ' + mon.name + ' drops.');
        beep(300, 0.08);
        level.monsters = level.monsters.filter((m) => m !== mon);
      }
    } else if (level.isWalkable(nx, ny)) {
      player.x = nx;
      player.y = ny;
      beep(140, 0.03);
      const item = level.getItemAt(nx, ny);
      if (item) {
        msg(player.pickup(item));
        level.items = level.items.filter((i) => i !== item);
        beep(600, 0.07);
        if (item.type === 'amulet') {
          state = 'win';
          showWin();
          return;
        }
      }
      const tile = level.tiles[ny][nx];
      if (tile === '>') {
        goDown();
        shifted = true;
      } else if (tile === '<') {
        goUp();
        shifted = true;
      }
    } else {
      beep(80, 0.04);
      msg('🪨 Rock.');
    }
    if (state !== 'play') return;
    if (!shifted) monstersTurn();
    if (checkDead()) return;
    draw();
  }

  function drink() {
    const pot = player.inventory.find((item) => item.type === 'potion');
    if (!pot) msg('🧪 You have nothing to drink.');
    else {
      player.inventory = player.inventory.filter((item) => item !== pot);
      player.hp = Math.min(player.maxHp, player.hp + 8);
      msg('🧪 The potion knits you. 💖 ' + player.hp + '/' + player.maxHp + '.');
      beep(620, 0.08);
      monstersTurn();
    }
    if (!checkDead()) draw();
  }

  function blink() {
    const scroll = player.inventory.find((item) => item.type === 'scroll');
    if (!scroll) {
      msg('📜 No scroll.');
      draw();
      return;
    }
    player.inventory = player.inventory.filter((item) => item !== scroll);
    let spot = null;
    for (let tries = 0; tries < 40; tries++) {
      const next = level.randomFloor();
      if (!next || level.getMonsterAt(next.x, next.y)) continue;
      if (next.x === player.x && next.y === player.y) continue;
      spot = next;
      break;
    }
    if (spot) {
      stand(spot);
      msg('📜 The corridor folds. You are elsewhere.');
    } else {
      msg('📜 The scroll fizzes and is gone.');
    }
    beep(480, 0.08);
    monstersTurn();
    if (!checkDead()) draw();
  }

  function showHelp() {
    messages = ['Move hjkl or arrows. P potion. Z scroll. I pack. R again.'];
    draw();
  }

  function moveFor(key) {
    const k = key.length === 1 ? key.toLowerCase() : key;
    const map = {
      a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1],
      q: [-1, -1], e: [1, -1], c: [1, 1],
      h: [-1, 0], l: [1, 0], k: [0, -1], j: [0, 1],
      y: [-1, -1], u: [1, -1], b: [-1, 1], n: [1, 1],
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]
    };
    return map[k] || null;
  }

  function handleKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();

    if (state === 'intro') {
      if (isReturn(e.key) || isRestart(e.key)) newGame();
      return;
    }
    if (state === 'dead' || state === 'win') {
      if (isRestart(e.key)) newGame();
      return;
    }
    const move = moveFor(e.key);
    if (move) {
      playerMove(move[0], move[1]);
    } else if (e.key === 'p' || e.key === 'P') {
      drink();
    } else if (e.key === 'z' || e.key === 'Z') {
      blink();
    } else if (e.key === 'i' || e.key === 'I') {
      const names = player.inventory.map((item) => item.ch + ' ' + item.name);
      msg(names.length ? '🎒 ' + names.join(', ') : '🎒 Empty pockets.');
      draw();
    } else if (e.key === '?') {
      showHelp();
    } else if (e.key === 'r' || e.key === 'R') {
      newGame();
    }
  }

  term.onKey(handleKey);
  term.wrap.addEventListener('click', () => term.focus());

  showIntro();

  return () => {
    term.destroy();
  };
});
