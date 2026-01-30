# Project Research Summary

**Project:** Mark-based Multi-select Filter Dropdown for Music Playlist
**Domain:** Vue 3 PWA Component Development
**Researched:** 2026-01-29
**Confidence:** HIGH

## Executive Summary

This project adds a mark-based filtering dropdown to an existing Vue 3 music player PWA. The recommended approach leverages the existing reka-ui component library (already integrated) to build a multi-select checkbox dropdown with OR-logic filtering. The implementation requires zero new dependencies since all necessary tools (reka-ui 2.3.0, Vue 3.5.16, @vueuse/core, TypeScript 5.8.0) are already present in the project.

The architecture follows existing patterns: extend `UiDropdownMenu.vue` (already in codebase) for the filter UI, use local component state (not Pinia) for ephemeral filter selections, and compute filtered results via declarative `computed()` properties. This aligns with how the project currently handles view-specific UI state and ensures consistency with patterns like `PlaylistDropdownMenu.vue`.

Key risks center on reactivity performance (deep vs shallow refs), memory leaks from event listener cleanup, and accessibility requirements. All are mitigable through established Vue 3 patterns: use `shallowRef()` for large track arrays, rely on reka-ui's built-in event management, and leverage reka-ui's WAI-ARIA compliance. The critical path is Phase 1 (core filtering with proper reactivity patterns from day one) — architectural decisions here determine whether the component scales to 200+ tracks without performance degradation.

## Key Findings

### Recommended Stack

The project already has the complete stack required. No new installations needed. The recommended approach is to extend existing components rather than add dependencies.

**Core technologies:**
- **reka-ui DropdownMenu + CheckboxItem (2.3.0)**: Already integrated; provides accessible, WAI-ARIA compliant menu primitives with built-in keyboard navigation and multi-select checkbox support
- **Vue 3 Composition API (3.5.16)**: Project standard; enables clean separation of logic using local refs for ephemeral UI state
- **PikaCSS (0.0.29)**: Existing styling system with `hover-mask`, `card`, `icon-btn` shortcuts ready for reuse
- **TypeScript (5.8.0)**: Essential for defining filter state types (Set<string>) and mark union types for compile-time safety

**Implementation pattern:**
Extend `UiDropdownMenu.vue` (existing component) → Add multi-select CheckboxItem support → Create composable pattern for filter logic → Integrate into `Playlist.vue` view. This follows the exact pattern used by `PlaylistDropdownMenu.vue` in the codebase.

### Expected Features

**Must have (table stakes):**
- **Clear All button** — Users expect quick reset without deselecting each mark individually (already specified in requirements)
- **Visual checkbox indicators** — Multi-select requires clear visual state with WCAG 3:1 contrast ratio for accessibility
- **Filter active state on button** — Badge showing "3 filters active" prevents confusion about whether filter is applied
- **Close on outside click** — Standard "light dismiss" pattern expected since 2020+
- **Keyboard navigation** — Arrow keys, Space, Enter, Escape; accessibility requirement for WCAG 2.2 compliance
- **Empty state handling** — Disable/hide button when no marks exist to prevent confusing empty dropdown
- **Zero-result feedback** — Show message when selected marks yield no tracks to prevent "Did the filter break?" confusion

**Should have (competitive):**
- **Search within marks list** — For playlists with 15+ unique marks, scrolling is tedious; fuzzy search reduces cognitive load
- **Selected marks count badge** — Shows "3 filters active" on button without opening dropdown
- **Mark count next to each mark** — "(12)" next to "Boss Battle" helps prioritize selections and prevents zero-result frustration
- **Select All / Deselect All** — Reduces clicks for bulk operations when user wants "almost everything"

**Defer (v2+):**
- **Keyboard shortcut to open filter** — Wait for analytics on usage frequency before adding keybinding
- **Animated result count** — Polish feature; defer until performance proven solid at scale
- **Persist visual state in dropdown** — Checked marks stay at top; UX quality of life, not core functionality

**Anti-features to avoid:**
- AND logic filtering (creates zero-result states, cognitive overhead)
- Nested mark categories (over-engineering; marks are flat tags)
- Real-time animation during filter (performance risk with large playlists)

### Architecture Approach

Use **local component state** pattern (not URL sync, not Pinia store) since filter state is ephemeral and view-specific. The filter component exposes a `computed` property via `defineExpose()` that parent consumes via template ref — this avoids prop drilling and follows Vue 3.3+ best practices.

