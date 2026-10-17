---
layout: game
title: "🖥️ BASIC I"
description: A 40-column machine. It speaks BASIC.
image: /games/basic-1/banner.jpg
permalink: /games/basic-1/
tags: [terminal, computer]
---

<style>
  .basic-front {
    width: min(72ch, 100%);
    color: #e8e8e8;
  }
  .basic-front h1 {
    margin: 0.2rem 0 0.6rem;
  }
  .basic-lead {
    margin: 0.4rem 0 0;
    color: #ccc;
  }
  .basic-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin: 1.1rem 0 0.7rem;
  }
  .basic-actions button,
  .basic-actions a.button {
    font: inherit;
    font-size: 1.05rem;
    color: #e8e8e8;
    background: transparent;
    border: 1px solid #3a2a4a;
    border-radius: 8px;
    padding: 0.55rem 0.95rem;
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
  }
  .basic-actions button:hover,
  .basic-actions button:focus-visible,
  .basic-actions button[aria-expanded="true"],
  .basic-actions a.button:hover,
  .basic-actions a.button:focus-visible {
    border-color: #c9a6ff;
    color: #e8d5ff;
    outline: none;
  }
  .basic-actions button.boot {
    border-color: #c9a6ff;
    color: #e8d5ff;
  }
  .basic-hint {
    margin: 0.2rem 0 0.8rem;
    color: #9a9a9a;
  }
  .basic-panel {
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    background: #111;
    padding: 0.3rem 1rem 0.8rem;
    margin: 0.4rem 0 1rem;
  }
  .basic-panel[hidden] { display: none !important; }
  .basic-panel.manual {
    max-height: min(70vh, 680px);
    overflow: auto;
  }
  body.basic-glass-on { overflow: hidden; }
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
  .basic-stage:fullscreen .ee-wrap,
  .basic-stage.basic-open .ee-wrap {
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
    border: 6px solid #4a90e2;
    box-shadow:
      inset 0 0 0 1px #1a1012,
      inset 0 0 40px rgba(74, 144, 226, 0.25);
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
  .basic-mood { white-space: nowrap; }
  .basic-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-left: auto;
  }
  .basic-key {
    font: inherit;
    letter-spacing: .04em;
    font-size: 11px;
    color: #cbbfa6;
    white-space: nowrap;
  }
  .basic-key kbd {
    color: #8d7b68;
    font: inherit;
    letter-spacing: 0;
  }
  .basic-key.lit, .
