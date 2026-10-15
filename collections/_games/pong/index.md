---
layout: default
title: 🏓Pong
description: Classic terminal Pong. First to 5 wins.
image: /games/pong/banner.jpg
permalink: /games/pong/
tags: [terminal, action]


---

<div id="game">
  <h1> Pong</h1>
  <textarea id="output" readonly rows="24" cols="80"></textarea>
  <div id="status">Player: 0  Computer: 0</div>
  <p style="color:#39ff14;font-family:monospace;margin-top:0.5rem;">W/S or ↑/↓ to move. R to restart.</p>
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

<script src="{{ '/games/pong/pong.js' | relative_url }}"></script>
