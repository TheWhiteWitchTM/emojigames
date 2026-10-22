---
layout: game
title: "⚓ Carriers"
description: Seven carrier battles. Search, strike, and move.
image: /games/carriers/banner.jpg
permalink: /games/carriers/
tags: [strategy, war]
style: strategy
featured: true
feature_rank: 1
---

<div id="game-manual" class="doc-panel" hidden>
{% capture game_doc %}{% include_relative MANUAL.md %}{% endcapture %}
{{ game_doc | markdownify }}
</div>

Seven battles from the Pacific war. You have a side, a map, and the carriers. The other fleet is out there. Click one of yours, click one of theirs to send the strike, click a square to move, and commit.

<script src="{{ '/assets/js/components.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/games/carriers/rules.js' | relative_url }}"></script>
<script src="{{ '/games/carriers/carriers.js' | relative_url }}"></script>
