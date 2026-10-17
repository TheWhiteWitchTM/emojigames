// BASIC I. Black background, white text, forced blue border.
"use strict";
(function () {
  var COLS = 40;
  var ROWS = 24;
  var CW = 18;
  var CH = 24;

  var mount = document.getElementById("game");
  if (!mount || !globalThis.EmojiEngine) {
    if (mount) mount.textContent = "GLASS MISSING";
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
  term.cursorColor = "#ffffff";
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

  var statusEl = document.createElement("span");
  statusEl.className = "status";
  statusEl.textContent = "WAKING 0/512";
  var mood = document.createElement("span");
  mood.className = "basic-mood";
  mood.appendChild(statusEl);

  var TOOLS = [
    { key: "F1", emoji: "📜", label: "LIST" },
    { key: "F2", emoji: "🕯️", label: "RUN" },
    { key: "F3", emoji: "📚", label: "SHELF" },
    { key: "F4", emoji: "🧹", label: "CLS" },
    { key: "F5", emoji: "✨", label: "AUTO" },
    { key: "F7", emoji: "🔒", label: "LATCH" }
  ];
  var bar = document.createElement("div");
  bar.className = "basic-bar";
  TOOLS.forEach(function (t) {
    var span = document.createElement("span");
    span.className = "basic-key";
    span.appendChild(document.createTextNode(t.emoji + " " + t.label + " "));
    var kbd = document.createElement("kbd");
    kbd.textContent = t.key;
    span.appendChild(kbd);
    bar.appendChild(span);
  });
  ui.footer.textContent = "";
  ui.footer.appendChild(mood);
  ui.footer.appendChild(bar);

  var lines = new Map();
  var entry = "";
  var maxLines = 512;

  function setStatus() {
    statusEl.textContent = "READY " + lines.size + "/512";
  }

  function writeAt(row, col, color, text) {
    term.color(color, 0);
    term.cursor.row = row;
    term.cursor.col = col;
    term.write(text);
  }

  function paintWelcome() {
    term.clear();
    term.color(15, 0);

    // Force blue border, one line at a time
    writeAt(4, 2, 12, "┌────────────────────────────────────┐");
    writeAt(5, 2, 12, "│                                    │");
    writeAt(6, 2, 12, "│          **** BASIC I ****         │");
    writeAt(7, 2, 12, "│                                    │");
    writeAt(8, 2, 12, "│          512 LINES FREE            │");
    writeAt(9, 2, 12, "│                                    │");
    writeAt(10, 2, 12, "└────────────────────────────────────┘");

    writeAt(13, 2, 15, "READY.");
    writeAt(15, 2, 11, "Type a command or a numbered line.");

    term.color(7, 0);
    term.dirty = true;
    term.flush();
    setStatus();
    term.cursor.row = 16;
    term.cursor.col = 2;
  }

  function writeReady() {
    term.color(15, 0);
    term.write("READY.\n");
    term.color(7, 0);
    term.flush();
  }

  function doPrint(arg) {
    var text = arg.replace(/^["']|["']$/g, "");
    term.color(15, 0);
    term.write(text + "\n");
    term.color(7, 0);
  }

  function doList() {
    var keys = Array.from(lines.keys()).sort(function (a, b) { return a - b; });
    term.color(11, 0);
    keys.forEach(function (n) {
      term.write(n + " " + lines.get(n) + "\n");
    });
    term.color(7, 0);
  }

  function doReset() {
    lines.clear();
    entry = "";
    paintWelcome();
  }

  function doRun() {
    var keys = Array.from(lines.keys()).sort(function (a, b) { return a - b; });
    term.color(10, 0);
    keys.forEach(function (n) {
      var src = lines.get(n);
      if (/^PRINT\s+/i.test(src)) {
        doPrint(src.replace(/^PRINT\s+/i, ""));
      }
    });
    term.color(7, 0);
    writeReady();
  }

  function handleLine(raw) {
    var line = (raw || "").trim();
    if (!line) { writeReady(); return; }

    var numMatch = line.match(/^(\d+)\s*(.*)$/);
    if (numMatch) {
      var num = parseInt(numMatch[1], 10);
      var rest = numMatch[2];
      if (lines.size >= maxLines && !lines.has(num)) {
        term.color(9, 0);
        term.write("OUT OF MEMORY\n");
        term.color(7, 0);
        writeReady();
        return;
      }
      if (!rest) lines.delete(num);
      else lines.set(num, rest);
      writeReady();
      return;
    }

    var upper = line.toUpperCase();
    if (upper === "LIST") { doList(); writeReady(); return; }
    if (upper === "NEW" || upper === "RESET") { doReset(); return; }
    if (upper === "RUN") { doRun(); return; }
    if (upper === "CLS") { paintWelcome(); return; }
    if (/^PRINT\s+/i.test(line)) { doPrint(line.replace(/^PRINT\s+/i, "")); writeReady(); return; }

    term.color(9, 0);
    term.write("SYNTAX ERROR\n");
    term.color(7, 0);
    writeReady();
  }

  function onKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      var line = entry;
      entry = "";
      term.write("\n");
      handleLine(line);
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      if (entry.length) {
        entry = entry.slice(0, -1);
        term.write("\b \b");
        term.flush();
      }
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      entry += e.key;
      term.write(e.key);
      term.flush();
    }
  }

  function power() {
    paintWelcome();
    document.addEventListener("keydown", onKey, true);
  }

  function leave() {
    document.removeEventListener("keydown", onKey, true);
  }

  window.BASIC = { power: power, leave: leave };
})();
