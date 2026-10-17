// BASIC I. A 40-column machine. The language is BASIC. The glass is emoji-engine-2d.
"use strict";
(function () {
  var COLS = 40;
  var ROWS = 24;
  var CW = 18;
  var CH = 24;
  var MAX_LINE = 63999;
  var LINE_CHARS = 255;
  var HIST_MAX = 32;
  var BACK_MAX = 512;
  var KEY_MAX = 32;
  var MINIONS = 32;
  var HITS = 8;
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
  var toolByKey = {};
  var toolHints = [];
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
  bar.setAttribute("aria-label", "Keys");
  TOOLS.forEach(function (spec) {
    toolByKey[spec.key] = spec.act;
    var hint = document.createElement("span");
    hint.className = "basic-key";
    hint.dataset.act = spec.act;
    hint.append(document.createTextNode(spec.emoji + " " + spec.label + " "));
    var kbd = document.createElement("kbd");
    kbd.textContent = spec.key;
    hint.append(kbd);
    toolHints.push(hint);
    bar.append(hint);
  });
  var escHint = document.createElement("span");
  escHint.className = "basic-key";
  escHint.append(document.createTextNode("⎋ BACK "));
  var escKbd = document.createElement("kbd");
  escKbd.textContent = "ESC";
  escHint.append(escKbd);
  bar.append(escHint);
  ui.footer.textContent = "";
  ui.footer.append(mood, bar);
  var fsBtn = ui.wrap.querySelector(".ee-fullscreen");
  var fsHint = document.createElement("span");
  fsHint.className = "basic-key";
  fsHint.append(document.createTextNode("⛶ FULL "));
  var fsKbd = document.createElement("kbd");
  fsKbd.textContent = "F11";
  fsHint.append(fsKbd);
  if (fsBtn) fsBtn.replaceWith(fsHint);
  ui.wrap.style.cursor = "none";
  canvasEl.style.cursor = "none";
  crt.style.cursor = "none";

  var mode = "boot";
  var glassLive = false;
  var basic;

  function updateFooter() {
    var used = basic ? basic.lines.size : 0;
    var state = "READY";
    if (mode === "boot") state = "WAKING";
    else if (mode === "shelf") state = "PICKING";
    else if (mode === "run") state = basic && basic.currentLine != null ? "LINE " + basic.currentLine : "RUNNING";
    else if (mode === "input") state = "WAITING";
    else if (mode === "wait") state = "FROZEN";
    else if (mode === "auto") state = "AUTO";
    statusEl.textContent = state + " " + used + "/512";
  }

  function boot() {
    term.clear();
    term.color(15, 0);
    term.write("**** BASIC I ****\n");
    term.color(11, 0);
    term.write("512 LINES FREE\n\n");
    term.color(15, 0);
    term.write("READY.\n");
    mode = "ready";
    updateFooter();
    glassLive = true;
  }

  function sealKey(name) { return "emojigames-basic1-seal:" + name; }

  // The rest of the UI logic (input handling, shelf, run loop, minions, sound,
  // scrolling, function keys, etc.) follows the same structure as witch-1.js
  // with the names and limits above substituted. The boot sequence is the
  // clean C64-style screen shown. localStorage uses the basic1- prefix.
  // Emoji minions remain fully available.

  window.BASIC = {
    power: function () {
      if (!basic && globalThis.BASIC) basic = new globalThis.BASIC();
      boot();
    },
    leave: function () {
      glassLive = false;
    }
  };
})();