**Major components:**
1. **MarkFilterDropdown.vue** — UI wrapper using `UiDropdownMenu`, manages local `selectedMarks: ref(new Set<string>())`, exposes `filteredItems` computed property
2. **Playlist.vue (parent)** — Consumes filtered data via template ref, resets filter on navigation via route watcher
3. **useMusicStore** — Unchanged; provides read-only access to playlist data and music metadata

**Data flow:** User toggles checkbox → `selectedMarks.add(mark)` → `filteredItems` computed re-runs → `UiVerticalList` re-renders with new items. Filter state resets on route param change (new playlist ID).

**Integration point:** Add filter button in `Playlist.vue` header (line 157, next to `PlaylistDropdownMenu`), update `UiVerticalList` items binding (line 170) to use `filterRef?.filteredItems ?? items`.

### Critical Pitfalls

1. **Deep reactivity overhead on large lists** — Using `ref()` instead of `shallowRef()` for track arrays causes massive memory consumption and janky UI with 100+ tracks. **Prevention:** Use `shallowRef()` from day one for source track list. Only make filter criteria (selected marks) fully reactive.

2. **Memory leaks from click-outside event listeners** — Dropdown registers `click`/`keydown` listeners on `window` but fails to remove them on unmount. **Prevention:** Use reka-ui's built-in event management (it handles cleanup automatically) or VueUse's `onClickOutside`. If custom: use `AbortController` pattern for automatic cleanup.

3. **Computed vs. watch for filter logic** — Using `watch()` with manual state updates causes unnecessary re-renders, infinite loops, or stale results. **Prevention:** Always use `computed()` for derived filter results — it's declarative, lazy, cached, and automatically handles multiple dependencies.

4. **Filter state not clearing on navigation** — Filter persists when user navigates between playlists, causing wrong results or crashes. **Prevention:** Add `watch(() => route.params.playlistId, () => selectedMarks.value.clear())` to reset filter when playlist changes.

5. **Missing accessibility** — Custom dropdown without keyboard navigation, screen readers can't announce state changes. **Prevention:** Use reka-ui's `DropdownMenuCheckboxItem` (provides WAI-ARIA compliance, keyboard navigation, focus management automatically).

6. **Dropdown positioning overflow** — Dropdown cut off at bottom of viewport or hidden by `overflow: hidden` parent. **Prevention:** Use `DropdownMenuPortal` with `position="popper"` for smart collision detection and viewport-aware positioning.

7. **TypeScript type safety** — Filter accepts invalid mark values, causing runtime errors. **Prevention:** Define `type Mark = '10' | '9' | '8' | ...` union type and use `ref<Set<Mark>>()` for compile-time validation.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Core Filtering Component (Isolated)
**Rationale:** Build and verify filtering logic independently before integration. Must establish correct reactivity patterns (`shallowRef` + `computed`) from day one — refactoring later requires touching all filter logic. This phase validates the reka-ui multi-select pattern and ensures no new dependencies needed.

**Delivers:** Standalone `MarkFilterDropdown.vue` component with hardcoded test marks, multi-select checkboxes, "Clear All" button, keyboard navigation (via reka-ui), and filter active state visual feedback.

**Addresses (from FEATURES.md):**
- Clear All button (table stakes)
- Visual checkbox indicators (table stakes)
- Filter active state on button (table stakes)
- Keyboard navigation (accessibility requirement)

**Avoids (from PITFALLS.md):**
- Pitfall #3: Use `computed()` for filter logic, not `watch()`
- Pitfall #5: Use reka-ui's `CheckboxItem` for automatic accessibility
- Pitfall #6: Use `DropdownMenuPortal` + `position="popper"` from start

**Critical decision:** Must use `shallowRef()` for source track list even during prototyping. Switching from `ref()` to `shallowRef()` later requires regression testing all reactivity behavior.

**Estimated effort:** 2-3 hours

---

### Phase 2: Data Integration & Store Connection
**Rationale:** Connect filter to real playlist data from `useMusicStore`. This phase uncovers any data structure mismatches (e.g., tracks without marks, undefined values) before full UI integration. Validates OR-logic filtering with real data edge cases (empty playlists, single-mark playlists).

**Delivers:** Filter component accepts `playlistId` prop, computes `availableMarks` from store, implements `filteredItems` computed property, exposes state via `defineExpose()` for parent consumption.

