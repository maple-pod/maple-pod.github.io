# Pitfalls Research

**Domain:** Vue 3 Multi-Select Filter with Custom Dropdown
**Researched:** 2026-01-29
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Deep Reactivity Overhead on Large Lists

**What goes wrong:**
Using `ref()` or `reactive()` on large track arrays (100+ items) makes every nested property reactive, causing massive memory consumption and janky UI during filtering operations.

**Why it happens:**
By default, Vue 3's reactivity system deeply tracks all nested objects and properties. When filtering 100+ tracks, each with multiple properties (title, artist, album, etc.), Vue creates reactive proxies for every single property, multiplying memory usage.

**How to avoid:**
- Use `shallowRef()` for the source track list
- Only make the filtered results computed, not reactive
- Keep filter criteria (selected marks) in regular `ref()`

```typescript
import { ref, shallowRef, computed } from 'vue'

// ✅ Correct: Shallow reactivity for large list
const tracks = shallowRef<Track[]>([...])
const selectedMarks = ref<string[]>([])

const filteredTracks = computed(() => {
  if (selectedMarks.value.length === 0) return tracks.value
  return tracks.value.filter(track => 
    selectedMarks.value.includes(track.mark)
  )
})

// ❌ Wrong: Deep reactivity on large list
const tracks = ref<Track[]>([...]) // Makes every track deeply reactive
```

**Warning signs:**
- Initial page load takes >500ms
- Memory usage increases by 10+ MB for 100 tracks
- DevTools shows thousands of reactive objects
- Scrolling feels "janky" even with small lists

**Phase to address:**
Phase 1 (Core Filtering) - Must use `shallowRef` from the start. Refactoring later requires touching all filter logic.

---

### Pitfall 2: Memory Leaks from Click-Outside Event Listeners

**What goes wrong:**
Dropdown registers `click` or `keydown` listeners on `window`/`document` to detect outside clicks for closing, but fails to remove them on component unmount, causing memory leaks and orphaned event handlers.

**Why it happens:**
- Anonymous arrow functions in `addEventListener` cannot be removed
- Forgetting `removeEventListener` in `onUnmounted`
- Component unmounts but teleported dropdown DOM remains
- Using different function references in add/remove

**How to avoid:**
Use VueUse's `onClickOutside` composable (handles cleanup automatically):

```typescript
import { onClickOutside } from '@vueuse/core'

const dropdownRef = ref<HTMLElement>()
onClickOutside(dropdownRef, () => {
  isOpen.value = false
})
```

Or if implementing manually, use `AbortController` (2026 standard):

```typescript
const controller = new AbortController()

onMounted(() => {
  window.addEventListener('click', handleClickOutside, { 
    signal: controller.signal 
  })
  window.addEventListener('keydown', handleEscape, { 
    signal: controller.signal 
  })
})

onUnmounted(() => {
  controller.abort() // Removes ALL listeners at once
})
```

**Never do this:**
```typescript
// ❌ Anonymous function - can't be removed
onMounted(() => {
  window.addEventListener('click', () => { isOpen.value = false })
})

// ❌ Missing cleanup
onMounted(() => {
  window.addEventListener('click', handleClick)
})
// No onUnmounted!
```

**Warning signs:**
- Chrome DevTools Memory → "Detached HTMLElements" increase after opening/closing dropdown 10 times
- JS Heap Size never decreases after navigation
- `window.getEventListeners(document).click.length` increases on each mount

**Phase to address:**
Phase 1 (Core Filtering) - reka-ui handles this internally, but custom wrappers must not add extra listeners without cleanup. Use VueUse if adding custom outside-click behavior.

---

### Pitfall 3: Computed vs. Watch for Filter Logic

**What goes wrong:**
Using `watch()` with manual state updates for filtering causes unnecessary re-renders, infinite loops, or stale results when multiple filter criteria change simultaneously.

**Why it happens:**
Developers think manual `watch` gives more "control," but it's imperative, eager (runs immediately), and requires careful synchronization. `computed` is declarative, lazy (only runs when accessed), and automatically handles multiple dependencies.

**How to avoid:**
Always use `computed` for derived filter results:

```typescript
// ✅ Correct: Declarative, cached, lazy
const filteredTracks = computed(() => {
  const marks = selectedMarks.value
  if (marks.length === 0) return tracks.value
  
  return tracks.value.filter(track => 
    marks.includes(track.mark)
  )
})

// ❌ Wrong: Imperative, eager, manual sync
const filteredTracks = ref<Track[]>([])
watch([tracks, selectedMarks], () => {
  if (selectedMarks.value.length === 0) {
    filteredTracks.value = tracks.value
  } else {
    filteredTracks.value = tracks.value.filter(track =>
      selectedMarks.value.includes(track.mark)
    )
  }
}, { immediate: true })
```

