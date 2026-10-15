---
layout: default
title: Games
description: Retro games. Ports of 70s/80s classics.
---

# 🕹️ Games

Got bored of the timeline and started porting old games. They live here.

{% for game in site.data.games %}
## {{ game.title }}

{{ game.description }}

[Play →]({{ game.url | relative_url }})

---
{% endfor %}
