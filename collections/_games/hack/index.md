---
layout: game
title: 🗡️ Hack
description: Rooms, corridors, and an amulet on the sixth floor.
image: /games/hack/banner.jpg
permalink: /games/hack/
tags: [terminal, roguelike]
---

<div id="game-manual" class="doc-panel" hidden>
{% capture game_doc %}{% include_relative MANUAL.md %}{% endcapture %}
{{ game_doc | markdownify }}
</div>

Descend. Fight. The Amulet of Yendor is waiting on the sixth floor. Return begins. R starts again.

<script src="{{ '/assets/js/components.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/assets/js/glass.js' | relative_url }}"></script>
<script src="{{ '/games/hack/level.js' | relative_url }}"></script>
<script src="{{ '/games/hack/item.js' | relative_url }}"></script>
<script src="{{ '/games/hack/monster.js' | relative_url }}"></script>
<script src="{{ '/games/hack/player.js' | relative_url }}"></script>
<script src="{{ '/games/hack/hack.js' | relative_url }}"></script>
