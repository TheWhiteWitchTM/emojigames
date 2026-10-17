---
layout: game
title: "🖥️ BASIC I"
description: A 40-column machine. It speaks BASIC.
image: /games/basic-1/banner.jpg
permalink: /games/basic-1/
tags: [terminal, computer]
---

<style>
  .witch-front {
    width: min(72ch, 100%);
    color: #e8e8e8;
  }
  .witch-front h1 {
    margin: 0.2rem 0 0.6rem;
  }
  .witch-lead {
    margin: 0.4rem 0 0;
    color: #ccc;
  }
  .witch-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin: 1.1rem 0 0.7rem;
  }
  .witch-actions button {
    font: inherit;
    font-size: 1.05rem;
    color: #e8e8e8;
    background: transparent;
    border: 1px solid #3a2a4a;
    border-radius: 8px;
    padding: 0.55rem 0.95rem;
    cursor: pointer;
  }
  .witch-actions button:hover,
  .witch-actions button:focus-visible,
  .witch-actions button[aria-expanded="true"] {
    border-color: #c9a6ff;
    color: #e8d5ff;
    outline: none;
  }
  .witch-actions button.boot {
    border-color: #c9a6ff;
    color: #e8d5ff;
  }
  .witch-hint {
    margin: 0.2rem 0 0.8rem;
    color: #9a9a9a;
  }
  .witch-panel {
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    background: #111;
    padding: 0.3rem 1rem 0.8rem;
    margin: 0.4rem 0 1rem;
  }
  .witch-panel[hidden] { display: none !important; }
  .witch-panel.manual {
    max-height: min(70vh, 680px);
    overflow: auto;
  }
  body.witch-glass-on { overflow: hidden; }
  .witch-stage[hidden] { display: none !important; }
  .witch-stage.witch-open,
  .witch-stage:fullscreen {
    display: flex !important;
    position: fixed;
    inset: 0;
    z-index: 400;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 12px;
    box-sizing: border-box;
    background: #050305;
    align-items: center;
    justify-content: center;
  }
  .witch-stage.witch-open #game,
  .witch-stage:fullscreen #game {
    width: min(100%, calc((100vh - 128px) * 720 / 576));
    width: min(100%, calc((100dvh - 128px) * 720 / 576));
    max-width: 100%;
    margin: 0;
  }
  .ee-wrap {
    width: 100% !important;
    max-width: none;
    background: #0b090a !important;
    color: #cbbfa6 !important;
    border-radius: 18px;
    box-shadow: 0 22px 60px rgba(0, 0, 0, .6);
    font-family: ui-monospace, "Courier New", monospace !important;
  }
  .witch-stage:fullscreen .ee-wrap,
  .witch-stage.witch-open .ee-wrap {
    border-radius: 12px;
  }
  .ee-header { border-bottom: 1px solid #2a211c; }
  .ee-title { letter-spacing: .22em; color: #d7c7a2; font-weight: 500; }
  .ee-wrap, .ee-wrap * { cursor: none !important; }
  .ee-wrap { user-select: none; }
  .crt {
    position: relative;
    margin: 8px 10px;
    background: #000;
    border-radius: 12px;
    overflow: hidden;
    box-shadow:
      inset 0 0 0 1px #1a1012,
      inset 0 0 80px rgba(36, 0, 12, .55);
  }
  .crt canvas {
    display: block;
    width: 100%;
    height: auto;
    background: #000;
  }
  .scan {
    pointer-events: none;
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      to bottom,
      rgba(0, 0, 0, .18),
      rgba(0, 0, 0, .18) 1px,
      transparent 2px,
      transparent 3px
    );
    mix-blend-mode: multiply;
  }
  .ee-footer {
    color: #8d7b68;
    letter-spacing: .08em;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
  }
  .witch-mood { white-space: nowrap; }
  .witch-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
  .witch-key {
    font: inherit;
    letter-spacing: .04em;
    font-size: 11px;
    color: #cbbfa6;
    white-space: nowrap;
  }
  .witch-key kbd {
    color: #8d7b68;
    font: inherit;
    letter-spacing: 0;
  }
  .witch-key.lit, .witch-key.lit kbd { color: #e2b657; }
  .witch-key.quiet { opacity: .38; }
  .led { color: #7a2e24; text-shadow: 0 0 8px rgba(122, 46, 36, .7); }
</style>

<div class="witch-front markdown-body">
  <h1>🖥️ BASIC I</h1>
  <p class="witch-lead">Forty columns, twenty-four rows. It speaks BASIC.</p>

  <div class="witch-actions">
    <button type="button" class="boot" id="witch-boot">🖥️ Boot</button>
    <button type="button" id="witch-started-btn" aria-expanded="false" aria-controls="witch-started">📖 Getting Started</button>
    <button type="button" id="witch-manual-btn" aria-expanded="false" aria-controls="witch-manual">📜 Manual</button>
  </div>
  <p class="witch-hint">Boot fills the screen. Escape brings you back here. The lines stay.</p>

  <div id="witch-started" class="witch-panel" hidden>
    <h2>📖 Getting Started</h2>
    <p>The prompt is <strong>READY</strong>. A line with a number is stored. A line without one runs now.</p>
    <ul>
      <li>📚 <code>SHELF</code> opens the box. The arrows move. Enter takes a program down and does not run it.</li>
      <li>🕯️ <code>RUN</code> starts at the top. 📜 <code>LIST</code> shows the lines.</li>
      <li>🧹 <code>SCRUB</code> clears the glass. ✨ <code>MAGIC</code> numbers the next lines.</li>
      <li>✋ Ctrl-C stops a program that will not stop.</li>
    </ul>
    <p>Try <code>SHELF</code>, point at <code>HELLO-WITCH</code>, press Enter, then <code>RUN</code>. <code>HELLO-DEMON</code> is the other hello. <code>ANSI-WITCH</code> paints her.</p>
    <p>Under the glass, the keys are an emoji, a word, and a function key. Nothing there is a button.</p>
    <ul>
      <li>📜 LIST F1</li>
      <li>🕯️ RUN F2</li>
      <li>📚 SHELF F3</li>
      <li>🧹 SCRUB F4</li>
      <li>✨ MAGIC F5</li>
      <li>🌑 EXORCISE F6</li>
      <li>🔒 LATCH F7</li>
      <li>⛶ FULL F11</li>
      <li>⎋ BACK ESC</li>
    </ul>
    <p>She wakes latched. Up walks the lines that rolled off the glass. The walls are in <a href="{{ '/SYSTEM.md' | relative_url }}">SYSTEM.md</a>.</p>
  </div>

  <div id="witch-manual" class="witch-panel manual markdown-body" hidden>
    {% capture witch_manual %}{% include_relative MANUAL.md %}{% endcapture %}
    {{ witch_manual | markdownify }}
  </div>
</div>

<div id="witch-stage" class="witch-stage" hidden>
  <div id="game" data-shelf="{{ '/games/basic-1/shelf/' | relative_url }}" data-witch="{{ '/assets/images/site.jpg' | relative_url }}"></div>
</div>

<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/games/basic-1/interpreter.js' | relative_url }}"></script>
<script src="{{ '/games/basic-1/basic-1.js' | relative_url }}"></script>
<script>
(function () {
  var stage = document.getElementById("witch-stage");
  var boot = document.getElementById("witch-boot");
  var startedBtn = document.getElementById("witch-started-btn");
  var manualBtn = document.getElementById("witch-manual-btn");
  var started = document.getElementById("witch-started");
  var manual = document.getElementById("witch-manual");
  var open = false;
  var inFull = false;

  function togglePanel(btn, panel, otherBtn, other) {
    var show = btn.getAttribute("aria-expanded") !== "true";
    btn.setAttribute("aria-expanded", show ? "true" : "false");
    panel.hidden = !show;
    if (show) {
      otherBtn.setAttribute("aria-expanded", "false");
      other.hidden = true;
      panel.scrollIntoView({ block: "nearest" });
    }
  }

  function closeStage() {
    if (!open) return;
    open = false;
    stage.classList.remove("witch-open");
    stage.hidden = true;
    document.body.classList.remove("witch-glass-on");
    if (document.fullscreenElement) {
      Promise.resolve(document.exitFullscreen()).catch(function () {});
    }
    if (window.WITCH && WITCH.leave) WITCH.leave();
    boot.focus();
  }

  function openStage() {
    open = true;
    stage.hidden = false;
    stage.classList.add("witch-open");
    document.body.classList.add("witch-glass-on");
    var root = stage;
    var pending = root.requestFullscreen ? root.requestFullscreen() : Promise.reject();
    Promise.resolve(pending).catch(function () {});
    if (window.WITCH && WITCH.power) WITCH.power();
  }

  boot.addEventListener("click", openStage);
  startedBtn.addEventListener("click", function () {
    togglePanel(startedBtn, started, manualBtn, manual);
  });
  manualBtn.addEventListener("click", function () {
    togglePanel(manualBtn, manual, startedBtn, started);
  });

  document.addEventListener("fullscreenchange", function () {
    if (document.fullscreenElement) {
      inFull = true;
      return;
    }
    if (!inFull) return;
    inFull = false;
    if (!open) return;
    closeStage();
  });

  window.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || !open) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeStage();
  }, true);
})();
</script>
