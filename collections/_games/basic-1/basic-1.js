// BASIC I. Friendly C64-style full-screen boot.
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
  term.cursorColor = "#7cf0ff";
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

  // Footer + function keys
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
  var esc = document.createElement("span");
  esc.className = "basic-key";
  esc.appendChild(document.createTextNode("⎋ BACK "));
  var escK = document.createElement("kbd");
  escK.textContent = "ESC";
  esc.appendChild(escK);
  bar.appendChild(esc);

  ui.footer.textContent = "";
  ui.footer.appendChild(mood);
  ui.footer.appendChild(bar);

  var lines = new Map();
  var entry = "";
  var maxLines = 512;

  function setStatus() {
    statusEl.textContent = "READY " + lines.size + "/512";
  }

  function fillBackground() {
    // Fill entire glass with blue background (color 6 = teal/blue family)
    term.color(15, 6);
    for (var r = 0; r < ROWS; r++) {
      term.write("                                        \n"); // 40 spaces
    }
    term.cursor.row = 0;
    term.cursor.col = 0;
  }

  function paintWelcome() {
    term.clear();
    fillBackground();

    // Simple friendly box art, white/cyan on blue
    term.color(15, 6); // white on blue
    term.cursor.row = 4;
    term.cursor.col = 2;
    term.write("┌────────────────────────────────────┐");

    term.cursor.row = 5;
    term.cursor.col = 2;
    term.write("│                                    │");

    term.cursor.row = 6;
    term.cursor.col = 2;
    term.write("│          **** BASIC I ****         │");

    term.cursor.row = 7;
    term.cursor.col = 2;
    term.write("│                                    │");

    term.cursor.row = 8;
    term.cursor.col = 2;
    term.write("│          512 LINES FREE            │");

    term.cursor.row = 9;
    term.cursor.col = 2;
    term.write("│                                    │");

    term.cursor.row = 10;
    term.cursor.col = 2;
    term.write("└────────────────────────────────────┘");

    term.cursor.row = 13;
    term.cursor.col = 2;
    term.color(14, 6); // cyan on blue
    term.write("READY.");

    term.color(7, 6);
    term.dirty = true;
    term.flush();
    setStatus();
    term.cursorLit = true;
  }

  function writeReady() {
    term.color(14, 6);
    term.write("READY.\n");
    term.color(7, 6);
    term.flush();
  }

  function doPrint(arg) {
    var text = arg.replace(/^["']|["']$/g, "");
    term.color(15, 6);
    term.write(text + "\n");
    term.color(7, 6);
  }

  function doList() {
    var keys = Array.from(lines.keys()).sort(function (a, b) { return a - b; });
    term.color(11, 6);
    keys.forEach(function (n) {
      term.write(n + " " + lines.get(n) + "\n");
    });
    term.color(7, 6);
  }

  function doReset() {
    lines.clear();
    entry = "";
    paintWelcome();
  }

  function doRun() {
    var keys = Array.from(lines.keys()).sort(function (a, b) { return a - b; });
    term.color(10, 6);
    keys.forEach(function (n) {
      var src = lines.get(n);
      if (/^PRINT\s+/i.test(src)) {
        doPrint(src.replace(/^PRINT\s+/i, ""));
      }
    });
    term.color(7, 6);
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
        term.color(9, 6);
        term.write("OUT OF MEMORY\n");
        term.color(7, 6);
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

    term.color(9, 6);
    term.write("SYNTAX ERROR\n");
    term.color(7, 6);
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

  window.BASIC = {
    power: power,
    leave: leave
  };
})();
