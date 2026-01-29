# Codebase Structure

**Analysis Date:** 2026-01-29

## Directory Layout

```
maple-pod.github.io/
├── .github/             # GitHub workflows
├── .planning/           # Planning documents (this analysis)
├── .vscode/             # VSCode settings
├── dist/                # Production build output
├── dev-dist/            # Development build output
├── public/              # Static assets
├── src/                 # Source code
│   ├── assets/          # Images and media
│   ├── components/      # Vue components
│   ├── composables/     # Reusable composition functions
│   ├── router/          # Route definitions
│   ├── schemas/         # Data validation schemas
│   ├── styles/          # Global CSS
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Pure utility functions
│   ├── views/           # Top-level route views
│   ├── App.vue          # Root component
│   └── main.ts          # Application entry point
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
├── pika.config.js       # PikaCSS configuration
├── pika.gen.ts          # Generated PikaCSS utilities (auto-generated)
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite build configuration
└── auto-imports.d.ts    # Auto-import type definitions (auto-generated)
```

## Directory Purposes

**`src/`:**
- Purpose: All application source code
- Contains: Components, composables, views, types, utilities
- Key files: `main.ts` (entry), `App.vue` (root)

**`src/components/`:**
- Purpose: Reusable UI components
- Contains: Vue single-file components (`.vue`)
- Key files: `DefaultLayout.vue`, `MusicPlayer.vue`, `UiDialog.vue`, `UiDropdownMenu.vue`
- Naming: PascalCase, prefixed with `Ui` for generic components, underscore prefix `_` for internal components

**`src/composables/`:**
- Purpose: Shared reactive logic and stores
- Contains: TypeScript files with composition functions
- Key files: `useMusicStore.ts`, `useAppStore.ts`, `useAudioPlayer.ts`, `useSavedUserData.ts`
- Auto-imported: All exports automatically available in components

**`src/views/`:**
- Purpose: Top-level route components
- Contains: Vue components mapped to routes
- Key files: `Playlist.vue`, `Playlists.vue`

**`src/router/`:**
- Purpose: Route definitions and navigation logic
- Contains: `index.ts` with route config and middlewares
- Key files: `index.ts` (exports router instance and Routes constant)

**`src/types/`:**
- Purpose: TypeScript type definitions
- Contains: Interfaces, types, enums
- Key files: `index.ts` (all types exported)

**`src/schemas/`:**
- Purpose: Runtime data validation schemas
- Contains: Valibot schema definitions
- Key files: `SavedUserData.ts`, `SaveablePlaylist.ts`, `index.ts`

**`src/utils/`:**
- Purpose: Pure utility functions
- Contains: Helpers for formatting, data transformation
- Key files: `common.ts`
- Auto-imported: All exports automatically available

**`src/assets/`:**
- Purpose: Static media files
- Contains: Images organized by type
- Subdirectories: `images/cursor/`, `images/pieces/`

**`src/styles/`:**
- Purpose: Global CSS stylesheets
- Contains: Custom CSS files
- Key files: `cursor.css`

**`public/`:**
- Purpose: Static files served at root
- Contains: PWA icons, logo
- Key files: `logo.png`, `pwa-192x192.png`, `pwa-512x512.png`

## Key File Locations

**Entry Points:**
- `index.html`: HTML entry, loads Vite and mounts point
- `src/main.ts`: JavaScript entry, bootstraps Vue app
- `src/App.vue`: Vue root component

**Configuration:**
- `vite.config.ts`: Build and dev server config
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: TypeScript config
- `pika.config.js`: Styling system config
- `package.json`: Project metadata and dependencies
- `.env.development`: Environment variables for dev

**Core Logic:**
- `src/composables/useMusicStore.ts`: Music data and playback state (432 lines)
- `src/composables/useAudioPlayer.ts`: Audio player logic
- `src/composables/useAppStore.ts`: App-level state (theme, background)
- `src/router/index.ts`: Routing and middlewares (180 lines)

