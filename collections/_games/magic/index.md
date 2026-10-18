---
layout: game
title: "✨ Magic"
description: A small language for learning. Lua, with the sharp corners filed off.
image: /games/magic/banner.jpg
permalink: /games/magic/
tags: [computer, language]
boot: true
machine: magic
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

The language is Magic. It is Lua, with the sharp corners filed off. Run compiles it to JavaScript and runs that. The words are colored while you type. A mistake says what to fix, and which line. 2d, 3d, and ui are already in the room.

The lesson menu holds the first programs. Getting Started is the first hour. The tutorial walks the rest.

<script src="{{ '/assets/js/emoji-engine-2d.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-engine-3d.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-engine-ui.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-bridge.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-magic.js' | relative_url }}"></script>
<script src="{{ '/assets/js/emoji-studio.js' | relative_url }}"></script>
<script>
(function () {
  var mount = document.getElementById("game");
  if (!mount || !window.EmojiStudio) return;
  var lessons = [
    { name: "Hello", code: "print(\"Hello\")\n" },
    { name: "Ask", code: "name = input(\"Your name\")\nprint(\"Hello, \" .. name)\n" },
    { name: "If", code: "n = tonumber(input(\"A number\"))\nif n == nil then\n  print(\"That was not a number.\")\nelse if n > 10 then\n  print(\"Bigger than 10.\")\nelse\n  print(\"10 or smaller.\")\nend\n" },
    { name: "Repeat", code: "for i = 1 to 5 do\n  print(i)\nend\n" },
    { name: "A list", code: "bag = {\"🌟\", \"🌙\", \"🔥\"}\nprint(bag[1])\nprint(#bag)\nfor item in bag do\n  print(item)\nend\n" },
    { name: "A face", code: "2d.paper(\"night\")\n2d.circle(160, 120, 70, \"gold\")\n2d.circle(135, 100, 8, \"night\")\n2d.circle(185, 100, 8, \"night\")\n2d.emoji(\"🙂\", 160, 140, 48)\n" },
    { name: "Move it", code: "x = 80\nwhile true do\n  if 2d.key(\"right\") then x = x + 4 end\n  if 2d.key(\"left\") then x = x - 4 end\n  2d.clear()\n  2d.emoji(\"😀\", x, 120, 64)\n  2d.wait()\nend\n" },
    { name: "Named steps", code: "x = 80\nfunction update()\n  if 2d.key(\"right\") then x = x + 4 end\n  if 2d.key(\"left\") then x = x - 4 end\nend\nfunction draw()\n  2d.clear()\n  2d.emoji(\"😀\", x, 120, 64)\nend\n2d.run()\n" },
    { name: "Boxes", code: "3d.paper(\"night\")\n3d.box(0, 0.5, 0, 2, 1, 2, \"orange\")\n3d.emoji(\"🌟\", 0, 2, 0, 0.6)\n" },
    { name: "A window", code: "ui.window(\"Hello\")\nui.label(\"Pick a color\")\nui.pick(\"color\", \"red\", \"gold\", \"navy\")\nui.field(\"name\", \"Your name\")\nui.button(\"OK\")\nui.show()\nprint(ui.value(\"name\") .. \" likes \" .. ui.value(\"color\"))\n" }
  ];
  window.EmojiStudio.open({
    root: mount,
    language: "magic",
    title: "Magic",
    storageKey: "emojigames.magic.v1",
    lessons: lessons,
    showJs: true
  });
})();
</script>
