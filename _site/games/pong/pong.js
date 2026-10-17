const output = document.getElementById('output');
const statusEl = document.getElementById('status');

const COLS = 40;
const ROWS = 20;
let playerY, cpuY, ball, scoreP, scoreC, alive, started, loop, speed;
let audioCtx;

function beep(freq = 440, duration = 0.06) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function init() {
  playerY = 8;
  cpuY = 8;
  ball = { x: 20, y: 10, dx: 1, dy: 0.5 };
  scoreP = 0;
  scoreC = 0;
  alive = true;
  started = false;
  speed = 90;
  if (loop) clearInterval(loop);
  draw();
}

function start() {
  if (started) return;
  started = true;
  loop = setInterval(tick, speed);
}

function tick() {
  if (!alive || !started) return;
  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.y <= 0 || ball.y >= ROWS - 1) ball.dy *= -1;

  if (ball.x <= 1 && ball.y >= playerY && ball.y < playerY + 4) {
    ball.dx = Math.abs(ball.dx) * 1.05;
    ball.dy += (Math.random() - 0.5) * 0.5;
    beep(520);
    speedUp();
  }
  if (ball.x >= COLS - 2 && ball.y >= cpuY && ball.y < cpuY + 4) {
    ball.dx = -Math.abs(ball.dx) * 1.05;
    ball.dy += (Math.random() - 0.5) * 0.5;
    beep(480);
    speedUp();
  }

  if (ball.x < 0) { scoreC++; resetBall(-1); beep(180, 0.2); }
  if (ball.x >= COLS) { scoreP++; resetBall(1); beep(180, 0.2); }

  if (ball.dx > 0) {
    const target = ball.y - 1.5;
    if (cpuY < target) cpuY = Math.min(ROWS - 4, cpuY + 0.35);
    if (cpuY > target) cpuY = Math.max(0, cpuY - 0.35);
  }

  if (scoreP >= 5 || scoreC >= 5) {
    alive = false;
    clearInterval(loop);
    beep(80, 0.5);
  }
  draw();
}

function speedUp() {
  if (speed > 40) {
    speed -= 2;
    clearInterval(loop);
    loop = setInterval(tick, speed);
  }
}

function resetBall(dir) {
  ball = { x: 20, y: 10, dx: dir * (0.9 + Math.random() * 0.3), dy: (Math.random() - 0.5) * 1.2 };
  speed = Math.max(50, speed);
}

function draw() {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(' '));
  for (let i = 0; i < 4; i++) {
    if (playerY + i < ROWS) grid[Math.floor(playerY + i)][0] = '█';
    if (cpuY + i < ROWS) grid[Math.floor(cpuY + i)][COLS - 1] = '█';
  }
  const bx = Math.floor(ball.x), by = Math.floor(ball.y);
  if (by >= 0 && by < ROWS && bx >= 0 && bx < COLS) grid[by][bx] = '●';

  let text = '';
  for (let y = 0; y < ROWS; y++) text += grid[y].join('') + '\n';
  if (!started) text += '\nPress S to start';
  if (!alive) text += `\n${scoreP >= 5 ? '🏆 You win!' : '💀 Computer wins!'} Press R to restart.`;
  output.value = text;
  statusEl.textContent = `Player: ${scoreP}  Computer: ${scoreC}  Speed: ${Math.round(1000/speed)}`;
}

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'r') { init(); return; }
  if (!started && key === 's') { start(); return; }
  if (!alive || !started) return;
  if (key === 'w' || key === 'arrowup') playerY = Math.max(0, playerY - 1);
  if (key === 's' || key === 'arrowdown') playerY = Math.min(ROWS - 4, playerY + 1);
  e.preventDefault();
});

init();