**Testing:**
- Not detected

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `MusicPlayer.vue`, `DefaultLayout.vue`)
- Composables: camelCase with `use` prefix (e.g., `useMusicStore.ts`, `useAudioPlayer.ts`)
- Utilities: camelCase (e.g., `common.ts`)
- Types/Schemas: PascalCase (e.g., `SavedUserData.ts`)
- Views: PascalCase (e.g., `Playlist.vue`)

**Directories:**
- Lowercase with hyphens: Not used
- Lowercase plural: `components`, `composables`, `views`, `types`, `schemas`, `utils`, `assets`, `styles`

**Components:**
- Generic UI components: `Ui` prefix (e.g., `UiDialog`, `UiSlider`, `UiTooltip`)
- Internal components: `_` prefix (e.g., `_UiToast.vue`, `_UiConfirmDialog.vue`)
- Domain components: Descriptive names (e.g., `MusicPlayer`, `PlaylistDropdownMenu`)

**TypeScript:**
- Interfaces: PascalCase (e.g., `MusicData`, `SavedUserData`, `Playlist<Id>`)
- Types: PascalCase with `Id` suffix for ID types (e.g., `PlaylistId`, `CustomPlaylistId`)
- Functions: camelCase (e.g., `getMusicData`, `togglePlay`)
- Constants: camelCase for objects, SCREAMING_SNAKE_CASE for primitives (e.g., `Routes`, `MAX_HISTORY_LENGTH`)

## Where to Add New Code

**New Feature:**
- Primary code: `src/composables/use{FeatureName}.ts` for logic
- UI: `src/components/{FeatureName}.vue` for component
- Types: Add to `src/types/index.ts`
- Tests: Not applicable (no test setup)

**New Component/Module:**
- Implementation: `src/components/{ComponentName}.vue`
- If generic UI: Use `Ui` prefix, place in `src/components/Ui*.vue`
- If domain-specific: Use descriptive name in `src/components/{DomainName}*.vue`

**New Route/View:**
- View component: `src/views/{ViewName}.vue`
- Route definition: Add to `src/router/index.ts` routes array
- Route name: Add to `Routes` constant in `src/router/index.ts`

**New Composable:**
- Shared logic: `src/composables/use{Name}.ts`
- Store: `src/composables/use{Domain}Store.ts` (e.g., `useMusicStore.ts`)
- Auto-imported: Exports automatically available in all components

**New Type/Interface:**
- Type definitions: `src/types/index.ts`
- Validation schema: `src/schemas/{SchemaName}.ts`, export from `src/schemas/index.ts`

**Utilities:**
- Shared helpers: `src/utils/common.ts` or new file in `src/utils/`
- Auto-imported: Exports from `src/utils/` automatically available

**Styles:**
- Global CSS: `src/styles/{name}.css`, import in `src/main.ts`
- Component styles: Use PikaCSS inline via `pika()` function

**Assets:**
- Images: `src/assets/images/{category}/` (e.g., `cursor/`, `pieces/`)
- Static files: `public/` for root-served files

## Special Directories

**`node_modules/`:**
- Purpose: Installed npm dependencies
- Generated: Yes (via pnpm install)
- Committed: No

**`dist/` and `dev-dist/`:**
- Purpose: Build output
- Generated: Yes (via Vite build)
- Committed: No

**`.planning/`:**
- Purpose: Project planning documents
- Generated: Manually/via tools
- Committed: Yes

**Auto-generated files:**
- `auto-imports.d.ts`: Type definitions for auto-imported composables/utils
- `components.d.ts`: Type definitions for auto-imported components
- `pika.gen.ts`: Generated PikaCSS utility types
- `pika.dev.css`: Development CSS output
- Generated: Yes (via unplugin-auto-import and PikaCSS)
- Committed: Yes (for better IDE support)

---

*Structure analysis: 2026-01-29*
