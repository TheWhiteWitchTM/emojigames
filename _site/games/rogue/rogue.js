// Rogue on the emoji engine. A short dungeon: six floors, then the amulet.
// Return leaves the title. R starts a new delve and skips the title.
useEffect(() => {
  const root = document.getElementById("game");
  if (!root || typeof Glass !== "function") return;

  const W = 56;
  const H = 16;
  const term = new Glass({
    cols: 58,
    rows: 22,
    title: "🗡️ Rogue",
    border: "#39ff14",
    footer: "Arrows or WASD. Q drinks a potion. R starts again."
  });
  root.appendChild(term.wrap);
  term.focus();

  const BESTIARY = [
    { ch: "👺", name: "kobold", hp: 4, dmg: 2, xp: 1, min: 1 },
    { ch: "👹", name: "orc", hp: 7, dmg: 3, xp: 2, min: 1 },
    { ch: "🧟", name: "zombie", hp: 10, dmg: 3, xp: 3, min: 2 },
    { ch: "🐉", name: "dragon", hp: 22, dmg: 6, xp: 12, min: 4 }
  ];

  let mode = "intro";
  let map, player, monsters, items, level, messages;

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
    if (y > 0 && y < H - 1 && x > 0 && x < W - 1) map[y][x] = "·";
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

  function emptySpot(rooms) {
    for (let tries = 0; tries < 80; tries++) {
      const room = rooms[rand(rooms.length)];
      const x = room.x + rand(room.w);
      const y = room.y + rand(room.h);
      if (map[y][x] !== "·") continue;
      if (player && x === player.x && y === player.y) continue;
      if (monsters.some((monster) => monster.x === x && monster.y === y)) continue;
      if (items.some((item) => item.x === x && item.y === y)) continue;
      return { x: x, y: y };
    }
    return null;
  }

  function newLevel() {
    map = Array.from({ length: H }, () => Array(W).fill("⬛"));
    const rooms = [];
    for (let i = 0; i < 7; i++) {
      const rw = 5 + rand(6);
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
      for (let y = 4; y < 12; y++) {
        for (let x = 4; x < 20; x++) map[y][x] = "·";
      }
      rooms.push({ x: 4, y: 4, w: 16, h: 8 });
    }
    for (let i = 1; i < rooms.length; i++) {
      const a = rooms[i - 1];
      const b = rooms[i];
      corridor(a.x + Math.floor(a.w / 2), a.y + Math.floor(a.h / 2), b.x + Math.floor(b.w / 2), b.y + Math.floor(b.h / 2));
    }
    const home = rooms[0];
    player.x = home.x + 1;
    player.y = home.y + 1;
    monsters = [];
    items = [];
    const pool = BESTIARY.filter((kind) => kind.min <= level);
    for (let i = 0; i < 3 + level; i++) {
      const kind = pool[rand(pool.length)];
      const spot = emptySpot(rooms);
      if (!spot) break;
      monsters.push({ ch: kind.ch, name: kind.name, hp: kind.hp + level, dmg: kind.dmg, xp: kind.xp, x: spot.x, y: spot.y });
    }
    for (let i = 0; i < 3; i++) {
      const spot = emptySpot(rooms);
      if (!spot) break;
      const potion = Math.random() < 0.55;
      items.push({
        x: spot.x,
        y: spot.y,
        ch: potion ? "🧪" : "💰",
        name: potion ? "potion" : "gold",
        type: potion ? "potion" : "gold",
        amount: 8 + rand(24)
      });
    }
    const last = rooms[rooms.length - 1];
    const end = { x: last.x + last.w - 2, y: last.y + Math.floor(last.h / 2) };
    if (level < 6) map[end.y][end.x] = "🔽";
    else items.push({ x: end.x, y: end.y, ch: "💎", name: "Amulet", type: "amulet" });
    message("Level " + level + (level === 6 ? ". The amulet is on this floor." : "."));
    term.tone(320, 0.08);
  }

  function showIntro() {
    mode = "intro";
    term.paintCard({
      kicker: "six floors",
      title: "ROGUE",
      lines: [
        "Descend, fight, and bring the amulet up.",
        "Arrows or WASD move. Q drinks a potion.",
        "Gold spends nothing. It only proves you went."
      ],
      foot: "Press Return"
    });
    term.setFooter("Return begins the delve");
    term.tone(392, 0.1);
  }

  function showEnd(won) {
    mode = "end";
    term.paintCard({
      title: won ? "THE AMULET" : "YOU DIED",
      fg: won ? 11 : 9,
      lines: [
        won ? "You close your hand on the Amulet of Yendor." : "The dungeon keeps another name.",
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
    player = { x: 2, y: 2, hp: 16, maxHp: 16, gold: 0, xp: 0, inv: [] };
    newLevel();
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
      let line = "";
      for (let x = 0; x < W; x++) {
        let ch = map[y][x];
        const monster = monsters.find((entry) => entry.x === x && entry.y === y);
        const item = items.find((entry) => entry.x === x && entry.y === y);
        if (monster) ch = monster.ch;
        else if (item) ch = item.ch;
        if (x === player.x && y === player.y) ch = "🧑";
        line += ch;
      }
      term.setFg(2);
      term.writeAt(1, y + 1, line);
    }
    term.setFg(10);
    term.writeAt(1, H + 2, ("HP " + player.hp + "/" + player.maxHp + "   Gold " + player.gold + "   Level " + level + "   Potions " + player.inv.length).slice(0, 56));
    term.setFg(7);
    term.writeAt(1, H + 3, (messages.join("  ·  ") || "").slice(0, 56));
    term.endFrame();
  }

  function quaff() {
    const potion = player.inv.pop();
    if (!potion) {
      message("No potion.");
      term.tone(90, 0.04);
      return;
    }
    player.hp = Math.min(player.maxHp, player.hp + 8);
    message("The potion knits you back together.");
    term.tone(620, 0.08);
  }

  function move(dx, dy) {
    if (mode !== "play") return;
    const nx = player.x + dx;
    const ny = player.y + dy;
    if (!map[ny] || map[ny][nx] === "⬛") {
      term.tone(80, 0.03);
      return;
    }
    const monster = monsters.find((entry) => entry.x === nx && entry.y === ny);
    if (monster) {
      monster.hp -= 3 + Math.floor(player.xp / 4);
      message("You hit the " + monster.name + ".");
      term.tone(460, 0.06);
      if (monster.hp <= 0) {
        monsters = monsters.filter((entry) => entry !== monster);
        player.xp += monster.xp;
        message("The " + monster.name + " drops.");
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
          message("Gold: " + item.amount + ".");
          term.tone(540, 0.06);
        } else if (item.type === "amulet") {
          message("The amulet is warm in your hand.");
          showEnd(true);
          return;
        } else {
          player.inv.push(item);
          message("You pocket a potion.");
          term.tone(540, 0.06);
        }
      }
      if (map[ny][nx] === "🔽") {
        level += 1;
        newLevel();
        draw();
        return;
      }
    }
    monsters.forEach((monster) => {
      if (Math.abs(monster.x - player.x) + Math.abs(monster.y - player.y) === 1) {
        player.hp -= monster.dmg > 4 ? 3 : 2;
        message("The " + monster.name + " hits.");
        term.tone(130, 0.08);
      } else if (Math.random() < 0.65) {
        const mx = monster.x + Math.sign(player.x - monster.x);
        const my = monster.y + Math.sign(player.y - monster.y);
        const blocked = map[my] && map[my][mx] !== "·" && map[my][mx] !== "🔽";
        const crowded = monsters.some((other) => other !== monster && other.x === mx && other.y === my);
        if (!blocked && !crowded && !(mx === player.x && my === player.y)) {
          monster.x = mx;
          monster.y = my;
        }
      }
    });
    if (player.hp <= 0) {
      showEnd(false);
      return;
    }
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
      quaff();
      draw();
    }
  });

  showIntro();

  return () => term.destroy();
});
