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
