# Architecture Research: Mark Filter Dropdown Component

**Domain:** Vue 3 Multi-Select Filter Component
**Researched:** 2026-01-29
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────┐
│                      Playlist.vue (Parent)                      │
│  - Uses filtered track list                                     │
│  - Passes playlistId prop                                       │
│  - Resets filter on navigation (via route watcher)              │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          MarkFilterDropdown.vue (Component)               │  │
│  │  ┌────────────────────┐    ┌─────────────────────────┐   │  │
│  │  │  FilterTrigger     │    │   FilterContent         │   │  │
│  │  │  - Shows count     │───▶│   - Checkbox list       │   │  │
│  │  │  - Opens dropdown  │    │   - Select/Clear all    │   │  │
│  │  └────────────────────┘    └─────────────────────────┘   │  │
│  │                                                             │  │
│  │  Internal State:                                            │  │
│  │  - selectedMarks: Set<string> (local component state)      │  │
│  │  - open: boolean (dropdown open/closed)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│                   Computed Data Flow Layer                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  availableMarks: computed(() => Set<string>)              │  │
│  │  - Extracts unique marks from current playlist            │  │
│  │                                                             │  │
│  │  filteredItems: computed(() => MusicData[])               │  │
│  │  - Filters playlist.list by selectedMarks (OR logic)      │  │
│  │  - Falls back to full list if no selection                │  │
│  └──────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────┤
│                  useMusicStore (Global State)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │  playlists   │  │  musicData   │  │  getPlaylist()   │     │
│  └──────────────┘  └──────────────┘  └──────────────────┘     │
└────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **MarkFilterDropdown.vue** | UI wrapper for filter dropdown | Uses `UiDropdownMenu` from existing UI library, manages local `selectedMarks` state |
| **FilterTrigger (slot)** | Button showing filter status | Icon button with badge showing selected count |
| **FilterContent (slot)** | Checkbox list of marks | Scrollable list, "Select All" / "Clear" actions |
| **Playlist.vue** | Consumes filtered data | Reads `filteredItems` instead of raw `playlist.list` |

## Recommended Component Structure

```
src/
├── components/
│   ├── MarkFilterDropdown.vue      # Main filter component
│   └── UiDropdownMenu.vue          # Existing (reused)
├── views/
│   └── Playlist.vue                # Integrates filter + renders list
└── composables/
    └── useMusicStore.ts            # Existing (no changes needed)
```

### Structure Rationale

- **Single-file component:** Since this is a feature-specific component (not a generic reusable filter), keep it as one SFC in `components/`
- **No new composable needed:** The filter logic is simple (set membership check) and tightly coupled to the UI, so a local `ref` is sufficient
- **Leverage existing patterns:** Reuse `UiDropdownMenu` exactly like `PlaylistDropdownMenu` does

## Architectural Patterns

### Pattern 1: Local Component State (Not URL Sync)

**What:** Filter state lives in the component via `ref(new Set<string>())`. It does NOT sync to URL or global store.

**When to use:**
- Ephemeral UI state (filters that reset on navigation)
- No need for shareability or deep-linking
- Performance-critical (avoids router overhead)

**Trade-offs:**
- ✅ Simple, no boilerplate
- ✅ No URL pollution for temporary filters
- ❌ State lost on page refresh (acceptable for this feature)

**Example:**
```typescript
// MarkFilterDropdown.vue
const selectedMarks = ref(new Set<string>())

// Reset on navigation
watch(() => props.playlistId, () => {
	selectedMarks.value.clear()
})
```

### Pattern 2: Computed Filtering (Not Store Mutation)

**What:** The filter component exposes a `computed` property that filters the original data. The parent consumes this computed value instead of mutating the source.

**When to use:**
- When multiple components need the unfiltered data
- When you want to preserve the original data structure
- When filtering logic is presentational (UI-only concern)

**Trade-offs:**
- ✅ Pure (no side effects)
- ✅ Testable (just test the computed function)
- ❌ Re-computes on every reactive dependency change (acceptable for <1000 items)

**Example:**
```typescript
const filteredItems = computed(() => {
	if (selectedMarks.value.size === 0) {
		return items.value // Show all if no filter
	}
	return items.value.filter(music =>
		selectedMarks.value.has(music.data.mark)
	)
})
```

