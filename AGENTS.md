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
.github/workflows/        # deploy-pages.yml, security-audit.yml, spec-validate.yml
.spec/                    # Spec-native engineering specification workspace managed via `spec` (@deviltea/spec-tool)
```

Engineering specification state lives in `.spec/` and is managed with the `spec` CLI (`pnpm exec spec --help`) — see the Spec Workflow section below.

## Engineering Workflow (Spec)

This project uses **@deviltea/spec-tool 0.1.0 (frozen v1)**. The old Artifact/Use Case/Requirement/lifecycle/Resource CLI and persistence formats are **not compatible**. The only authoritative Spec workspace is the validated v1 graph under `.spec/`; `docs/spec-migration/legacy/` is a read-only historical archive, not parallel specification authority.

Use the installed `maintain-spec-workspace` skill for semantic changes and `review-spec-workspace` for read-only reviews. Both must match the 0.1.0 package.

1. **Validate first:** `pnpm exec spec workspace validate --root .` — invalid workspaces expose diagnostics only, not partial semantic reads. A fresh workspace is initialized with `spec workspace init --root .` **only if** no `.spec/` exists.
2. **Discover semantic state:** `pnpm exec spec graph export --root .` gives normalized Story / Feature / Rule / Scenario / Contract / Clause nodes and their `motivates`, `demonstrates` and `constrains` edges. Use `spec graph get/list/incoming/outgoing` and the individual resource CLI commands to inspect specific IDs rather than guessing references.
3. **Mutate through the v1 API:** `story`, `feature`, `rule`, `scenario`, `contract` and `clause` each expose their documented create/update/delete operations. Structured CLI mutation requests are JSON on stdin and **require the latest `expectedRevision`** from a validation or graph snapshot. Reread the graph after conflicts; never blindly replay a stale write. Set relations with `graph set-relation-targets`.
4. **Keep semantic boundaries:** Story records intent; Feature and embedded Rules record local semantics; Scenario records observable Given/When/Then interaction, with `demonstrates` as a semantic link **not** test-pass evidence. Standalone Contracts exist only for cross-Feature normative authority requiring independent ownership. Implementation, release status, verification results, and noncanonical notes do not become new Spec authority by implication.
5. **Verify changes:** finish every mutation sequence with `pnpm exec spec workspace validate --root .` and `pnpm exec spec graph export --root .`, plus relevant code lint/type-check/build/behavioral checks. Validation proves structural/reference invariants only, not prose adequacy or implementation conformance. Review any authority-changing edit explicitly.

The v1 root is closed-world: exactly `.spec/spec.yaml` (`formatVersion: 1`) and optional flat `stories/`, `features/`, `contracts/` and `scenarios/` directories. Never create the old `changes/`, `decisions/`, `policies/`, `prds/`, `projects/`, `requirements/` or `use-cases/` directories inside `.spec/`.

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
- ESLint flat config extending `@deviltea/eslint-config` (tabs, single quotes, no semicolons); `.spec/**` (managed by the `spec` CLI) and tool-managed agent skill/hook files (`.agents/`, `.claude/`, `.codex/`, `skills-lock.json`) are ignored
- Auto-imports (unplugin-auto-import): `vue`, `vue-router`, `pinia`, `@vueuse/core`, `Routes` from `@/router/index`, plus everything in `src/composables/` and `src/utils/` — do not add manual imports for these
- Components are auto-registered (unplugin-vue-components); `auto-imports.d.ts` / `components.d.ts` / `.pikacss/` are generated — never edit by hand
- Path alias `@` -> `src/`
- Pre-commit hook (simple-git-hooks) runs lint-staged (`eslint --fix` on js/ts/vue)

## Release

- Push to `master` triggers `.github/workflows/deploy-pages.yml`: pnpm install, `pnpm build`, copies `dist/index.html` to `dist/404.html` (SPA fallback), deploys `dist/` to GitHub Pages
- `.github/workflows/security-audit.yml` runs `pnpm audit --audit-level=moderate` weekly (Sunday 21:00 UTC) and on manual dispatch

## Gotchas

- `pnpm-workspace.yaml` holds the pnpm supply-chain baseline (`minimumReleaseAge`, `trustPolicy: no-downgrade` with `trustPolicyExclude` entries, `strictDepBuilds`, `overrides`) — each setting is commented in-file; new deps needing build scripts must be reviewed into `allowBuilds`
- workbox is pinned to 7.4.0 (`workbox-build`/`workbox-window` overrides + exact `workbox-window` devDep) because 7.4.1 pulls an unattested fork prerelease that trips `trustPolicy` — see the `limit:` comment in `pnpm-workspace.yaml` before bumping
- `__GIT_COMMIT_HASH__` is injected at build time from `git rev-parse` (via simple-git) — builds outside a git checkout get `'unknown'`
- Node >= 24 required (`engines`); pnpm pinned via `packageManager` (12.3.4)
- README is a stub; the PWA manifest in `vite.config.ts` is the source of the app name/description