**Uses (from STACK.md):**
- `useMusicStore.ts` — Read-only access to playlists and music data
- TypeScript union types — Define `Mark` type from actual mark values in data
- Computed properties — Declarative filtering with automatic caching

**Implements (from ARCHITECTURE.md):**
- Local component state pattern (not Pinia, not URL sync)
- `defineExpose({ filteredItems })` for parent consumption
- Mark extraction: `computed(() => new Set(playlist.value.list.map(id => getMusicData(id)?.data.mark).filter(Boolean)))`

**Avoids (from PITFALLS.md):**
- Pitfall #1: Use `shallowRef()` for track array (performance)
- Pitfall #7: Define `Mark` union type for compile-time safety

**Estimated effort:** 1-2 hours

---

### Phase 3: Playlist View Integration
**Rationale:** Integrate filter into live playlist view where real user interactions occur. This phase exposes navigation bugs (filter state persisting), layout issues (button placement), and responsive design problems. Must add route watcher to reset filter state — critical for Phase 4 testing across multiple playlists.

**Delivers:** Filter button added to `Playlist.vue` header (next to `PlaylistDropdownMenu`), `UiVerticalList` consumes filtered results, filter resets on route param change, visual feedback for active filters.

**Addresses (from FEATURES.md):**
- Close on outside click (reka-ui provides this)
- Empty state handling (disable button when no marks)
- Zero-result feedback (show message when filter excludes all tracks)

**Implements (from ARCHITECTURE.md):**
- Parent-child communication via template ref: `filterRef?.filteredItems ?? items`
- Route watcher: `watch(() => route.params.playlistId, () => filterRef?.reset())`
- Integration point: `Playlist.vue` line 157 (header) + line 170 (items binding)

**Avoids (from PITFALLS.md):**
- Pitfall #4: Add route watcher to clear filter on navigation
- Pitfall #2: Rely on reka-ui's built-in event cleanup (no custom listeners)

**Estimated effort:** 1 hour

---

### Phase 4: Polish & Validation
**Rationale:** Finalize user-facing details that distinguish "working" from "production-ready." This phase validates accessibility with real screen reader testing (NVDA/VoiceOver), confirms performance with realistic data (load 200+ tracks), and tests mobile viewport edge cases. No architectural changes — only refinements.

**Delivers:** Filter count badge on trigger button, "No results" empty state with helpful message, accessibility audit with screen reader validation, performance testing with large playlists (200+ tracks), mobile viewport testing (320px width, on-screen keyboard).

**Addresses (from FEATURES.md):**
- Selected marks count badge (competitive advantage)
- Zero-result feedback (UX quality of life)

**Avoids (from PITFALLS.md):**
- Pitfall #5: Manual accessibility audit (unplug mouse test, axe-core scan)
- Pitfall #1: Performance verification with 200+ tracks (memory profiling)
- Pitfall #6: Mobile positioning test (bottom of viewport, keyboard open)

**Estimated effort:** 1-2 hours

---

### Phase Ordering Rationale

1. **Isolated → Integrated:** Phase 1 validates reka-ui patterns before committing to architecture. Discovering multi-select limitations after full integration would require major refactoring.

2. **Data before UI:** Phase 2 uncovers data structure issues (missing marks, undefined values) before visual integration makes debugging harder.

3. **Integration before polish:** Phase 3 exposes navigation and layout bugs that affect Phase 4 feature decisions (e.g., badge placement depends on button position in header).

4. **Critical path = Phase 1 reactivity decisions:** Using `ref()` instead of `shallowRef()` in Phase 1 creates technical debt that compounds — switching later requires regression testing all phases.

5. **Deferred features stay deferred:** Research shows current mark count (estimated ~10-30) doesn't need search functionality yet. Phase 2 validates this assumption with real data; if mark count >50, add Phase 5 for search.

### Research Flags

**Phases needing deeper research during planning:**
- **None** — This is a well-documented domain (Vue 3 Composition API + reka-ui integration). All patterns verified against existing codebase (`PlaylistDropdownMenu.vue`, `UiDropdownMenu.vue`).

**Phases with standard patterns (skip research-phase):**
- **Phase 1-4** — Established Vue 3 + reka-ui patterns. Follow existing codebase conventions. No novel integration challenges identified.

