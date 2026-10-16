---
layout: game
title: "🖥️ Witch ]["
description: A 40-column machine. It speaks WASIC.
image: /games/witch-1/banner.jpg
permalink: /games/witch-1/
tags: [terminal, computer]
---

<style>
  #game { width: min(100%, 820px); }
  .ee-wrap {
    width: 100% !important;
    max-width: 820px;
    background: #1a1714 !important;
    color: #d7ccb2 !important;
    border-radius: 18px;
    box-shadow: 0 18px 50px rgba(0, 0, 0, .45);
    font-family: ui-monospace, "Courier New", monospace !important;
  }
  .ee-header { border-bottom: 1px solid #3a332c; }
  .ee-title { letter-spacing: .14em; color: #c8e6b0; }
  .ee-fullscreen {
    color: #d7ccb2 !important;
    border-color: #5c5348 !important;
  }
  .crt {
    position: relative;
    margin: 10px;
    background: #000;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: inset 0 0 0 2px #0c140c, inset 0 0 40px rgba(40, 80, 30, .25);
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
      rgba(0, 0, 0, .12),
      rgba(0, 0, 0, .12) 1px,
      transparent 2px,
      transparent 4px
    );
    mix-blend-mode: multiply;
  }
  .ee-footer { color: #9d8; }
  .led { color: #39ff14; text-shadow: 0 0 6px #39ff14; }
  .ee-wrap:fullscreen {
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    border-radius: 0;
    justify-content: center;
  }
  .ee-wrap:fullscreen .crt {
    width: min(100%, calc(100vh * 720 / 640));
    margin: 0 auto;
  }
</style>

<div id="game"></div>

A 40-column machine. It speaks WASIC.

Type a line number, then the words. `RUN` starts at the top. `SHELF` lists the programs in the box. `UNSEAL "shelf:GUESS"` loads one. `GRIMOIRE` prints the words she accepts. Escape stops a running program.

Click the glass if the sound stays quiet.

<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/games/witch-1/wasic.js' | relative_url }}"></script>
<script src="{{ '/games/witch-1/shelf.js' | relative_url }}"></script>
<script src="{{ '/games/witch-1/witch-1.js' | relative_url }}"></script>
