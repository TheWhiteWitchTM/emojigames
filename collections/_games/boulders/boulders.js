// Boulders. Dig the dirt. The rocks fall. The diamonds open the door.
// Return leaves the title. R, after the caves or a burial, starts again.
useEffect(() => {
  const root = document.getElementById("game");
  const E = globalThis.EmojiEngine;
  if (!root || !E) return;

  const CAVES = [
    {
      name: "The first hole",
      need: 4,
      rows: [
        "################",
        "#@....*......X.#",
        "#..O...........#",
        "#....*.........#",
        "#..............#",
        "#......O.......#",
        "#..*...........#",
        "#..............#",
        "#.....O...*....#",
        "#..............#",
        "################"
      ]
    },
    {
      name: "The boxed stone",
      need: 4,
      rows: [
        "################",
        "#@.*...........#",
        "#..O...........#",
        "#..*...........#",
        "#.OOO..........#",
        "#..*....*......#",
        "#..............#",
        "#.....O........#",
        "#........*..X..#",
        "#..............#",
        "################"
      ]
    },
    {
      name: "The loose roof",
      need: 6,
      rows: [
        "################",
        "#@.............#",
        "#..O.O.O.O.O.O.#",
        "#.*...*...*....#",
        "#..............#",
        "#..O.O.O.O.O...#",
        "#.*...*...*....#",
        "#..............#",
        "#...........X..#",
        "#..............#",
        "################"
      ]
    }
  ];

  const H = CAVES[0].rows.length;
  const W = CAVES[0].rows[0].length;
  const CELL = 36;
  const OX = 32;
  const OY = 28;
  const WIDTH = OX * 2 + W * CELL;
  const HEIGHT = OY + H * CELL + 24;

  const canvas = new E.Canvas({ width: WIDTH, height: HEIGHT });
  const engine = new E.Engine({ canvas });
  const ui = E.Utilities.wrap(engine, { title: "🪨 Boulders", footer: true });
  ui.wrap.classList.add("ee-game");
  ui.wrap.tabIndex = 0;
  ui.wrap.style.outline = "none";
  root.appendChild(ui.wrap);

  const el = canvas.element;
  el.style.background = "#140c08";
  el.style.border = "2px solid #c4a36a";
  el.style.boxShadow = "0 0 16px #c4a36a44";
  el.style.width = "100%";
  el.style.height = "auto";
  el.style.display = "block";

  const cells = [];
  for (let y = 0; y < H; y++) {
    cells[y] = [];
    for (let x = 0; x < W; x++) {
      cells[y][x] = engine.sprite(" ", OX + x * CELL + CELL / 2, OY + y * CELL + CELL / 2, 30, "play");
    }
  }

  const card = document.createElement("div");
  card.className = "play-card";
  ui.wrap.appendChild(card);

  let mode = "intro";
  let grid = [];
  let player = { x: 1, y: 1 };
  let cave = 0;
  let got = 0;
  let need = 0;
  let lives = 3;
  let tick = 0;
  let lastMove = 0;
  let raf = 0;
  let last = 0;

  function get(x, y) {
    if (y < 0 || x < 0 || y >= H || x >= W) return "#";
    return grid[y][x];
  }

  function set(x, y, tile) {
    grid[y][x] = tile;
  }

  function glyph(x, y) {
    if (mode === "play" && player.x === x && player.y === y) return "🧙";
    const tile = get(x, y);
    if (tile === "#") return "⬛";
    if (tile === ".") return "🟤";
    if (tile === "O") return "⚪";
    if (tile === "*") return "💎";
    if (tile === "X") return "🚪";
    if (tile === "!") return "✨";
    return " ";
  }

  function paint() {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) cells[y][x].emoji = glyph(x, y);
    }
    canvas.draw();
  }

  function status() {
    const spec = CAVES[cave];
    ui.footer.textContent = "Cave " + (cave + 1) + "  " + spec.name + "    " + got + "/" + need + "    lives " + lives;
  }

  function loadCave(index) {
    const spec = CAVES[index];
    cave = index;
    need = spec.need;
    got = 0;
    grid = spec.rows.map((row) => row.split(""));
    for (let y = 0; y < H; y++) {
      if (grid[y].length !== W) return;
      for (let x = 0; x < W; x++) {
        if (grid[y][x] === "@") {
          player = { x: x, y: y };
          grid[y][x] = " ";
        }
      }
    }
    status();
    paint();
  }

  function openExits() {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) if (grid[y][x] === "X") grid[y][x] = "!";
    }
  }

  function showIntro() {
    mode = "intro";
    card.hidden = false;
    card.innerHTML = "<h2>🪨 Boulders</h2><p>Dig the dirt. The rocks fall. The diamonds open the door.</p><p>Arrows or WASD. You can push a rock if the far side is empty.</p><p class=\"play-foot\">Press Return</p>";
    ui.footer.textContent = "Return starts the first cave";
    loadCave(0);
    lives = 3;
    paint();
  }

  function showEnd(won) {
    mode = "end";
    card.hidden = false;
    if (won) {
      card.innerHTML = "<h2>The caves are quiet</h2><p>Three holes. The diamonds came out with you.</p><p class=\"play-foot\">Press R</p>";
      ui.footer.textContent = "R starts again";
      engine.beep(523, 90);
      setTimeout(() => engine.beep(659, 110), 120);
      setTimeout(() => engine.beep(784, 160), 250);
    } else {
      card.innerHTML = "<h2>Buried</h2><p>The cave keeps the diamonds.</p><p class=\"play-foot\">Press R</p>";
      ui.footer.textContent = "R starts again";
      engine.beep(90, 280);
    }
    paint();
  }

  function nextCave() {
    if (cave + 1 >= CAVES.length) {
      showEnd(true);
      return;
    }
    engine.beep(660, 80);
    setTimeout(() => engine.beep(880, 120), 100);
    loadCave(cave + 1);
    mode = "play";
    card.hidden = true;
    ui.wrap.focus();
  }

  function bury() {
    lives -= 1;
    engine.beep(90, 220);
    if (lives <= 0) {
      showEnd(false);
      return;
    }
    loadCave(cave);
    mode = "play";
  }

  function gravity() {
    const moved = new Set();
    let crushed = false;
    tick += 1;
    for (let y = H - 2; y >= 1; y--) {
      for (let x = 1; x < W - 1; x++) {
        const here = y + "," + x;
        if (moved.has(here)) continue;
        const tile = get(x, y);
        if (tile !== "O" && tile !== "*") continue;
        const under = get(x, y + 1);
        const playerUnder = player.x === x && player.y === y + 1;
        if (under === " " || playerUnder) {
          if (playerUnder) crushed = true;
          set(x, y + 1, tile);
          set(x, y, " ");
          moved.add((y + 1) + "," + x);
          continue;
        }
        if (under !== "O" && under !== "*" && under !== "#") continue;
        const first = tick % 2 === 0 ? -1 : 1;
        if (slide(x, y, tile, first, moved) || slide(x, y, tile, -first, moved)) continue;
      }
    }
    return crushed;
  }

  function slide(x, y, tile, dir, moved) {
    const sx = x + dir;
    if (get(sx, y) !== " ") return false;
    if (player.x === sx && player.y === y) return false;
    if (get(sx, y + 1) !== " ") return false;
    if (player.x === sx && player.y === y + 1) return false;
    set(sx, y, tile);
    set(x, y, " ");
    moved.add(y + "," + sx);
    return true;
  }

  function tryMove(dx, dy) {
    if (mode !== "play") return;
    const nx = player.x + dx;
    const ny = player.y + dy;
    const tile = get(nx, ny);
    if (tile === "#" || tile === "X") return;
    if (tile === "O") {
      if (dy !== 0) return;
      const far = get(nx + dx, ny);
      if (far !== " ") return;
      if (player.x === nx + dx && player.y === ny) return;
      set(nx + dx, ny, "O");
      set(nx, ny, " ");
      engine.beep(140, 30);
    } else if (tile === "*") {
      got += 1;
      set(nx, ny, " ");
      engine.beep(880, 50);
      if (got >= need) {
        openExits();
        engine.beep(990, 70);
      }
    } else if (tile === ".") {
      set(nx, ny, " ");
      engine.beep(220, 18);
    } else if (tile === "!") {
      player.x = nx;
      player.y = ny;
      paint();
      nextCave();
      return;
    } else if (tile !== " ") {
      return;
    }
    player.x = nx;
    player.y = ny;
    if (gravity()) bury();
    else {
      status();
      paint();
    }
  }

  function begin() {
    mode = "play";
    card.hidden = true;
    lives = 3;
    loadCave(0);
    engine.beep(440, 70);
    ui.wrap.focus();
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (typeof isGameLive === "function" && !isGameLive()) {
      last = now;
      return;
    }
    if (!last) {
      last = now;
      return;
    }
    const dt = now - last;
    last = now;
    if (mode !== "play") return;
    lastMove += dt;
    if (lastMove < 160) return;
    lastMove = 0;
    if (gravity()) {
      bury();
      return;
    }
    paint();
  }

  const unbind = armGameKeys((event) => {
    if (engine.audio && engine.audio.state === "suspended") engine.audio.resume();
    if (mode === "intro") {
      if (isReturn(event.key) || isRestart(event.key)) begin();
      return;
    }
    if (mode === "end") {
      if (isRestart(event.key)) begin();
      return;
    }
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") tryMove(-1, 0);
    else if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") tryMove(1, 0);
    else if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") tryMove(0, -1);
    else if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") tryMove(0, 1);
  });

  showIntro();
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    if (unbind) unbind();
  };
});
