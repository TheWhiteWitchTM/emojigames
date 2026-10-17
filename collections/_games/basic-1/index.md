---
layout: game
title: "🖥️ BASIC I"
description: A 40-column machine. It speaks BASIC.
image: /games/basic-1/banner.jpg
permalink: /games/basic-1/
tags: [terminal, computer]
---

<style>
  .basic-front { width: min(72ch, 100%); color: #e8e8e8; }
  .basic-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; margin: 1.1rem 0; }
  .basic-actions button,
  .basic-actions a.button {
    font: inherit; font-size: 1.05rem; color: #e8e8e8; background: transparent;
    border: 1px solid #3a2a4a; border-radius: 8px; padding: 0.55rem 0.95rem;
    cursor: pointer; text-decoration: none; display: inline-block;
  }
  .basic-actions button.boot { border-color: #c9a6ff; color: #e8d5ff; }
  .basic-hint { color: #9a9a9a; }
  .basic-panel { border: 1px solid #2a2a2a; border-radius: 8px; background: #111; padding: 0.3rem 1rem 0.8rem; margin: 0.4rem 0 1rem; }
  .basic-panel[hidden] { display: none !important; }
  .basic-stage[hidden] { display: none !important; }
  .basic-stage.basic-open,
  .basic-stage:fullscreen {
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
  .basic-stage.basic-open #game,
  .basic-stage:fullscreen #game {
    width: min(100%, calc((100vh - 160px) * 720 / 576));
    width: min(100%, calc((100dvh - 160px) * 720 / 576));
    max-width: 100%;
    max-height: calc(100vh - 48px);
    max-height: calc(100dvh - 48px);
    margin: 0;
  }
  .ee-wrap {
    width: 100% !important;
    max-width: none;
    max-height: 100%;
    background: #0b090a !important;
    color: #cbbfa6 !important;
    border-radius: 12px;
    font-family: ui-monospace, "Courier New", monospace !important;
  }
  .crt {
    position: relative;
    margin: 8px 10px;
    background: #000;
    border-radius: 12px;
    overflow: hidden;
    border: 6px solid #4a90e2;
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
    background: repeating-linear-gradient(to bottom, rgba(0,0,0,.18), rgba(0,0,0,.18) 1px, transparent 2px, transparent 3px);
  }
  .ee-footer {
    color: #8d7b68;
    letter-spacing: .08em;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
  }
  .basic-mood { white-space: nowrap; }
  .basic-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-left: auto; }
  .basic-key { font: inherit; letter-spacing: .04em; font-size: 11px; color: #cbbfa6; white-space: nowrap; }
  .basic-key kbd { color: #8d7b68; font: inherit; }
</style>

<div class="basic-front">
  <h1>🖥️ BASIC I</h1>
  <p>Forty columns, twenty-four rows. It speaks BASIC.</p>

  <div class="basic-actions">
    <button type="button" class="boot" id="basic-boot">🖥️ Boot</button>
    <button type="button" id="basic-started-btn">📖 Getting Started</button>
    <button type="button" id="basic-manual-btn">📜 Manual</button>
    <a class="button" href="{{ '/games/basic-1/learning/' | relative_url }}">📘 Learning</a>
  </div>
  <p class="basic-hint">Boot fills the screen. Escape brings you back here.</p>

  <div id="basic-started" class="basic-panel" hidden>
    {% capture basic_started %}{% include_relative GETTING-STARTED.md %}{% endcapture %}
    {{ basic_started | markdownify }}
  </div>

  <div id="basic-manual" class="basic-panel" hidden>
    {% capture basic_manual %}{% include_relative MANUAL.md %}{% endcapture %}
    {{ basic_manual | markdownify }}
  </div>
</div>

<div id="basic-stage" class="basic-stage" hidden>
  <div id="game"></div>
</div>

<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/games/basic-1/basic.js' | relative_url }}"></script>
<script src="{{ '/games/basic-1/basic-1.js' | relative_url }}"></script>
<script>
(function () {
  var stage = document.getElementById("basic-stage");
  var boot = document.getElementById("basic-boot");
  var startedBtn = document.getElementById("basic-started-btn");
  var manualBtn = document.getElementById("basic-manual-btn");
  var started = document.getElementById("basic-started");
  var manual = document.getElementById("basic-manual");
  var open = false;

  function openStage() {
    open = true;
    stage.hidden = false;
    stage.classList.add("basic-open");
    document.body.classList.add("basic-glass-on");
    if (stage.requestFullscreen) {
      stage.requestFullscreen().catch(function () {});
    }
    if (window.BASIC && BASIC.power) BASIC.power();
  }
  function closeStage() {
    if (!open) return;
    open = false;
    stage.classList.remove("basic-open");
    stage.hidden = true;
    document.body.classList.remove("basic-glass-on");
    if (document.fullscreenElement === stage) {
      document.exitFullscreen().catch(function () {});
    }
    if (window.BASIC && BASIC.leave) BASIC.leave();
  }

  boot.addEventListener("click", openStage);
  startedBtn.addEventListener("click", function () { started.hidden = !started.hidden; });
  manualBtn.addEventListener("click", function () { manual.hidden = !manual.hidden; });

  document.addEventListener("fullscreenchange", function () {
    if (!document.fullscreenElement && open) {
      closeStage();
    }
  });

  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      closeStage();
    }
  }, true);
})();
</script>
