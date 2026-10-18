---
layout: game
title: 🗡️ Rogue
description: Six floors, a handful of rooms, and the amulet at the bottom.
image: /games/rogue/banner.jpg
permalink: /games/rogue/
tags: [terminal, roguelike]
---

<div id="game-manual" class="doc-panel" hidden>
{% capture game_doc %}{% include_relative MANUAL.md %}{% endcapture %}
{{ game_doc | markdownify }}
</div>

Rooms, corridors, and something on the stairs. The amulet is on the sixth floor. Carry it back up. Q drinks a potion.

<script src="{{ '/assets/js/components.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/assets/js/glass.js' | relative_url }}"></script>
<script src="{{ '/games/rogue/rogue.js' | relative_url }}"></script>
