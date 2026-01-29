# Technology Stack

**Analysis Date:** 2026-01-29

## Languages

**Primary:**
- TypeScript 5.8.0 - All application code, components, composables, and utilities
- JavaScript - Configuration files (Vite, PikaCSS, ESLint)

**Secondary:**
- CSS - Custom styling in `src/styles/cursor.css`
- HTML - Index template and PWA manifest

## Runtime

**Environment:**
- Node.js (LTS) - Development runtime specified in CI/CD workflow
- Browser - Production runtime (modern browsers with PWA support)

**Package Manager:**
- pnpm 10.10.0
- Lockfile: pnpm-lock.yaml (present)

## Frameworks

**Core:**
- Vue 3.5.16 - Frontend framework with Composition API
- Vue Router 4.5.1 - Client-side routing
- Pinia 3.0.2 - State management

**UI Components:**
- reka-ui 2.3.0 - Headless UI component library (Slider, Progress, ScrollArea, Toast, Tooltip, Dialog, Tabs)

**Testing:**
- None detected

**Build/Dev:**
- Vite 6.3.5 - Build tool and dev server
- vue-tsc 2.2.10 - TypeScript type checking for Vue
- @vitejs/plugin-vue 5.2.4 - Vue SFC support
- vite-plugin-vue-devtools 7.7.6 - Vue DevTools integration

**Styling:**
- @pikacss/vite-plugin-pikacss 0.0.29 - Atomic CSS framework
- @pikacss/plugin-icons 0.0.29 - Icon system
- modern-normalize 3.0.1 - CSS normalization

**Code Quality:**
- ESLint 9.28.0 - Linting with @deviltea/eslint-config 4.0.0
- lint-staged 15.5.2 - Pre-commit linting
- simple-git-hooks 2.13.0 - Git hooks

## Key Dependencies

**Critical:**
- localforage 1.10.0 - IndexedDB storage for offline music files
- ofetch 1.4.1 - HTTP client for fetching music metadata and resources
- fflate 0.8.2 - Compression/decompression for data import/export
- valibot 1.1.0 - Schema validation for user data import/export

**Infrastructure:**
- @unhead/vue 2.0.10 - Document head management (title, meta tags)
- @vueuse/core 13.3.0 - Vue composition utilities (useAsyncState, useDark, useOnline, etc.)
- @deviltea/vue-router-middleware 0.0.3 - Route middleware handling

**PWA:**
- vite-plugin-pwa 1.0.0 - Service worker and PWA manifest generation
- Workbox - Runtime caching (configured for Google Fonts, resources)

**Development:**
- unplugin-auto-import 19.3.0 - Auto-import Vue APIs, VueUse, Pinia
- unplugin-vue-components 28.7.0 - Auto-import Vue components
- simple-git 3.27.0 - Git operations for commit hash in build

## Configuration

**Environment:**
- Development: `.env.development` (worker URL, magic headers for dev proxy)
- Production: `.env.production` (created by CI/CD from GitHub secrets)
- Required env vars:
  - `VITE_APP_WORKER_URL` - Backend worker URL
  - `VITE_APP_MAGIC_HEADER_KEY` - Authentication header name
  - `VITE_APP_MAGIC_HEADER_VALUE` - Authentication header value

**Build:**
- `vite.config.ts` - Build configuration, plugins, dev server proxy
- `tsconfig.json` - TypeScript project references
- `tsconfig.app.json` - App TypeScript config (extends @deviltea/tsconfig/dom)
- `tsconfig.node.json` - Node config files
- `pika.config.js` - PikaCSS styling configuration
- `eslint.config.mjs` - ESLint configuration
- Build defines: `__GIT_COMMIT_HASH__` injected at build time

**Dev Server Proxy:**
- `/resources/data.json` → https://maple-pod.deviltea.me
- `/resources/mark` → https://maple-pod.deviltea.me
- `/resources/bgm` → https://maple-pod.deviltea.me
- `/resources/bg.json` → https://maple-pod.deviltea.me
- `/resources/bg` → https://maple-pod.deviltea.me

## Platform Requirements

**Development:**
- Node.js LTS (v24.11.1 in current environment)
- pnpm 10.10.0
- Git (for commit hash injection)

**Production:**
- Modern browser with:
  - ES2020+ support
  - Service Worker API
  - IndexedDB
  - Media Session API (optional, for system media controls)
  - Document Picture-in-Picture API (optional)
  - Web Audio API

**Deployment:**
- GitHub Pages (configured via `.github/workflows/deploy-pages.yml`)
- Static file hosting
- HTTPS required for PWA features

---

*Stack analysis: 2026-01-29*
