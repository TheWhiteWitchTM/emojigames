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

  // Footer: status + quick keys
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
    term.cursor.col = 2;
    term.write("READY.");

    term.dirty = true;
    term.flush();
    term.cursor.row = 11;
    term.cursor.col = 2;
  }

  function power() {
    paintWelcome();
  }

  function leave() {}

  window.BASIC = { power: power, leave: leave };
})();
