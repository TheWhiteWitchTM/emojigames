// Witch I. A 40-column machine. The language is WASIC. The glass is emoji-engine-2d.
"use strict";
(function () {
  var COLS = 40;
  var ROWS = 24;
  var CW = 18;
  var CH = 24;
  var MAX_LINE = 63999;
  var LINE_CHARS = 255;
  var HIST_MAX = 32;
  var KEY_MAX = 32;
  var MINIONS = 32;
  var HITS = 8;
  var INDEX_KEY = "emojigames-witch1-seals";
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

  var ui = E.Utilities.wrap(term, { title: "WITCH I", footer: true });
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
  ui.wrap.setAttribute("aria-label", "Witch I");

  var led = document.createElement("span");
  led.className = "led";
  led.textContent = "● ";
  var statusEl = document.createElement("span");
  statusEl.className = "status";
  ui.footer.textContent = "";
  ui.footer.append(led, statusEl);

  var mode = "boot";
  var shelfState = "";
  var shelfBase = mount.getAttribute("data-shelf") || "shelf/";
  if (shelfBase.slice(-1) !== "/") shelfBase += "/";
  var catalog = [];
  var catalogPromise = null;
  var shelfCache = {};
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
  var busy = false;
  var holdPrompt = false;
  var demandResolve = null;
  var keyWait = null;
  var inkeyQueue = [];
  var nextId = 1;
  var minions = new Map();
  var touching = new Set();
  var framePairs = new Set();
  var wasic;

  function cp(s) { return Array.from(s); }
  function sealKey(name) { return "emojigames-witch1-seal:" + name; }

  function updateFooter() {
    var used = wasic ? wasic.lines.size : 0;
    var state = "SPEAK";
    if (mode === "boot") state = "WAKING";
    else if (shelfState) state = shelfState;
    else if (mode === "run") state = wasic && wasic.currentLine != null ? "LINE " + wasic.currentLine : "RUNNING";
    else if (mode === "demand") state = "WAITING";
    else if (mode === "freeze") state = "FROZEN";
    else if (mode === "auto") state = "AUTO " + auto.num;
    statusEl.textContent = state + " " + used + "/666";
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
    var book = globalThis.WASIC_MESSAGES;
    return (book && book[code]) || "❓ NO.";
  }

  function tone(freq, ms, level) {
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
    term.color(stop ? 11 : 9, 0);
    writeRaw(msg + "\n");
    term.color(7, 0);
    flashLed(stop);
    if (stop) stopSound();
    else errorSound();
  }

  function scrollOne() {
    term.cells.shift();
    var row = [];
    for (var c = 0; c < COLS; c += 1) row.push({ ch: " " });
    term.cells.push(row);
    term.cursor.row = Math.max(0, term.cursor.row - 1);
    if (origin) origin.row = Math.max(0, origin.row - 1);
    term.dirty = true;
    term.flush();
  }

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
    auto.on = false;
    mode = "ready";
    if (term.cursor.col !== 0) writeRaw("\n");
    term.write("\x1b[0m\x1b[97mSPEAK.\x1b[0m\n");
    term.color(7, 0);
    beginEntry("");
    updateFooter();
  }

  function waitSpeak() {
    auto.on = false;
    mode = "ready";
    term.color(7, 0);
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
    if (wasic) wasic.pendingHits.length = 0;
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
      if (bg == null) term.color(fg);
      else term.color(fg, bg);
    },
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
      term.color(10, 0);
      touching.clear();
    },
    stopping: function () {
      term.write("\x1b[0m");
      term.color(7, 0);
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

  wasic = new Wasic(host);

  engine.onCollision(function (a, b) {
    var ida = a.data && a.data.id;
    var idb = b.data && b.data.id;
    if (!ida || !idb) return;
    var key = ida < idb ? ida + ":" + idb : idb + ":" + ida;
    framePairs.add(key);
    if (!touching.has(key)) {
      touching.add(key);
      if (wasic.watchName && wasic.pendingHits.length < HITS) wasic.pendingHits.push({ a: ida, b: idb });
    }
  });

  var wokeAt = performance.now();
  var lastFrame = wokeAt;
  function frame(t) {
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
  requestAnimationFrame(frame);

  function storeUserLine(trimmed) {
    if (cp(trimmed).length > LINE_CHARS) { fault(say("long")); return false; }
    var m = trimmed.match(/^(\d+)\s*(.*)$/);
    if (!m) { fault(say("syntax")); return false; }
    var num = Number(m[1]);
    try {
      wasic.store(num, m[2]);
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
      "THE SHORT LIST. SHE IS NOT YOUR TUTOR.",
      "",
      "CHANT DEMAND CONJURE FLYTO",
      "SUMMON BANISH IF CURSE BREAK",
      "MARK DISPEL FREEZE WHISPER",
      "OFFERING TAKE REWIND WHEN DIM",
      "AT SCRUB COLOR TONE MINION",
      "SEND WATCH DESTROY CIRCLE",
      "LINE FILL",
      "",
      "FROM OUT HERE:",
      "RUN REVEAL OBLITERATE",
      "RENUMBER VANISH AUTO",
      "SEAL UNSEAL UPLOAD",
      "DOWNLOAD SHELF GRIMOIRE",
      "",
      "UNSEAL \"shelf:HELLO-WITCH\"",
      "THEN RUN. HELLO-DEMON TOO.",
      "ESCAPE LEAVES A CIRCLE THAT WILL NOT.",
      "A NUMBER STORES THE LINE. RUN LATER.",
      "BASIC MAY SIT IN A LINE.",
      "IT FALLS OVER WHEN SHE REACHES IT.",
      "PEEK POKE SYS. SHE COMPLAINS."
    ];
    for (var i = 0; i < lines.length; i += 1) writeRaw(lines[i] + "\n");
  }

  function editorCommand(trimmed) {
    var m = trimmed.match(/^([A-Za-z]+)(?:\s+([\s\S]*))?$/);
    if (!m) return false;
    var word = m[1].toUpperCase();
    var known = {
      REVEAL: 1, OBLITERATE: 1, RENUMBER: 1, VANISH: 1, AUTO: 1, SEAL: 1, UNSEAL: 1,
      UPLOAD: 1, DOWNLOAD: 1, SHELF: 1, GRIMOIRE: 1, RUN: 1, HELP: 1,
      LIST: 1, NEW: 1, LOAD: 1, SAVE: 1, CLS: 1, HOME: 1
    };
    if (!known[word]) return false;
    var rest = (m[2] || "").trim();
    if (word === "HELP") {
      writeRaw("GRIMOIRE. NOT HELP.\n");
      printGrimoire();
      writeRaw("GRIMOIRE. NOT HELP.\n");
      return true;
    }
    if (word === "LIST") {
      writeRaw("REVEAL. NOT LIST.\n");
      word = "REVEAL";
    }
    if (word === "NEW") {
      writeRaw("VANISH. NOT NEW.\n");
      wasic.clearProgram();
      clearMinions();
      writeRaw("GONE.\n");
      return true;
    }
    if (word === "LOAD") {
      writeRaw("UNSEAL. NOT LOAD.\n");
      return doUnseal(rest);
    }
    if (word === "SAVE") {
      writeRaw("SEAL. NOT SAVE.\n");
      return doSeal(rest);
    }
    if (word === "CLS" || word === "HOME") {
      writeRaw(word === "HOME" ? "SCRUB. NOT HOME.\n" : "SCRUB. NOT CLS.\n");
      term.color(7, 0);
      term.clear();
      return true;
    }
    if (word === "GRIMOIRE") { printGrimoire(); return true; }
    if (word === "RUN") { return doRun(rest); }
    if (word === "REVEAL") {
      var range = rest ? parseRange(rest) : { from: 0, to: MAX_LINE };
      if (!range) { fault(say("syntax")); return true; }
      var text = wasic.listing(range.from, range.to);
      if (text) writeRaw(text + "\n");
      return true;
    }
    if (word === "OBLITERATE") {
      var gone = parseRange(rest);
      if (!gone) { fault(say("syntax")); return true; }
      wasic.deleteRange(gone.from, gone.to);
      return true;
    }
    if (word === "RENUMBER") {
      if (rest) { fault(say("syntax")); return true; }
      try { wasic.renumber(); writeRaw("RENUMBERED.\n"); }
      catch (err) { fault(err.message || "NO."); }
      return true;
    }
    if (word === "VANISH") {
      wasic.clearProgram();
      clearMinions();
      term.color(7, 0);
      term.clear();
      writeRaw("GONE.\n");
      return true;
    }
    if (word === "AUTO") { return doAuto(rest); }
    if (word === "SEAL") { return doSeal(rest); }
    if (word === "UNSEAL") { return doUnseal(rest); }
    if (word === "DOWNLOAD") { return doDownload(rest); }
    if (word === "UPLOAD") { return doUpload(); }
    if (word === "SHELF") { return doShelf(); }
    return false;
  }

  function doRun(rest) {
    if (!rest) return wasic.run(null).then(function () { return true; });
    if (!/^\d+$/.test(rest) || Number(rest) > MAX_LINE) { fault(say("syntax")); return true; }
    return wasic.run(Number(rest)).then(function () { return true; });
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
    } else if (wasic.lines.size) {
      start = Math.max.apply(null, Array.from(wasic.lines.keys())) + 10;
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
      localStorage.setItem(sealKey(parsed.name), wasic.listing());
      if (index.indexOf(parsed.name) < 0) index.push(parsed.name);
      localStorage.setItem(INDEX_KEY, JSON.stringify(index));
      writeRaw("SEALED.\n");
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
    return fetch(shelfBase + name.toLowerCase() + ".wasic").then(function (res) {
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
    if (parsed.error === "name") { fault(say("nameit")); return true; }
    if (parsed.error) { fault(say("syntax")); return true; }
    if (!parsed.shelf) {
      var kept = null;
      try { kept = localStorage.getItem(sealKey(parsed.name)); }
      catch (err) { fault(say("shut")); return true; }
      if (kept == null) { fault(say("missing")); return true; }
      try {
        wasic.load(kept);
        clearMinions();
        writeRaw("UNSEALED.\n");
      } catch (err) { fault(err.message || say("syntax")); }
      return true;
    }
    shelfState = "READING";
    updateFooter();
    term.color(10, 0);
    writeRaw("☾ THE SHELF CREAKS.\n");
    writeRaw(parsed.name + ".WASIC\n");
    term.color(7, 0);
    tone(392, 45, 0.03);
    return fetchShelf(parsed.name).then(function (text) {
      shelfState = "";
      if (text == null) { fault(say("missing")); return true; }
      try {
        wasic.load(text);
        clearMinions();
        writeRaw("UNSEALED.\n");
      } catch (err) { fault(err.message || say("syntax")); }
      return true;
    }).catch(function () {
      shelfState = "";
      fault(say("shut"));
      return true;
    });
  }

  function doDownload(rest) {
    var parsed = parseName(rest, false);
    if (parsed.error === "name") { fault(say("nameit")); return true; }
    if (parsed.error) { fault(say("syntax")); return true; }
    var text = wasic.listing();
    if (!text) { fault(say("empty")); return true; }
    var blob = new Blob([text + "\n"], { type: "text/plain" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = parsed.name.toLowerCase() + ".wasic";
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
    input.accept = ".wasic,.txt,text/plain";
    var settled = false;
    function settle(text) {
      if (settled) return;
      settled = true;
      holdPrompt = false;
      if (text != null) {
        try {
          wasic.load(text);
          clearMinions();
          writeRaw("UNSEALED.\n");
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

  function doShelf() {
    writeRaw("SHELF:\n");
    return loadCatalog().then(function (ok) {
      if (!ok || !catalog.length) { fault(say("shut")); return true; }
      writeWords(catalog);
      var sealed = [];
      try { sealed = readIndex(); } catch (err) { sealed = []; }
      if (sealed.length) {
        writeRaw("SEALED:\n");
        writeWords(sealed);
      }
      return true;
    });
  }

  async function handleLine(line, flags) {
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
      else if (!consumed) await wasic.direct(trimmed);
      if (auto.on) stayAuto = true;
    } catch (err) {
      fault(err && err.message ? err.message : "NO.");
    } finally {
      wasic.breakRequested = false;
      if (holdPrompt) return;
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
        term.color(15, 0);
        writeRaw("SPEAK.\n");
        term.color(7, 0);
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
      wasic.breakRequested = true;
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
        wasic.breakRequested = true;
        entry = "";
        caret = 0;
        submitEntry();
      }
      return;
    }
    var key = event.key;
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
        wasic.breakRequested = true;
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
    if (event.target && event.target.closest && event.target.closest("button") && !ui.wrap.contains(event.target)) return;
    unlock();
    if (mode === "boot") {
      if (event.key === " " || event.key.indexOf("Arrow") === 0) event.preventDefault();
      return;
    }
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

  crt.addEventListener("pointerdown", unlock);

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
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
    var i = 0;
    function step() {
      if (i >= rows) return Promise.resolve();
      scrollOne();
      i += 1;
      return sleep(20).then(step);
    }
    return step();
  }

  var waking = true;
  var witchSrc = mount.getAttribute("data-witch");
  if (witchSrc) {
    var witchImg = new Image();
    witchImg.onload = function () {
      portrait.image = witchImg;
      if (waking) {
        portrait.target = 1;
        lightSpark();
      }
    };
    witchImg.src = witchSrc;
  }

  async function boot() {
    var SIGN = 10;
    mode = "boot";
    term.clear();
    term.cursor.col = 0;
    term.cursor.row = 0;
    term.cursorLit = true;
    term.flush();
    updateFooter();
    loadCatalog();
    await sleep(280);
    if (portrait.image) {
      portrait.target = 1;
      lightSpark();
    }
    await sleep(240);
    var boxCol = centerOf("┌────────────────────┐");
    var box = [
      ["┌────────────────────┐", "92"],
      ["│ **** WITCH I ****  │", "1;97"],
      ["│    WASIC · ONE     │", "92"],
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
      [8, "SHE WOKE UP.", "37"],
      [9, "THE CIRCLE HOLDS.", "37"],
      [10, "WASIC SPEAKS.", "37"],
      [11, "BASIC CAN SIT IN THE DARK.", "31"]
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
    try { engine.beep(98, 160); } catch (err) {}
    await sleep(190);
    try { engine.beep(146, 260); } catch (err) {}
    await sleep(240);
    waking = false;
    portrait.target = 0;
    dropSpark();
    await rollUp(SIGN);
    term.cursor.row = last - SIGN + 1;
    term.cursor.col = 0;
    term.write("\x1b[0m");
    promptReady();
  }

  globalThis.WITCH = {
    term: term,
    engine: engine,
    wasic: wasic,
    get mode() { return mode; }
  };

  boot();
})();
