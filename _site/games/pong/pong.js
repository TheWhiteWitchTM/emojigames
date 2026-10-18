// Pong on the emoji engine. Return leaves the title. R starts the match again.
// Speeds are pixels per second. The old table moved one cell about every 90 ms.
useEffect(() => {
  const root = document.getElementById("game");
  const E = globalThis.EmojiEngine;
  if (!root || !E) return;

  const W = 720;
  const H = 460;
  const PADDLE_H = 96;
  const TOP = 72;
  const BALL_MAX = 300;
  const PLAYER_SPEED = 250;
  const CPU_SPEED = 145;
  const DIGITS = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"];
  const canvas = new E.Canvas({ width: W, height: H });
  const engine = new E.Engine({ canvas });
  const ui = E.Utilities.wrap(engine, { title: "🏓 Pong", footer: true });
  ui.wrap.classList.add("ee-game");
  ui.wrap.tabIndex = 0;
  ui.wrap.style.outline = "none";
  root.appendChild(ui.wrap);

  const el = canvas.element;
  el.style.background = "#061206";
  el.style.border = "2px solid #39ff14";
  el.style.boxShadow = "0 0 16px #39ff1455";
  el.style.width = "100%";
  el.style.height = "auto";
  el.style.display = "block";

  for (let i = 0; i < 16; i++) {
    const glyph = i % 5 === 0 ? "✨" : "·";
    engine.sprite(glyph, 40 + (i * 47) % (W - 80), 90 + ((i * 83) % (H - 120)), 16, "sky");
  }
  for (let y = TOP + 8; y < H - 16; y += 28) engine.sprite("·", W / 2, y, 14, "sky");

  function makePaddle(x, y) {
    const parts = [];
    for (let i = 0; i < 4; i++) parts.push(engine.sprite("🟩", x, y + i * 22, 26, "play"));
    return { x: x, y: y, parts: parts };
  }

  const player = makePaddle(36, H / 2 - PADDLE_H / 2);
  const cpu = makePaddle(W - 36, H / 2 - PADDLE_H / 2);
  const ball = engine.sprite("⚪", W / 2, H / 2, 28, "play");
  engine.sprite("🙂", W * 0.22, 36, 32, "hud");
  engine.sprite("🤖", W * 0.78, 36, 32, "hud");
  const scoreL = engine.sprite(DIGITS[0], W * 0.36, 36, 46, "hud");
  const scoreR = engine.sprite(DIGITS[0], W * 0.64, 36, 46, "hud");

  const card = document.createElement("div");
  card.className = "play-card";
  ui.wrap.appendChild(card);

  let mode = "intro";
  let scoreP = 0;
  let scoreC = 0;
  let vx = 200;
  let vy = 80;
  let raf = 0;
  let last = 0;
  let server = 1;
  let wait = 0;
  let cpuAim = H / 2;

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function placePaddle(paddle) {
    paddle.y = clamp(paddle.y, TOP, H - PADDLE_H - 12);
    paddle.parts.forEach((sprite, index) => {
      sprite.x = paddle.x;
      sprite.y = paddle.y + 14 + index * 22;
    });
  }

  function paintScore() {
    scoreL.emoji = DIGITS[scoreP] || DIGITS[0];
    scoreR.emoji = DIGITS[scoreC] || DIGITS[0];
  }

  function serve(dir) {
    ball.x = W / 2;
    ball.y = H / 2 + 16;
    vx = dir * (185 + Math.random() * 25);
    vy = (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 50);
    wait = 0.7;
    cpuAim = ball.y;
  }

  function resetMatch() {
    scoreP = 0;
    scoreC = 0;
    player.y = H / 2 - PADDLE_H / 2;
    cpu.y = player.y;
    cpuAim = H / 2;
    server = 1;
    serve(server);
    placePaddle(player);
    placePaddle(cpu);
    paintScore();
    status();
  }

  function status() {
    ui.footer.textContent = "You " + scoreP + "    Machine " + scoreC + "    first to 5";
  }

  function showIntro() {
    mode = "intro";
    card.hidden = false;
    card.innerHTML = "<h2>🏓 Pong</h2><p>First to 5. You are the left paddle. The score sits on the table.</p><p>W and S, or the up and down arrows.</p><p class=\"play-foot\">Press Return</p>";
    ui.footer.textContent = "Return starts the match";
    paintScore();
    canvas.draw();
  }

  function showEnd() {
    mode = "end";
    const won = scoreP >= 5;
    card.hidden = false;
    card.innerHTML = "<h2>" + (won ? "You win" : "The machine wins") + "</h2><p>You " + scoreP + "    Machine " + scoreC + "</p><p>" + (won ? "The table is yours." : "It read every bounce.") + "</p><p class=\"play-foot\">Press R</p>";
    ui.footer.textContent = "R starts again";
    paintScore();
    if (won) {
      engine.beep(523, 90);
      setTimeout(() => engine.beep(659, 110), 120);
      setTimeout(() => engine.beep(784, 160), 250);
    } else {
      engine.beep(90, 280);
    }
    canvas.draw();
  }

  function begin() {
    mode = "play";
    card.hidden = true;
    resetMatch();
    engine.beep(440, 70);
    ui.wrap.focus();
  }

  function hits(paddle) {
    return ball.x > paddle.x - 24 && ball.x < paddle.x + 24 && ball.y > paddle.y - 8 && ball.y < paddle.y + PADDLE_H + 8;
  }

  function bounce(paddle, fromLeft) {
    const mid = paddle.y + PADDLE_H / 2;
    vy += (ball.y - mid) * 3.4;
    vy = clamp(vy, -220, 220);
    const speed = Math.min(BALL_MAX, Math.abs(vx) * 1.035 + 6);
    vx = fromLeft ? speed : -speed;
    ball.x = fromLeft ? paddle.x + 28 : paddle.x - 28;
    engine.beep(fromLeft ? 540 : 460, 50);
  }

  function point(who) {
    if (who === "player") scoreP += 1;
    else scoreC += 1;
    engine.beep(180, 140);
    paintScore();
    status();
    if (scoreP >= 5 || scoreC >= 5) {
      showEnd();
      return;
    }
    server *= -1;
    serve(server);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (typeof isGameLive === "function" && !isGameLive()) {
      last = now;
      return;
    }
    if (!last) {
      last = now;
      canvas.draw();
      return;
    }
    const dt = Math.min(0.032, Math.max(0, (now - last) / 1000));
    last = now;
    if (mode === "play") {
      if (engine.isKeyDown("w") || engine.isKeyDown("W") || engine.isKeyDown("ArrowUp")) player.y -= PLAYER_SPEED * dt;
      if (engine.isKeyDown("s") || engine.isKeyDown("S") || engine.isKeyDown("ArrowDown")) player.y += PLAYER_SPEED * dt;
      const target = vx > 0 ? ball.y : H / 2 + 10;
      cpuAim += (target - cpuAim) * Math.min(1, dt * 2.4);
      const aim = cpuAim - (cpu.y + PADDLE_H / 2);
      cpu.y += clamp(aim * 3.1, -CPU_SPEED, CPU_SPEED) * dt;
      if (wait > 0) {
        wait -= dt;
      } else {
        ball.x += vx * dt;
        ball.y += vy * dt;
        if (ball.y < TOP + 16 || ball.y > H - 18) {
          vy *= -1;
          ball.y = clamp(ball.y, TOP + 16, H - 18);
          engine.beep(280, 30);
        }
        if (vx < 0 && hits(player)) bounce(player, true);
        else if (vx > 0 && hits(cpu)) bounce(cpu, false);
        if (ball.x < -8) point("cpu");
        else if (ball.x > W + 8) point("player");
      }
      if (mode === "play") {
        placePaddle(player);
        placePaddle(cpu);
      }
    }
    canvas.draw();
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
    if (isRestart(event.key)) begin();
  });

  placePaddle(player);
  placePaddle(cpu);
  showIntro();
  raf = requestAnimationFrame(frame);
  ui.wrap.focus();

  return () => {
    cancelAnimationFrame(raf);
    unbind();
    ui.wrap.remove();
  };
});
