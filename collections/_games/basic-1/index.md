---
layout: game
title: "🖥️ Basic I"
description: A small computer for learning BASIC. Forty columns, 512 lines, lessons built in.
image: /games/basic-1/banner.jpg
permalink: /games/basic-1/
tags: [terminal, computer]
desk: false
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
    border: 1px solid #24564c;
    border-radius: 8px;
    padding: 0.55rem 0.95rem;
    cursor: pointer;
  }
  .witch-actions button:hover,
  .witch-actions button:focus-visible,
  .witch-actions button[aria-expanded="true"] {
    border-color: #7ec8b8;
    color: #e7fff6;
    outline: none;
  }
  .witch-actions button.boot {
    border-color: #7ec8b8;
    color: #e7fff6;
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
      inset 0 0 80px rgba(0, 40, 28, .45);
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
  <h1>🖥️ Basic I</h1>
  <p class="witch-lead">A small computer for kids, retro fans, and anyone learning BASIC. Forty columns. 512 lines. The lessons are built in.</p>

  <div class="witch-actions">
    <button type="button" class="boot" id="witch-boot">🖥️ Boot</button>
    <button type="button" id="witch-started-btn" aria-expanded="false" aria-controls="witch-started">📖 Getting Started</button>
    <button type="button" id="witch-tutorial-btn" aria-expanded="false" aria-controls="witch-tutorial">✏️ Tutorial</button>
    <button type="button" id="witch-manual-btn" aria-expanded="false" aria-controls="witch-manual">📘 Manual</button>
  </div>
  <p class="witch-hint">Boot fills the screen. Escape brings you back here. Your lines stay. Start with Getting Started, then the tutorial.</p>

  <div id="witch-started" class="witch-panel manual markdown-body" hidden>
    {% capture started_doc %}{% include_relative GETTING-STARTED.md %}{% endcapture %}
    {{ started_doc | markdownify }}
  </div>

  <div id="witch-tutorial" class="witch-panel manual markdown-body" hidden>
    {% capture tutorial_doc %}{% include_relative TUTORIAL.md %}{% endcapture %}
    {{ tutorial_doc | markdownify }}
  </div>

  <div id="witch-manual" class="witch-panel manual markdown-body" hidden>
    {% capture manual_doc %}{% include_relative MANUAL.md %}{% endcapture %}
    {{ manual_doc | markdownify }}
  </div>
</div>

<div id="witch-stage" class="witch-stage" hidden>
  <div id="game" data-modules="{{ '/games/basic-1/modules/' | relative_url }}"></div>
</div>

<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/games/basic-1/interpreter.js' | relative_url }}"></script>
<script src="{{ '/games/basic-1/basic-1.js' | relative_url }}"></script>
<script>
(function () {
  var stage = document.getElementById("witch-stage");
  var boot = document.getElementById("witch-boot");
  var startedBtn = document.getElementById("witch-started-btn");
  var tutorialBtn = document.getElementById("witch-tutorial-btn");
  var manualBtn = document.getElementById("witch-manual-btn");
  var started = document.getElementById("witch-started");
  var tutorial = document.getElementById("witch-tutorial");
  var manual = document.getElementById("witch-manual");
  var open = false;
  var inFull = false;
  var docs = [
    { btn: startedBtn, panel: started },
    { btn: tutorialBtn, panel: tutorial },
    { btn: manualBtn, panel: manual }
  ];

  function togglePanel(which) {
    docs.forEach(function (item) {
      var show = item === which && item.btn.getAttribute("aria-expanded") !== "true";
      item.btn.setAttribute("aria-expanded", show ? "true" : "false");
      item.panel.hidden = !show;
      if (show) item.panel.scrollIntoView({ block: "nearest" });
    });
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
    if (window.BASIC && BASIC.leave) BASIC.leave();
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
    if (window.BASIC && BASIC.power) BASIC.power();
  }

  boot.addEventListener("click", openStage);
  startedBtn.addEventListener("click", function () { togglePanel(docs[0]); });
  tutorialBtn.addEventListener("click", function () { togglePanel(docs[1]); });
  manualBtn.addEventListener("click", function () { togglePanel(docs[2]); });

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
