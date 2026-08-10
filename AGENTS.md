# AGENTS.md

## Project Overview

`maple-pod` is Maple Pod — a MapleStory music player, built as a Vue 3 + Vite single-page PWA (vite-plugin-pwa, `registerType: 'autoUpdate'`) and deployed to GitHub Pages. State lives in Pinia + composables with persistence via localforage; UI primitives come from reka-ui; styling is PikaCSS (atomic CSS engine, `pika.config.ts`); runtime data validation uses valibot. Music/background resources are fetched from `https://maple-pod.deviltea.me` (proxied by the dev server in `vite.config.ts`).

**Repository structure:**
```
src/main.ts               # App entry
src/App.vue               # Root component
src/components/           # UI components (Ui* primitives + feature components)
src/composables/          # use* stores/logic (app store, audio player, queue, saved data)
src/views/                # Route views (Playlist, Playlists)
src/router/index.ts       # vue-router routes (exports Routes, auto-imported)
src/schemas/              # valibot schemas for saved/imported user data
src/utils/common.ts       # Shared helpers (auto-imported)
pika.config.ts            # PikaCSS engine config (design tokens for theme colors, preflights, selectors, shortcuts, icons)
vite.config.ts            # Vite + PWA manifest/workbox + dev proxy + auto-imports
public/                   # PWA icons, logo
.github/workflows/        # deploy-pages.yml, security-audit.yml
.engineering/             # EF engineering files (PROJECT/PRD/REQ/ADR/POL/CHG) managed via the `ef` CLI (@deviltea/ef)
```

Engineering knowledge (product intent, requirements, decisions, policies) lives in `.engineering/` and is managed with the `ef` CLI (`pnpm exec ef help`) — use the `author-engineering-files` skill to author or change these files; never edit active EF content without its CHG-backed workflow.

## Setup Commands

```bash
# Install dependencies
pnpm install

# Dev server (with proxy to maple-pod.deviltea.me for /resources/*)
pnpm dev

# Production build (vite build -> dist/)
pnpm build

# Preview the production build
pnpm preview

# Lint / lint and fix
pnpm lint
pnpm lint:fix

# Type check (vue-tsc --build --noEmit)
pnpm type-check
```

## Code Style

- TypeScript via `@deviltea/tsconfig` (project references: `tsconfig.app.json` extends `@deviltea/tsconfig/browser`, `tsconfig.node.json` for tooling)
- ESLint flat config extending `@deviltea/eslint-config` (tabs, single quotes, no semicolons); `.engineering/**` (canonically formatted by the `ef` CLI) and tool-managed agent skill/hook files (`.agents/`, `.claude/`, `.codex/`, `skills-lock.json`) are ignored
- Auto-imports (unplugin-auto-import): `vue`, `vue-router`, `pinia`, `@vueuse/core`, `Routes` from `@/router/index`, plus everything in `src/composables/` and `src/utils/` — do not add manual imports for these
- Components are auto-registered (unplugin-vue-components); `auto-imports.d.ts` / `components.d.ts` / `pika.gen.ts` are generated — never edit by hand
- Path alias `@` -> `src/`
- Pre-commit hook (simple-git-hooks) runs lint-staged (`eslint --fix` on js/ts/vue)

## Release

- Push to `master` triggers `.github/workflows/deploy-pages.yml`: pnpm install, `pnpm build`, copies `dist/index.html` to `dist/404.html` (SPA fallback), deploys `dist/` to GitHub Pages
- `.github/workflows/security-audit.yml` runs `pnpm audit --audit-level=moderate` weekly (Sunday 21:00 UTC) and on manual dispatch

## Gotchas

- `pnpm-workspace.yaml` holds the pnpm supply-chain baseline (`minimumReleaseAge`, `trustPolicy: no-downgrade` with `trustPolicyExclude` entries, `strictDepBuilds`, `overrides`) — each setting is commented in-file; new deps needing build scripts must be reviewed into `onlyBuiltDependencies`/`ignoredBuiltDependencies`
- workbox is pinned to 7.4.0 (`workbox-build`/`workbox-window` overrides + exact `workbox-window` devDep) because 7.4.1 pulls an unattested fork prerelease that trips `trustPolicy` — see the `limit:` comment in `pnpm-workspace.yaml` before bumping
- `__GIT_COMMIT_HASH__` is injected at build time from `git rev-parse` (via simple-git) — builds outside a git checkout get `'unknown'`
- Node >= 24 required (`engines`); pnpm pinned via `packageManager` (10.34.4)
- README is a stub; the PWA manifest in `vite.config.ts` is the source of the app name/description
