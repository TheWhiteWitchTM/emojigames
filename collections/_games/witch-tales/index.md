---
layout: game
title: 🧙 A Witch's Tale
description: A chaptered tile RPG. You are a witch. The land has problems. Alpha.
permalink: /games/witch-tales/
image: /games/witch-tales/banner.jpg
tags: [terminal, rpg, adventure]
game_base: /games/witch-tales/
---

<div id="game-manual" class="doc-panel" hidden>
{% capture game_doc %}{% include_relative MANUAL.md %}{% endcapture %}
{{ game_doc | markdownify }}
</div>

You are a witch. The land has problems. Chapters arrive one at a time. Your save stays in this browser.

<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/assets/js/glass.js' | relative_url }}"></script>
<script src="{{ '/games/witch-tales/witch-tales.js' | relative_url }}"></script>
<script src="{{ '/games/witch-tales/chapter-01.js' | relative_url }}"></script>
