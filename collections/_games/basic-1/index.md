---
layout: game
title: "🖥️ Basic I"
description: A small computer for learning BASIC. Forty columns, 512 lines, lessons built in.
image: /games/basic-1/banner.jpg
permalink: /games/basic-1/
tags: [terminal, computer]
stage_aspect: 1.25
game_modules: /games/basic-1/modules/
---

<style>
  .witch-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin: 0.2rem 0 0.7rem;
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
  .ee-wrap {
    width: 100% !important;
    max-width: none;
    background: #0b090a !important;
    color: #cbbfa6 !important;
    border-radius: 12px;
    box-shadow: 0 22px 60px rgba(0, 0, 0, .6);
    font-family: ui-monospace, "Courier New", monospace !important;
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

<div class="witch-actions">
  <button type="button" id="witch-started-btn" aria-expanded="false" aria-controls="witch-started">📖 Getting Started</button>
  <button type="button" id="witch-tutorial-btn" aria-expanded="false" aria-controls="witch-tutorial">✏️ Tutorial</button>
  <button type="button" id="witch-manual-btn" aria-expanded="false" aria-controls="witch-manual">📘 Manual</button>
</div>

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

<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/games/basic-1/interpreter.js' | relative_url }}"></script>
<script src="{{ '/games/basic-1/basic-1.js' | relative_url }}"></script>
<script>
(function () {
  var startedBtn = document.getElementById("witch-started-btn");
  var tutorialBtn = document.getElementById("witch-tutorial-btn");
  var manualBtn = document.getElementById("witch-manual-btn");
  var started = document.getElementById("witch-started");
  var tutorial = document.getElementById("witch-tutorial");
  var manual = document.getElementById("witch-manual");
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

  startedBtn.addEventListener("click", function () { togglePanel(docs[0]); });
  tutorialBtn.addEventListener("click", function () { togglePanel(docs[1]); });
  manualBtn.addEventListener("click", function () { togglePanel(docs[2]); });
})();
</script>
