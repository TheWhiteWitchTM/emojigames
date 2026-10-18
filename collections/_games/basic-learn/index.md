---
layout: game
title: "🖥️ Basic Learn"
description: BASIC with colored words, plain errors, and the picture engines.
image: /games/basic-learn/banner.jpg
permalink: /games/basic-learn/
tags: [computer, language]
boot: true
machine: learn
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

Basic I is the 40-column machine. The prompt there is READY. This one has the picture, colored words, and plain errors. 2D, 3D, and UI are already in the room.

The lesson menu holds the first programs. Getting Started is the first hour. The tutorial walks the rest.

<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-engine-3d.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-engine-ui.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-bridge.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-basic.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-studio.js' | relative_url }}"></script>
<script>
(function () {
  var mount = document.getElementById("game");
  if (!mount || !window.EmojiStudio) return;
  var lessons = [
    { name: "Hello", code: "PRINT \"Hello\"\n" },
    { name: "Ask", code: "INPUT \"Your name\"; NAME$\nPRINT \"Hello, \"; NAME$\n" },
    { name: "If", code: "INPUT \"A number\"; N\nIF N = 0 THEN PRINT \"Zero or empty.\"\nIF N > 10 THEN\n  PRINT \"Bigger than 10.\"\nELSE\n  PRINT \"10 or smaller.\"\nEND IF\n" },
    { name: "Count", code: "FOR I = 1 TO 5\n  PRINT I\nNEXT I\n" },
    { name: "A face", code: "2D.PAPER \"night\"\n2D.CIRCLE 160, 120, 70, \"gold\"\n2D.CIRCLE 135, 100, 8, \"night\"\n2D.CIRCLE 185, 100, 8, \"night\"\n2D.EMOJI \"🙂\", 160, 140, 48\n" },
    { name: "Move it", code: "10 X = 80\n20 DO\n30 2D.CLEAR\n40 ID = 2D.EMOJI(\"😀\", X, 120, 64)\n50 IF 2D.KEY(\"right\") THEN X = X + 4\n60 2D.WAIT\n70 LOOP\n" },
    { name: "Boxes", code: "3D.PAPER \"night\"\n3D.BOX 0, 0.5, 0, 2, 1, 2, \"orange\"\n3D.EMOJI \"🌟\", 0, 2, 0, 0.6\n" },
    { name: "A window", code: "UI.WINDOW \"Hello\"\nUI.LABEL \"Pick a color\"\nUI.PICK \"color\", \"red\", \"gold\", \"navy\"\nUI.FIELD \"name\", \"Your name\"\nUI.BUTTON \"OK\"\nUI.SHOW\nPRINT UI.VALUE(\"name\"); \" likes \"; UI.VALUE(\"color\")\n" }
  ];
  window.EmojiStudio.open({
    root: mount,
    language: "basic",
    title: "Basic Learn",
    storageKey: "emojigames.basic-learn.v1",
    lessons: lessons,
    showJs: false
  });
})();
</script>
