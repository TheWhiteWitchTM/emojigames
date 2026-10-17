"use strict";
(function () {
  var mount = document.getElementById("game");
  if (!mount || !globalThis.EmojiEngine) {
    if (mount) mount.textContent = "NO ENGINE";
    return;
  }

  var E = globalThis.EmojiEngine;
  var canvas = new E.Canvas({ width: 720, height: 576 });
  var term = new E.Terminal({ cols: 40, rows: 24, cellWidth: 18, cellHeight: 24, canvas: canvas });
  term.cursorColor = "#ffffff";
  term.cursorLit = true;

  var ui = E.Utilities.wrap(term, { title: "BASIC I", footer: true });
  var crt = document.createElement("div");
  crt.className = "crt";
  crt.appendChild(term.canvas.element);
  ui.wrap.insertBefore(crt, term.canvas.element);
  mount.appendChild(ui.wrap);

  var entry = "";

  function show() {
    term.clear();
    term.color(15, 0);
    term.write("**** BASIC I ****\n");
    term.write("512 LINES FREE\n\n");
    term.write("READY.\n");
    term.flush();
  }

  function onKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      term.write("\n> " + entry + "\nREADY.\n");
      entry = "";
      term.flush();
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
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      entry += e.key;
      term.write(e.key);
      term.flush();
    }
  }

  window.BASIC = {
    power: function () {
      show();
      document.addEventListener("keydown", onKey, true);
    },
    leave: function () {
      document.removeEventListener("keydown", onKey, true);
    }
  };
})();
