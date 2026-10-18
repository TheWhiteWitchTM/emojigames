// Snake on the emoji engine. Return leaves the title. R starts again and skips it.
// One hundred points clears the board.
useEffect(() => {
  const root = document.getElementById("game");
  const E = globalThis.EmojiEngine;
  if (!root || !E) return;

  const COLS = 22;
  const ROWS = 16;
  const CELL = 28;
  const WIN = 100;
  const W = COLS * CELL;
  const H = ROWS * CELL;
  const canvas = new E.Canvas({ width: W, height: H });
  const engine = new E.Engine({ canvas });
  const ui = E.Utilities.wrap(engine, { title: "🐍 Snake", footer: true });
  ui.wrap.classList.add("ee-game");
  ui.wrap.tabIndex = 0;
  ui.wrap.style.outline = "none";
  root.appendChild(ui.wrap);

  const el = canvas.element;
  el.style.background = "#071107";
  el.style.border = "2px solid #39ff14";
  el.style.boxShadow = "0 0 16px #39ff1455";
  el.style.width = "100%";
  el.style.height = "auto";
  el.style.display = "block";

  const rocks = ["🌵", "🪨", "💣", "🔥"];
  const card = document.createElement("div");
  card.className = "play-card";
  ui.wrap.appendChild(card);

  let mode = "intro";
  let snake = [];
  let dir = { x: 1, y: 0 };
  let queued = dir;
  let food = null;
  let obstacles = [];
  let score = 0;
  let speed = 210;
  let timer = 0;
  let segs = [];
  let foodSprite = null;
  let rockSprites = [];

  function cell(x, y) {
    return { x: x * CELL + CELL / 2, y: y * CELL + CELL / 2 };
  }

  function occupied(x, y, extra) {
    if (snake.some((part) => part.x === x && part.y === y)) return true;
    if (obstacles.some((rock) => rock.x === x && rock.y === y)) return true;
    if (extra && extra.x === x && extra.y === y) return true;
    return false;
  }

  function dropSprite(sprite) {
    if (!sprite) return;
    sprite.alive = false;
    canvas.remove(sprite);
    const index = engine.sprites.indexOf(sprite);
    if (index >= 0) engine.sprites.splice(index, 1);
  }

  function placeFood() {
    let spot = null;
    for (let tries = 0; tries < 400; tries++) {
      const next = { x: 1 + Math.floor(Math.random() * (COLS - 2)), y: 1 + Math.floor(Math.random() * (ROWS - 2)) };
      if (!occupied(next.x, next.y)) {
        spot = next;
        break;
      }
    }
    if (!spot) {
      showEnd(true);
      return;
    }
    food = spot;
    if (!foodSprite) foodSprite = engine.sprite("🍎", 0, 0, 24, "play");
    const at = cell(food.x, food.y);
    foodSprite.x = at.x;
    foodSprite.y = at.y;
  }

  function placeRocks() {
    rockSprites.forEach(dropSprite);
    rockSprites = [];
    obstacles = [];
    const count = 6 + Math.floor(score / 40);
    for (let i = 0; i < count; i++) {
      let spot = null;
      for (let tries = 0; tries < 80; tries++) {
        const next = {
          x: 1 + Math.floor(Math.random() * (COLS - 2)),
          y: 1 + Math.floor(Math.random() * (ROWS - 2)),
          emoji: rocks[i % rocks.length]
        };
        const nearStart = Math.abs(next.x - 8) < 3 && next.y === 8;
        if (!occupied(next.x, next.y) && !(food && food.x === next.x && food.y === next.y) && !nearStart) {
          spot = next;
          break;
        }
      }
      if (!spot) continue;
      obstacles.push(spot);
      const at = cell(spot.x, spot.y);
      rockSprites.push(engine.sprite(spot.emoji, at.x, at.y, 24, "play"));
    }
  }

  function syncSnake() {
    while (segs.length < snake.length) segs.push(engine.sprite("🟢", 0, 0, 24, "play"));
    while (segs.length > snake.length) dropSprite(segs.pop());
    snake.forEach((part, index) => {
      const sprite = segs[index];
      const at = cell(part.x, part.y);
      sprite.emoji = index === 0 ? "🐍" : "🟢";
      sprite.x = at.x;
      sprite.y = at.y;
    });
  }

  function status() {
    ui.footer.textContent = "Score " + score + "    " + WIN + " clears the board";
  }

  function showIntro() {
    mode = "intro";
    card.hidden = false;
    card.innerHTML = "<h2>🐍 Snake</h2><p>Eat the apples. Don't meet the furniture, the walls, or yourself.</p><p>" + WIN + " points clears the board.</p><p>Arrows or WASD.</p><p class=\"play-foot\">Press Return</p>";
    ui.footer.textContent = "Return starts";
    canvas.draw();
  }

  function showEnd(won) {
    mode = "end";
    clearInterval(timer);
    timer = 0;
    card.hidden = false;
    card.innerHTML = "<h2>" + (won ? "The board is clear" : "You crashed") + "</h2><p>Score " + score + "</p><p>" + (won ? "Nothing left that wants a bite." : "The grove keeps what you ran into.") + "</p><p class=\"play-foot\">Press R</p>";
    ui.footer.textContent = "R starts again";
    if (won) {
      engine.beep(523, 90);
      setTimeout(() => engine.beep(659, 110), 130);
      setTimeout(() => engine.beep(784, 160), 260);
    } else {
      engine.beep(80, 320);
    }
    canvas.draw();
  }

  function tick() {
    if (mode !== "play") return;
    dir = queued;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    const eating = food && head.x === food.x && head.y === food.y;
    const hitsSelf = snake.some((part, index) => part.x === head.x && part.y === head.y && (eating || index !== snake.length - 1));
    const hitsRock = obstacles.some((rock) => rock.x === head.x && rock.y === head.y);
    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS || hitsSelf || hitsRock) {
      showEnd(false);
      return;
    }
    snake.unshift(head);
    if (food && head.x === food.x && head.y === food.y) {
      score += 10;
      engine.beep(660, 90);
      status();
      if (score >= WIN) {
        syncSnake();
        canvas.draw();
        showEnd(true);
        return;
      }
      if (score % 40 === 0) placeRocks();
      placeFood();
      if (mode !== "play") return;
      if (speed > 120) {
        speed -= 8;
        clearInterval(timer);
        timer = setInterval(tick, speed);
      }
    } else {
      snake.pop();
    }
    syncSnake();
    canvas.draw();
  }

  function begin() {
    mode = "play";
    card.hidden = true;
    segs.forEach(dropSprite);
    segs = [];
    snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
    dir = { x: 1, y: 0 };
    queued = dir;
    score = 0;
    speed = 210;
    obstacles = [];
    placeFood();
    placeRocks();
    syncSnake();
    status();
    canvas.draw();
    clearInterval(timer);
    timer = setInterval(tick, speed);
    engine.beep(440, 70);
    ui.wrap.focus();
  }

  function turn(next) {
    if (mode !== "play") return;
    if (next.x === -dir.x && next.y === -dir.y) return;
    queued = next;
  }

  const unbind = armGameKeys((event) => {
    if (engine.audio && engine.audio.state === "suspended") engine.audio.resume();
    const key = event.key.toLowerCase();
    if (mode === "intro") {
      if (isReturn(event.key) || isRestart(event.key)) begin();
      return;
    }
    if (mode === "end" || isRestart(event.key)) {
      if (isRestart(event.key)) begin();
      return;
    }
    if (key === "arrowup" || key === "w") turn({ x: 0, y: -1 });
    else if (key === "arrowdown" || key === "s") turn({ x: 0, y: 1 });
    else if (key === "arrowleft" || key === "a") turn({ x: -1, y: 0 });
    else if (key === "arrowright" || key === "d") turn({ x: 1, y: 0 });
  });

  showIntro();
  ui.wrap.focus();

  return () => {
    clearInterval(timer);
    unbind();
    ui.wrap.remove();
  };
});
