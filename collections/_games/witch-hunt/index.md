---
layout: game
title: 🧙‍♀️ Witch Hunt
description: Survive 10 levels. Religious symbols chase the White Witch. Cast spells, grab power-ups, clear the pellets. Alpha.
permalink: /games/witch-hunt/
image: /games/witch-hunt/banner.jpg
tags: [terminal, action, arcade]
---

<div id="game-manual" class="doc-panel" hidden>
{% capture game_doc %}{% include_relative MANUAL.md %}{% endcapture %}
{{ game_doc | markdownify }}
</div>

Religious symbols chase you. Collect pellets, cast spells, survive 10 levels. Alpha.

<script src="{{ '/assets/js/terminal.js' | relative_url }}"></script>
<script src="{{ '/games/witch-hunt/witch-hunt.js' | relative_url }}"></script>
