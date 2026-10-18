---
layout: game
title: "🚀 Galaxy Hunt 3D"
description: Super Star Trek, written in Magic. Charts, a quadrant, and a bridge.
image: /games/galaxy-hunt-3d/banner.jpg
permalink: /games/galaxy-hunt-3d/
game_base: /games/galaxy-hunt-3d/
tags: [flight, action]
style: flight
---

<div id="game-manual" class="doc-panel" hidden>
{% capture game_doc %}{% include_relative MANUAL.md %}{% endcapture %}
{{ game_doc | markdownify }}
</div>

The same eight-by-eight hunt, written in Magic. 2d draws the charts, 3d is the quadrant, and ui is the bridge. Return leaves the title. R, after the mission ends, starts another and skips the title.

<script src="{{ '/assets/js/components.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-engine-3d.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-engine-ui.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-bridge.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-magic.js' | relative_url }}"></script>
<script src="{{ '/games/galaxy-hunt-3d/host.js' | relative_url }}"></script>
