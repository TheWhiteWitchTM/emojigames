---
layout: game
title: 🛸 Elite
description: Trade, fight, and dock. Eight galaxies. The Cobra is yours.
image: /games/elite/banner.jpg
permalink: /games/elite/
tags: [flight, trade]
---

<div id="game-manual" class="doc-panel" hidden>
{% capture game_doc %}{% include_relative MANUAL.md %}{% endcapture %}
{{ game_doc | markdownify }}
</div>

The Cobra Mk III is docked at Lave. One hundred credits, a pulse laser, and fuel for seven light years. Launch, trade, and come back through the slot. Return leaves the title. R, after the ship is lost, starts another commander and skips the title.

<script src="{{ '/assets/js/emoji-engine-3d.js' | relative_url }}"></script>
<script src="{{ '/games/elite/math.js' | relative_url }}"></script>
<script src="{{ '/games/elite/galaxy.js' | relative_url }}"></script>
<script src="{{ '/games/elite/ships.js' | relative_url }}"></script>
<script src="{{ '/games/elite/render.js' | relative_url }}"></script>
<script src="{{ '/games/elite/audio.js' | relative_url }}"></script>
<script src="{{ '/games/elite/sim.js' | relative_url }}"></script>
<script src="{{ '/games/elite/elite.js' | relative_url }}"></script>
