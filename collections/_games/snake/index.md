---
layout: default
title: Snake
description: Classic terminal Snake. Eat, grow, don’t crash.
image: /games/snake/banner.jpg
permalink: /games/snake/
tags: [terminal, action]


---

<div id="game">
  <h1>🐍 Snake</h1>
  <textarea id="output" readonly rows="24" cols="80"></textarea>
  <div id="status">Score: 0</div>
  <p style="color:#39ff14;font-family:monospace;margin-top:0.5rem;">Arrow keys or WASD to move. R to restart.</p>
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
    font-size: 0.95rem;
    line-height: 1.15;
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

<script src="{{ '/games/snake/snake.js' | relative_url }}"></script>