### Pattern 3: Compound Component (Via Slots)

**What:** Instead of a monolithic `MarkFilterDropdown`, use the existing `UiDropdownMenu` as the structural component and inject custom content via slots.

**When to use:**
- When you already have a headless dropdown primitive (like `UiDropdownMenu`)
- When you want flexibility for future filter types

**Trade-offs:**
- ✅ Follows project conventions (see `PlaylistDropdownMenu`)
- ✅ Separation of concerns (dropdown logic vs. filter logic)

**Example:**
```vue
<UiDropdownMenu v-model:open="isOpen">
  <template #trigger>
    <button class="icon-btn">
      <div class="i-f7:line-horizontal-3-decrease" />
      <span v-if="selectedMarks.size > 0">{{ selectedMarks.size }}</span>
    </button>
  </template>
  <template #menu>
    <!-- Custom checkbox list -->
  </template>
</UiDropdownMenu>
```

## Data Flow

### Request Flow

```
[User clicks filter trigger]
    ↓
[UiDropdownMenu opens (open = true)]
    ↓
[User toggles checkbox] → [selectedMarks.add(mark) / .delete(mark)]
    ↓
[filteredItems computed re-runs]
    ↓
[UiVerticalList re-renders with new items]
```

### State Management Pattern

```
┌─────────────────────────────────────────┐
│         useMusicStore (Global)          │
│  - playlists (source of truth)          │
│  - musicData (readonly lookup)          │
└────────────┬────────────────────────────┘
             │ getPlaylist(id)
             ↓
┌─────────────────────────────────────────┐
│      Playlist.vue (Parent View)         │
│  - playlist: computed(() =>             │
│      getPlaylist(props.playlistId))     │
│                                          │
│  - Pass playlistId to filter ─────┐     │
│  - Consume filteredItems          │     │
└───────────────────────────────────┼─────┘
                                    │
                                    ↓
┌─────────────────────────────────────────┐
│   MarkFilterDropdown (Local State)      │
│                                          │
│  - selectedMarks: ref(new Set())        │
│  - availableMarks: computed(() =>       │
│      new Set(items.map(m => m.data.mark)))│
│  - filteredItems: computed(() =>        │
│      items.filter(m => selected.has(m.mark)))│
│                                          │
│  - defineExpose({ filteredItems })      │
└─────────────────────────────────────────┘
```

### Key Data Flows

1. **Mark Extraction:** `availableMarks = computed(() => new Set(playlist.value.list.map(id => getMusicData(id)?.data.mark).filter(Boolean)))`
2. **Filter Application:** `filteredItems = computed(() => selectedMarks.size === 0 ? items : items.filter(m => selectedMarks.has(m.data.mark)))`
3. **Reset on Navigation:** `watch(() => props.playlistId, () => selectedMarks.value.clear())`

## Integration Points

### With Existing Playlist View

**Current Structure (Playlist.vue:168-172):**
```vue
<UiVerticalList
  ref="uiVerticalListRef"
  :items
  :itemHeight="72"
>
```

**After Integration:**
```vue
<!-- Add filter button in header (line 157, next to PlaylistDropdownMenu) -->
<MarkFilterDropdown
  ref="filterRef"
  :playlistId="playlistId"
/>

<!-- Update items binding (line 170) -->
<UiVerticalList
  :items="filterRef?.filteredItems ?? items"
  ...
/>
```

### Component Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **MarkFilterDropdown ↔ Playlist.vue** | `defineExpose({ filteredItems })` | Parent reads via template ref |
| **MarkFilterDropdown ↔ useMusicStore** | `getMusicData(id)` | Read-only lookup, no mutations |
| **Playlist.vue ↔ useMusicStore** | `storeToRefs(musicStore)` | Existing pattern, unchanged |

## Anti-Patterns to Avoid

### Anti-Pattern 1: Mutating Store State for UI Filters

**What people do:** Add `filteredPlaylist` to `useMusicStore` and mutate it on filter change.

**Why it's wrong:**
- Global state for local UI concern
- Breaks if multiple views need different filters
- Requires cleanup logic on unmount

