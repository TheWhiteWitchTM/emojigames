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

  function paintWelcome() {
    term.clear();
    term.color(15, 0);

    // Title
    term.cursor.row = 2;
    term.cursor.col = 8;
    term.write("**** BASIC I ****");

    // Small friendly character
    term.cursor.row = 4;
    term.cursor.col = 16;
    term.write("  ^_^  ");
    term.cursor.row = 5;
    term.cursor.col = 16;
    term.write(" (o o) ");
    term.cursor.row = 6;
    term.cursor.col = 16;
    term.write("  > <  ");

    // Free lines
    term.cursor.row = 8;
    term.cursor.col = 10;
    term.write("512 LINES FREE");

    // READY right under the banner
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
