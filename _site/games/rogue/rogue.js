// Rogue on the emoji engine. Six floors, then the amulet, then the climb home.
// Return leaves the title. R starts a new delve and skips the title.
useEffect(() => {
  const root = document.getElementById("game");
  if (!root || typeof Glass !== "function") return;

  const W = 42;
  const H = 14;
  const term = new Glass({
    cols: 44,
    rows: 18,
    cellWidth: 20,
    cellHeight: 24,
    title: "🗡 Rogue",
    border: "#39ff14",
    showCursor: false,
    footer: "Arrows or WASD. Q drinks a potion. R starts again."
  });
  root.appendChild(term.wrap);
  term.focus();

  const BESTIARY = [
    { ch: "👺", name: "kobold", hp: 4, dmg: 2, xp: 1, min: 1 },
    { ch: "👹", name: "orc", hp: 7, dmg: 3, xp: 2, min: 1 },
    { ch: "🧟", name: "zombie", hp: 10, dmg: 4, xp: 3, min: 2 },
    { ch: "🐉", name: "dragon", hp: 22, dmg: 6, xp: 8, min: 4 }
  ];

  let mode = "intro";
  let map, player, monsters, items, level, messages, floors;

  function rand(n) {
    return Math.floor(Math.random() * n);
  }

  function message(text) {
    messages = [text].concat(messages).slice(0, 2);
  }

  function roomFits(rooms, rx, ry, rw, rh) {
    if (rx < 1 || ry < 1 || rx + rw >= W - 1 || ry + rh >= H - 1) return false;
    return !rooms.some((room) => rx < room.x + room.w + 1 && rx + rw + 1 > room.x && ry < room.y + room.h + 1 && ry + rh + 1 > room.y);
  }

  function carve(x, y) {
    if (y > 0 && y < H - 1 && x > 0 && x < W - 1 && map[y][x] === " ") map[y][x] = "·";
  }

  function corridor(x1, y1, x2, y2) {
    let x = x1;
    let y = y1;
    while (x !== x2) {
      carve(x, y);
      x += x < x2 ? 1 : -1;
    }
    while (y !== y2) {
      carve(x, y);
      y += y < y2 ? 1 : -1;
    }
    carve(x2, y2);
  }

  function open(x, y) {
    const tile = map[y] && map[y][x];
    return tile === "·" || tile === "🌅" || tile === "🔼" || tile === "🔽";
  }

  function occupied(x, y) {
    if (player && x === player.x && y === player.y) return true;
    if (monsters.some((monster) => monster.x === x && monster.y === y)) return true;
    if (items.some((item) => item.x === x && item.y === y)) return true;
    if (map[y][x] !== "·") return true;
    return false;
  }

  function emptySpot(rooms, away) {
    for (let tries = 0; tries < 80; tries++) {
      const room = rooms[rand(rooms.length)];
      const x = room.x + rand(room.w);
      const y = room.y + rand(room.h);
      if (occupied(x, y)) continue;
      if (away && Math.abs(x - away.x) + Math.abs(y - away.y) < 4) continue;
      return { x: x, y: y };
    }
    return null;
  }

  function findMark(mark) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) if (map[y][x] === mark) return { x: x, y: y };
    }
    return null;
  }

  function stamp(x, y, ch) {
    term.core.set(x, y, { ch: ch, fg: ch === "·" ? 2 : 7, bg: 0, bright: false });
  }

  function paintRow(row, text, fg) {
    const chars = Array.from(String(text)).slice(0, term.cols);
    for (let x = 0; x < term.cols; x++) stamp(x, row, " ");
    term.core.fg = fg;
    chars.forEach((ch, i) => {
      term.core.set(i, row, { ch: ch, fg: fg, bg: 0, bright: false });
    });
  }

  function buildLevel() {
    map = Array.from({ length: H }, () => Array(W).fill(" "));
    const rooms = [];
    for (let i = 0; i < 8; i++) {
      const rw = 5 + rand(4);
      const rh = 3 + rand(2);
      const rx = 1 + rand(W - rw - 2);
      const ry = 1 + rand(H - rh - 2);
      if (!roomFits(rooms, rx, ry, rw, rh)) continue;
      for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) map[y][x] = "·";
      }
      rooms.push({ x: rx, y: ry, w: rw, h: rh });
    }
    if (!rooms.length) {
      for (let y = 3; y < 9; y++) {
        for (let x = 3; x < 16; x++) map[y][x] = "·";
      }
      rooms.push({ x: 3, y: 3, w: 13, h: 6 });
    }
    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i - 1];
      const b = rooms[i];
      corridor(a.x + Math.floor(a.w / 2), a.y + Math.floor(a.h / 2), b.x + Math.floor(b.w / 2), b.y + Math.floor(b.h / 2));
    }
    const home = rooms[0];
    const last = rooms[rooms.length - 1];
    player.x = home.x + 1;
    player.y = home.y + 1;
    if (level === 1) map[home.y + home.h - 2][home.x + home.w - 2] = "🌅";
    else map[home.y + 1][home.x + 1] = "🔼";
    if (level < 6) map[last.y + Math.floor(last.h / 2)][last.x + last.w - 2] = "🔽";
    if (map[player.y][player.x] !== "·") {
      player.x = home.x + Math.min(2, home.w - 2);
      player.y = home.y + Math.min(2, home.h - 2);
    }
    monsters = [];
    items = [];
    const pool = BESTIARY.filter((kind) => kind.min <= level);
    const want = 2 + level;
    for (let i = 0; i < want; i++) {
      const kind = pool[rand(pool.length)];
      const spot = emptySpot(rooms, player);
      if (!spot) break;
      monsters.push({ ch: kind.ch, name: kind.name, hp: kind.hp + level, dmg: kind.dmg, xp: kind.xp, x: spot.x, y: spot.y });
    }
    for (let i = 0; i < 3; i++) {
      const spot = emptySpot(rooms, player);
      if (!spot) break;
      const roll = Math.random();
      if (roll < 0.4) items.push({ x: spot.x, y: spot.y, ch: "🧪", name: "potion", type: "potion" });
      else if (roll < 0.75) items.push({ x: spot.x, y: spot.y, ch: "💰", name: "gold", type: "gold", amount: 8 + rand(24) });
      else items.push({ x: spot.x, y: spot.y, ch: "🍖", name: "ration", type: "food" });
    }
    if (level === 6) {
      let spot = emptySpot(rooms, player);
      if (!spot) {
        for (let y = 1; y < H - 1 && !spot; y++) {
          for (let x = 1; x < W - 1; x++) {
            if (map[y][x] === "·" && !(player.x === x && player.y === y)) {
              spot = { x: x, y: y };
              break;
            }
          }
        }
      }
      if (spot) items.push({ x: spot.x, y: spot.y, ch: "💎", name: "Amulet", type: "amulet" });
    }
    floors[level] = { map: map, monsters: monsters, items: items };
    message("Level " + level + (level === 6 ? ". The amulet is on this floor." : "."));
    term.tone(320, 0.08);
  }

  function showIntro() {
    mode = "intro";
    term.paintCard({
      kicker: "six floors",
      title: "🗡 ROGUE",
      lines: [
        "Descend. The amulet is on the sixth floor.",
        "Bring it back to the road home.",
        "Arrows or WASD move. Q drinks a potion."
      ],
      foot: "Press Return"
    });
    term.setFooter("Return begins the delve");
    term.tone(392, 0.1);
  }

  function showEnd(won) {
    mode = "end";
    term.paintCard({
      title: won ? "💎 THE AMULET" : "💀 YOU DIED",
      fg: won ? 11 : 9,
      lines: [
        won ? "You carry the Amulet of Yendor into the day." : "The dungeon keeps another name.",
        "Level " + level + "    Gold " + player.gold + "    XP " + player.xp
      ],
      foot: "Press R"
    });
    term.setFooter("R starts a new delve");
    if (won) {
      term.tone(523, 0.1);
      setTimeout(() => term.tone(659, 0.12), 130);
      setTimeout(() => term.tone(784, 0.16), 270);
    } else {
      term.tone(80, 0.42);
    }
  }

  function begin() {
    mode = "play";
    level = 1;
    messages = [];
    floors = [];
    player = { x: 2, y: 2, hp: 20, maxHp: 20, gold: 0, xp: 0, inv: [], amulet: false };
    buildLevel();
    term.setFooter("Arrows or WASD. Q drinks a potion. R starts again.");
    draw();
    term.focus();
  }

  function draw() {
    if (mode !== "play") return;
    term.beginFrame();
    term.clear();
    term.hideCursor();
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let ch = map[y][x];
        const monster = monsters.find((entry) => entry.x === x && entry.y === y);
        const item = items.find((entry) => entry.x === x && entry.y === y);
        if (item) ch = item.ch;
        if (monster) ch = monster.ch;
        if (x === player.x && y === player.y) ch = "🧝";
        stamp(x + 1, y + 1, ch);
      }
    }
    const mark = player.amulet ? "💎" : "·";
    paintRow(H + 2, "💖 " + player.hp + "/" + player.maxHp + "   💰 " + player.gold + "   🏰 " + level + "   🧪 " + player.inv.length + "   " + mark, 10);
    paintRow(H + 3, messages.join("   ") || "", 7);
    term.endFrame();
  }

  function remember() {
    floors[level] = { map: map, monsters: monsters, items: items };
  }

  function arrive(next, mark) {
    remember();
    const saved = floors[next];
    level = next;
    if (!saved) {
      buildLevel();
      return;
    }
    map = saved.map;
    monsters = saved.monsters;
    items = saved.items;
    const spot = findMark(mark);
    if (spot) {
      const blocker = monsters.find((monster) => monster.x === spot.x && monster.y === spot.y);
      if (blocker) {
        const alt = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => {
          const x = spot.x + dx;
          const y = spot.y + dy;
          return open(x, y) && !monsters.some((monster) => monster.x === x && monster.y === y);
        });
        if (alt) {
          blocker.x += alt[0];
          blocker.y += alt[1];
        } else {
          monsters = monsters.filter((monster) => monster !== blocker);
        }
      }
      player.x = spot.x;
      player.y = spot.y;
    }
    message(next > 1 ? "Level " + level + "." : "Level 1. The road home is here.");
    term.tone(300, 0.08);
  }

  function quaff() {
    const potion = player.inv.pop();
    if (!potion) {
      message("No potion.");
      term.tone(90, 0.04);
      return false;
    }
    player.hp = Math.min(player.maxHp, player.hp + 10);
    message("🧪 The potion knits you back together.");
    term.tone(620, 0.08);
    return true;
  }

  function monsterTurn() {
    monsters.forEach((monster) => {
      const dist = Math.abs(monster.x - player.x) + Math.abs(monster.y - player.y);
      if (dist === 1) {
        const soak = Math.floor(player.xp / 8);
        const hit = Math.max(1, Math.ceil(monster.dmg / 2) - soak);
        player.hp -= hit;
        message(monster.ch + " The " + monster.name + " hits for " + hit + ".");
        term.tone(130, 0.08);
        return;
      }
      if (dist > 7 || Math.random() > 0.7) return;
      const mx = monster.x + Math.sign(player.x - monster.x);
      const my = monster.y + Math.sign(player.y - monster.y);
      if (!open(mx, my)) return;
      const crowded = monsters.some((other) => other !== monster && other.x === mx && other.y === my);
      if (!crowded && !(mx === player.x && my === player.y)) {
        monster.x = mx;
        monster.y = my;
      }
    });
  }

  function move(dx, dy) {
    if (mode !== "play") return;
    const nx = player.x + dx;
    const ny = player.y + dy;
    if (!open(nx, ny)) {
      term.tone(80, 0.03);
      return;
    }
    const monster = monsters.find((entry) => entry.x === nx && entry.y === ny);
    let shifted = false;
    if (monster) {
      const blow = 3 + Math.floor(player.xp / 3);
      monster.hp -= blow;
      message("⚔ You hit the " + monster.name + ". " + Math.max(0, monster.hp) + " left.");
      term.tone(460, 0.06);
      if (monster.hp <= 0) {
        monsters = monsters.filter((entry) => entry !== monster);
        player.xp += monster.xp;
        if (player.xp % 6 < monster.xp) {
          player.maxHp += 2;
          player.hp += 2;
        }
        message(monster.ch + " The " + monster.name + " drops.");
        term.tone(680, 0.09);
      }
    } else {
      player.x = nx;
      player.y = ny;
      term.tone(200, 0.025);
      const item = items.find((entry) => entry.x === nx && entry.y === ny);
      if (item) {
        items = items.filter((entry) => entry !== item);
        if (item.type === "gold") {
          player.gold += item.amount;
          message("💰 Gold: " + item.amount + ".");
          term.tone(540, 0.06);
        } else if (item.type === "amulet") {
          player.amulet = true;
          message("💎 The amulet is warm. Climb back to the road home.");
          term.tone(720, 0.12);
        } else if (item.type === "food") {
          player.hp = Math.min(player.maxHp, player.hp + 5);
          message("🍖 You eat. It helps.");
          term.tone(540, 0.06);
        } else {
          player.inv.push(item);
          message("🧪 You pocket a potion.");
          term.tone(540, 0.06);
        }
      }
      const tile = map[ny][nx];
      if (tile === "🌅") {
        if (player.amulet) {
          showEnd(true);
          return;
        }
        message("🌅 The road home waits for the amulet.");
      } else if (tile === "🔽") {
        arrive(level + 1, "🔼");
        shifted = true;
      } else if (tile === "🔼") {
        arrive(level - 1, "🔽");
        shifted = true;
      }
    }
    if (mode !== "play") return;
    if (!shifted) monsterTurn();
    if (player.hp <= 0) {
      showEnd(false);
      return;
    }
    remember();
    draw();
  }

  term.onKey((event) => {
    if (mode === "intro") {
      if (isReturn(event.key) || isRestart(event.key)) begin();
      return;
    }
    if (mode === "end") {
      if (isRestart(event.key)) begin();
      return;
    }
    const key = event.key.toLowerCase();
    if (isRestart(event.key)) {
      begin();
      return;
    }
    if (key === "arrowup" || key === "w") move(0, -1);
    else if (key === "arrowdown" || key === "s") move(0, 1);
    else if (key === "arrowleft" || key === "a") move(-1, 0);
    else if (key === "arrowright" || key === "d") move(1, 0);
    else if (key === "q") {
      if (quaff()) monsterTurn();
      if (player.hp <= 0) showEnd(false);
      else {
        remember();
        draw();
      }
    }
  });

  showIntro();

  return () => term.destroy();
});
