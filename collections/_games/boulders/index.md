---
layout: game
title: 🪨 Boulders
description: Dig the dirt. The rocks fall. The diamonds open the door.
image: /games/boulders/banner.jpg
permalink: /games/boulders/
tags: [action, cave]
---

<div id="game-manual" class="doc-panel" hidden>
{% capture game_doc %}{% include_relative MANUAL.md %}{% endcapture %}
{{ game_doc | markdownify }}
</div>

Three caves. Arrows or WASD. Return starts. R starts again after the last cave, or after the rocks win.

<script src="{{ '/assets/js/components.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/assets/js/glass.js' | relative_url }}"></script>
<script src="{{ '/games/boulders/boulders.js' | relative_url }}"></script>
