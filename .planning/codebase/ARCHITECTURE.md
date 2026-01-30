# Architecture

**Analysis Date:** 2026-01-29

## Pattern Overview

**Overall:** Single Page Application (SPA) with Vue 3 Composition API

**Key Characteristics:**
- Component-based UI with Vue 3 Composition API
- State management via Pinia stores
- Auto-imported composables for shared logic
- Progressive Web App (PWA) with offline support
- Client-side routing with middleware pattern

## Layers

**Presentation Layer (Views & Components):**
- Purpose: User interface and interaction handling
- Location: `src/views/`, `src/components/`
- Contains: Vue components with Composition API setup
- Depends on: Composables, Types, Utils
- Used by: Router, App root

**Business Logic Layer (Composables):**
- Purpose: Reusable reactive logic and state management
- Location: `src/composables/`
- Contains: Composable functions (`use*` pattern), Pinia stores
- Depends on: Types, Utils, Schemas, External libraries
- Used by: Components, Views, Router middlewares

**Data Layer (Types & Schemas):**
- Purpose: Type definitions and data validation
- Location: `src/types/`, `src/schemas/`
- Contains: TypeScript interfaces, Valibot validation schemas
- Depends on: Valibot library
- Used by: All layers

**Utility Layer:**
- Purpose: Pure helper functions
- Location: `src/utils/`
- Contains: Common utilities (formatting, data transformation)
- Depends on: fflate, Vue utilities
- Used by: Composables, Components

**Routing Layer:**
- Purpose: Navigation and route guards
- Location: `src/router/`
- Contains: Route definitions, middleware handlers
- Depends on: Composables, Types, Schemas, Components
- Used by: App bootstrap

## Data Flow

**Music Playback Flow:**

1. User interacts with Playlist view (`src/views/Playlist.vue`)
2. Component calls `useMusicStore().play(playlist, musicId)`
3. Store updates `currentPlaylist` and delegates to `audioPlayerLogic.play()`
4. `useAudioPlayer` composable manages queue via `useAudioQueue`
5. Audio source loaded via `useAudio` composable
6. Playback state syncs to `navigator.mediaSession` for OS integration
7. Components reactively update via Pinia `storeToRefs()`

**State Management:**
- Global state managed by Pinia stores (`useMusicStore`, `useAppStore`)
- User preferences persisted via `useLocalStorage` in `useSavedUserData`
- Offline music cached in IndexedDB via `localforage`
- State changes trigger reactive UI updates

## Key Abstractions

**Composables Pattern:**
- Purpose: Encapsulate and reuse reactive logic
- Examples: `src/composables/useMusicStore.ts`, `src/composables/useAudioPlayer.ts`, `src/composables/useAppStore.ts`
- Pattern: Functions prefixed with `use`, return reactive refs/computed

**Store Pattern:**
- Purpose: Centralized state management
- Examples: `useMusicStore` (music data, playlists, playback), `useAppStore` (UI state, theme, background)
- Pattern: Pinia `defineStore` with Composition API syntax

**Dialog/Toast Pattern:**
- Purpose: Imperative UI overlays
- Examples: `useAppDialog`, `useUiToast`, `useUiConfirmDialog`
- Pattern: Composable returns component + imperative API (dialog(), confirm(), toast())

**Audio Queue Pattern:**
- Purpose: Manage playback order with random/repeat
- Location: `src/composables/useAudioQueue.ts`, `src/composables/useAudioPlayer.ts`
- Pattern: Queue manipulation with history tracking

## Entry Points

**Browser Entry:**
- Location: `src/main.ts`
- Triggers: HTML loads `index.html` → Vite loads entry
- Responsibilities: Create Vue app, install Pinia/Router/Head, mount to DOM

**App Root:**
- Location: `src/App.vue`
- Triggers: Vue app mounted
- Responsibilities: Setup global event listeners, render layout/router-view, show dialogs/toasts

**Router Entry:**
- Location: `src/router/index.ts`
- Triggers: Navigation events
- Responsibilities: Route matching, middleware execution, lazy-load views

**Default Layout:**
- Location: `src/components/DefaultLayout.vue`
- Triggers: Root route matched
- Responsibilities: App chrome (header, player, panels), nested router-view

## Error Handling

**Strategy:** Defensive checks with console warnings, no global error boundary

**Patterns:**
- Optional chaining for null safety (`playlist?.id`)
- Early returns in functions when data unavailable
- Validation with Valibot schemas before processing external data
- Try-catch in async operations (e.g., git commit hash in `vite.config.ts`)
- No explicit error components or toast notifications for errors

## Cross-Cutting Concerns

**Logging:** Console.warn for invalid data (e.g., playlist validation in `useMusicStore`)

**Validation:** Valibot schemas in `src/schemas/` for user data import/export

**Authentication:** Not applicable (client-only app, no auth)

**State Persistence:**
- `useLocalStorage` for user preferences (`useSavedUserData`)
- IndexedDB via `localforage` for offline music blobs
- Service Worker caching via Vite PWA plugin

**Offline Support:**
- Service Worker with Workbox runtime caching
- LocalForage for music blob storage
- Online/offline detection via `useOnline` composable
- Disabled state for unavailable offline music

**Styling:**
- PikaCSS utility-first approach via `pika()` function calls
- Scoped to component via inline style objects
- Generated at build time to `pika.gen.ts`

---

*Architecture analysis: 2026-01-29*
