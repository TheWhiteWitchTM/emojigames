// Pong on the emoji engine. Return leaves the title. R starts the match again.
useEffect(() => {
  const root = document.getElementById("game");
  const E = globalThis.EmojiEngine;
  if (!root || !E) return;

  const W = 720;
  const H = 440;
  const PADDLE_H = 96;
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
    engine.sprite(glyph, 40 + (i * 47) % (W - 80), 30 + ((i * 83) % (H - 60)), 16, "sky");
  }
  for (let y = 24; y < H - 16; y += 28) engine.sprite("·", W / 2, y, 14, "sky");

  function makePaddle(x, y) {
    const parts = [];
    for (let i = 0; i < 4; i++) parts.push(engine.sprite("🟩", x, y + i * 22, 26, "play"));
    return { x: x, y: y, parts: parts };
  }

  const player = makePaddle(36, H / 2 - PADDLE_H / 2);
  const cpu = makePaddle(W - 36, H / 2 - PADDLE_H / 2);
  const ball = engine.sprite("⚪", W / 2, H / 2, 28, "play");

  const card = document.createElement("div");
  card.className = "play-card";
  ui.wrap.appendChild(card);

  let mode = "intro";
  let scoreP = 0;
  let scoreC = 0;
  let vx = 5.4;
  let vy = 2.2;
  let raf = 0;
  let last = 0;
  let server = 1;

  function placePaddle(paddle) {
    paddle.y = Math.max(16, Math.min(H - PADDLE_H - 12, paddle.y));
    paddle.parts.forEach((sprite, index) => {
      sprite.x = paddle.x;
      sprite.y = paddle.y + 14 + index * 22;
    });
  }

  function serve(dir) {
    ball.x = W / 2;
    ball.y = H / 2;
    vx = dir * (5.2 + Math.random() * 0.8);
    vy = (Math.random() < 0.5 ? -1 : 1) * (1.6 + Math.random() * 2.2);
  }

  function resetMatch() {
    scoreP = 0;
    scoreC = 0;
    player.y = H / 2 - PADDLE_H / 2;
    cpu.y = player.y;
    server = 1;
    serve(server);
    placePaddle(player);
    placePaddle(cpu);
    status();
  }

  function status() {
    ui.footer.textContent = "You " + scoreP + "    Machine " + scoreC + "    first to 5";
  }

  function showIntro() {
    mode = "intro";
    card.hidden = false;
    card.innerHTML = "<h2>🏓 Pong</h2><p>First to 5. You are the left paddle.</p><p>W and S, or the up and down arrows.</p><p class=\"play-foot\">Press Return</p>";
    ui.footer.textContent = "Return starts the match";
    canvas.draw();
  }

  function showEnd() {
    mode = "end";
    const won = scoreP >= 5;
    card.hidden = false;
    card.innerHTML = "<h2>" + (won ? "You win" : "The machine wins") + "</h2><p>You " + scoreP + "    Machine " + scoreC + "</p><p>" + (won ? "The table is yours." : "It read every bounce.") + "</p><p class=\"play-foot\">Press R</p>";
    ui.footer.textContent = "R starts again";
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
    vy += (ball.y - mid) * 0.08;
    vy = Math.max(-7, Math.min(7, vy));
    const speed = Math.min(12, Math.abs(vx) * 1.05 + 0.15);
    vx = fromLeft ? speed : -speed;
    ball.x = fromLeft ? paddle.x + 26 : paddle.x - 26;
    engine.beep(fromLeft ? 540 : 460, 50);
  }

  function point(who) {
    if (who === "player") scoreP += 1;
    else scoreC += 1;
    engine.beep(180, 140);
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
    const step = Math.min(2, (now - last || 16) / 16);
    last = now;
    if (mode !== "play") return;
    if (engine.isKeyDown("w") || engine.isKeyDown("W") || engine.isKeyDown("ArrowUp")) player.y -= 7.2 * step;
    if (engine.isKeyDown("s") || engine.isKeyDown("S") || engine.isKeyDown("ArrowDown")) player.y += 7.2 * step;
    const aim = ball.y - (cpu.y + PADDLE_H / 2);
    cpu.y += Math.max(-5.1, Math.min(5.1, aim * 0.11)) * step;
    ball.x += vx * step;
    ball.y += vy * step;
    if (ball.y < 18 || ball.y > H - 18) {
      vy *= -1;
      ball.y = Math.max(18, Math.min(H - 18, ball.y));
      engine.beep(280, 30);
    }
    if (vx < 0 && hits(player)) bounce(player, true);
    else if (vx > 0 && hits(cpu)) bounce(cpu, false);
    if (ball.x < -8) point("cpu");
    else if (ball.x > W + 8) point("player");
    if (mode !== "play") return;
    placePaddle(player);
    placePaddle(cpu);
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