**Do this instead:** Keep filter state local, compute filtered results in the component.

### Anti-Pattern 2: Over-Engineering with Pinia/Composable

**What people do:** Create `useMarkFilter()` composable for 20 lines of logic.

**Why it's wrong:**
- Premature abstraction (YAGNI principle)
- Harder to debug (logic spread across files)
- Overkill for feature-specific logic

**Do this instead:** Start with local `ref`. Extract to composable only if reused in 3+ places.

### Anti-Pattern 3: Prop Drilling Selected Marks

**What people do:** Pass `selectedMarks` and `@update:selectedMarks` through multiple component layers.

**Why it's wrong:**
- Creates coupling between parent and child implementation details
- Hard to refactor
- Vue 3's `defineExpose` is specifically designed to avoid this

**Do this instead:** Use `defineExpose({ filteredItems })` and let parent read via template ref.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **<100 marks** | Current approach works. No optimization needed. |
| **100-500 marks** | Add virtual scrolling to dropdown (reuse `UiVerticalList`) + search input with `refDebounced` |
| **500+ marks** | Unlikely for this domain (MapleStory has ~50 map categories). If needed, use Fuse.js for fuzzy search |

### Performance Optimizations (Future)

Only implement if profiling shows issues:

1. **`v-memo` on checkbox items:** `v-memo="[isSelected(mark), mark]"`
2. **Virtual scrolling in dropdown:** Reuse `UiVerticalList` for filter options
3. **Debounced search:** `const searchQuery = refDebounced(searchInput, 300)`

## Build Order

Based on integration dependencies:

### Phase 1: Standalone Filter Component (Isolated)
- [ ] Create `MarkFilterDropdown.vue` with hardcoded marks (no playlist integration)
- [ ] Implement checkbox list UI with `UiDropdownMenu`
- [ ] Add "Select All" / "Clear" actions
- [ ] Test in Storybook/isolated route

### Phase 2: Data Integration
- [ ] Add `playlistId` prop
- [ ] Compute `availableMarks` from `useMusicStore`
- [ ] Implement `filteredItems` computed property
- [ ] Expose via `defineExpose`

### Phase 3: Playlist View Integration
- [ ] Add filter button to Playlist.vue header (line 157)
- [ ] Replace `items` binding with `filteredItems` (line 170)
- [ ] Add reset-on-navigation watcher

### Phase 4: Polish
- [ ] Add filter count badge on trigger button
- [ ] Add "No results" state when filter excludes all items
- [ ] Test with different playlists (all, liked, custom)

### Estimated Effort
- Phase 1: 2-3 hours
- Phase 2: 1-2 hours
- Phase 3: 1 hour
- Phase 4: 1 hour
- **Total: 5-7 hours**

## Component API Design

### Props
```typescript
interface Props {
	playlistId: PlaylistId
}
```

### Exposed
```typescript
interface Exposed {
	filteredItems: ComputedRef<MusicData[]>
	selectedMarks: Ref<Set<string>>
	reset: () => void
}
```

### No Emits
This component does NOT emit events. It exposes computed state for the parent to consume.

## Sources

- **Project Analysis:**
  - `src/views/Playlist.vue` (existing integration point)
  - `src/components/PlaylistDropdownMenu.vue` (dropdown pattern reference)
  - `src/composables/useMusicStore.ts` (data access layer)
  - `vite.config.ts` (auto-import configuration)

- **Vue 3 Best Practices (2026):**
  - Composition API with `<script setup>` (official standard)
  - `defineExpose` for parent-child communication (Vue 3.3+)
  - Local state for ephemeral UI (preferred over Pinia for component-local concerns)
  - Computed properties for derived data (standard reactive pattern)

- **Architecture Patterns:**
  - Headless component pattern (compound components with slots)
  - Separation of concerns (UI state vs. business logic)
  - YAGNI principle (avoid premature abstraction)

**Confidence Level:** HIGH
- All patterns verified against existing codebase
- No new dependencies required
- Follows established project conventions
- Testable and maintainable architecture

---

*Architecture research for: Mark Filter Dropdown Component*
*Researched: 2026-01-29*
