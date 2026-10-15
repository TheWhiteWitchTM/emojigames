---
title: 🕹️ Games
description: Browse by category or tag.
---

# 🕹️ Games

<div id="storefront"></div>

<script src="{{ '/assets/js/components.js' | relative_url }}"></script>
<script>
useEffect(() => {
  const root = document.getElementById('storefront');
  const games = [
    {% for game in site.games %}
    {
      title: {{ game.title | jsonify }},
      url: {{ game.url | relative_url | jsonify }},
      image: {{ game.image | relative_url | jsonify }},
      category: {{ game.category | default: "other" | jsonify }},
      tags: {{ game.tags | default: [] | jsonify }},
      description: {{ game.description | default: "" | jsonify }}
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ];

  const categories = [...new Set(games.map(g => g.category))].sort();
  const tags = [...new Set(games.flatMap(g => g.tags))].sort();

  let currentCat = categories[0] || 'other';
  let currentTag = null;

  const catTabs = tabs(categories, 'store-tabs', (i) => {
    currentCat = categories[i];
    render();
  });

  const tagDrop = dropdown('All tags', ['All', ...tags], 'store-tags', (val) => {
    currentTag = val === 'All' ? null : val;
    render();
  });

  const grid = document.createElement('div');
  grid.className = 'game-grid';

  root.append(catTabs, tagDrop, grid);

  function render() {
    grid.innerHTML = '';
    games
      .filter(g => g.category === currentCat)
      .filter(g => !currentTag || g.tags.includes(currentTag))
      .forEach(g => {
        const c = card(`
          <a href="${g.url}" class="game-card">
            <img src="${g.image}" alt="" class="game-thumb" loading="lazy" width="240" height="135">
            <div class="game-title">${g.title}</div>
            <div class="game-desc">${g.description}</div>
          </a>
        `);
        grid.appendChild(c);
      });
  }

  if (categories.length) render();
});
</script>
