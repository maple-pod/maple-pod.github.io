# Playlist Mark Filter

## What This Is

A mark-based filtering feature for the playlist view that allows users to filter music tracks by selecting multiple marks using OR logic. Users can click a filter toggle button to open a dropdown menu displaying all unique marks from the current playlist, select multiple marks, and see only tracks that match any of the selected marks.

## Core Value

Users can quickly find specific tracks in a playlist by filtering through marks without manually scrolling through the entire list.

## Requirements

### Validated

- ✓ Music playback with playlist support — existing
- ✓ Playlist view with track listing — existing
- ✓ ResourceBgm data structure with mark field — existing
- ✓ Vue 3 + TypeScript + Composition API architecture — existing
- ✓ PikaCSS styling system — existing
- ✓ Pinia state management — existing

### Active

- [ ] Display filter toggle button with `i-f7:funnel` icon alongside PlaylistDropdownMenu
- [ ] Toggle button shows active/inactive state based on whether filters are applied
- [ ] Dropdown menu dynamically extracts unique marks from current playlist's tracks
- [ ] Marks listed in order of first appearance in playlist
- [ ] Users can select multiple marks (checkboxes)
- [ ] Filtered tracks display when any selected mark matches (OR logic)
- [ ] "Clear all" button within dropdown to reset all selections
- [ ] All tracks shown when no marks selected (default state)
- [ ] Filter state clears when navigating away from playlist

### Out of Scope

- Persisting filter state across page reloads — filter resets on navigation
- Filtering empty/null marks — data should not contain these cases
- AND logic filtering — only OR logic supported
- Multiple filter criteria beyond marks — only mark filtering for now
- Sorting marks by frequency or alphabetically — preserve extraction order

## Context

**Existing Playlist Architecture:**
- Playlist view located at `src/views/Playlist.vue`
- Music data managed via `useMusicStore` Pinia store
- ResourceBgm type includes `mark: string` field
- PlaylistDropdownMenu component exists as reference for dropdown UI pattern
- Icon system via `@pikacss/plugin-icons` (usage: `i-f7:funnel`)

**Technical Environment:**
- Vue 3.5.16 with Composition API
- TypeScript 5.8.0 for type safety
- PikaCSS for component styling
- reka-ui for headless UI components (potential dropdown base)
- Component auto-import via unplugin-vue-components

**User Experience:**
- Component appears alongside existing playlist controls
- Non-intrusive: hidden until user clicks toggle button
- Quick access: single click to open, multi-select, immediate filtering
- Clear feedback: button shows filter active state

## Constraints

- **Tech Stack**: Must use Vue 3 Composition API with TypeScript — consistency with codebase
- **Styling**: Must use PikaCSS pattern — matches existing component styling
- **Icon**: Must use `i-f7:funnel` from PikaCSS icons — specified requirement
- **State Management**: Local component state only — filter state is ephemeral
- **Data Source**: Marks extracted from current playlist only — scoped to active context
- **Compatibility**: Must work within existing Playlist view layout — no breaking changes

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| New standalone component vs extending PlaylistDropdownMenu | Separate concerns: filtering is distinct from playlist actions | — Pending |
| Dropdown implementation (reka-ui vs custom) | Need to evaluate existing dropdown patterns in codebase | — Pending |
| Mark extraction timing (computed vs watch) | Performance consideration for large playlists | — Pending |
| Filter state location (component local vs composable) | Simple ephemeral state doesn't need shared store | — Pending |

---
*Last updated: 2026-01-29 after initialization*
