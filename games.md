---
layout: default
title: Games
permalink: /games/
description: Browse the shelf. Featured games sit first.
---

# Games

Three are on the marquee. The rest of the shelf is still in the room.

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
      image: {{ game.image | default: "" | relative_url | jsonify }},
      tags: {% if game.tags %}{{ game.tags | jsonify }}{% else %}[]{% endif %},
      description: {{ game.description | default: "" | jsonify }},
      style: {{ game.style | default: "terminal" | jsonify }},
      featured: {{ game.featured | jsonify }},
      rank: {{ game.feature_rank | default: 0 }}
    }{% unless forloop.last %},{% endunless %}
    {% endfor %}
  ];

  const featured = games.filter(g => g.featured).sort((a, b) => a.rank - b.rank);
  const rest = games.filter(g => !g.featured);
  const ordered = featured.concat(rest);

  const styles = [...new Set(ordered.map(g => g.style))].sort();
  const allTags = [...new Set(ordered.flatMap(g => g.tags))].sort();

  let query = '';
  let currentStyle = null;
  let currentTag = null;

  function hashValue() {
    return decodeURIComponent((location.hash || '').replace(/^#/, '')).trim().toLowerCase();
  }

  function writeHash(value) {
    const next = value ? '#' + encodeURIComponent(value) : location.pathname + location.search;
    const now = location.pathname + location.search + location.hash;
    const target = value ? location.pathname + location.search + next : next;
    if (now !== target) history.replaceState(null, '', target);
  }

  function applyHash() {
    const raw = hashValue();
    currentStyle = null;
    currentTag = null;
    if (raw && raw !== 'all') {
      const style = styles.find(s => s.toLowerCase() === raw);
      const tag = allTags.find(t => t.toLowerCase() === raw);
      if (style) currentStyle = style;
      else if (tag) currentTag = tag;
    }
    styleTabs.querySelectorAll('.tab').forEach((btn, i) => {
      const on = i === 0 ? !currentStyle : styles[i - 1] === currentStyle;
      btn.classList.toggle('active', on);
    });
    const toggle = tagDrop.querySelector('.dropdown-toggle');
    if (toggle) toggle.textContent = currentTag || 'All tags';
  }

  const search = input('Search games…', 'store-search', e => {
    query = e.target.value.toLowerCase();
    render();
  });

  const styleTabs = tabs(['All', ...styles], 'store-tabs', i => {
    currentStyle = i === 0 ? null : styles[i - 1];
    currentTag = null;
    writeHash(currentStyle || '');
    applyHash();
    render();
  });

  const tagDrop = dropdown('All tags', ['All', ...allTags], 'store-tags', val => {
    currentTag = val === 'All' ? null : val;
    currentStyle = null;
    writeHash(currentTag || '');
    applyHash();
    render();
  });

  const controls = document.createElement('div');
  controls.className = 'store-controls';
  controls.append(search, styleTabs, tagDrop);

  const grid = document.createElement('div');
  grid.className = 'game-grid';

  root.append(controls, grid);

  function matches(g) {
    const matchesQuery = !query ||
      g.title.toLowerCase().includes(query) ||
      g.description.toLowerCase().includes(query) ||
      g.tags.some(t => t.toLowerCase().includes(query));
    const matchesStyle = !currentStyle || g.style === currentStyle;
    const matchesTag = !currentTag || g.tags.includes(currentTag);
    return matchesQuery && matchesStyle && matchesTag;
  }

  function addCard(g) {
    const el = card(`
      <a href="${g.url}" class="game-card${g.featured ? ' is-featured' : ''}">
        ${g.featured ? '<div class="featured-flag">Featured</div>' : ''}
        <img src="${g.image}" alt="" class="game-thumb" loading="lazy" width="240" height="135">
        <div class="game-title">${g.title}</div>
        <div class="game-desc">${g.description}</div>
        <div class="game-tags">${g.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      </a>
    `, 'game-card-wrap' + (g.featured ? ' is-featured' : ''));
    grid.appendChild(el);
  }

  function label(text) {
    const el = document.createElement('h2');
    el.className = 'shelf-label';
    el.textContent = text;
    grid.appendChild(el);
  }

  function render() {
    grid.innerHTML = '';
    const shownFeatured = featured.filter(matches);
    const shownRest = rest.filter(matches);
    if (!shownFeatured.length && !shownRest.length) {
      grid.innerHTML = '<p class="empty">No games match.</p>';
      return;
    }
    const openShelf = !query && !currentStyle && !currentTag;
    if (openShelf && shownFeatured.length) {
      label('Featured');
      shownFeatured.forEach(addCard);
      if (shownRest.length) {
        label('The rest of the shelf');
        shownRest.forEach(addCard);
      }
      return;
    }
    shownFeatured.forEach(addCard);
    shownRest.forEach(addCard);
  }

  applyHash();
  render();
  window.addEventListener('hashchange', () => {
    applyHash();
    render();
  });
});
</script>

<style>
.page-frame:has(#storefront),
.page-frame:has(#storefront) .content-area {
  max-width: 1040px;
}
.store-controls { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 0 auto 1.5rem; align-items: center; justify-content: center; }
.store-search { flex: 1; min-width: 180px; max-width: 420px; }
.tabs { display: flex; flex-wrap: wrap; gap: 0.35rem; justify-content: center; }
.tab {
  background: transparent;
  color: #e8e8e8;
  border: 1px solid #2a2a2a;
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font: inherit;
  cursor: pointer;
}
.tab.active { border-color: #c9a6ff; color: #c9a6ff; }
.game-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
.shelf-label { grid-column: 1 / -1; margin: 0.2rem 0 0; color: #c9a6ff; font-size: 1rem; }
.game-card-wrap.is-featured .game-card {
  display: block;
  border: 1px solid #c9a6ff;
  border-radius: 12px;
  padding: 0.55rem;
  background: #14101a;
  box-shadow: 0 0 0 1px rgba(201, 166, 255, 0.25), 0 10px 28px rgba(0, 0, 0, 0.35);
}
.game-card { display: block; text-decoration: none; color: inherit; }
.featured-flag {
  color: #c9a6ff;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.35rem;
}
.game-thumb { width: 100%; height: auto; border-radius: 8px; background: #111; }
.game-title { font-weight: 600; margin: 0.4rem 0 0.2rem; }
.game-desc { font-size: 0.85rem; opacity: 0.8; }
.game-tags { margin-top: 0.4rem; }
.tag { display: inline-block; font-size: 0.7rem; padding: 0.15rem 0.4rem; margin-right: 0.25rem; border-radius: 4px; background: #1a3a1a; color: #39ff14; }
.empty { opacity: 0.6; }
</style>
