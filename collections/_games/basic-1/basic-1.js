// Basic I. A 40-column machine. The language is BASIC. The glass is emoji-engine-2d.
"use strict";
(function () {
  var COLS = 40;
  var ROWS = 24;
  var CW = 18;
  var CH = 24;
  var MAX_LINE = 63999;
  var LINE_CHARS = 255;
  var HIST_MAX = 32;
  var BACK_MAX = 666;
  var KEY_MAX = 32;
  var MINIONS = 32;
  var HITS = 8;
  var INDEX_KEY = "emojigames-basic1-seals";
  // The white witch in assets/images/site.jpg (1168×784). Hat through the wand, not the title.
  var WITCH_CROP = { x: 58, y: 236, w: 204, h: 268 };

  var mount = document.getElementById("game");
  if (!mount || !globalThis.EmojiEngine) {
    if (mount) mount.textContent = "THE GLASS IS MISSING.";
    return;
  }

  var E = globalThis.EmojiEngine;
  var canvas = new E.Canvas({ width: COLS * CW, height: ROWS * CH });
  var portrait = {
    image: null,
    alpha: 0,
    target: 0,
    draw: function (ctx) {
      var image = this.image;
      if (!image || !image.complete || !image.naturalWidth || this.alpha < 0.012) return;
      var box = witchBox();
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.globalAlpha = this.alpha;
      ctx.drawImage(image, WITCH_CROP.x, WITCH_CROP.y, WITCH_CROP.w, WITCH_CROP.h, box.dx, box.dy, box.dw, box.dh);
      ctx.restore();
    }
  };
  canvas.add(portrait, "witch");
  var term = new E.Terminal({
    cols: COLS,
    rows: ROWS,
    cellWidth: CW,
    cellHeight: CH,
    canvas: canvas
  });
  term.cursorColor = "#e6d3b0";
  term.cursorLit = true;
  var engine = new E.Engine({ canvas: canvas });

  var ui = E.Utilities.wrap(term, { title: "BASIC I", footer: true });
  var crt = document.createElement("div");
  crt.className = "crt";
  var canvasEl = term.canvas.element;
  ui.wrap.insertBefore(crt, canvasEl);
  crt.appendChild(canvasEl);
  var scan = document.createElement("div");
  scan.className = "scan";
  crt.appendChild(scan);
  mount.appendChild(ui.wrap);
  ui.wrap.setAttribute("role", "application");
  ui.wrap.setAttribute("aria-label", "BASIC I");

  var led = document.createElement("span");
  led.className = "led";
  led.textContent = "● ";
  var statusEl = document.createElement("span");
  statusEl.className = "status";
  var mood = document.createElement("span");
  mood.className = "witch-mood";
  mood.append(led, statusEl);
  var toolByKey = {};
  var toolHints = [];
  var TOOLS = [
    { act: "list", key: "F1", emoji: "📜", label: "LIST" },
    { act: "run", key: "F2", emoji: "▶", label: "RUN" },
    { act: "shelf", key: "F3", emoji: "📚", label: "SHELF" },
    { act: "cls", key: "F4", emoji: "🧹", label: "CLS" },
    { act: "auto", key: "F5", emoji: "✨", label: "AUTO" },
    { act: "renum", key: "F6", emoji: "🔢", label: "RENUM" },
    { act: "latch", key: "F7", emoji: "🔒", label: "LATCH" }
  ];
  var bar = document.createElement("div");
  bar.className = "witch-bar";
  bar.setAttribute("aria-label", "Keys");
  TOOLS.forEach(function (spec) {
    toolByKey[spec.key] = spec.act;
    var hint = document.createElement("span");
    hint.className = "witch-key";
    hint.dataset.act = spec.act;
    hint.append(document.createTextNode(spec.emoji + " " + spec.label + " "));
    var kbd = document.createElement("kbd");
    kbd.textContent = spec.key;
    hint.append(kbd);
    toolHints.push(hint);
    bar.append(hint);
  });
  var escHint = document.createElement("span");
  escHint.className = "witch-key";
  escHint.append(document.createTextNode("⎋ BACK "));
  var escKbd = document.createElement("kbd");
  escKbd.textContent = "ESC";
  escHint.append(escKbd);
  bar.append(escHint);
  ui.footer.textContent = "";
  ui.footer.append(mood, bar);
  var fsBtn = ui.wrap.querySelector(".ee-fullscreen");
  var fsHint = document.createElement("span");
  fsHint.className = "witch-key";
  fsHint.append(document.createTextNode("⛶ FULL "));
  var fsKbd = document.createElement("kbd");
  fsKbd.textContent = "F11";
  fsHint.append(fsKbd);
  if (fsBtn) fsBtn.replaceWith(fsHint);
  ui.wrap.style.cursor = "none";
  canvasEl.style.cursor = "none";
  crt.style.cursor = "none";
  function eatMouse(event) {
    event.preventDefault();
    event.stopPropagation();
  }
  ["mousedown", "mouseup", "click", "dblclick", "auxclick", "contextmenu", "dragstart"].forEach(function (name) {
    ui.wrap.addEventListener(name, eatMouse, true);
  });
  ui.wrap.addEventListener("wheel", eatMouse, { capture: true, passive: false });

  var mode = "boot";
  var glassLive = false;
  var frameOn = false;
  var generation = 0;
  var activeBoot = -1;
  var awake = false;
  var booting = false;
  var shelfState = "";
  var shelfBase = mount.getAttribute("data-shelf") || "shelf/";
  if (shelfBase.slice(-1) !== "/") shelfBase += "/";
  var catalog = [];
  var catalogPromise = null;
  var shelfCache = {};
  var shelf = null;
  var holdKeys = false;
  var pen = { fg: 7, bg: 0 };
  var spark = null;
  var auto = { on: false, num: 10, step: 10 };
  var entry = "";
  var caret = 0;
  var promptText = "";
  var origin = { col: 0, row: 0 };
  var painted = 0;
  var hist = [];
  var histAt = -1;
  var stash = "";
  var back = [];
  var gaze = 0;
  var latch = true;
  var busy = false;
  var holdPrompt = false;
  var demandResolve = null;
  var keyWait = null;
  var inkeyQueue = [];
  var nextId = 1;
  var minions = new Map();
  var touching = new Set();
  var framePairs = new Set();
  var interpreter;

  function cp(s) { return Array.from(s); }
  function sealKey(name) { return "emojigames-basic1-seal:" + name; }

  function updateFooter() {
    var used = interpreter ? interpreter.lines.size : 0;
    var state = "READY";
    if (mode === "boot") state = "WAKING";
    else if (shelfState) state = shelfState;
    else if (mode === "shelf") state = "PICKING";
    else if (mode === "run") state = interpreter && interpreter.currentLine != null ? "LINE " + interpreter.currentLine : "RUNNING";
    else if (mode === "demand") state = "WAITING";
    else if (mode === "freeze") state = "FROZEN";
    else if (mode === "auto") state = "AUTO " + auto.num;
    if (gaze > 0 && (mode === "ready" || mode === "auto" || mode === "demand")) state = "GAZE " + gaze;
    statusEl.textContent = state + " " + used + "/666";
    var speaking = mode === "ready" || mode === "auto";
    var editing = speaking || mode === "demand";
    for (var b = 0; b < toolHints.length; b += 1) {
      var hint = toolHints[b];
      var act = hint.dataset.act;
      var usable = act === "latch" ? editing : speaking;
      var on = false;
      if (act === "latch") on = editing && latch;
      if (act === "auto") on = !!auto.on && speaking;
      hint.classList.toggle("quiet", !usable);
      hint.classList.toggle("lit", on);
    }
  }

  function setPen(fg, bg) {
    pen.fg = fg;
    if (bg != null) pen.bg = bg;
    term.color(pen.fg, pen.bg);
  }

  function restorePen() {
    term.write("\x1b[0m");
    term.color(pen.fg, pen.bg);
  }

  function writeAnsi(text) {
    term.write(text);
    restorePen();
  }

  function expandVeil(text) {
    var out = "";
    var i = 0;
    while (i < text.length) {
      if (text.charAt(i) === "{" && text.charAt(i + 1) === "{") {
        out += "{";
        i += 2;
        continue;
      }
      if (text.charAt(i) === "{") {
        var end = text.indexOf("}", i + 1);
        if (end > i + 1 && /^[0-9][0-9;]*$/.test(text.slice(i + 1, end))) {
          out += "\x1b[" + text.slice(i + 1, end) + "m";
          i = end + 1;
          continue;
        }
      }
      out += text.charAt(i);
      i += 1;
    }
    return out;
  }

  function veilWrite(text) {
    term.write(expandVeil(text) + "\n");
    restorePen();
  }

  function writeRaw(text) {
    term.beginFrame();
    for (var ch of text) {
      if (ch === "\n") {
        term.cursor.col = 0;
        term.cursor.row += 1;
        if (term.cursor.row >= ROWS) term.scrollIntoView();
        continue;
      }
      if (ch === "\r") {
        term.cursor.col = 0;
        continue;
      }
      if (term.cursor.col >= COLS) {
        term.cursor.col = 0;
        term.cursor.row += 1;
      }
      if (term.cursor.row >= ROWS) term.scrollIntoView();
      term.set(term.cursor.col, term.cursor.row, ch);
      term.cursor.col += 1;
    }
    term.dirty = true;
    term.endFrame();
  }

  function say(code) {
    var book = globalThis.BASIC_MESSAGES;
    return (book && book[code]) || "❓ NO.";
  }

  function tone(freq, ms, level) {
    if (!glassLive) return;
    unlock();
    var audio = engine.audio;
    if (!audio) return;
    try {
      var osc = audio.createOscillator();
      var gain = audio.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.value = level == null ? 0.05 : level;
      osc.connect(gain);
      gain.connect(audio.destination);
      var stopAt = audio.currentTime + ms / 1000;
      gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
      osc.start();
      osc.stop(stopAt);
    } catch (err) {}
  }

  function errorSound() {
    tone(440, 70, 0.06);
    setTimeout(function () { tone(220, 150, 0.055); }, 75);
  }

  function stopSound() {
    tone(330, 55, 0.045);
    setTimeout(function () { tone(247, 100, 0.04); }, 65);
  }

  function flashLed(stop) {
    led.style.color = stop ? "#e2b657" : "#ff5544";
    led.style.textShadow = stop ? "0 0 8px #e2b657" : "0 0 10px #ff5544";
    setTimeout(function () {
      led.style.color = "";
      led.style.textShadow = "";
    }, 220);
  }

  function fault(msg, kind) {
    var stop = kind === "stop";
    setPen(stop ? 11 : 9, 0);
    writeRaw(msg + "\n");
    setPen(7, 0);
    flashLed(stop);
    if (stop) stopSound();
    else errorSound();
  }

  function cloneCell(cell) {
    var copy = {};
    for (var k in cell) {
      if (!Object.prototype.hasOwnProperty.call(cell, k)) continue;
      var v = cell[k];
      copy[k] = v && typeof v === "object" ? { r: v.r, g: v.g, b: v.b } : v;
    }
    return copy;
  }

  function blankGlassRow() {
    var row = [];
    for (var c = 0; c < COLS; c += 1) row.push({ ch: " " });
    return row;
  }

  function rememberTop() {
    if (!term.cells.length) return;
    var row = term.cells[0];
    var copy = new Array(row.length);
    for (var i = 0; i < row.length; i += 1) copy[i] = cloneCell(row[i]);
    back.push(copy);
    if (back.length > BACK_MAX) {
      back.shift();
      if (gaze > 0) gaze -= 1;
    }
    if (gaze > back.length) gaze = back.length;
    if (gaze < 0) gaze = 0;
  }

  function shiftGlass() {
    term.cells.shift();
    term.cells.push(blankGlassRow());
    term.cursor.row = Math.max(0, term.cursor.row - 1);
    if (origin) origin.row = Math.max(0, origin.row - 1);
    term.dirty = true;
    term.flush();
  }

  function scrollOne() {
    rememberTop();
    shiftGlass();
  }

  function reading() {
    return gaze > 0 && (mode === "ready" || mode === "auto" || mode === "demand");
  }

  function composedRows() {
    var live = term.cells;
    var total = back.length + live.length;
    var start = total - ROWS - gaze;
    if (start < 0) start = 0;
    var out = [];
    for (var i = 0; i < ROWS; i += 1) {
      var idx = start + i;
      if (idx < back.length) out.push(back[idx]);
      else {
        var liveAt = idx - back.length;
        out.push(liveAt >= 0 && liveAt < live.length ? live[liveAt] : blankGlassRow());
      }
    }
    return out;
  }

  function showGaze() {
    term.dirty = true;
    term.flush();
    updateFooter();
  }

  function gazeBy(delta) {
    var max = back.length;
    if (max < 1) { term.bell(); return; }
    var next = gaze + delta;
    if (next < 0) next = 0;
    if (next > max) next = max;
    if (next === gaze) { term.bell(); return; }
    gaze = next;
    showGaze();
  }

  function gazeTop() {
    if (!back.length || gaze === back.length) { term.bell(); return; }
    gaze = back.length;
    showGaze();
  }

  function gazeLive() {
    if (gaze === 0) { term.bell(); return; }
    gaze = 0;
    showGaze();
  }

  function sit() {
    if (gaze === 0) return;
    gaze = 0;
    showGaze();
  }

  var paintLive = term.draw.bind(term);
  term.draw = function (ctx, camera) {
    if (!reading()) {
      paintLive(ctx, camera);
      return;
    }
    var savedCells = this.cells;
    var savedLit = this.cursorLit;
    this.cells = composedRows();
    this.cursorLit = false;
    try { paintLive(ctx, camera); }
    finally {
      this.cells = savedCells;
      this.cursorLit = savedLit;
    }
  };

  term.scrollIntoView = function () {
    while (this.cursor.row >= this.rows) {
      rememberTop();
      shiftGlass();
    }
    if (this.cursor.row < 0) this.cursor.row = 0;
    if (this.cursor.col < 0) this.cursor.col = 0;
    if (this.cursor.col > this.cols) this.cursor.col = this.cols;
    this.dirty = true;
  };

  term.scrollUp = function (count) {
    var lines = Math.min(Math.max(0, count | 0), this.rows);
    for (var i = 0; i < lines; i += 1) {
      rememberTop();
      this.cells.shift();
      this.cells.push(blankGlassRow());
      if (origin) origin.row = Math.max(0, origin.row - 1);
    }
    this.dirty = true;
  };

  var wipeGlass = term.clear.bind(term);
  term.clear = function () {
    back.length = 0;
    gaze = 0;
    wipeGlass();
  };

  function paintEntry() {
    var text = cp(promptText + entry);
    var rowsNeeded = Math.max(1, Math.ceil((origin.col + Math.max(text.length, 1)) / COLS));
    while (origin.row + rowsNeeded > ROWS) scrollOne();
    var start = origin.row * COLS + origin.col;
    var total = Math.max(text.length, painted);
    term.beginFrame();
    for (var i = 0; i < total; i += 1) {
      var pos = start + i;
      var row = Math.floor(pos / COLS);
      var col = pos % COLS;
      if (row < 0 || row >= ROWS) continue;
      term.set(col, row, i < text.length ? text[i] : " ");
    }
    var caretPos = start + cp(promptText).length + caret;
    var crow = Math.floor(caretPos / COLS);
    var ccol = caretPos % COLS;
    if (crow >= ROWS) { crow = ROWS - 1; ccol = COLS - 1; }
    term.cursor.row = crow;
    term.cursor.col = ccol;
    term.dirty = true;
    term.endFrame();
    painted = text.length;
  }

  function beginEntry(prompt) {
    promptText = prompt;
    entry = "";
    caret = 0;
    painted = 0;
    histAt = -1;
    while (term.cursor.row > ROWS - 3) scrollOne();
    origin = { col: term.cursor.col, row: term.cursor.row };
    paintEntry();
  }

  function finishEntryLine() {
    var len = cp(promptText + entry).length;
    var row = origin.row;
    var col = origin.col + len;
    while (col >= COLS) { col -= COLS; row += 1; }
    while (row >= ROWS) { scrollOne(); row -= 1; }
    term.cursor.row = row;
    term.cursor.col = col;
    if (!(col === 0 && len > 0)) writeRaw("\n");
  }

  function entryLimit() {
    if (mode === "demand") return LINE_CHARS;
    return Math.max(0, LINE_CHARS - cp(promptText).length);
  }

  function insertText(text) {
    var chars = cp(entry);
    var add = cp(text).filter(function (ch) { return ch >= " " && ch !== "\u007f"; });
    var room = entryLimit() - chars.length;
    if (room < 0) room = 0;
    var take = add.slice(0, room);
    chars.splice(caret, 0, ...take);
    entry = chars.join("");
    caret += take.length;
    if (take.length < add.length) term.bell();
    paintEntry();
  }

  function promptReady() {
    sit();
    auto.on = false;
    mode = "ready";
    if (term.cursor.col !== 0) writeRaw("\n");
    term.write("\x1b[0m\x1b[97mREADY.\x1b[0m\n");
    setPen(7, 0);
    beginEntry("");
    updateFooter();
  }

  function waitSpeak() {
    sit();
    auto.on = false;
    mode = "ready";
    setPen(7, 0);
    beginEntry("");
    updateFooter();
  }

  function killSprite(sprite) {
    sprite.alive = false;
    sprite.vx = 0;
    sprite.vy = 0;
    engine.canvas.remove(sprite);
    var index = engine.sprites.indexOf(sprite);
    if (index >= 0) engine.sprites.splice(index, 1);
  }

  function clearMinions() {
    minions.forEach(killSprite);
    minions.clear();
    touching.clear();
    if (interpreter) interpreter.pendingHits.length = 0;
  }

  function living() {
    var n = 0;
    minions.forEach(function (s) { if (s.alive) n += 1; });
    return n;
  }

  function spriteById(id) {
    var s = minions.get(id);
    if (!s || !s.alive) return null;
    return s;
  }

  function unlock() {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      if (!engine.audio) engine.audio = new Ctx();
      if (engine.audio.state === "suspended") engine.audio.resume();
    } catch (err) {}
  }

  var host = {
    cols: COLS,
    rows: ROWS,
    write: writeRaw,
    column: function () { return term.cursor.col; },
    readLine: function () {
      return new Promise(function (resolve) {
        demandResolve = resolve;
        mode = "demand";
        beginEntry("");
        updateFooter();
      });
    },
    inkey: function () { return inkeyQueue.length ? inkeyQueue.shift() : ""; },
    held: function (name) {
      if (!name) return 0;
      if (term.isKeyDown(name)) return 1;
      if (name.length === 1) {
        if (term.isKeyDown(name.toLowerCase()) || term.isKeyDown(name.toUpperCase())) return 1;
      }
      return 0;
    },
    color: function (fg, bg) {
      if (bg == null) setPen(fg);
      else setPen(fg, bg);
    },
    veil: function (text) { veilWrite(text); },
    scrub: function () { term.clear(); },
    at: function (col, row) {
      term.cursor.col = col;
      term.cursor.row = row;
      term.dirty = true;
      term.flush();
    },
    plot: function (x, y) { term.set(x, y, "●"); },
    cell: function (x, y) {
      var cell = term.get(x, y);
      return cell && cell.ch ? cell.ch : " ";
    },
    beep: function (freq, ms) {
      if (!glassLive) return;
      unlock();
      engine.beep(freq, ms);
    },
    minion: function (emoji, x, y, size) {
      if (living() >= MINIONS) return null;
      var id = nextId++;
      var sprite = engine.sprite(emoji || "●", (x + 0.5) * CW, (y + 0.5) * CH, size, "minions");
      sprite.data.id = id;
      sprite.data.cvx = 0;
      sprite.data.cvy = 0;
      minions.set(id, sprite);
      return id;
    },
    send: function (id, vx, vy) {
      var s = spriteById(id);
      if (!s) return false;
      s.data.cvx = vx;
      s.data.cvy = vy;
      engine.motion(s, vx * CW / 60, vy * CH / 60);
      return true;
    },
    destroy: function (id) {
      if (id == null) { clearMinions(); return true; }
      var s = spriteById(id);
      if (!s) return false;
      killSprite(s);
      minions.delete(id);
      return true;
    },
    col: function (id) {
      var s = spriteById(id);
      return s ? s.x / CW - 0.5 : null;
    },
    row: function (id) {
      var s = spriteById(id);
      return s ? s.y / CH - 0.5 : null;
    },
    vx: function (id) {
      var s = spriteById(id);
      return s ? s.data.cvx : null;
    },
    vy: function (id) {
      var s = spriteById(id);
      return s ? s.data.cvy : null;
    },
    tick: function () { return Math.floor(performance.now()); },
    starting: function () {
      clearMinions();
      setPen(10, 0);
      touching.clear();
    },
    stopping: function () {
      term.write("\x1b[0m");
      setPen(7, 0);
    },
    waitKey: function () {
      mode = "freeze";
      updateFooter();
      return new Promise(function (resolve) { keyWait = resolve; });
    },
    trace: function () { updateFooter(); },
    bell: function () { try { term.bell(); } catch (err) {} },
    fault: fault,
    begin: function () { term.beginFrame(); },
    end: function () { term.endFrame(); }
  };

  interpreter = new Interpreter(host);

  engine.onCollision(function (a, b) {
    var ida = a.data && a.data.id;
    var idb = b.data && b.data.id;
    if (!ida || !idb) return;
    var key = ida < idb ? ida + ":" + idb : idb + ":" + ida;
    framePairs.add(key);
    if (!touching.has(key)) {
      touching.add(key);
      if (interpreter.watchName && interpreter.pendingHits.length < HITS) interpreter.pendingHits.push({ a: ida, b: idb });
    }
  });

  var wokeAt = performance.now();
  var lastFrame = wokeAt;
  function frame(t) {
    if (!glassLive) { frameOn = false; return; }
    term.cursorLit = Math.floor((t - wokeAt) / 500) % 2 === 0;
    var dt = Math.min(0.05, Math.max(0.001, (t - lastFrame) / 1000));
    lastFrame = t;
    framePairs = new Set();
    minions.forEach(function (s) {
      if (!s.alive) return;
      s.vx = (s.data.cvx || 0) * CW * dt;
      s.vy = (s.data.cvy || 0) * CH * dt;
    });
    if (spark && spark.alive) {
      spark.vx = 0;
      spark.vy = 0;
    }
    try { engine.update(); } catch (err) {}
    if (spark && spark.alive) {
      spark.x = spark.data.hx + Math.sin(t / 160) * 2.5;
      spark.y = spark.data.hy + Math.sin(t / 210) * 3.5;
    }
    portrait.alpha += (portrait.target - portrait.alpha) * Math.min(1, dt * 8);
    if (Math.abs(portrait.target - portrait.alpha) < 0.01) portrait.alpha = portrait.target;
    touching.forEach(function (key) { if (!framePairs.has(key)) touching.delete(key); });
    try { canvas.draw(); } catch (err) {}
    requestAnimationFrame(frame);
  }

  function storeUserLine(trimmed) {
    if (cp(trimmed).length > LINE_CHARS) { fault(say("long")); return false; }
    var m = trimmed.match(/^(\d+)\s*(.*)$/);
    if (!m) { fault(say("syntax")); return false; }
    var num = Number(m[1]);
    try {
      interpreter.store(num, m[2]);
      return true;
    } catch (err) {
      fault(err.message || say("syntax"));
      return false;
    }
  }

  function parseRange(rest) {
    var m = rest.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) return order(+m[1], +m[2]);
    m = rest.match(/^(\d+)\s*-$/);
    if (m) return order(+m[1], MAX_LINE);
    m = rest.match(/^-\s*(\d+)$/);
    if (m) return order(0, +m[1]);
    m = rest.match(/^(\d+)$/);
    if (m) return order(+m[1], +m[1]);
    return null;
  }
  function order(a, b) {
    if (a > MAX_LINE || b > MAX_LINE) return null;
    return a <= b ? { from: a, to: b } : { from: b, to: a };
  }

  function parseName(rest, allowShelf) {
    if (!rest) return { error: "name" };
    var body = rest.trim();
    if (body.charAt(0) === "\"" && body.charAt(body.length - 1) === "\"" && body.length >= 2) {
      body = body.slice(1, -1).trim();
    }
    var shelf = false;
    if (allowShelf && /^shelf:/i.test(body)) {
      shelf = true;
      body = body.slice(6);
    }
    var name = body.toUpperCase();
    if (!/^[A-Z][A-Z0-9-]{0,15}$/.test(name)) return { error: "syntax" };
    return { name: name, shelf: shelf };
  }

  function readIndex() {
    var raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(function (s) { return typeof s === "string"; });
  }

  function writeWords(words) {
    var col = 0;
    var line = "";
    for (var i = 0; i < words.length; i += 1) {
      var w = words[i];
      var need = line ? w.length + 1 : w.length;
      if (col + need > COLS) {
        writeRaw(line + "\n");
        line = w;
        col = Array.from(w).length;
      } else {
        line = line ? line + " " + w : w;
        col += need;
      }
    }
    if (line) writeRaw(line + "\n");
  }

  function printGrimoire() {
    var lines = [
      "THE SHORT LIST.",
      "",
      "PRINT INPUT LET GOTO",
      "GOSUB RETURN IF FOR NEXT",
      "LABEL END SLEEP REM",
      "DATA READ RESTORE ON DIM",
      "LOCATE CLS COLOR SOUND INK",
      "SPRITE SEND WATCH DESTROY",
      "CIRCLE LINE FILL",
      "",
      "FROM OUT HERE:",
      "RUN LIST NEW AUTO",
      "RENUM LOAD SAVE",
      "UPLOAD DOWNLOAD SHELF",
      "HELP LATCH",
      "",
      "LATCH HOLDS THE GLASS.",
      "UP WALKS WHAT ROLLED OFF.",
      "LATCH OFF, AND UP RECALLS.",
      "",
      "LOAD \"shelf:HELLO\"",
      "OR SHELF, AND POINT.",
      "LIST SHOWS THE LINES.",
      "THEN RUN.",
      "ESCAPE LEAVES A PROGRAM THAT WILL NOT.",
      "A NUMBER STORES THE LINE. RUN LATER.",
      "AUTO NUMBERS THE NEXT LINES.",
      "PEEK POKE SYS. IT COMPLAINS."
    ];
    for (var i = 0; i < lines.length; i += 1) writeRaw(lines[i] + "\n");
  }

  function printList(range) {
    var text = interpreter.listing(range.from, range.to);
    writeAnsi("\x1b[1;37mLIST.\n");
    writeAnsi("\x1b[2;31mRETYPE THE NUMBER. THAT IS THE EDIT.\n");
    if (!text) {
      writeAnsi("\x1b[31mNO LINES.\n");
      setPen(7, 0);
      return;
    }
    var lines = text.split("\n");
    for (var i = 0; i < lines.length; i += 1) {
      var sp = lines[i].indexOf(" ");
      var num = sp < 0 ? lines[i] : lines[i].slice(0, sp);
      var src = sp < 0 ? "" : lines[i].slice(sp + 1);
      writeAnsi("\x1b[93m" + num + " ");
      setPen(7, 0);
      writeRaw(src + "\n");
    }
    writeAnsi("\x1b[2;33mRUN, OR RETYPE A NUMBER.\n");
    setPen(7, 0);
  }

  function editorCommand(trimmed) {
    var m = trimmed.match(/^([A-Za-z]+)(?:\s+([\s\S]*))?$/);
    if (!m) return false;
    var word = m[1].toUpperCase();
    var known = {
      REVEAL: 1, OBLITERATE: 1, RENUMBER: 1, RENUM: 1, VANISH: 1, AUTO: 1, MAGIC: 1, SEAL: 1, UNSEAL: 1,
      UPLOAD: 1, DOWNLOAD: 1, SHELF: 1, GRIMOIRE: 1, RUN: 1, HELP: 1, LATCH: 1,
      LIST: 1, NEW: 1, LOAD: 1, SAVE: 1, CLS: 1, HOME: 1
    };
    if (!known[word]) return false;
    var rest = (m[2] || "").trim();
    if (word === "HELP" || word === "GRIMOIRE") {
      printGrimoire();
      return true;
    }
    if (word === "LIST") {
      var listed = rest ? parseRange(rest) : { from: 0, to: MAX_LINE };
      if (!listed) { fault(say("syntax")); return true; }
      printList(listed);
      return true;
    }
    if (word === "NEW" || word === "VANISH") {
      interpreter.clearProgram();
      clearMinions();
      if (word === "VANISH") {
        setPen(7, 0);
        term.clear();
      }
      writeRaw("GONE.\n");
      return true;
    }
    if (word === "LOAD" || word === "UNSEAL") { return doUnseal(rest); }
    if (word === "SAVE" || word === "SEAL") { return doSeal(rest); }
    if (word === "CLS" || word === "HOME") {
      setPen(7, 0);
      term.clear();
      return true;
    }
    if (word === "RUN") { return doRun(rest); }
    if (word === "REVEAL") {
      var range = rest ? parseRange(rest) : { from: 0, to: MAX_LINE };
      if (!range) { fault(say("syntax")); return true; }
      var text = interpreter.listing(range.from, range.to);
      if (text) writeRaw(text + "\n");
      return true;
    }
    if (word === "OBLITERATE") {
      var gone = parseRange(rest);
      if (!gone) { fault(say("syntax")); return true; }
      interpreter.deleteRange(gone.from, gone.to);
      return true;
    }
    if (word === "RENUMBER" || word === "RENUM") {
      if (rest) { fault(say("syntax")); return true; }
      try { interpreter.renumber(); writeRaw("RENUMBERED.\n"); }
      catch (err) { fault(err.message || "NO."); }
      return true;
    }
    if (word === "AUTO" || word === "MAGIC") { return doAuto(rest); }
    if (word === "DOWNLOAD") { return doDownload(rest); }
    if (word === "UPLOAD") { return doUpload(); }
    if (word === "SHELF") { return doShelf(); }
    if (word === "LATCH") { return doLatch(rest); }
    return false;
  }

  function doLatch(rest) {
    if (!rest) latch = !latch;
    else if (/^ON$/i.test(rest)) latch = true;
    else if (/^OFF$/i.test(rest)) latch = false;
    else { fault(say("syntax")); return true; }
    if (!latch) sit();
    writeRaw(latch ? "LATCHED. THE GLASS HOLDS.\n" : "OPEN. THE ARROWS RECALL.\n");
    updateFooter();
    return true;
  }

  function doRun(rest) {
    if (!rest) return interpreter.run(null).then(function () { return true; });
    if (!/^\d+$/.test(rest) || Number(rest) > MAX_LINE) { fault(say("syntax")); return true; }
    return interpreter.run(Number(rest)).then(function () { return true; });
  }

  function doAuto(rest) {
    if (/^OFF$/i.test(rest)) { auto.on = false; writeRaw("AUTO OFF.\n"); return true; }
    var start = 10;
    var step = 10;
    if (rest) {
      var m = rest.match(/^(\d+)(?:\s*,\s*(\d+))?$/);
      if (!m) { fault(say("syntax")); return true; }
      start = Number(m[1]);
      step = m[2] ? Number(m[2]) : 10;
      if (step <= 0 || start > MAX_LINE) { fault(say("syntax")); return true; }
    } else if (interpreter.lines.size) {
      start = Math.max.apply(null, Array.from(interpreter.lines.keys())) + 10;
      if (start > MAX_LINE) start = MAX_LINE;
    }
    auto.on = true;
    auto.num = start;
    auto.step = step;
    return true;
  }

  function doSeal(rest) {
    var parsed = parseName(rest, false);
    if (parsed.error === "name") { fault(say("nameit")); return true; }
    if (parsed.error) { fault(say("syntax")); return true; }
    try {
      var index = readIndex();
      localStorage.setItem(sealKey(parsed.name), interpreter.listing());
      if (index.indexOf(parsed.name) < 0) index.push(parsed.name);
      localStorage.setItem(INDEX_KEY, JSON.stringify(index));
      writeRaw("SAVED.\n");
    } catch (err) { fault(say("shut")); }
    return true;
  }

  function loadCatalog() {
    if (catalogPromise) return catalogPromise;
    catalogPromise = fetch(shelfBase + "catalog.txt").then(function (res) {
      if (!res.ok) throw new Error("shut");
      return res.text();
    }).then(function (text) {
      var names = [];
      text.split(/\r?\n/).forEach(function (line) {
        var name = line.trim().toUpperCase();
        if (!name || name.charAt(0) === "#") return;
        if (!/^[A-Z][A-Z0-9-]{0,15}$/.test(name)) return;
        if (names.indexOf(name) < 0) names.push(name);
      });
      catalog = names;
      return true;
    }).catch(function () {
      catalogPromise = null;
      catalog = [];
      return false;
    });
    return catalogPromise;
  }

  function fetchShelf(name) {
    if (Object.prototype.hasOwnProperty.call(shelfCache, name)) {
      return Promise.resolve(shelfCache[name]);
    }
    return fetch(shelfBase + name.toLowerCase() + ".bas").then(function (res) {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("shut");
      return res.text();
    }).then(function (text) {
      if (text == null) return null;
      shelfCache[name] = text;
      return text;
    });
  }

  function doUnseal(rest) {
    var parsed = parseName(rest, true);
    if (parsed.error === "name") { fault(say("nameit")); return false; }
    if (parsed.error) { fault(say("syntax")); return false; }
    if (!parsed.shelf) {
      var kept = null;
      try { kept = localStorage.getItem(sealKey(parsed.name)); }
      catch (err) { fault(say("shut")); return false; }
      if (kept == null) { fault(say("missing")); return false; }
      try {
        interpreter.load(kept);
        clearMinions();
        writeRaw("LOADED.\n");
      } catch (err) { fault(err.message || say("syntax")); return false; }
      return true;
    }
    shelfState = "READING";
    updateFooter();
    setPen(10, 0);
    writeRaw("READING.\n");
    writeRaw(parsed.name + ".BAS\n");
    setPen(7, 0);
    tone(392, 45, 0.03);
    return fetchShelf(parsed.name).then(function (text) {
      shelfState = "";
      if (text == null) { fault(say("missing")); return false; }
      try {
        interpreter.load(text);
        clearMinions();
        writeRaw("LOADED.\n");
      } catch (err) { fault(err.message || say("syntax")); return false; }
      return true;
    }).catch(function () {
      shelfState = "";
      fault(say("shut"));
      return false;
    });
  }

  function doDownload(rest) {
    var parsed = parseName(rest, false);
    if (parsed.error === "name") { fault(say("nameit")); return true; }
    if (parsed.error) { fault(say("syntax")); return true; }
    var text = interpreter.listing();
    if (!text) { fault(say("empty")); return true; }
    var blob = new Blob([text + "\n"], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = parsed.name.toLowerCase() + ".bas";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    writeRaw("TAKE IT.\n");
    return true;
  }

  function doUpload() {
    holdPrompt = true;
    var input = document.createElement("input");
    input.type = "file";
    input.accept = ".bas,.basic,.txt,text/plain";
    var settled = false;
    function settle(text) {
      if (settled) return;
      settled = true;
      holdPrompt = false;
      if (text != null) {
        try {
          interpreter.load(text);
          clearMinions();
          writeRaw("LOADED.\n");
        } catch (err) { fault(err.message || "NO."); }
      }
      promptReady();
    }
    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      if (!file) { settle(null); return; }
      var reader = new FileReader();
      reader.onload = function () { settle(String(reader.result || "")); };
      reader.onerror = function () { fault(say("missing")); settle(null); };
      reader.readAsText(file);
    });
    window.addEventListener("focus", function onFocus() {
      setTimeout(function () {
        if (!settled && (!input.files || !input.files.length)) {
          window.removeEventListener("focus", onFocus);
          settle(null);
        }
      }, 500);
    });
    input.click();
    return true;
  }

  function countSpeech(n, one, many) {
    return String(n) + " " + (n === 1 ? one : many);
  }

  function reportSpell(spell, fromFile) {
    writeAnsi("\x1b[1;95mEXORCISE. THE SUMS STAY.\n");
    setPen(7, 0);
    if (spell.renamed) writeRaw(countSpeech(spell.renamed, "LINE TOOK A NEW NAME.", "LINES TOOK A NEW NAME.") + "\n");
    if (spell.buried) {
      setPen(1, 0);
      writeRaw(countSpeech(spell.buried, "LINE I BURIED.", "LINES I BURIED.") + "\n");
      setPen(7, 0);
    }
    if (spell.wires) writeRaw("PEEK ANSWERS 0. THE WIRES STAY DEAD.\n");
    if (spell.numbered) writeRaw("BARE LINES GOT NUMBERS.\n");
    if (spell.moved) writeRaw(countSpeech(spell.moved, "LINE NUMBERED PAST THE END.", "LINES NUMBERED PAST THE END.") + "\n");
    if (spell.tight) writeRaw(countSpeech(spell.tight, "LINE WOULD NOT FIT.", "LINES WOULD NOT FIT.") + "\n");
    if (fromFile) writeRaw("IT SITS IN THE CIRCLE.\n");
    writeRaw("RUN IT, OR LIST AND MEDDLE.\n");
  }

  function applySpell(text, fromFile) {
    var spell;
    try { spell = globalThis.Wasic.exorcise(String(text || "")); }
    catch (err) { fault(err.message || say("syntax")); return; }
    if (!spell || !String(spell.text || "").trim()) { fault(say("empty")); return; }
    if (!spell.changed) {
      if (!fromFile) { writeRaw("NOTHING HERE SPEAKS BASIC.\n"); return; }
      try {
        interpreter.load(spell.text);
        clearMinions();
        writeRaw("ALREADY WASIC.\n");
      } catch (err) { fault(err.message || say("syntax")); }
      return;
    }
    try {
      interpreter.load(spell.text);
      clearMinions();
    } catch (err) { fault(err.message || say("syntax")); return; }
    reportSpell(spell, fromFile);
  }

  function pickBasic() {
    holdPrompt = true;
    setPen(5, 0);
    writeRaw("☾ BRING THE LISTING.\n");
    setPen(7, 0);
    var input = document.createElement("input");
    input.type = "file";
    input.accept = ".bas,.basic,.txt,.wasic,text/plain";
    var settled = false;
    function settle(text) {
      if (settled) return;
      settled = true;
      holdPrompt = false;
      if (text != null) applySpell(text, true);
      promptReady();
    }
    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      if (!file) { settle(null); return; }
      var reader = new FileReader();
      reader.onload = function () { settle(String(reader.result || "")); };
      reader.onerror = function () { fault(say("missing")); settle(null); };
      reader.readAsText(file);
    });
    window.addEventListener("focus", function onFocus() {
      setTimeout(function () {
        if (!settled && (!input.files || !input.files.length)) {
          window.removeEventListener("focus", onFocus);
          settle(null);
        }
      }, 500);
    });
    input.click();
    return true;
  }

  function doExorcise() {
    if (interpreter.lines.size) {
      applySpell(interpreter.listing(), false);
      return true;
    }
    return pickBasic();
  }

  function toggleLatch() {
    if (mode !== "ready" && mode !== "auto" && mode !== "demand") {
      term.bell();
      return;
    }
    latch = !latch;
    if (!latch) sit();
    tone(latch ? 494 : 262, 50, 0.03);
    updateFooter();
  }

  function screenRoot() {
    return document.getElementById("witch-stage") || ui.wrap;
  }

  function toggleFull() {
    var root = screenRoot();
    var request = document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen();
    Promise.resolve(request).catch(function () {});
  }

  async function invokeTool(act) {
    if (busy || holdKeys || holdPrompt) return;
    if (mode !== "ready" && mode !== "auto") return;
    sit();
    if (entry) {
      entry = "";
      caret = 0;
      histAt = -1;
      paintEntry();
    }
    if (term.cursor.col !== 0) writeRaw("\n");
    var keep = auto.on && act !== "run" && act !== "shelf";
    busy = true;
    try {
      if (act === "list") printList({ from: 0, to: MAX_LINE });
      else if (act === "run") {
        auto.on = false;
        keep = false;
        mode = "run";
        updateFooter();
        await doRun("");
      } else if (act === "shelf") {
        auto.on = false;
        keep = false;
        await doShelf();
      } else if (act === "cls") {
        term.write("\x1b[0m");
        setPen(7, 0);
        term.clear();
      } else if (act === "auto") {
        if (auto.on) {
          auto.on = false;
          keep = false;
          writeRaw("AUTO OFF.\n");
        } else {
          doAuto("");
          keep = true;
        }
      } else if (act === "renum") {
        try { interpreter.renumber(); writeRaw("RENUMBERED.\n"); }
        catch (err) { fault(err.message || "NO."); }
      }
    } catch (err) {
      fault(err && err.message ? err.message : "NO.");
    } finally {
      busy = false;
      if (holdPrompt || mode === "shelf") return;
      if (mode === "demand" || mode === "freeze") return;
      if (keep && auto.on) {
        mode = "auto";
        beginEntry(String(auto.num) + " ");
        updateFooter();
      } else promptReady();
    }
  }

  function fitCells(text, width) {
    var chars = Array.from(text);
    if (chars.length > width) return chars.slice(0, width).join("");
    while (chars.length < width) chars.push(" ");
    return chars.join("");
  }

  function paintAnsiRow(row, sgr, text) {
    var chars = Array.from(text);
    var last = null;
    if (chars.length >= COLS) {
      chars = chars.slice(0, COLS);
      last = chars.pop();
    }
    writeAnsi("\x1b[" + (row + 1) + ";1H\x1b[" + sgr + "m" + chars.join("") + "\x1b[K");
    if (last != null) {
      term.write("\x1b[" + sgr + "m");
      term.set(COLS - 1, row, last);
      restorePen();
    }
  }

  function paintShelfChrome() {
    paintAnsiRow(0, "1;37;40", "THE SHELF");
    paintAnsiRow(1, shelf.shut ? "31;40" : "2;31;40", shelf.shut ? "THE BOX IS SHUT. THESE ARE YOURS." : "POINT AT ONE. I HAVE OTHER WORK.");
    paintAnsiRow(2, "40", "");
    paintAnsiRow(19, "40", "");
    paintAnsiRow(21, "40", "");
    paintAnsiRow(22, "2;33;40", "ARROWS. ENTER TAKES IT. ESC GOES BACK.");
    paintAnsiRow(23, "40", "");
  }

  function paintShelfList() {
    for (var slot = 0; slot < shelf.view; slot += 1) {
      var at = shelf.window + slot;
      var item = shelf.items[at];
      var row = 3 + slot;
      if (!item) {
        paintAnsiRow(row, "40", "");
        continue;
      }
      if (item.gap) {
        paintAnsiRow(row, "2;35;40", "  " + item.name);
        continue;
      }
      var on = at === shelf.index;
      var mark = (on ? "▶ " : "  ") + item.name;
      paintAnsiRow(row, on ? "1;97;45" : "37;40", on ? fitCells(mark, COLS) : mark);
    }
  }

  function paintShelfStatus() {
    var item = shelf.items[shelf.index];
    paintAnsiRow(20, "93;40", item ? item.name + ". TAKE IT OR DON'T." : "");
  }

  function revealPick() {
    if (shelf.index < shelf.window) shelf.window = shelf.index;
    if (shelf.index >= shelf.window + shelf.view) shelf.window = shelf.index - shelf.view + 1;
  }

  function repaintPick() {
    revealPick();
    paintShelfList();
    paintShelfStatus();
  }

  function movePick(dir) {
    if (!shelf || shelf.busy) return;
    var i = shelf.index;
    var guard = 0;
    while (guard < shelf.items.length) {
      guard += 1;
      i += dir;
      if (i < 0 || i >= shelf.items.length) return;
      if (!shelf.items[i].gap) {
        shelf.index = i;
        repaintPick();
        return;
      }
    }
  }

  function jumpPick(toEnd) {
    if (!shelf || shelf.busy) return;
    var i = toEnd ? shelf.items.length - 1 : 0;
    var step = toEnd ? -1 : 1;
    while (i >= 0 && i < shelf.items.length && shelf.items[i].gap) i += step;
    if (i < 0 || i >= shelf.items.length) return;
    shelf.index = i;
    repaintPick();
  }

  function pagePick(dir) {
    if (!shelf || shelf.busy) return;
    var hops = shelf.view;
    var i = shelf.index;
    var moved = 0;
    while (moved < hops) {
      var n = i + dir;
      while (n >= 0 && n < shelf.items.length && shelf.items[n].gap) n += dir;
      if (n < 0 || n >= shelf.items.length) break;
      i = n;
      moved += 1;
    }
    shelf.index = i;
    repaintPick();
  }

  function closeShelf() {
    shelf = null;
    mode = "run";
    term.cursorLit = true;
    updateFooter();
  }

  function beginShelf(items, shut) {
    var index = 0;
    while (index < items.length && items[index].gap) index += 1;
    if (index >= items.length) return false;
    shelf = { items: items, index: index, window: 0, view: 16, busy: false, shut: !!shut };
    mode = "shelf";
    term.cursorLit = false;
    term.write("\x1b[2J\x1b[H");
    restorePen();
    paintShelfChrome();
    repaintPick();
    updateFooter();
    tone(392, 45, 0.03);
    return true;
  }

  function cancelPick() {
    if (!shelf || shelf.busy) return;
    shelf.busy = true;
    closeShelf();
    term.clear();
    setPen(1, 0);
    writeRaw("FINE. THE SHELF CAN WAIT.\n");
    setPen(7, 0);
    tone(196, 70, 0.03);
    promptReady();
  }

  function choosePick() {
    if (!shelf || shelf.busy) return;
    var item = shelf.items[shelf.index];
    if (!item || item.gap) return;
    shelf.busy = true;
    var quoted = "\"" + (item.shelf ? "shelf:" : "") + item.name + "\"";
    closeShelf();
    term.clear();
    setPen(7, 0);
    holdKeys = true;
    Promise.resolve(doUnseal(quoted)).then(function (ok) {
      if (ok) {
        setPen(3, 0);
        writeRaw("LIST. A NUMBER CHANGES A LINE.\n");
        setPen(7, 0);
      }
    }).catch(function () {
      fault(say("syntax"));
    }).then(function () {
      holdKeys = false;
      if (mode !== "shelf") promptReady();
    });
  }

  function onShelfKey(event) {
    if (event.metaKey || event.altKey) return;
    if (event.ctrlKey && !isBreak(event)) return;
    var key = event.key;
    if (isBreak(event) || key === "Escape") { event.preventDefault(); cancelPick(); return; }
    if (key === "ArrowUp") { event.preventDefault(); movePick(-1); return; }
    if (key === "ArrowDown") { event.preventDefault(); movePick(1); return; }
    if (key === "ArrowLeft" || key === "ArrowRight") { event.preventDefault(); return; }
    if (key === "Home") { event.preventDefault(); jumpPick(false); return; }
    if (key === "End") { event.preventDefault(); jumpPick(true); return; }
    if (key === "PageUp") { event.preventDefault(); pagePick(-1); return; }
    if (key === "PageDown") { event.preventDefault(); pagePick(1); return; }
    if (key === "Enter") { event.preventDefault(); choosePick(); return; }
  }

  function doShelf() {
    shelfState = "READING";
    holdKeys = true;
    updateFooter();
    return loadCatalog().then(function (ok) {
      holdKeys = false;
      shelfState = "";
      var sealed = [];
      try { sealed = readIndex(); } catch (err) { sealed = []; }
      sealed = sealed.filter(function (name) { return /^[A-Z][A-Z0-9-]{0,15}$/.test(String(name).toUpperCase()) && String(name).toUpperCase() === name; });
      if ((!ok || !catalog.length) && !sealed.length) { fault(say("shut")); return true; }
      var items = [];
      if (ok) {
        for (var i = 0; i < catalog.length; i += 1) items.push({ name: catalog[i], shelf: true });
      }
      if (sealed.length) {
        items.push({ gap: true, name: "SAVED IN THIS BROWSER" });
        for (var s = 0; s < sealed.length; s += 1) items.push({ name: sealed[s], shelf: false });
      }
      if (!beginShelf(items, !ok)) fault(say("shut"));
      return true;
    });
  }

  async function handleLine(line, flags) {
    sit();
    mode = "run";
    updateFooter();
    var stayAuto = false;
    var quiet = false;
    try {
      if (flags && flags.emptyAuto) {
        auto.on = false;
        writeRaw("AUTO OFF.\n");
        return;
      }
      var trimmed = line.trim();
      if (!trimmed) return;
      if (/^\d/.test(trimmed)) {
        var ok = storeUserLine(trimmed);
        if (auto.on) {
          if (ok) {
            auto.num += auto.step;
            if (auto.num > MAX_LINE) auto.on = false;
            else stayAuto = true;
          } else stayAuto = true;
        } else if (ok) quiet = true;
        return;
      }
      auto.on = false;
      var consumed = editorCommand(trimmed);
      if (consumed && typeof consumed.then === "function") await consumed;
      else if (!consumed) await interpreter.direct(trimmed);
      if (auto.on) stayAuto = true;
    } catch (err) {
      fault(err && err.message ? err.message : "NO.");
    } finally {
      interpreter.breakRequested = false;
      if (holdPrompt || mode === "shelf") return;
      if (stayAuto) {
        mode = "auto";
        beginEntry(String(auto.num) + " ");
        updateFooter();
      } else if (quiet) waitSpeak();
      else promptReady();
    }
  }

  async function submitEntry() {
    if (mode === "demand") {
      var answer = entry;
      finishEntryLine();
      var go = demandResolve;
      demandResolve = null;
      entry = "";
      caret = 0;
      painted = 0;
      mode = "run";
      if (go) go(answer);
      return;
    }
    if (busy) return;
    busy = true;
    try {
      var typed = entry;
      if (mode === "auto" && !typed.trim()) {
        finishEntryLine();
        entry = "";
        caret = 0;
        painted = 0;
        await handleLine("", { emptyAuto: true });
        return;
      }
      if (mode === "ready" && !typed.trim()) {
        entry = "";
        caret = 0;
        painted = 0;
        setPen(15, 0);
        writeRaw("READY.\n");
        setPen(7, 0);
        beginEntry("");
        updateFooter();
        return;
      }
      finishEntryLine();
      if (typed.trim()) {
        hist.push(typed);
        if (hist.length > HIST_MAX) hist.shift();
      }
      histAt = -1;
      var line = mode === "auto" ? (promptText + typed) : typed;
      entry = "";
      caret = 0;
      painted = 0;
      await handleLine(line, {});
    } finally {
      busy = false;
    }
  }

  function recall(dir) {
    if (!hist.length) return;
    if (dir < 0) {
      if (histAt < 0) { stash = entry; histAt = hist.length - 1; }
      else if (histAt > 0) histAt -= 1;
    } else if (histAt < 0) return;
    else if (histAt < hist.length - 1) histAt += 1;
    else {
      histAt = -1;
      entry = stash;
      caret = cp(entry).length;
      paintEntry();
      return;
    }
    entry = hist[histAt];
    caret = cp(entry).length;
    paintEntry();
  }

  function isBreak(event) {
    return event.key === "Escape" || ((event.key === "c" || event.key === "C") && event.ctrlKey);
  }
  function typingTarget(event) {
    var el = event.target;
    if (!el || !el.tagName) return false;
    var tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
  }

  function onRunKey(event) {
    if (isBreak(event)) {
      event.preventDefault();
      interpreter.breakRequested = true;
      if (keyWait) {
        var go = keyWait;
        keyWait = null;
        mode = "run";
        go(event.key);
      }
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (mode === "freeze" || keyWait) {
      event.preventDefault();
      var resume = keyWait;
      keyWait = null;
      mode = "run";
      if (resume) resume(event.key);
      return;
    }
    if (event.key === "Shift" || event.key === "Control" || event.key === "Alt" || event.key === "Meta") return;
    if (event.key.length === 1 || event.key.indexOf("Arrow") === 0) {
      if (inkeyQueue.length < KEY_MAX) inkeyQueue.push(event.key);
      event.preventDefault();
    }
  }

  function onEditKey(event) {
    if (event.metaKey || event.altKey) return;
    if (event.ctrlKey) {
      if (isBreak(event) && mode === "demand") {
        event.preventDefault();
        interpreter.breakRequested = true;
        entry = "";
        caret = 0;
        submitEntry();
        return;
      }
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        sit();
        recall(event.key === "ArrowUp" ? -1 : 1);
      }
      return;
    }
    var key = event.key;
    if (latch && (key === "ArrowUp" || key === "ArrowDown" || key === "PageUp" || key === "PageDown" || key === "Home" || key === "End")) {
      event.preventDefault();
      if (key === "ArrowUp") gazeBy(1);
      else if (key === "ArrowDown") gazeBy(-1);
      else if (key === "PageUp") gazeBy(ROWS - 1);
      else if (key === "PageDown") gazeBy(1 - ROWS);
      else if (key === "Home") {
        if (back.length) gazeTop();
        else { caret = 0; paintEntry(); }
      } else if (gaze > 0) gazeLive();
      else { caret = cp(entry).length; paintEntry(); }
      return;
    }
    if (gaze) sit();
    if (key === "PageUp" || key === "PageDown") { event.preventDefault(); term.bell(); return; }
    if (key === "Enter") { event.preventDefault(); submitEntry(); return; }
    if (key === "Backspace") {
      event.preventDefault();
      if (caret > 0) {
        var chars = cp(entry);
        chars.splice(caret - 1, 1);
        entry = chars.join("");
        caret -= 1;
        paintEntry();
      }
      return;
    }
    if (key === "Delete") {
      event.preventDefault();
      var now = cp(entry);
      if (caret < now.length) {
        now.splice(caret, 1);
        entry = now.join("");
        paintEntry();
      }
      return;
    }
    if (key === "ArrowLeft") { event.preventDefault(); caret = Math.max(0, caret - 1); paintEntry(); return; }
    if (key === "ArrowRight") { event.preventDefault(); caret = Math.min(cp(entry).length, caret + 1); paintEntry(); return; }
    if (key === "Home") { event.preventDefault(); caret = 0; paintEntry(); return; }
    if (key === "End") { event.preventDefault(); caret = cp(entry).length; paintEntry(); return; }
    if (key === "ArrowUp") { event.preventDefault(); recall(-1); return; }
    if (key === "ArrowDown") { event.preventDefault(); recall(1); return; }
    if (key === "Escape") {
      event.preventDefault();
      if (mode === "demand") {
        interpreter.breakRequested = true;
        entry = "";
        caret = 0;
        submitEntry();
        return;
      }
      entry = "";
      caret = 0;
      histAt = -1;
      paintEntry();
      return;
    }
    if (key.length === 1) {
      event.preventDefault();
      insertText(key);
    }
  }

  window.addEventListener("keydown", function (event) {
    if (typingTarget(event)) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === "F11") {
      event.preventDefault();
      event.stopPropagation();
      if (!event.repeat) toggleFull();
      return;
    }
    var act = toolByKey[event.key];
    var scrollKey = event.key === "ScrollLock";
    if (!act && !scrollKey) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.repeat) return;
    unlock();
    if (holdKeys || mode === "boot") return;
    if (scrollKey || act === "latch") { toggleLatch(); return; }
    if (mode !== "ready" && mode !== "auto") { term.bell(); return; }
    invokeTool(act);
  }, true);

  window.addEventListener("keydown", function (event) {
    if (typingTarget(event)) return;
    if (event.target && event.target.closest && event.target.closest("button") && !ui.wrap.contains(event.target)) return;
    unlock();
    if (holdKeys) { event.preventDefault(); return; }
    if (mode === "boot") {
      if (event.key === " " || event.key.indexOf("Arrow") === 0) event.preventDefault();
      return;
    }
    if (mode === "shelf") { onShelfKey(event); return; }
    if (mode === "run" || mode === "freeze") onRunKey(event);
    else if (mode === "ready" || mode === "auto" || mode === "demand") onEditKey(event);
  });

  window.addEventListener("paste", function (event) {
    if (typingTarget(event)) return;
    if (mode !== "ready" && mode !== "auto" && mode !== "demand") return;
    var text = event.clipboardData && event.clipboardData.getData("text");
    if (!text) return;
    event.preventDefault();
    pasteText(text);
  });

  async function pasteText(text) {
    var normalized = String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (mode === "demand") {
      var first = normalized.split("\n")[0];
      insertText(first);
      if (normalized.indexOf("\n") >= 0) await submitEntry();
      return;
    }
    if (normalized.indexOf("\n") < 0) { insertText(normalized); return; }
    auto.on = false;
    var parts = normalized.split("\n");
    if (normalized.endsWith("\n")) parts.pop();
    for (var i = 0; i < parts.length; i += 1) {
      if (i === 0) insertText(parts[i]);
      else {
        entry = parts[i];
        caret = cp(entry).length;
        paintEntry();
      }
      await submitEntry();
    }
  }

  function sleep(ms) {
    var gen = generation;
    return new Promise(function (r) { setTimeout(r, ms); }).then(function () {
      if (gen !== generation || !glassLive) {
        var err = new Error("cut");
        err.cut = true;
        throw err;
      }
    });
  }

  function showGlass() {
    glassLive = true;
    unhush();
    if (frameOn) return;
    frameOn = true;
    lastFrame = performance.now();
    requestAnimationFrame(frame);
  }

  function unhush() {
    try {
      if (engine.audio && engine.audio.state === "suspended") engine.audio.resume();
    } catch (err) {}
  }

  function hush() {
    try {
      if (engine.audio && engine.audio.state === "running") engine.audio.suspend();
    } catch (err) {}
  }

  function power() {
    showGlass();
    if (awake) return;
    var gen = generation;
    if (booting && gen === activeBoot) return;
    activeBoot = gen;
    booting = true;
    boot().then(function (done) {
      if (done && gen === generation) awake = true;
    }).catch(function () {}).finally(function () {
      if (gen === generation) booting = false;
    });
  }

  function leave() {
    generation += 1;
    glassLive = false;
    if (mode === "shelf") cancelPick();
    if (mode === "run" || mode === "freeze") {
      interpreter.breakRequested = true;
      if (keyWait) {
        var go = keyWait;
        keyWait = null;
        mode = "run";
        go("Escape");
      }
    }
    hush();
  }

  function witchBox() {
    var dh = 210;
    var dw = Math.round(dh * WITCH_CROP.w / WITCH_CROP.h);
    return { dx: Math.round((COLS * CW - dw) / 2), dy: 4, dw: dw, dh: dh };
  }

  function centerOf(text) {
    return Math.max(0, Math.floor((COLS - Array.from(text).length) / 2));
  }

  function cup(row, col, text, sgr) {
    term.write("\x1b[" + (row + 1) + ";" + (col + 1) + "H\x1b[" + sgr + "m" + text + "\x1b[0m");
  }

  function lightSpark() {
    if (spark || !portrait.image) return;
    var box = witchBox();
    var x = box.dx + box.dw * 0.78;
    var y = box.dy + box.dh * 0.44;
    spark = engine.sprite("✨", x, y, 26, "spark");
    spark.data.cvx = 0;
    spark.data.cvy = 0;
    spark.data.hx = x;
    spark.data.hy = y;
  }

  function dropSpark() {
    if (!spark) return;
    killSprite(spark);
    spark = null;
  }

  function rollUp(rows) {
    // Blank rows leaving as she wakes. Not a listing, so they are not kept.
    var i = 0;
    function step() {
      if (i >= rows) return Promise.resolve();
      shiftGlass();
      i += 1;
      return sleep(20).then(step);
    }
    return step();
  }

  var waking = true;
  var inkHold = true;
  portrait.target = 0;

  // The same picture as shelf/ansi-witch.wasic, drawn on the glass before the sign-on.
  var INK_WITCH = [
    [1, ["1;95", "               ANSI WITCH"]],
    [2, ["2;31", "        THE INK IS HERS. SIT DOWN."]],
    [4, ["2;37", "             ·    ", "38;5;226", "*", "2;37", "    ·"]],
    [5, ["1;97", "                 .-^-. "]],
    [6, ["97", "              .-'     '-."]],
    [7, ["38;5;54", "            .'    ", "38;5;141", "☾", "38;5;54", "    '."]],
    [8, ["38;2;232;206;168", "           :   ", "1;91", "•", "38;2;232;206;168", "     ", "1;91", "•", "38;2;232;206;168", "   :"]],
    [9, ["38;2;232;206;168", "            '.   ", "1;31", "—", "38;2;232;206;168", "   .'"]],
    [10, ["97", "              '-._____.-'"]],
    [11, ["35", "                 | |"]],
    [12, ["45;97", "            .-'|     |'-."]],
    [13, ["45;97", "          .'   |     |   '."]],
    [14, ["45;97", "         :     |  ", "38;5;226", "*", "45;97", "  |     :"]],
    [15, ["45;97", "          '.   |     |   .'"]],
    [16, ["35", "            '-.|_____|.-'"]],
    [17, ["93", "                \\   /"]],
    [18, ["38;5;226", "               *     *"]],
    [20, ["2;31", "            SHE WOKE IN INK."]]
  ];

  function paintInkRow(row, parts) {
    var seq = "\x1b[" + (row + 1) + ";1H";
    for (var i = 0; i < parts.length; i += 2) seq += "\x1b[" + parts[i] + "m" + parts[i + 1];
    seq += "\x1b[0m";
    term.write(seq);
    term.cursor.row = 23;
    term.cursor.col = 0;
    term.dirty = true;
  }

  async function paintInkWitch() {
    for (var i = 0; i < INK_WITCH.length; i += 1) {
      paintInkRow(INK_WITCH[i][0], INK_WITCH[i][1]);
      await sleep(40);
    }
  }

  async function boot() {
    var SIGN = 10;
    mode = "boot";
    waking = true;
    try {
    term.clear();
    term.cursor.col = 0;
    term.cursor.row = 0;
    term.cursorLit = true;
    term.flush();
    inkHold = true;
    portrait.target = 0;
    updateFooter();
    loadCatalog();
    await sleep(220);
    tone(196, 90, 0.04);
    await sleep(110);
    tone(247, 150, 0.035);
    await sleep(260);
    term.write("\x1b[0m");
    term.clear();
    setPen(7, 0);
    inkHold = false;
    portrait.target = 0;
    await sleep(80);
    var boxCol = centerOf("┌────────────────────┐");
    var box = [
      ["┌────────────────────┐", "92"],
      ["│ **** BASIC I ****  │", "1;97"],
      ["│    BASIC · ONE     │", "92"],
      ["└────────────────────┘", "92"]
    ];
    for (var b = 0; b < box.length; b += 1) cup(SIGN + b, boxCol, box[b][0], box[b][1]);
    await sleep(90);
    var glass = "40 COLUMN GLASS";
    cup(SIGN + 5, centerOf(glass), glass, "2;37");
    var marks = [111, 222, 333, 444, 555, 666];
    for (var i = 0; i < marks.length; i += 1) {
      var mem = "MEMORY " + String(marks[i]).padStart(3, "0");
      cup(SIGN + 6, centerOf(mem), mem, "93");
      await sleep(50);
    }
    var spoken = [
      [8, "IT WOKE UP.", "37"],
      [9, "THE GLASS HOLDS.", "37"],
      [10, "BASIC SPEAKS.", "37"],
      [11, "A NUMBER STORES A LINE.", "37"]
    ];
    for (var n = 0; n < spoken.length; n += 1) {
      await sleep(65);
      cup(SIGN + spoken[n][0], centerOf(spoken[n][1]), spoken[n][1], spoken[n][2]);
    }
    await sleep(65);
    var free = "666 LINES FREE.";
    var last = SIGN + 13;
    cup(last, centerOf(free), free, "93");
    unlock();
    if (glassLive) { try { engine.beep(98, 160); } catch (err) {} }
    await sleep(190);
    if (glassLive) { try { engine.beep(146, 260); } catch (err) {} }
    await sleep(240);
    waking = false;
    portrait.target = 0;
    dropSpark();
    await rollUp(SIGN);
    term.cursor.row = last - SIGN + 1;
    term.cursor.col = 0;
    term.write("\x1b[0m");
    promptReady();
    return true;
    } catch (err) {
      if (err && err.cut) return false;
      throw err;
    }
  }

  globalThis.BASIC = {
    term: term,
    engine: engine,
    interpreter: interpreter,
    get mode() { return mode; },
    get gaze() { return gaze; },
    get latch() { return latch; },
    get kept() { return back.length; },
    power: power,
    leave: leave,
    glass: function () {
      var rows = reading() ? composedRows() : term.cells;
      var out = [];
      for (var r = 0; r < rows.length; r += 1) {
        var line = "";
        var cells = rows[r];
        for (var c = 0; c < cells.length; c += 1) line += cells[c].ch || " ";
        out.push(line.replace(/\s+$/, ""));
      }
      return out;
    }
  };
})();
