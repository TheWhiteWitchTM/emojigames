---
layout: game
title: "🖥️ Basic I"
description: A small computer for learning BASIC. Forty columns, 512 lines, lessons built in.
image: /games/basic-1/banner.jpg
permalink: /games/basic-1/
tags: [terminal, computer]
stage_aspect: 1.25
game_modules: /games/basic-1/modules/
boot: true
machine: basic
docs:
  - id: game-started
    label: "📖 Getting Started"
  - id: game-tutorial
    label: "✏️ Tutorial"
---

<div id="game-started" class="doc-panel" hidden>
{% capture started_doc %}{% include_relative GETTING-STARTED.md %}{% endcapture %}
{{ started_doc | markdownify }}
</div>

<div id="game-tutorial" class="doc-panel" hidden>
{% capture tutorial_doc %}{% include_relative TUTORIAL.md %}{% endcapture %}
{{ tutorial_doc | markdownify }}
</div>

<div id="game-manual" class="doc-panel" hidden>
{% capture game_doc %}{% include_relative MANUAL.md %}{% endcapture %}
{{ game_doc | markdownify }}
</div>

The prompt is READY. A program holds 512 lines. MODULES opens the lessons. Getting Started is the first hour. The tutorial walks the rest.

<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/games/basic-1/interpreter.js' | relative_url }}"></script>
<script src="{{ '/games/basic-1/basic-1.js' | relative_url }}"></script>
