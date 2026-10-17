"use strict";
(function () {
  var mount = document.getElementById("game");
  if (!mount) return;

  if (!window.EmojiEngine) {
    mount.textContent = "EMOJI ENGINE MISSING";
    return;
  }

  var E = window.EmojiEngine;
  var canvas = new E.Canvas({ width: 720, height: 576 });
  var term = new E.Terminal({
    cols: 40,
    rows: 24,
    cellWidth: 18,
    cellHeight: 24,
    canvas: canvas
  });
  term.cursorColor = "#ffffff";
  term.cursorLit = true;

  var ui = E.Utilities.wrap(term, { title: "BASIC I", footer: true });
  // Force the wrapped terminal into the mount point
  mount.innerHTML = "";
  mount.appendChild(ui.wrap);

  var basic = null;
  var entry = "";

  function paint() {
    try {
      term.clear();
      term.color(15, 0);
      term.write("**** BASIC I ****\n");
      term.write("512 LINES FREE\n\n");
      term.write("READY.\n");
      term.flush();
    } catch (err) {
      mount.textContent = "DRAW ERROR: " + err.message;
    }
  }

  function ready() {
    term.color(15, 0);
    term.write("READY.\n");
    term.flush();
  }

  function handle(line) {
    if (!basic) {
      term.write("(no interpreter)\n");
      ready();
      return;
    }
    var r = basic.execLine(line);
    if (r.type === "reset" || r.type === "cls") { paint(); return; }
    if (r.type === "print") {
      if (r.text) term.write(r.text + "\n");
      ready();
      return;
    }
    if (r.type === "error") {
      term.color(9, 0);
      term.write(r.msg + "\n");
      ready();
      return;
    }
    ready();
  }

  function onKey(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      var l = entry;
      entry = "";
      term.write("\n");
      handle(l);
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      if (entry) {
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
      if (!basic && window.BASIC) {
        try { basic = new window.BASIC(); } catch (e) {}
      }
      paint();
      document.addEventListener("keydown", onKey, true);
    },
    leave: function () {
      document.removeEventListener("keydown", onKey, true);
    }
  };
})();
