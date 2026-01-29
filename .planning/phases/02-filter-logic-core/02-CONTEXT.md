# Phase 2: Filter Logic Core - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract marks from current playlist's tracks and reactively filter tracks based on user selections using OR logic. Each mark displays with a track count badge. Filter state clears when navigating away or switching playlists.

</domain>

<decisions>
## Implementation Decisions

### Mark extraction and data source
- Marks are extracted from `ResourceBgm.mark` field on each track
- Use existing `useMusicStore.musicsGroupedByCover` Map as the data source
- Marks are extracted from **current playlist's tracks only**, not all available marks
- Display marks in the original Map order (maintains first-appearance order, with `/logo.png` last)
- Empty marks, special values, and edge cases: Claude's discretion

### Badge count behavior
- Badge displays **simple number** (e.g., "5", not "(5)" or "5 tracks")
- Badge counts tracks **in current playlist** that have that mark
- Badge number **remains unchanged** when filters are active (no dynamic recalculation)
- Marks with **0 tracks are hidden** from the dropdown entirely

### Filter state management
- Filter state stored in `Playlist.vue` as local state
- Data structure: `Set<string>` (selected mark names)
- Bound to `PlaylistFilterDropdown` via `v-model`
- Filtered tracks computed using **`computed()` property** for reactivity
- **Immediate calculation** on every filter state change (no debounce)

### Filter state lifecycle
- **Auto-clear on playlist switch** — Watch playlist ID changes, reset filter state
- **Auto-clear on page leave** — Component unmount naturally clears local state
- When filtered result is empty, **display empty state message** ("No tracks match selected marks" or similar)

### Claude's Discretion
- Specific empty state message text and styling
- Handling of edge cases (invalid marks, corrupted data)
- Exact implementation of OR logic filtering
- Performance optimizations if needed for large playlists

</decisions>

<specifics>
## Specific Ideas

- Existing codebase structure: `useMusicStore.musicsGroupedByCover` is already `Map<string, MusicData[]>` where keys are marks in order
- Data type: `ResourceBgm` has `mark: string` field
- Vue patterns: Use `v-model` binding between parent and child component

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-filter-logic-core*
*Context gathered: 2026-01-30*
