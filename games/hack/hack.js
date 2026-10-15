useEffect(() => {
  const loading = document.getElementById('loading');
  if (loading) loading.remove();

  const gameEl = document.getElementById('game');
  if (!gameEl) return;

  const term = new Terminal({
    fontSize: '14px',
    fg: '#39ff14',
    bg: '#0a140a',
    border: '#39ff14',
    cols: 60,
    rows: 20,
    autoRender: false
  });
  gameEl.appendChild(term.wrap);
  term.wrap.tabIndex = 0;
  term.focus();

  let level, player, depth = 1, messages = [], gameOver = false, won = false;
  let state = 'intro';

  let audioCtx = null;
  function beep(freq = 440, duration = 0.06) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
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
    term.writeAt(16, 16, 'WASD / hjkl to move');
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
    term.write(`Dlvl:${depth}  HP:${player.hp}/${player.maxHp}  Gold:${player.gold}`);
    term.moveTo(0, level.height + 1);
    term.setFg(7);
    term.write((messages.join(' | ') || '').slice(0, 70));
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
        msg(`You descend to level ${depth}.`);
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
    messages = [
      'WASD to move (QEZC diagonals) or hjkl',
      'i = inventory   ? = help   r = restart'
    ];
    draw();
  }

  function handleKey(e) {
    e.preventDefault();
    e.stopPropagation();

    if (state === 'intro') {
      if (e.key === 'Enter') newGame();
      return;
    }
    if (state === 'dead' || state === 'win') {
      if (e.key === 'r' || e.key === 'R') {
        newGame();
      }
      return;
    }

    const key = e.key.toLowerCase();
    const map = {
      a: [-1, 0], d: [1, 0], w: [0, -1], s: [0, 1],
      q: [-1, -1], e: [1, -1], z: [-1, 1], c: [1, 1],
      h: [-1, 0], l: [1, 0], k: [0, -1], j: [0, 1],
      y: [-1, -1], u: [1, -1], b: [-1, 1], n: [1, 1]
    };

    if (map[key]) {
      playerMove(...map[key]);
    } else if (key === 'i') {
      msg('Inventory: ' + (player.inventory.map(i => i.name).join(', ') || 'empty'));
      draw();
    } else if (key === '?') {
      showHelp();
    }
  }

  term.onKey(handleKey);
  term.wrap.addEventListener('click', () => term.focus());

  showIntro();

  return () => {
    term.destroy();
  };
});
