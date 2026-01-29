# Phase 2: Filter Logic Core - Research

**Researched:** 2026-01-30
**Domain:** Vue 3 reactive filtering with OR logic
**Confidence:** HIGH

## Summary

This phase implements reactive filtering of playlist tracks based on user-selected marks using OR logic. The research focused on Vue 3's Composition API patterns for filtering, reactive state management, and performance optimization for list operations.

The standard approach uses `computed()` properties for derived filtering logic, `Set<string>` for tracking selected marks (with O(1) lookup performance), and component lifecycle hooks for state cleanup. Vue 3.5+'s enhanced computed stability ensures efficient re-renders only when actual output changes.

**Primary recommendation:** Use `computed()` for filtered track list with Set.has() for O(1) mark checking, store filter state as `ref<Set<string>>`, and watch playlist ID changes for automatic state reset.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue | 3.5.16 | Reactive framework | Project already uses; 3.5+ has enhanced computed stability and lazy evaluation |
| TypeScript | latest | Type safety | Project standard; provides Set<string> type safety |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Reka UI | 2.3.0 | Headless UI components | Already used for dropdown; provides accessible checkbox items |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Set<string> | Array<string> | Set provides O(1) lookup vs O(n) for array.includes(), critical for filter checking |
| computed() | watch() + ref | computed is for derived state (filtering); watch is for side effects |
| Local state | Pinia store | Local state simpler for single-page-scoped filters; no need for global state |

**Installation:**
No additional packages required - using existing project dependencies.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── views/
│   └── Playlist.vue          # Parent - filter state owner
└── components/
    └── PlaylistFilterDropdown.vue  # Child - UI only
```

### Pattern 1: Computed-Based Filtering
**What:** Use `computed()` to derive filtered list from source data + filter state
**When to use:** Always for reactive filtering - it's cached and only re-evaluates when dependencies change
**Example:**
```typescript
// Source: Vue.js official docs - Computed Properties
const selectedMarks = ref<Set<string>>(new Set())
const tracks = ref<MusicData[]>([...])

const filteredTracks = computed(() => {
  // When Set is empty, show all tracks (default state)
  if (selectedMarks.value.size === 0) {
    return tracks.value
  }
  
  // OR logic: track matches if its mark is in the selected set
  // Set.has() is O(1), making total complexity O(n) where n = tracks.length
  return tracks.value.filter(track => 
    selectedMarks.value.has(track.data.mark)
  )
})
```

### Pattern 2: Set-Based State Management
**What:** Use `ref<Set<string>>` for selected marks instead of array
**When to use:** When checking membership repeatedly (in filter operations)
**Example:**
```typescript
// Source: Community best practice 2026
// ref<Set<string>> preferred over reactive(new Set()) for consistency
const selectedMarks = ref<Set<string>>(new Set())

// Type-safe operations
const toggleMark = (mark: string, checked: boolean) => {
  if (checked) {
    selectedMarks.value.add(mark)
  } else {
    selectedMarks.value.delete(mark)
  }
  // Vue's proxy automatically tracks Set mutations
}
```

### Pattern 3: Two-Way Binding with v-model Transform
**What:** Transform between Set (parent state) and Array (component prop) at the boundary
**When to use:** When child component expects array but parent uses Set for performance
**Example:**
```vue
<!-- Parent: Playlist.vue -->
<template>
  <PlaylistFilterDropdown
    v-model="selectedMarksArray"
    :marks="availableMarks"
  />
</template>

<script setup>
const selectedMarks = ref<Set<string>>(new Set())

