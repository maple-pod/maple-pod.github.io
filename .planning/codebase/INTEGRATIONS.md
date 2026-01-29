# External Integrations

**Analysis Date:** 2026-01-29

## APIs & External Services

**Music Resources API:**
- Backend: https://maple-pod.deviltea.me (production) / http://localhost:8787 (development)
  - SDK/Client: ofetch 1.4.1
  - Auth: Custom magic headers (env vars `VITE_APP_MAGIC_HEADER_KEY` and `VITE_APP_MAGIC_HEADER_VALUE`)
  - Endpoints:
    - `/resources/data.json` - Music metadata, BGM list, cover marks
    - `/resources/bgm/{filename}.mp3` - Audio file streaming
    - `/resources/mark` - Cover image data (binary)
    - `/resources/bg.json` - Background image list and previews
    - `/resources/bg` - Background image files
  - Caching: NetworkFirst strategy via Workbox (365 day expiration)

**Google Fonts:**
- Fonts API: https://fonts.googleapis.com
  - Usage: Comfortaa font family (weights 300-700)
  - Caching: CacheFirst via Workbox (365 day expiration)
- Font files: https://fonts.gstatic.com
  - Caching: CacheFirst via Workbox (365 day expiration)

## Data Storage

**Databases:**
- IndexedDB (via localforage 1.10.0)
  - Instance name: `maple-pod`
  - Client: localforage
  - Purpose: Offline music file storage (Blob objects keyed by music ID)
  - Location: Browser storage, managed in `src/composables/useMusicStore.ts`

**Local Storage:**
- localStorage (via @vueuse/core)
  - Keys managed in `src/composables/useSavedUserData.ts`:
    - User preferences (theme, background image)
    - Custom playlists
    - Liked songs
    - Play history (last 50 tracks)

**File Storage:**
- Local filesystem only (no cloud storage)
- User can export/import saved data as JSON files

**Caching:**
- Service Worker caches (via Workbox)
  - `google-fonts-cache` - Google Fonts CSS
  - `gstatic-fonts-cache` - Font files
  - `maple-pod-data-cache` - Music metadata JSON
  - Default cache - App assets (JS, CSS, HTML, images)

## Authentication & Identity

**Auth Provider:**
- None (no user accounts)
  - Implementation: Magic header-based API authentication (server-side)
  - Headers configured via environment variables
  - All data stored locally in browser

## Monitoring & Observability

**Error Tracking:**
- None

**Logs:**
- Browser console only
- console.warn used for invalid playlist validation in `src/composables/useMusicStore.ts`

## CI/CD & Deployment

**Hosting:**
- GitHub Pages
  - URL: Configured in GitHub Pages settings
  - Static file serving with SPA fallback (404.html → index.html)

**CI Pipeline:**
- GitHub Actions (`.github/workflows/deploy-pages.yml`)
  - Trigger: Push to `master` branch or manual dispatch
  - Build: pnpm install → pnpm build
  - Environment secrets injection during build
  - Deploy: Upload to GitHub Pages

**Required Secrets (GitHub):**
- `WORKER_URL` - Production worker URL
- `MAGIC_HEADER_KEY` - API auth header name
- `MAGIC_HEADER_VALUE` - API auth header value

## Environment Configuration

**Required env vars:**
- `VITE_APP_WORKER_URL` - Backend worker URL
- `VITE_APP_MAGIC_HEADER_KEY` - Authentication header name
- `VITE_APP_MAGIC_HEADER_VALUE` - Authentication header value

**Secrets location:**
- Development: `.env.development` (not committed)
- Production: GitHub repository secrets → injected as `.env.production` during CI build

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Browser APIs

**Media Session API:**
- Native: navigator.mediaSession
  - Purpose: System media controls integration
  - Features: Play/pause, next/previous track, seek, metadata display
  - Implementation: `src/composables/useMusicStore.ts` (lines 239-302)

**Service Worker API:**
- vite-plugin-pwa 1.0.0
  - Purpose: PWA capabilities, offline support, asset caching
  - Registration: `virtual:pwa-register/vue` in `src/components/PwaReloadPrompt.vue`
  - Strategy: autoUpdate with prompt for new versions

**Document Picture-in-Picture API:**
- Native: documentPictureInPicture
  - Purpose: Mini player in floating window
  - Implementation: `src/composables/useDocumentPictureInPicture.ts`
  - Optional: Graceful degradation if unsupported

**Online/Offline Detection:**
- Native: navigator.onLine (via @vueuse/core useOnline)
  - Purpose: Disable non-cached music when offline
  - Implementation: `src/composables/useMusicStore.ts` (line 231)

## Third-Party Resources

**MapleStory BGM Database:**
- GitHub: https://github.com/maplestory-music/maplebgm-db
  - Relationship: Data source (linked in About dialog)

**Project Repository:**
- GitHub: https://github.com/maple-pod/maple-pod.github.io
  - Purpose: Source code hosting, CI/CD

---

*Integration audit: 2026-01-29*
