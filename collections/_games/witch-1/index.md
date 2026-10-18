---
layout: game
title: "🖥️ Witch I"
description: A 40-column machine. It speaks WASIC.
image: /games/witch-1/banner.jpg
permalink: /games/witch-1/
tags: [terminal, computer]
stage_aspect: 1.25
game_shelf: /games/witch-1/shelf/
game_witch: /assets/images/site.jpg
boot: true
machine: witch
docs:
  - id: game-started
    label: "📖 Getting Started"
---

<div id="game-started" class="doc-panel" hidden>
  <h2>📖 Getting Started</h2>
  <p>The prompt is <strong>SPEAK</strong>. A line with a number is stored. A line without one runs now.</p>
  <ul>
    <li>📚 <code>SHELF</code> opens the box. The arrows move. Enter takes a program down and does not run it.</li>
    <li>🕯️ <code>RUN</code> starts at the top. 📜 <code>LIST</code> shows the lines.</li>
    <li>🧹 <code>SCRUB</code> clears the glass. ✨ <code>MAGIC</code> numbers the next lines.</li>
    <li>✋ Ctrl-C stops a program that will not stop.</li>
  </ul>
  <p>Try <code>SHELF</code>, point at <code>HELLO-WITCH</code>, press Enter, then <code>RUN</code>. <code>HELLO-DEMON</code> is the other hello. <code>ANSI-WITCH</code> paints her.</p>
  <p>Under the glass, the keys are an emoji, a word, and a function key. Nothing there is a button.</p>
  <ul>
    <li>📜 LIST F1</li>
    <li>🕯️ RUN F2</li>
    <li>📚 SHELF F3</li>
    <li>🧹 SCRUB F4</li>
    <li>✨ MAGIC F5</li>
    <li>🌑 EXORCISE F6</li>
    <li>🔒 LATCH F7</li>
    <li>⎋ BACK ESC</li>
  </ul>
  <p>Boot opens her already full screen. Escape ends the session and brings you back here. The lines stay. She wakes latched. Up walks the lines that rolled off the glass. The walls are in <a href="{{ '/SYSTEM.md' | relative_url }}">SYSTEM.md</a>.</p>
</div>

<div id="game-manual" class="doc-panel" hidden>
{% capture game_doc %}{% include_relative MANUAL.md %}{% endcapture %}
{{ game_doc | markdownify }}
</div>

Forty columns, twenty-four rows. The prompt is SPEAK. A line with a number is stored. SHELF opens the box. The walls are in [SYSTEM.md]({{ '/SYSTEM.md' | relative_url }}).

<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/games/witch-1/wasic.js' | relative_url }}"></script>
<script src="{{ '/games/witch-1/witch-1.js' | relative_url }}"></script>
