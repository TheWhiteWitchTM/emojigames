---
layout: game
title: 🤖 Trump Super Intelligence
description: The most tremendous chatbot. Many people are saying it.
image: /games/trump-si/banner.jpg
permalink: /games/trump-si/
tags: [terminal, joke]
---

<div id="game"></div>

<script src="{{ '/assets/js/components.js' | relative_url }}"></script>
<script src="{{ '/assets/js/terminal.js' | relative_url }}"></script>
<script src="{{ '/games/trump-si/responses.js' | relative_url }}"></script>
<script src="{{ '/games/trump-si/trump-faces.js' | relative_url }}"></script>
<script src="{{ '/games/trump-si/trump-si.js' | relative_url }}"></script>
<script>
useEffect(() => {
  const container = document.getElementById('game');
  if (!container || typeof Terminal === 'undefined' || typeof TrumpSI === 'undefined') {
    container.innerHTML = '<p>Terminal or TrumpSI failed to load.</p>';
    return;
  }
  const term = new Terminal({ border: '#39ff14' });
  container.appendChild(term.wrap);
  term.wrap.focus();

  const bot = new TrumpSI(term);
  bot.start();

  let buffer = "";
  term.onKey(e => {
    if (e.key === "Enter") {
      if (buffer.trim()) {
        bot.reply(buffer.trim());
        buffer = "";
      }
    } else if (e.key === "Backspace") {
      buffer = buffer.slice(0, -1);
    } else if (e.key.length === 1) {
      buffer += e.key;
    }
  });
});
</script>
