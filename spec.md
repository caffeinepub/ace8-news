# ACE8 NEWS - PWA Implementation

## Current State
ACE8 NEWS is a multi-language Indian news aggregator built with React/Vite. It has a Vite-based build system, React Query for data fetching, and a responsive UI. There is no PWA support, service worker, or app manifest. The `index.html` already has AdSense and viewport meta tags.

## Requested Changes (Diff)

### Add
- `public/manifest.json`: Web App Manifest with name, icons, theme color, display:standalone, start_url
- `public/sw.js`: Service Worker with:
  - Cache-first strategy for static assets (CSS, JS, fonts)
  - Network-first for news API requests (CORS proxy calls)
  - Offline fallback page showing cached news
- App icons: 192x192 and 512x512 PNG icons for ACE8 NEWS (red background with newspaper icon)
- `src/hooks/usePWAInstall.ts`: Custom hook that captures `beforeinstallprompt` event and exposes `installApp()` + `isInstallable` state
- `src/components/InstallBanner.tsx`: Prominent banner shown to users who haven't installed the PWA, with "Install App" button and dismiss option
- Service worker registration in `main.tsx`

### Modify
- `index.html`: Add `<link rel="manifest">`, `<meta name="theme-color">`, `<meta name="apple-mobile-web-app-*">` tags, apple touch icon links
- `vite.config.js`: Enable minify (set to `true`) for production builds
- `src/components/Header.tsx`: Add a subtle "Install App" button/icon in the header for mobile users

### Remove
- Nothing removed

## Implementation Plan
1. Generate ACE8 NEWS app icons (192x192 and 512x512) - red background with newspaper logo
2. Create `public/manifest.json` with full PWA metadata
3. Create `public/sw.js` service worker with caching strategies
4. Create `src/hooks/usePWAInstall.ts` hook
5. Create `src/components/InstallBanner.tsx` with install prompt UI
6. Register service worker in `src/main.tsx`
7. Update `index.html` with PWA meta tags
8. Wire `InstallBanner` into `App.tsx`
9. Add install button to Header
