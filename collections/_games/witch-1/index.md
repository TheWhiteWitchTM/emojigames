---
layout: game
title: "🖥️ Witch I"
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
    background: #0b090a !important;
    color: #cbbfa6 !important;
    border-radius: 18px;
    box-shadow: 0 22px 60px rgba(0, 0, 0, .6);
    font-family: ui-monospace, "Courier New", monospace !important;
  }
  .ee-header { border-bottom: 1px solid #2a211c; }
  .ee-title { letter-spacing: .22em; color: #d7c7a2; font-weight: 500; }
  .ee-fullscreen {
    color: #cbbfa6 !important;
    border-color: #4a3b32 !important;
  }
  .crt {
    position: relative;
    margin: 10px;
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
  .ee-footer { color: #8d7b68; letter-spacing: .08em; }
  .led { color: #7a2e24; text-shadow: 0 0 8px rgba(122, 46, 36, .7); }
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

<div id="game" data-shelf="{{ '/games/witch-1/shelf/' | relative_url }}" data-witch="{{ '/assets/images/site.jpg' | relative_url }}"></div>

Forty columns, twenty-four rows. The glass is black. She speaks WASIC.

When she wakes, the white witch from the banner stands in the glass. The count climbs to 666. Then she steps back, the words roll to the top, and the glass says SPEAK.

A line with a number is stored. A line without one runs now. That is the C64 way, and she kept it. `RUN` starts at the top. The programs live in `shelf/`, and the names end in `.wasic`. `SHELF` lists them. `UNSEAL "shelf:HELLO-WITCH"` takes the hello down and leaves it sitting there. `HELLO-DEMON` is the other one. `GRIMOIRE` prints the words she will hear. `HELP` gets you the same list and a small lecture. `LIST` is REVEAL, and she will say so. PEEK, POKE, and SYS sit in a line if you type them. When she reaches them she complains, in red, with a mark, and the glass rings. She does not answer to READY. When the glass says SPEAK, the turn is yours.

Escape ends a working that will not end. Ctrl-C does too, if you were raised on the other machines. The pale bar blinks from the moment the glass is dark, before she bothers to introduce herself.

Click the glass once if the two notes stay buried. They are low, a fifth apart. The browser holds sound until a hand arrives. A refusal is two notes going down.

The walls are written in [SYSTEM.md]({{ '/SYSTEM.md' | relative_url }}). She keeps them.

<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/games/witch-1/wasic.js' | relative_url }}"></script>
<script src="{{ '/games/witch-1/witch-1.js' | relative_url }}"></script>
