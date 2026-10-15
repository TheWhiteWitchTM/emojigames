---
layout: default
title: Rogue
description: A close terminal homage to the 1980 classic. Descend, fight, and find the Amulet.
image: /games/rogue/banner.jpg
permalink: /games/rogue/
tags: [terminal, roguelike]
---

<div id="game">
  <h1>🗡️ Rogue</h1>
  <textarea id="output" readonly rows="24" cols="80"></textarea>
  <div id="status">Level 1  HP 12/12  Str 16  Gold 0</div>
  <p style="color:#39ff14;font-family:monospace;margin-top:0.5rem;">Arrows/WASD move. i inventory. q quaff. r read. &gt; down. &lt; up. R restart.</p>
</div>

<style>
  #game { max-width: 720px; margin: 0 auto; }
  #output {
    width: 100%;
    height: auto;
    min-height: 24em;
    background: #0a140a;
    color: #39ff14;
    border: 1px solid #1a3a1a;
    border-radius: 4px;
    padding: 0.6rem;
    font-family: "Courier New", Courier, monospace;
    font-size: 0.9rem;
    line-height: 1.1;
    resize: none;
    text-shadow: 0 0 4px rgba(57, 255, 20, 0.4);
  }
  #status {
    color: #39ff14;
    font-family: "Courier New", Courier, monospace;
    margin-top: 0.4rem;
    text-shadow: 0 0 4px rgba(57, 255, 20, 0.4);
  }
</style>

<script src="{{ '/games/rogue/rogue.js' | relative_url }}"></script>