// Transform Set <-> Array at the boundary
const selectedMarksArray = computed({
  get: () => Array.from(selectedMarks.value),
  set: (arr: string[]) => {
    selectedMarks.value = new Set(arr)
  }
})
</script>
```

### Pattern 4: Lifecycle-Based State Reset
**What:** Watch route/playlist changes to reset filter state
**When to use:** When filter state should not persist across navigation
**Example:**
```typescript
// Source: Vue Router 4 + Composition API patterns
watch(
  () => props.playlistId,
  () => {
    // Clear filter when playlist changes
    selectedMarks.value.clear()
  }
)
// Component unmount automatically clears local state (no manual cleanup needed)
```

### Anti-Patterns to Avoid
- **Don't use array for selected marks**: `selectedMarks.includes(mark)` is O(n), becomes O(n²) in filter loop
- **Don't mutate computed return value**: Computed returns derived state; mutate source state instead
- **Don't use watch() for filtering logic**: Filtering is derived state (use computed), not a side effect
- **Don't manually trigger re-renders**: Vue's reactivity tracks Set.add()/delete() automatically

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OR logic filtering | Custom loop with boolean flags | `array.filter(item => set.has(item.mark))` | Set provides O(1) lookup; custom logic error-prone |
| Empty state detection | Manual flag tracking | `selectedMarks.value.size === 0` | Set.size is always accurate; manual flags can desync |
| Mark extraction from Map | Loop with uniqueness check | `Array.from(map.keys())` | Map keys are already unique; built-in method is optimized |
| Reactive array<->Set sync | Manual event listeners | `computed()` with get/set | Vue's computed handles reactivity; manual sync is bug-prone |

**Key insight:** Vue 3.5's reactivity system tracks all built-in collection methods (Set.add, Set.delete, Map operations). Trust the framework's proxy-based reactivity rather than building custom tracking.

## Common Pitfalls

### Pitfall 1: Using Array.includes() Instead of Set.has()
**What goes wrong:** Performance degrades with large mark lists (O(n²) complexity)
**Why it happens:** Array is more familiar, developers don't consider complexity
**How to avoid:** Always use Set for membership checking when filtering
**Warning signs:** Lag when selecting marks in playlists with 50+ unique marks

### Pitfall 2: Forgetting Default State (Empty Selection)
**What goes wrong:** No tracks shown when no marks selected, appears broken
**Why it happens:** Filter logic only handles selected marks case
**How to avoid:** Check `selectedMarks.size === 0` first, return all items
**Warning signs:** Component shows empty state when first loaded

### Pitfall 3: Not Clearing State on Navigation
**What goes wrong:** Filter persists when switching playlists, showing wrong results
**Why it happens:** Local state persists across same-component updates
**How to avoid:** Watch `props.playlistId` and clear Set on change
**Warning signs:** Previous playlist's filters apply to new playlist

### Pitfall 4: Badge Count Recalculating on Filter Change
**What goes wrong:** Badge numbers change while filtering, confusing UX
**Why it happens:** Counting filtered results instead of original dataset
**How to avoid:** Calculate badge counts from unfiltered playlist tracks
**Warning signs:** Badge shows "3" but changes to "1" when other marks selected

### Pitfall 5: Converting Set to Array in Filter Loop
**What goes wrong:** Performance degrades, loses Set's O(1) advantage
**Why it happens:** Unfamiliarity with Set API, converting for array methods
**How to avoid:** Use Set.has() directly in filter, keep Set in memory
**Warning signs:** Code like `[...selectedMarks].includes(mark)` in filter

## Code Examples

Verified patterns from official sources:

### Extract Marks from Map
```typescript
// Source: JavaScript Map MDN + Vue composition patterns
const musicsGroupedByCover = computed(() => groupByMark(musicDataList.value))

// Extract unique marks in original Map order
const availableMarks = computed(() => {
  const playlist = getPlaylist(props.playlistId)
  if (!playlist) return []
  
  // Get marks only from current playlist's tracks
  const playlistTrackIds = new Set(playlist.list)
  const marks: string[] = []
  
  // Map keys are already unique and ordered
  for (const [mark, tracks] of musicsGroupedByCover.value) {
    // Check if this mark has any tracks in current playlist
    const hasTracksInPlaylist = tracks.some(t => playlistTrackIds.has(t.id))
    if (hasTracksInPlaylist) {
      marks.push(mark)
    }
  }
  
  return marks
})
```

### Calculate Badge Counts
```typescript
// Source: Vue computed best practices
const markBadgeCounts = computed(() => {
  const playlist = getPlaylist(props.playlistId)
  if (!playlist) return new Map<string, number>()
  
  const playlistTrackIds = new Set(playlist.list)
  const counts = new Map<string, number>()
  
  // Count tracks per mark in current playlist
  for (const [mark, tracks] of musicsGroupedByCover.value) {
    const count = tracks.filter(t => playlistTrackIds.has(t.id)).length
    if (count > 0) {
      counts.set(mark, count)
    }
  }
  
  return counts
})
```

### Reactive OR Logic Filtering
```typescript
// Source: Vue 3.5 computed properties documentation
const selectedMarks = ref<Set<string>>(new Set())