**Why computed wins:**
- **Caching:** Only re-runs if dependencies change
- **Vue 3.4+ optimization:** If result array has same items, DOM doesn't re-render
- **Lazy:** Doesn't run until template actually uses it
- **Automatic:** Can't forget to update it

**Warning signs:**
- Filter logic code has `watch()` for derived state
- Seeing "Maximum call stack" errors
- Filter updates lag behind UI interactions
- Multiple watchers for the same filter logic

**Phase to address:**
Phase 1 (Core Filtering) - Use `computed` from day one. Architecture review should flag any `watch` used for filtering.

---

### Pitfall 4: Filter State Not Clearing on Navigation

**What goes wrong:**
User applies mark filter → navigates to different playlist → returns to original playlist → filter still active but UI shows wrong results or crashes.

**Why it happens:**
- Filter state (`selectedMarks`) persists across route changes
- Component reuses same instance (Vue Router keep-alive)
- Filter doesn't reset when data source changes

**How to avoid:**
Clear filter state when playlist changes:

```typescript
import { watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const selectedMarks = ref<string[]>([])

// Reset filter when playlist ID changes
watch(() => route.params.playlistId, () => {
  selectedMarks.value = []
}, { immediate: false })
```

Or use `onBeforeRouteLeave` if filter must clean up:

```typescript
import { onBeforeRouteLeave } from 'vue-router'

onBeforeRouteLeave(() => {
  selectedMarks.value = []
})
```

**Warning signs:**
- Filter shows marks from previous playlist
- TypeScript errors: "Property 'mark' does not exist" (data structure changed)
- Empty results despite data existing
- Test: Navigate between playlists quickly - does filter persist?

**Phase to address:**
Phase 2 (Navigation Integration) - Must test filter behavior across route changes. Add Vitest tests for navigation scenarios.

---

### Pitfall 5: Missing Accessibility - Keyboard Navigation and ARIA

**What goes wrong:**
Custom dropdown with checkboxes doesn't support keyboard navigation, screen readers can't announce state changes, focus gets trapped or lost.

**Why it happens:**
- Implementing custom dropdown without using accessible component library
- Missing ARIA attributes (`role`, `aria-expanded`, `aria-checked`)
- Not managing focus on open/close
- Checkbox items not keyboard-navigable

**How to avoid:**
reka-ui's `Select` component handles most accessibility, but multi-select with checkboxes needs `CheckboxItem`:

```typescript
// ✅ Using reka-ui with proper accessibility
<SelectRoot v-model="selectedMarks" multiple>
  <SelectTrigger>
    <SelectValue placeholder="Filter by mark" />
  </SelectTrigger>
  <SelectContent>
    <SelectViewport>
      <SelectItem v-for="mark in marks" :key="mark" :value="mark">
        <SelectItemText>{{ mark }}</SelectItemText>
        <SelectItemIndicator>
          <CheckIcon />
        </SelectItemIndicator>
      </SelectItem>
    </SelectViewport>
  </SelectContent>
</SelectRoot>
```

**Required ARIA attributes if building custom:**
- `role="combobox"` on trigger
- `aria-expanded` on trigger (true/false)
- `aria-controls` linking to dropdown ID
- `role="listbox"` on dropdown container
- `role="option"` on each checkbox item
- `aria-checked` on each item (true/false)

**Keyboard requirements:**
- `Space` / `Enter`: Toggle dropdown
- `ArrowDown` / `ArrowUp`: Navigate items
- `Space`: Toggle checkbox when focused
- `Escape`: Close dropdown, return focus to trigger

**Warning signs:**
- Can't navigate dropdown with keyboard alone
- Screen reader doesn't announce "expanded" or "checked"
- Automated accessibility tests (axe, Lighthouse) flag issues
- Test: Unplug mouse, can you operate filter?

**Phase to address:**
Phase 1 (Core Filtering) - Use reka-ui's built-in accessibility. Phase 3 (Polish) - Manual accessibility audit with screen reader (NVDA/VoiceOver).

---

### Pitfall 6: Dropdown Positioning Overflow Issues

**What goes wrong:**
Dropdown appears cut off at bottom of viewport, gets hidden by `overflow: hidden` parent containers, or positions incorrectly on scroll.

**Why it happens:**
- Dropdown rendered inside container with `overflow: hidden`
- Not using `Portal` / `Teleport` to escape parent stacking context
- Hardcoded positioning instead of collision detection
- Mobile viewport height not accounted for

