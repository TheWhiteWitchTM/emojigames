// useEffect-style: runs on mount, optional cleanup on unmount
function useEffect(fn) {
  const run = () => {
    const cleanup = fn();
    if (typeof cleanup === 'function') {
      window.addEventListener('beforeunload', cleanup);
      return cleanup;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    return run();
  }
}

// base injector
function base(html, selector = null) {
  const targets = selector
    ? document.querySelectorAll(selector)
    : document.querySelectorAll('[data-component]');

  const inserted = [];
  targets.forEach(el => {
    el.innerHTML = html;
    inserted.push(...el.children);
  });

  return inserted.length === 1 ? inserted[0] : inserted;
}

// Neutral primitives (Radix-style)
function button(text, className = '', onClick = null) {
  const btn = document.createElement('button');
  btn.className = `btn btn-outline ${className}`.trim();
  btn.textContent = text;
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}

function card(content, className = '') {
  const el = document.createElement('div');
  el.className = `card ${className}`.trim();
  el.innerHTML = content;
  return el;
}

function dialog(title, body, className = '') {
  const el = document.createElement('div');
  el.className = `dialog ${className}`.trim();
  el.innerHTML = `
    <div class="dialog-title">${title}</div>
    <div class="dialog-body">${body}</div>
  `;
  return el;
}

function input(placeholder = '', className = '', onInput = null) {
  const el = document.createElement('input');
  el.className = `input ${className}`.trim();
  el.placeholder = placeholder;
  if (onInput) el.addEventListener('input', onInput);
  return el;
}

function toggle(label, className = '', onChange = null) {
  const el = document.createElement('label');
  el.className = `toggle ${className}`.trim();
  el.innerHTML = `<input type="checkbox"> ${label}`;
  if (onChange) el.querySelector('input').addEventListener('change', onChange);
  return el;
}

function tabs(items, className = '', onChange = null) {
  const el = document.createElement('div');
  el.className = `tabs ${className}`.trim();
  el.innerHTML = items.map((item, i) => 
    `<button class="tab ${i === 0 ? 'active' : ''}" data-index="${i}">${item}</button>`
  ).join('');
  if (onChange) {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab')) {
        el.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        onChange(Number(e.target.dataset.index));
      }
    });
  }
  return el;
}

function dropdown(label, items, className = '', onSelect = null) {
  const el = document.createElement('div');
  el.className = `dropdown ${className}`.trim();
  el.innerHTML = `
    <button class="dropdown-toggle">${label}</button>
    <ul class="dropdown-menu">
      ${items.map(item => `<li><a href="#" data-value="${item}">${item}</a></li>`).join('')}
    </ul>
  `;
  el.querySelector('.dropdown-toggle').addEventListener('click', (e) => {
    e.preventDefault();
    el.querySelector('.dropdown-menu').classList.toggle('open');
  });
  if (onSelect) {
    el.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        onSelect(a.dataset.value);
        el.querySelector('.dropdown-menu').classList.remove('open');
      });
    });
  }
  return el;
}

function accordion(items, className = '') {
  const el = document.createElement('div');
  el.className = `accordion ${className}`.trim();
  el.innerHTML = items.map((item, i) => `
    <div class="accordion-item">
      <button class="accordion-trigger">${item.title}</button>
      <div class="accordion-content">${item.content}</div>
    </div>
  `).join('');
  el.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      trigger.parentElement.classList.toggle('open');
    });
  });
  return el;
}

// Example
useEffect(() => {
  const share = button('📋 Share', 'share-btn', () => {
    navigator.clipboard.writeText(location.href);
  });
  document.querySelector('#actions')?.appendChild(share);
  return () => share.remove();
});