**Validation triggers:**
If during implementation you discover:
- Mark count exceeds 50 → Add Phase 5 for search/virtual scrolling (research: Fuse.js integration, `vue-virtual-scroller`)
- Need to persist filter across sessions → Research: Pinia store integration + localforage pattern (see existing `SavedUserData` interface)
- Multiple filter dimensions needed (marks + year + genre) → Research: filter composability patterns and UI redesign

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | All dependencies already installed; reka-ui 2.3.0 API verified from official docs; patterns match existing `PlaylistDropdownMenu.vue` implementation |
| Features | **HIGH** | Table stakes features well-documented (multi-select UI patterns 2026); competitive features validated via Spotify/Apple Music competitor analysis; anti-patterns identified from UX research |
| Architecture | **HIGH** | Local state pattern matches existing codebase (`open` state in `UiDropdownMenu`); `defineExpose` pattern is Vue 3.3+ standard; integration points verified in `Playlist.vue` source |
| Pitfalls | **HIGH** | Critical pitfalls verified from 2026 Vue performance best practices (shallowRef, computed over watch); reka-ui accessibility features documented in official API; TypeScript union type pattern is standard |

**Overall confidence:** **HIGH**

All recommendations grounded in:
1. Existing codebase analysis (patterns already working in production)
2. Official documentation (reka-ui, Vue 3.5, TypeScript 5.8)
3. 2026 web standards (WAI-ARIA 1.2, WCAG 2.2, AbortController)

### Gaps to Address

**Gap 1: Actual mark count in production data**
**Impact:** If mark count >50, Phase 1-3 roadmap remains valid but Phase 4 should include search functionality instead of just polish.
**Resolution:** Phase 2 will compute `availableMarks` from real data. If `availableMarks.size > 50`, flag for PM review — may adjust Phase 4 scope or add Phase 5.

**Gap 2: Performance threshold validation**
**Impact:** Research recommends `shallowRef()` for >100 tracks, but project-specific performance depends on device targets (mobile vs desktop, CPU/memory constraints).
**Resolution:** Phase 4 includes performance profiling with 200 tracks on target devices. If initial page load >500ms or memory usage >10MB, validate `shallowRef()` is correctly applied in Phase 1. If profiling shows no issues with `ref()`, document for future scale decisions.

**Gap 3: Mark label formatting**
**Impact:** Research assumes marks are user-facing strings (e.g., "Boss Battle"). If marks are IDs (e.g., "mark_001"), need label mapping logic.
**Resolution:** Phase 2 data integration will expose this. If marks are IDs, add `markLabel()` computed function to map ID → display name using existing mark metadata from store.

**Gap 4: Filter persistence user expectation**
**Impact:** Research recommends ephemeral filter (resets on navigation) per standard patterns. If user testing shows expectation for persistence, requires Pinia + localforage integration.
**Resolution:** Ship with ephemeral behavior (Phase 1-4). Gather usage analytics post-launch. If users frequently reapply same filters, add persistence as Phase 5 based on data, not assumption.

## Sources

### Primary (HIGH confidence)
- **reka-ui official documentation** — https://reka-ui.com/docs/components/dropdown-menu — DropdownMenu, CheckboxItem, ItemIndicator APIs; accessibility features; keyboard navigation behavior
- **Project codebase analysis** — `src/views/Playlist.vue` (integration point), `src/components/PlaylistDropdownMenu.vue` (dropdown pattern), `src/components/UiDropdownMenu.vue` (component structure), `src/composables/useMusicStore.ts` (data access layer), `pika.config.js` (styling shortcuts)
- **Vue 3.5 Composition API** — Official docs + 2026 performance improvements (computed optimization with version counting)
- **TypeScript 5.8** — Union type patterns for compile-time validation

### Secondary (MEDIUM confidence)
- **Multi-select UI patterns (2026)** — Web search aggregation from multiple sources; corroborated patterns (checkbox indicators, Clear All button, keyboard navigation)
- **Music filtering UX research** — Competitor analysis (Spotify, Apple Music) from web search; observable patterns in live products
- **Accessibility patterns** — W3C WAI-ARIA Authoring Practices Guide (APG) Combobox Pattern
- **Performance optimization thresholds** — General Vue community consensus (100-200 tracks for virtual scrolling); not project-specific profiling

### Tertiary (LOW confidence)
- **Virtual scrolling thresholds** — Flagged as general guidance; needs validation with project-specific data and devices
- **Mark count estimates** — Inferred from `useMusicStore.ts` grouping by cover image; actual count unknown until Phase 2

---
*Research completed: 2026-01-29*
*Ready for roadmap: yes*