**How to avoid:**
Always use `SelectPortal` with `position="popper"` for smart positioning:

```typescript
<SelectRoot>
  <SelectTrigger>...</SelectTrigger>
  
  <SelectPortal>
    <SelectContent 
      position="popper"
      :side-offset="5"
      :avoid-collisions="true"
      :collision-padding="10"
    >
      <SelectViewport>
        <!-- Items -->
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</SelectRoot>
```

**Key props:**
- `position="popper"`: Enables collision detection (default is `item-aligned`)
- `avoidCollisions`: Auto-flips side when hitting viewport edge
- `collisionPadding`: Distance from viewport edge to trigger flip
- `sideOffset`: Gap between trigger and dropdown

**For mobile:**
Constrain height to viewport:

```css
.SelectContent {
  max-height: var(--reka-select-content-available-height);
  overflow-y: auto;
}
```

**Warning signs:**
- Dropdown cut off when near bottom of page
- Scrolling page causes dropdown to detach from trigger
- Dropdown hidden on mobile when keyboard opens
- Test on small viewport (320px width, iPhone SE)

**Phase to address:**
Phase 1 (Core Filtering) - Use `position="popper"` and `SelectPortal`. Phase 4 (Mobile Testing) - Test on real devices, especially with on-screen keyboard.

---

### Pitfall 7: TypeScript Type Safety for Filter Values

**What goes wrong:**
Filter state accepts invalid mark values, runtime errors when backend returns different data shape, or type narrowing fails causing compilation errors.

**Why it happens:**
- Using `string[]` instead of union type for known marks
- Not validating data from API matches expected shape
- Generic types not constrained properly
- Filter logic assumes data structure never changes

**How to avoid:**
Use union types for known marks and proper generic constraints:

```typescript
// ✅ Type-safe mark values
type Mark = '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2' | '1'

interface Track {
  id: string
  title: string
  artist: string
  mark: Mark
}

const selectedMarks = ref<Mark[]>([])

// Compile-time error if invalid mark
selectedMarks.value = ['10', '99'] // ❌ Error: '99' not in Mark type

// ✅ Type-safe filter function
function filterByMarks(tracks: Track[], marks: Mark[]): Track[] {
  if (marks.length === 0) return tracks
  return tracks.filter(track => marks.includes(track.mark))
}

// ❌ Wrong: Any string allowed
const selectedMarks = ref<string[]>([])
selectedMarks.value = ['invalid'] // No compile error!
```

**For dynamic marks from API:**
Use Zod or similar for runtime validation:

```typescript
import { z } from 'zod'

const MarkSchema = z.enum(['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'])
type Mark = z.infer<typeof MarkSchema>

const TrackSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  mark: MarkSchema,
})

// Validate API response
const tracks = TrackSchema.array().parse(apiResponse)
```

**Warning signs:**
- Filter accepts values that don't exist in data
- TypeScript errors about type narrowing after filtering
- Runtime errors: "Cannot read property of undefined"
- Test: Try passing invalid mark value - does TypeScript catch it?

**Phase to address:**
Phase 1 (Core Filtering) - Define Mark type union. Phase 2 (API Integration) - Add runtime validation if marks are dynamic.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using `ref()` instead of `shallowRef()` for tracks | No API learning curve | Memory issues at 100+ tracks, janky scrolling | Never - `shallowRef` is trivial to use |
| Skip virtual scrolling | Faster initial implementation | Unusable with 500+ tracks, browser tab crashes | MVP with guaranteed <100 tracks |
| Manual event listener cleanup | Feels like "more control" | Memory leaks, hard to debug | Never - VueUse exists for this |
| Hardcode mark values instead of API | No backend dependency | Can't add marks without code deploy | MVP only, must refactor before Phase 2 |
| Skip `AbortController`, use traditional cleanup | Works in older browsers | Verbose code, easy to miss listeners | Never in 2026 - all modern browsers support it |
| Use `v-if` instead of `SelectPortal` | Simpler component tree | Positioning/overflow issues | Never - Portal is required for dropdowns |
| Skip TypeScript union types for marks | Less typing | Runtime errors, no autocomplete | Never - costs 5 minutes to set up |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Vue Router | Filter state persists across routes | Watch `route.params` and reset filter |
| reka-ui Select | Using `position="item-aligned"` (default) | Use `position="popper"` for collision detection |
| TypeScript | Using `string[]` for marks | Use union type: `type Mark = '10' \| '9' \| ...` |
| API fetching | Not validating mark values exist in data | Use Zod schema validation or type guards |
| Composition API | Importing `ref` but using `reactive` for arrays | Use `shallowRef` for large collections |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Deep reactivity on track list | Page load >500ms, memory usage spikes | Use `shallowRef()` for source list | >100 tracks |
| Rendering all filtered results | Scrolling jank, long frames (>50ms) | Virtual scrolling (`vue-virtual-scroller`) | >200 visible tracks |
| Using `watch` for filter logic | Double renders, stale state | Use `computed` for derived state | Any scale |
| Not using `computed` caching | Re-filtering on every render | Memoize with `computed()` | >50 tracks |
| Teleport without collision detection | Dropdown cut off at viewport edge | Use `position="popper"` + `avoidCollisions` | Mobile, small viewports |

