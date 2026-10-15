const output = document.getElementById('output');
const statusEl = document.getElementById('status');

const COLS = 40;
const ROWS = 20;
let snake, dir, food, obstacles, score, alive, started, loop, speed;
let audioCtx;

function beep(freq = 440, duration = 0.08, type = 'square') {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function init() {
  snake = [{x: 10, y: 10}, {x: 9, y: 10}, {x: 8, y: 10}];
  dir = {x: 1, y: 0};
  score = 0;
  alive = true;
  started = false;
  speed = 180;
  obstacles = [];
  placeFood();
  placeObstacles(5);
  if (loop) clearInterval(loop);
  draw();
}

function placeFood() {
  do {
    food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === food.x && s.y === food.y) ||
           obstacles.some(o => o.x === food.x && o.y === food.y));
}

function placeObstacles(count) {
  const emojis = ['🌵', '💣', '🪨', '💀', '🔥', '⚡'];
  for (let i = 0; i < count; i++) {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS), emoji: emojis[Math.floor(Math.random() * emojis.length)] };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y) ||
             (food && food.x === pos.x && food.y === pos.y) ||
             obstacles.some(o => o.x === pos.x && o.y === pos.y));
    obstacles.push(pos);
  }
}

function start() {
  if (started) return;
  started = true;
  loop = setInterval(tick, speed);
}

function tick() {
  if (!alive || !started) return;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
      snake.some(s => s.x === head.x && s.y === head.y) ||
      obstacles.some(o => o.x === head.x && o.y === head.y)) {
    alive = false;
    clearInterval(loop);
    beep(80, 0.4, 'sawtooth');
    draw(true);
    return;
  }

  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    beep(660, 0.12, 'square');
    placeFood();
    if (score % 50 === 0 && speed > 60) {
      speed -= 15;
      clearInterval(loop);
      loop = setInterval(tick, speed);
    }
  } else {
    snake.pop();
    beep(220, 0.04, 'square');
  }
  draw();
}

function draw(dead = false) {
  const grid = Array.from({ length: ROWS }, () => Array(COLS).fill('·'));
  snake.forEach((s, i) => grid[s.y][s.x] = i === 0 ? '█' : '▓');
  if (food) grid[food.y][food.x] = '🍎';
  obstacles.forEach(o => grid[o.y][o.x] = o.emoji);

  let text = '';
  for (let y = 0; y < ROWS; y++) text += grid[y].join('') + '\n';
  if (!started) text += '\nPress S to start';
  if (dead) text += '\n💀 CRASH! Press R to restart.';
  output.value = text;
  statusEl.textContent = `Score: ${score}  Speed: ${Math.round(1000/speed)}`;
  output.scrollTop = 0;
}

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'r') { init(); return; }
  if (!started && key === 's') { start(); return; }
  if (!alive || !started) return;

  if ((key === 'arrowup' || key === 'w') && dir.y === 0) dir = {x: 0, y: -1};
  else if ((key === 'arrowdown' || key === 's') && dir.y === 0) dir = {x: 0, y: 1};
  else if ((key === 'arrowleft' || key === 'a') && dir.x === 0) dir = {x: -1, y: 0};
  else if ((key === 'arrowright' || key === 'd') && dir.x === 0) dir = {x: 1, y: 0};
  e.preventDefault();
});

init();
