---
layout: game
title: 🤖 Trump Super Intelligence
description: The most tremendous chatbot. Many people are saying it.
image: /games/trump-si/banner.jpg
permalink: /games/trump-si/
tags: [terminal, joke]
---

<div id="game-manual" class="doc-panel" hidden>
{% capture game_doc %}{% include_relative MANUAL.md %}{% endcapture %}
{{ game_doc | markdownify }}
</div>

A conversation, not a match. Type a line and press Return. The face, the frame, and the voice follow the mood.

<script src="{{ '/assets/js/components.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/assets/js/glass.js' | relative_url }}"></script>
<script src="{{ '/games/trump-si/responses.js' | relative_url }}"></script>
<script src="{{ '/games/trump-si/trump-si.js' | relative_url }}"></script>