---

## Accessibility Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Dropdown not keyboard-navigable | Keyboard users can't filter | Use reka-ui's built-in keyboard support |
| Missing ARIA labels | Screen readers announce "button" not "filter" | Add `aria-label="Filter by mark"` to trigger |
| No focus management | Focus disappears when dropdown closes | reka-ui handles this - don't override |
| Checkbox state not announced | Screen reader doesn't say "checked" or "unchecked" | Use `SelectItemIndicator` for visual + ARIA |
| Escape key doesn't close dropdown | Keyboard users trapped | reka-ui provides this - ensure not disabled |
| Touch targets <44px | Mobile users mis-tap | Set min height 44px on trigger and items |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Filtering works** - but did you test with 200+ tracks? (Performance)
- [ ] **Dropdown opens** - but does it close when clicking outside? (Event cleanup)
- [ ] **Filter clears** - but does it reset when navigating to new playlist? (Route sync)
- [ ] **Checkboxes work** - but can you navigate them with Tab/Arrow keys? (Accessibility)
- [ ] **Dropdown shows** - but does it flip up when near bottom of viewport? (Positioning)
- [ ] **TypeScript compiles** - but does it prevent invalid mark values? (Type safety)
- [ ] **Works on desktop** - but does dropdown overflow on mobile? (Responsive)
- [ ] **OR logic implemented** - but did you test empty selection (show all)? (Edge cases)

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Deep reactivity on large list | LOW | Wrap existing `ref()` with `shallowRef()`, test thoroughly |
| Memory leak from listeners | MEDIUM | Audit all `addEventListener`, add `AbortController` or VueUse |
| Filter state persists | LOW | Add `watch` on route param, reset to `[]` |
| Missing accessibility | HIGH | Requires testing with screen reader, may need component refactor |
| Dropdown positioning issues | MEDIUM | Add `SelectPortal` + `position="popper"` (may require style updates) |
| Wrong TypeScript types | MEDIUM | Define `Mark` union type, update all refs, fix compile errors |
| Performance with large lists | HIGH | Requires virtual scrolling library integration |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Deep reactivity overhead | Phase 1 (Core Filtering) | Load 200 tracks, check memory in DevTools (<5MB increase) |
| Memory leaks | Phase 1 (Core Filtering) | Open/close dropdown 20x, check "Detached HTMLElements" count |
| Computed vs watch | Phase 1 (Core Filtering) | Code review - no `watch()` for filter logic |
| Filter state not clearing | Phase 2 (Navigation) | Test: Apply filter → navigate → return → verify cleared |
| Missing accessibility | Phase 1 + Phase 3 (Polish) | Unplug mouse test, automated axe-core scan |
| Dropdown positioning | Phase 1 (Core Filtering) | Test at bottom of page, mobile viewport |
| TypeScript type safety | Phase 1 (Core Filtering) | Try passing invalid mark - TypeScript error? |

---

## Sources

**HIGH Confidence Sources:**
- Vue 3.4/3.5 performance improvements (computed optimization, version counting): Google Search results from 2026 ecosystem discussion
- Memory leak patterns with `AbortController`: Google Search results from 2026 best practices
- reka-ui Select API and accessibility: Official documentation at https://reka-ui.com/docs/components/select
- `shallowRef` vs `ref` performance: Google Search results comparing reactivity approaches in 2026

**MEDIUM Confidence Sources:**
- Virtual scrolling thresholds (100-200 tracks): Based on general Vue performance patterns, not project-specific testing
- Mobile touch target size (44px): Standard WCAG guideline

**Context:**
This research focused on pitfalls for Vue 3 + reka-ui filtering implementation. All critical recommendations (shallowRef, AbortController, computed over watch, reka-ui Portal positioning) are verified from 2026-current sources and official documentation.

---

*Pitfalls research for: Vue 3 Multi-Select Mark Filter with Dropdown UI*
*Researched: 2026-01-29*
