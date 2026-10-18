---
layout: null
permalink: /sw.js
---
const CACHE = 'emojigames-2026-10-18-5';
const SCOPE = {{ '/' | relative_url | jsonify }};

const PRECACHE = [
  SCOPE,
  {{ '/manifest.webmanifest' | relative_url | jsonify }},
  {{ '/assets/css/style.css' | relative_url | jsonify }},
  {{ '/assets/images/site.jpg' | relative_url | jsonify }},
  {{ '/assets/icons/icon-192.png' | relative_url | jsonify }},
  {{ '/assets/icons/icon-512.png' | relative_url | jsonify }},
  {{ '/assets/icons/icon-maskable-192.png' | relative_url | jsonify }},
  {{ '/assets/icons/icon-maskable-512.png' | relative_url | jsonify }},
  {{ '/assets/icons/apple-touch-icon.png' | relative_url | jsonify }},
  {{ '/assets/icons/favicon-32.png' | relative_url | jsonify }},
  {{ '/assets/js/emoji-engine-2d.js' | relative_url | jsonify }},
  {{ '/assets/js/emoji-engine-3d.js' | relative_url | jsonify }},
  {{ '/assets/js/emoji-engine-3d.min.js' | relative_url | jsonify }}
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/sw.js')) return;

  event.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok && fresh.type === 'basic') {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      const cached = await caches.match(req) || await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const home = await caches.match(SCOPE);
        if (home) return home;
        return new Response(
          '<!doctype html><meta charset="utf-8"><title>Offline</title><p>Offline. Open Emoji Games again when the connection is back.</p>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
      throw err;
    }
  })());
});
