// Witch ][. A 40-column machine. The language is WASIC. The glass is emoji-engine-2d.
"use strict";
(function () {
  var COLS = 40;
  var ROWS = 24;
  var CW = 18;
  var CH = 24;
  var MAX_LINE = 63999;
  var INDEX_KEY = "emojigames-witch1-seals";

  var mount = document.getElementById("game");
  if (!mount || !globalThis.EmojiEngine) {
    if (mount) mount.textContent = "THE GLASS IS MISSING.";
    return;
  }

  var E = globalThis.EmojiEngine;
  var canvas = new E.Canvas({ width: COLS * CW, height: ROWS * CH });
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

  var ui = E.Utilities.wrap(term, { title: "WITCH ][", footer: true });
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

  function fault(msg) {
    writeRaw(msg + "\n");
    try { term.bell(); } catch (err) {}
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
    if (mode === "demand") return 255;
    return Math.max(0, 255 - cp(promptText).length);
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
    term.color(15, 0);
    writeRaw("SPEAK.\n");
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
      if (living() >= 32) return null;
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
    waitKey: function () {
      mode = "freeze";
      updateFooter();
      return new Promise(function (resolve) { keyWait = resolve; });
    },
    trace: function () { updateFooter(); },
    bell: function () { try { term.bell(); } catch (err) {} },
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
      if (wasic.watchName && wasic.pendingHits.length < 8) wasic.pendingHits.push({ a: ida, b: idb });
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
    try { engine.update(); } catch (err) {}
    touching.forEach(function (key) { if (!framePairs.has(key)) touching.delete(key); });
    try { canvas.draw(); } catch (err) {}
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function storeUserLine(trimmed) {
    if (trimmed.length > 255) { fault("TOO LONG."); return false; }
    var m = trimmed.match(/^(\d+)\s*(.*)$/);
    if (!m) { fault("NO. SAY IT AGAIN."); return false; }
    var num = Number(m[1]);
    try {
      wasic.store(num, m[2]);
      return true;
    } catch (err) {
      fault(err.message || "NO.");
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
      "UNSEAL \"shelf:GUESS\" THEN RUN.",
      "ESCAPE LEAVES A CIRCLE THAT WILL NOT.",
      "BASIC MAY SIT IN A LINE.",
      "IT FALLS OVER WHEN SHE REACHES IT."
    ];
    for (var i = 0; i < lines.length; i += 1) writeRaw(lines[i] + "\n");
  }

  function editorCommand(trimmed) {
    var m = trimmed.match(/^([A-Za-z]+)(?:\s+([\s\S]*))?$/);
    if (!m) return false;
    var word = m[1].toUpperCase();
    var known = {
      REVEAL: 1, OBLITERATE: 1, RENUMBER: 1, VANISH: 1, AUTO: 1, SEAL: 1, UNSEAL: 1,
      UPLOAD: 1, DOWNLOAD: 1, SHELF: 1, GRIMOIRE: 1, RUN: 1, HELP: 1
    };
    if (!known[word]) return false;
    var rest = (m[2] || "").trim();
    if (word === "HELP") {
      writeRaw("GRIMOIRE. NOT HELP.\n");
      printGrimoire();
      writeRaw("GRIMOIRE. NOT HELP.\n");
      return true;
    }
    if (word === "GRIMOIRE") { printGrimoire(); return true; }
    if (word === "RUN") { return doRun(rest); }
    if (word === "REVEAL") {
      var range = rest ? parseRange(rest) : { from: 0, to: MAX_LINE };
      if (!range) { fault("NO. SAY IT AGAIN."); return true; }
      var text = wasic.listing(range.from, range.to);
      if (text) writeRaw(text + "\n");
      return true;
    }
    if (word === "OBLITERATE") {
      var gone = parseRange(rest);
      if (!gone) { fault("NO. SAY IT AGAIN."); return true; }
      wasic.deleteRange(gone.from, gone.to);
      return true;
    }
    if (word === "RENUMBER") {
      if (rest) { fault("NO. SAY IT AGAIN."); return true; }
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
    if (!/^\d+$/.test(rest) || Number(rest) > MAX_LINE) { fault("NO. SAY IT AGAIN."); return true; }
    return wasic.run(Number(rest)).then(function () { return true; });
  }

  function doAuto(rest) {
    if (/^OFF$/i.test(rest)) { auto.on = false; writeRaw("AUTO OFF.\n"); return true; }
    var start = 10;
    var step = 10;
    if (rest) {
      var m = rest.match(/^(\d+)(?:\s*,\s*(\d+))?$/);
      if (!m) { fault("NO. SAY IT AGAIN."); return true; }
      start = Number(m[1]);
      step = m[2] ? Number(m[2]) : 10;
      if (step <= 0 || start > MAX_LINE) { fault("NO. SAY IT AGAIN."); return true; }
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
    if (parsed.error === "name") { fault("NAME IT."); return true; }
    if (parsed.error) { fault("NO. SAY IT AGAIN."); return true; }
    try {
      var index = readIndex();
      localStorage.setItem(sealKey(parsed.name), wasic.listing());
      if (index.indexOf(parsed.name) < 0) index.push(parsed.name);
      localStorage.setItem(INDEX_KEY, JSON.stringify(index));
      writeRaw("SEALED.\n");
    } catch (err) { fault("THE BOX IS SHUT."); }
    return true;
  }

  function doUnseal(rest) {
    var parsed = parseName(rest, true);
    if (parsed.error === "name") { fault("NAME IT."); return true; }
    if (parsed.error) { fault("NO. SAY IT AGAIN."); return true; }
    var text = null;
    if (parsed.shelf) {
      var shelf = globalThis.WITCH_SHELF || {};
      if (!Object.prototype.hasOwnProperty.call(shelf, parsed.name)) { fault("NO. IT IS NOT THERE."); return true; }
      text = shelf[parsed.name];
    } else {
      try { text = localStorage.getItem(sealKey(parsed.name)); }
      catch (err) { fault("THE BOX IS SHUT."); return true; }
      if (text == null) { fault("NO. IT IS NOT THERE."); return true; }
    }
    try {
      wasic.load(text);
      clearMinions();
      writeRaw("UNSEALED.\n");
    } catch (err) { fault(err.message || "NO."); }
    return true;
  }

  function doDownload(rest) {
    var parsed = parseName(rest, false);
    if (parsed.error === "name") { fault("NAME IT."); return true; }
    if (parsed.error) { fault("NO. SAY IT AGAIN."); return true; }
    var text = wasic.listing();
    if (!text) { fault("NOTHING TO RUN."); return true; }
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
      reader.onerror = function () { fault("NO. IT IS NOT THERE."); settle(null); };
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
    var shelf = globalThis.WITCH_SHELF || {};
    writeWords(Object.keys(shelf).sort());
    var sealed = [];
    try { sealed = readIndex(); } catch (err) { sealed = []; }
    if (sealed.length) {
      writeRaw("SEALED:\n");
      writeWords(sealed);
    }
    return true;
  }

  async function handleLine(line, flags) {
    mode = "run";
    updateFooter();
    var stayAuto = false;
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
        }
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
      if (holdPrompt) return;
      if (stayAuto) {
        mode = "auto";
        beginEntry(String(auto.num) + " ");
        updateFooter();
      } else promptReady();
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
        if (hist.length > 32) hist.shift();
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
      if (inkeyQueue.length < 32) inkeyQueue.push(event.key);
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

  async function boot() {
    mode = "boot";
    term.clear();
    term.cursor.col = 0;
    term.cursor.row = 0;
    term.cursorLit = true;
    term.flush();
    updateFooter();
    await sleep(1200);
    term.write("\x1b[2;35m☾\x1b[0m\n\n");
    term.write("\x1b[97mWITCH ][\x1b[0m\n\n");
    term.write("\x1b[2;37mTHE GLASS IS BLACK.\x1b[0m\n\n");
    term.write("\x1b[33m");
    var marks = [111, 222, 333, 444, 555, 666];
    for (var i = 0; i < marks.length; i += 1) {
      term.write("\rMEMORY " + String(marks[i]).padStart(3, "0"));
      await sleep(70);
    }
    term.write("\x1b[0m\n\n");
    term.write("\x1b[37mSHE WOKE UP.\n");
    term.write("THE CIRCLE HOLDS.\n");
    term.write("WASIC SPEAKS.\x1b[0m\n");
    term.write("\x1b[31mBASIC CAN SIT IN THE DARK.\x1b[0m\n\n");
    term.write("\x1b[33m666 LINES FREE.\x1b[0m\n\n");
    term.write("\x1b[0m");
    unlock();
    try { engine.beep(98, 160); } catch (err) {}
    await sleep(200);
    try { engine.beep(146, 260); } catch (err) {}
    await sleep(180);
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
