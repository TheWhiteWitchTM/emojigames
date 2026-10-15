---
layout: default
title: Galaxy Hunt
description: A retro terminal space combat game. Destroy the raiders before time runs out.
permalink: /games/galaxy-hunt/
image: /games/galaxy-hunt/banner.jpg
---

<div id="game">
  <h1>🚀 Galaxy Hunt</h1>
  <textarea id="output" readonly rows="24" cols="80"></textarea>
  <form id="command-form">
    <input id="command" autocomplete="off" autofocus placeholder="Command (nav, lscan, sscan, beam, missile, help…)">
    <button type="submit">Enter</button>
  </form>
</div>

<style>
  #game {
    max-width: 720px;
    margin: 0 auto;
  }
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
  #command-form {
    margin-top: 0.5rem;
    display: flex;
    gap: 0.5rem;
  }
  #command {
    flex: 1;
    background: #0a140a;
    color: #39ff14;
    border: 1px solid #1a3a1a;
    border-radius: 4px;
    padding: 0.4rem 0.6rem;
    font-family: "Courier New", Courier, monospace;
  }
  button {
    background: #1a3a1a;
    color: #39ff14;
    border: 1px solid #39ff14;
    border-radius: 4px;
    padding: 0.4rem 1rem;
    cursor: pointer;
    font-family: "Courier New", Courier, monospace;
  }
  button:hover {
    background: #39ff14;
    color: #0a140a;
  }
</style>

<script src="{{ '/games/galaxy-hunt/galaxy-hunt.js' | relative_url }}"></script>
