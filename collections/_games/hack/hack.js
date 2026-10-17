useEffect(() => {
  const loading = document.getElementById('loading');
  if (loading) loading.remove();

  const gameEl = document.getElementById('game');
  if (!gameEl) return;

  const term = new Glass({
    cols: 60,
    rows: 20,
    title: '🗡️ Hack',
    border: '#39ff14',
    autoRender: false,
    showCursor: false,
    footer: 'Arrows, WASD, or hjkl. P drinks a potion. R starts again.'
  });
  gameEl.appendChild(term.wrap);
  term.focus();

  let level, player, depth = 1, messages = [], gameOver = false, won = false;
  let state = 'intro';

  function beep(freq = 440, duration = 0.06) {
    term.tone(freq, duration);
  }

  function msg(text) {
    messages.push(text);
    if (messages.length > 3) messages.shift();
  }

  function showIntro() {
    term.clear();
    term.setFg(10);
    term.writeAt(10, 2, '╦ ╦╔═╗╔═╗╦╔═');
    term.writeAt(10, 3, '╠═╣╠═╣║  ╠╩╗');
    term.writeAt(10, 4, '╩ ╩╩ ╩╚═╝╩ ╩');
    term.setFg(2);
    term.writeAt(8, 7, 'A terminal homage to the original');
    term.writeAt(12, 8, 'Descend. Fight. Survive.');
    term.setFg(11);
    term.writeAt(14, 12, 'Press ENTER to begin');
    term.setFg(8);
    term.writeAt(12, 16, 'Arrows, WASD, or hjkl');
    term.render();
    beep(440, 0.15);
  }

  function showDead() {
    term.clear();
    term.setFg(1);
    term.writeAt(12, 3, '╔══════════════╗');
    term.writeAt(12, 4, '║  YOU DIED    ║');
    term.writeAt(12, 5, '╚══════════════╝');
    term.setFg(8);
    term.writeAt(10, 8, 'The dungeon claims another.');
    term.setFg(10);
    term.writeAt(12, 12, 'Press R to restart');
    term.render();
    beep(80, 0.4);
  }

  function showWin() {
    term.clear();
    term.setFg(11);
    term.writeAt(10, 3, '╔════════════════╗');
    term.writeAt(10, 4, '║   YOU WIN!     ║');
    term.writeAt(10, 5, '╚════════════════╝');
    term.setFg(10);
    term.writeAt(8, 8, 'You have the Amulet of Yendor!');
    term.setFg(2);
    term.writeAt(12, 12, 'Press R to play again');
    term.render();
    beep(600, 0.3);
  }

  function newGame() {
    depth = 1;
    gameOver = false;
    won = false;
    state = 'play';
    level = new Level(depth);
    const r = level.rooms[0];
    const start = r ? { x: r.x + 2, y: r.y + 2 } : (level.randomFloor() || { x: 2, y: 2 });
    player = new Player(start.x, start.y);
    messages = ['Use WASD to move. Type ? for help.'];
    beep(520, 0.1);
    draw();
    term.focus();
  }

  function draw() {
    if (state !== 'play') return;
    term.clear();
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        term.moveTo(x, y);
        const t = level.tiles[y][x];
        if (t === '#') {
          term.setFg(8);
          term.write('█');
        } else {
          term.setFg(2);
          term.write(t || '·');
        }
      }
    }
    level.items.forEach(item => {
      term.moveTo(item.x, item.y);
      term.resetAttr();
      term.write(item.ch || '?');
    });
    level.monsters.forEach(mon => {
      if (mon.hp > 0) {
        term.moveTo(mon.x, mon.y);
        term.resetAttr();
        term.write(mon.emoji || mon.ch);
      }
    });
    term.moveTo(player.x, player.y);
    term.resetAttr();
    term.write('🧙');

    term.moveTo(0, level.height);
    term.setFg(10);
    const gear = player.weapon ? player.weapon.name : 'fists';
    term.write(`Dlvl:${depth}  HP:${player.hp}/${player.maxHp}  Gold:${player.gold}  ${gear}`.slice(0, term.cols));
    term.moveTo(0, level.height + 1);
    term.setFg(7);
    term.write((messages.join(' | ') || '').slice(0, term.cols));
    term.render();
  }

  function playerMove(dx, dy) {
    if (state !== 'play' || gameOver) return;
    const nx = player.x + dx;
    const ny = player.y + dy;
    const mon = level.getMonsterAt(nx, ny);
    if (mon) {
      const dmg = player.attack(mon);
      msg(`You hit the ${mon.emoji || ''} ${mon.name} for ${dmg}.`);
      beep(200, 0.05);
      if (mon.hp <= 0) {
        msg(`You kill the ${mon.name}!`);
        beep(300, 0.08);
        level.monsters = level.monsters.filter(m => m !== mon);
      }
    } else if (level.isWalkable(nx, ny)) {
      player.x = nx;
      player.y = ny;
      beep(140, 0.03);
      const item = level.getItemAt(nx, ny);
      if (item) {
        msg(player.pickup(item));
        level.items = level.items.filter(i => i !== item);
        beep(600, 0.07);
        if (item.type === 'amulet') {
          won = true;
          state = 'win';
          showWin();
          return;
        }
      }
      if (level.tiles[ny][nx] === '⬇️') {
        depth++;
        level = new Level(depth);
        const r = level.rooms[0];
        const s = r ? { x: r.x + 2, y: r.y + 2 } : level.randomFloor();
        player.x = s.x; player.y = s.y;
        msg(depth === 6 ? 'You descend to level 6. The Amulet of Yendor is here.' : `You descend to level ${depth}.`);
        beep(180, 0.12);
      } else if (level.tiles[ny][nx] === '⬆️' && depth > 1) {
        depth--;
        level = new Level(depth);
        const r = level.rooms[level.rooms.length - 1];
        const s = r ? { x: r.x + 2, y: r.y + 2 } : level.randomFloor();
        player.x = s.x; player.y = s.y;
        msg(`You ascend to level ${depth}.`);
        beep(220, 0.12);
      }
    } else {
      beep(80, 0.04);
      msg('You cannot go that way.');
    }
    level.monsters.forEach(m => {
      const res = m.act(level, player);
      if (res) msg(res);
    });
    if (player.hp <= 0) {
      gameOver = true;
      state = 'dead';
      showDead();
      return;
    }
    draw();
  }

  function showHelp() {
    messages = ['Move: arrows/WASD/hjkl.  i inventory.  p potion.  ? help.  r restart'];
    draw();
  }

  function moveFor(key) {
    const k = key.length === 1 ? key.toLowerCase() : key;
    const map = {
      a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1],
      q: [-1, -1], e: [1, -1], z: [-1, 1], c: [1, 1],
      h: [-1, 0], l: [1, 0], k: [0, -1], j: [0, 1],
      y: [-1, -1], u: [1, -1], b: [-1, 1], n: [1, 1],
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]
    };
    return map[k] || null;
  }

  function handleKey(e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();

    const move = moveFor(e.key);
    if (state === 'intro') {
      if (isReturn(e.key) || isRestart(e.key)) newGame();
      return;
    }
    if (state === 'dead' || state === 'win') {
      if (isRestart(e.key)) newGame();
      return;
    }
    if (move) {
      playerMove(...move);
    } else if (e.key === 'p' || e.key === 'P') {
      const pot = player.inventory.find(item => item.type === 'potion');
      if (!pot) msg('You have nothing to drink.');
      else {
        player.inventory = player.inventory.filter(item => item !== pot);
        player.hp = Math.min(player.maxHp, player.hp + 8);
        msg('You drink the ' + pot.name + '.');
        beep(620, 0.08);
      }
      draw();
    } else if (e.key === 'i' || e.key === 'I') {
      msg('Inventory: ' + (player.inventory.map(i => i.name).join(', ') || 'empty'));
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
