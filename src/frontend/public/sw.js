const CACHE_NAME = 'ace8-static-v1';
const STATIC_EXTENSIONS = ['.js', '.css', '.woff2', '.woff', '.ttf', '.png', '.ico', '.svg'];
const NEWS_API_PATTERNS = ['allorigins', 'rss2json', 'news.google.com', 'feeds.feedburner'];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ACE8 NEWS - Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #DC2626;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 2rem;
    }
    .container { max-width: 400px; }
    h1 { font-size: 2rem; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 0.5rem; }
    .tagline { font-size: 0.85rem; opacity: 0.8; margin-bottom: 2rem; }
    .icon { font-size: 4rem; margin-bottom: 1.5rem; }
    p { font-size: 1.1rem; line-height: 1.6; opacity: 0.9; margin-bottom: 1rem; }
    .hint { font-size: 0.85rem; opacity: 0.7; }
    button {
      margin-top: 1.5rem;
      background: white;
      color: #DC2626;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📵</div>
    <h1>ACE8 NEWS</h1>
    <p class="tagline">all news in one place</p>
    <p>You're offline. Please check your internet connection.</p>
    <p class="hint">News will be available once you're back online.</p>
    <button onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>`;

function isStaticAsset(url) {
  const pathname = new URL(url).pathname;
  return STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext));
}

function isNewsAPI(url) {
  return NEWS_API_PATTERNS.some(pattern => url.includes(pattern));
}

// Install: cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/']);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || url.startsWith('chrome-extension://')) {
    return;
  }

  // News APIs: network-first, no cache fallback
  if (isNewsAPI(url)) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'offline' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Static assets: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation requests (HTML pages): network-first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(OFFLINE_HTML, {
          headers: { 'Content-Type': 'text/html' },
        });
      })
    );
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(request).then((response) => {
      if (response && response.status === 200) {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
      }
      return response;
    }).catch(() => caches.match(request))
  );
});
