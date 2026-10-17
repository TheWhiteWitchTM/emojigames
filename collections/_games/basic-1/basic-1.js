"use strict";
(function () {
  var mount = document.getElementById("game");
  if (!mount || !globalThis.EmojiEngine) { if (mount) mount.textContent = "NO ENGINE"; return; }

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

  var statusEl = document.createElement("span");
  statusEl.textContent = "READY 0/512";
  ui.footer.appendChild(statusEl);

  var basic = null;
  var entry = "";

  function setStatus() {
    statusEl.textContent = "READY " + (basic ? basic.lines.size : 0) + "/512";
  }

  function paintWelcome() {
    term.clear();
    term.color(15, 0);
    term.write("**** BASIC I ****\n512 LINES FREE\n\nREADY.\n");
    term.flush();
    setStatus();
  }

  function writeReady() {
    term.color(15, 0);
    term.write("READY.\n");
    term.flush();
    setStatus();
  }

  function handleLine(raw) {
    if (!basic) return;
    var r = basic.execLine(raw);
    if (r.type === "reset" || r.type === "cls") { paintWelcome(); return; }
    if (r.type === "print") {
      term.color(15, 0);
      if (r.text) term.write(r.text + "\n");
      writeReady();
      return;
    }
    if (r.type === "error") {
      term.color(9, 0);
      term.write(r.msg + "\n");
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
      if (entry.length) { entry = entry.slice(0, -1); term.write("\b \b"); term.flush(); }
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
      if (!basic && globalThis.BASIC) basic = new globalThis.BASIC();
      paintWelcome();
      document.addEventListener("keydown", onKey, true);
    },
    leave: function () {
      document.removeEventListener("keydown", onKey, true);
    }
  };
})();
