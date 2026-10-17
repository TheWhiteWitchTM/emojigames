// BASIC I. A 40-column machine. The language is BASIC.
"use strict";
(function () {
  var COLS = 40;
  var ROWS = 24;
  var CW = 18;
  var CH = 24;
  var BACK_MAX = 512;
  var INDEX_KEY = "emojigames-basic1-seals";

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

  var led = document.createElement("span");
  led.className = "led";
  led.textContent = "● ";
  var statusEl = document.createElement("span");
  statusEl.className = "status";
  var mood = document.createElement("span");
  mood.className = "basic-mood";
  mood.append(led, statusEl);

  var TOOLS = [
    { act: "list", key: "F1", emoji: "📜", label: "LIST" },
    { act: "run", key: "F2", emoji: "🕯️", label: "RUN" },
    { act: "shelf", key: "F3", emoji: "📚", label: "SHELF" },
    { act: "cls", key: "F4", emoji: "🧹", label: "CLS" },
    { act: "auto", key: "F5", emoji: "✨", label: "AUTO" },
    { act: "latch", key: "F7", emoji: "🔒", label: "LATCH" }
  ];
  var bar = document.createElement("div");
  bar.className = "basic-bar";
  TOOLS.forEach(function (spec) {
    var hint = document.createElement("span");
    hint.className = "basic-key";
    hint.append(document.createTextNode(spec.emoji + " " + spec.label + " "));
    var kbd = document.createElement("kbd");
    kbd.textContent = spec.key;
    hint.append(kbd);
    bar.append(hint);
  });
  ui.footer.textContent = "";
  ui.footer.append(mood, bar);

  var mode = "boot";
  var basic = null;
  var entry = "";
  var caret = 0;

  function updateFooter() {
    var used = basic ? basic.lines.size : 0;
    var state = mode === "boot" ? "WAKING" : "READY";
    statusEl.textContent = state + " " + used + "/512";
  }

  function writeLine(text, color) {
    if (color != null) term.color(color, 0);
    term.write(text + "\n");
    term.color(7, 0);
  }

  function bootScreen() {
    term.clear();
    term.color(15, 0);
    writeLine("**** BASIC I ****");
    term.color(11, 0);
    writeLine("512 LINES FREE");
    term.write("\n");
    term.color(15, 0);
    writeLine("READY.");
    mode = "ready";
    entry = "";
    caret = 0;
    updateFooter();
    term.cursorLit = true;
    term.dirty = true;
    term.flush();
  }

  function handleKey(e) {
    if (mode !== "ready") return;
    if (e.key === "Enter") {
      e.preventDefault();
      var line = entry.trim();
      entry = "";
      caret = 0;
      term.write("\n");
      if (line) {
        // Basic command handling can be expanded here.
        // For now echo and return to READY so the prompt is live.
        term.color(10, 0);
        term.write("> " + line + "\n");
        term.color(15, 0);
        term.write("READY.\n");
      } else {
        term.write("READY.\n");
      }
      updateFooter();
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

  function start() {
    if (!basic && globalThis.BASIC) basic = new globalThis.BASIC();
    bootScreen();
    document.addEventListener("keydown", handleKey);
  }

  function stop() {
    document.removeEventListener("keydown", handleKey);
  }

  window.BASIC = {
    power: start,
    leave: stop
  };

  // Auto-start if the stage is already open
  if (document.getElementById("basic-stage") && !document.getElementById("basic-stage").hidden) {
    start();
  }
})();
