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

  var statusEl = document.createElement("span");
  statusEl.className = "status";
  statusEl.textContent = "READY 0/512";
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

  var basic = null;
  var entry = "";

  function setStatus() {
    var used = basic ? basic.lines.size : 0;
    statusEl.textContent = "READY " + used + "/512";
  }

  function paintWelcome() {
    term.clear();
    term.color(15, 0);
    term.cursor.row = 2;
    term.cursor.col = 8;
    term.write("**** BASIC I ****");
    term.cursor.row = 4;
    term.cursor.col = 16;
    term.write("  ^_^  ");
    term.cursor.row = 5;
    term.cursor.col = 16;
    term.write(" (o o) ");
    term.cursor.row = 6;
    term.cursor.col = 16;
    term.write("  > <  ");
    term.cursor.row = 8;
    term.cursor.col = 10;
    term.write("512 LINES FREE");
    term.cursor.row = 10;
    term.cursor.col = 0;
    term.write("READY.\n");
    term.dirty = true;
    term.flush();
    setStatus();
  }

  function writeReady() {
    term.color(15, 0);
    term.write("READY.\n");
    term.color(7, 0);
    term.flush();
    setStatus();
  }

  function handleLine(raw) {
    if (!basic) return;
    var result = basic.execLine(raw);
    if (result.type === "reset" || result.type === "cls") {
      paintWelcome();
      return;
    }
    if (result.type === "print") {
      term.color(15, 0);
      if (result.text) term.write(result.text + "\n");
      term.color(7, 0);
      writeReady();
      return;
    }
    if (result.type === "error") {
      term.color(9, 0);
      term.write(result.msg + "\n");
      term.color(7, 0);
      writeReady();
      return;
    }
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
    if (!basic && globalThis.BASIC) basic = new globalThis.BASIC();
    paintWelcome();
    document.addEventListener("keydown", onKey, true);
  }

  function leave() {
    document.removeEventListener("keydown", onKey, true);
  }

  window.BASIC = { power: power, leave: leave };
})();