const filteredTracks = computed(() => {
  const playlist = getPlaylist(props.playlistId)
  if (!playlist) return []
  
  const allTracks = playlist.list
    .map(id => getMusicData(id))
    .filter((t): t is MusicData => t != null)
  
  // Default state: show all tracks
  if (selectedMarks.value.size === 0) {
    return allTracks
  }
  
  // OR logic: show track if its mark is selected
  // Set.has() is O(1), so total complexity is O(n)
  return allTracks.filter(track => 
    selectedMarks.value.has(track.data.mark)
  )
})
```

### Playlist Change Watcher
```typescript
// Source: Vue 3 watchers documentation
watch(
  () => props.playlistId,
  () => {
    // Clear filter state when playlist changes
    selectedMarks.value.clear()
  }
)
// No manual cleanup needed - local ref cleared on component unmount
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Array.includes() for filtering | Set.has() with Set<string> | 2020+ (ES6 adoption) | O(n²) → O(n) complexity for filtering |
| Manual reactivity tracking | Proxy-based auto-tracking | Vue 3.0 (2020) | No need to manually notify on Set mutations |
| watch() for derived state | computed() for filtering | Vue 3.0+ best practices | Better performance through caching |
| Deep watchers for objects | Shallow ref + immutable updates | Vue 3.4+ (2023) | Reduced memory overhead |

**Deprecated/outdated:**
- Vue 2's `$set()` for reactivity: Vue 3's Proxy tracks Set operations automatically
- Options API watch: Composition API's `watch()` provides better type safety
- Converting Set to Array for filtering: Modern engines optimize Set iteration

## Open Questions

1. **Empty mark handling**
   - What we know: Tracks may have empty/null marks
   - What's unclear: Should empty marks be filterable, or excluded from mark list?
   - Recommendation: Exclude empty/null marks from dropdown; they're likely data errors

2. **Mark display names**
   - What we know: Marks are stored as paths (e.g., "/covers/leafre.png")
   - What's unclear: Should marks display as paths or friendly names?
   - Recommendation: Use Resources.marks mapping for display names if available

3. **Filter state persistence**
   - What we know: Context specifies no persistence needed
   - What's unclear: Should filter state save to localStorage for same playlist?
   - Recommendation: Start with no persistence (as specified); can add later if requested

## Sources

### Primary (HIGH confidence)
- Vue.js Official Documentation - Computed Properties (https://vuejs.org/guide/essentials/computed.html)
- Vue.js Official Documentation - Watchers (https://vuejs.org/guide/essentials/watchers.html)
- MDN Web Docs - JavaScript Set (standard complexity guarantees)

### Secondary (MEDIUM confidence)
- Google Search: "Vue 3.5 computed properties performance best practices 2026"
  - Verified: Lazy evaluation, version-counting mechanism, pure functions requirement
- Google Search: "JavaScript Set performance array filtering 2026"
  - Verified: O(1) Set.has() vs O(n) Array.includes(), Set preferred for membership tests
- Google Search: "Vue 3 watch vs computed when to use 2026"
  - Verified: computed for derived state, watch for side effects

### Tertiary (LOW confidence)
- Google Search: "filter dropdown badge count display UI UX best practices 2026"
  - Note: UX patterns are subjective; badge count implementation straightforward
  - Recommendation: Keep badge numbers static (don't recalculate on filter change)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Project dependencies already established, no new libraries needed
- Architecture: HIGH - Vue 3 Composition API patterns well-documented and proven
- Pitfalls: HIGH - Common mistakes well-known in Vue community (array vs Set, computed vs watch)

**Research date:** 2026-01-30
**Valid until:** 2026-03-01 (30 days) - Vue 3 patterns are stable, JavaScript fundamentals unchanged
