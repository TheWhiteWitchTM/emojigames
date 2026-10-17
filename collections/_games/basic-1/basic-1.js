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
  var term = new E.Terminal({ cols: 40, rows: 24, cellWidth: 18, cellHeight: 24, canvas: canvas });
  term.cursorColor = "#ffffff";
  term.cursorLit = true;
  var ui = E.Utilities.wrap(term, { title: "BASIC I", footer: true });

  var crt = document.createElement("div");
  crt.className = "crt";
  crt.appendChild(term.canvas.element);
  ui.wrap.insertBefore(crt, ui.wrap.firstChild);
  mount.innerHTML = "";
  mount.appendChild(ui.wrap);

  var basic = null;
  var entry = "";

  function paint() {
    term.clear();
    term.color(15, 0);
    term.write("**** BASIC I ****\n512 LINES FREE\n\nREADY.\n");
    term.flush();
  }
  function ready() {
    term.color(15, 0);
    term.write("READY.\n");
    term.flush();
  }
  function handle(line) {
    if (!basic) {
      term.color(9, 0);
      term.write("INTERPRETER NOT LOADED\n");
      ready();
      return;
    }
    var r = basic.execLine(line);
    if (r.type === "reset" || r.type === "cls") { paint(); return; }
    if (r.type === "print") {
      term.color(15, 0);
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
      if (entry) { entry = entry.slice(0, -1); term.write("\b \b"); term.flush(); }
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
      if (!basic && window.BasicInterpreter) basic = new window.BasicInterpreter();
      paint();
      document.addEventListener("keydown", onKey, true);
    },
    leave: function () {
      document.removeEventListener("keydown", onKey, true);
    }
  };
})();
