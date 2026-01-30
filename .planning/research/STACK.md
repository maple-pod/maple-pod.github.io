# Stack Research

**Domain:** Vue 3 Multi-select Filter Dropdown Component
**Researched:** 2026-01-29
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| reka-ui DropdownMenu | 2.3.0 (existing) | Headless dropdown foundation | Already integrated in project; provides accessible, WAI-ARIA compliant menu primitives with built-in keyboard navigation, focus management, and positioning logic |
| reka-ui CheckboxItem | 2.3.0 (existing) | Multi-select checkbox items | Native support for checkable items with optional indeterminate state; integrates seamlessly with DropdownMenu; handles state management automatically |
| Vue 3 Composition API | 3.5.16 (existing) | Reactivity and state management | Project standard; enables clean separation of logic into composables for reusability |
| PikaCSS | 0.0.29 (existing) | Styling system | Project's existing utility-first CSS framework with custom shortcuts and theme variables already configured |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vueuse/core | 13.3.0 (existing) | Utility composables | For debouncing search input, managing click outside behavior (if needed beyond reka-ui) |
| TypeScript | 5.8.0 (existing) | Type safety | Essential for defining filter state types, mark types, and component props |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| PikaCSS shortcuts | Reusable style patterns | Leverage existing `hover-mask`, `card`, and `icon-btn` shortcuts for consistent styling |
| reka-ui ItemIndicator | Visual feedback for selected state | Built-in component for rendering checkmarks on selected items |

## Installation

```bash
# No new dependencies required
# All necessary packages already installed:
# - reka-ui@2.3.0 (includes DropdownMenu, CheckboxItem, ItemIndicator)
# - vue@3.5.16
# - @vueuse/core@13.3.0
# - typescript@5.8.0
```

## Recommended Implementation Approach

### 1. Component Architecture

**Pattern: Extend Existing UiDropdownMenu Component**

The project already has a well-structured `UiDropdownMenu.vue` component that wraps reka-ui primitives. The recommended approach is to:

1. **Add multi-select support to UiDropdownMenu** by extending the existing `UiDropdownMenuItem` types to include `CheckboxItem`
2. **Create a dedicated composable** (`useMarkFilter`) to handle filter state logic
3. **Create a presentation component** (`MarkFilterDropdown.vue`) that consumes the composable and uses UiDropdownMenu

**Why this approach:**
- Maintains consistency with existing codebase patterns (see `PlaylistDropdownMenu.vue` which follows this pattern)
- Separates concerns: UI structure (reka-ui) → Styling (PikaCSS) → Logic (composable) → Integration (component)
- Makes filter logic reusable if needed elsewhere
- Follows Vue 3 Composition API best practices

### 2. State Management Strategy

**Pattern: Composable with Local State (not Pinia store)**

**Recommended:**
```typescript
// composables/useMarkFilter.ts
export function useMarkFilter(marks: Ref<string[]>) {
	const selectedMarks = ref<Set<string>>(new Set())

	const toggle = (mark: string) => {
		if (selectedMarks.value.has(mark)) {
			selectedMarks.value.delete(mark)
		}
		else {
			selectedMarks.value.add(mark)
		}
		// Trigger reactivity for Set
		selectedMarks.value = new Set(selectedMarks.value)
	}

	const clear = () => {
		selectedMarks.value.clear()
		selectedMarks.value = new Set(selectedMarks.value)
	}

	const isSelected = (mark: string) => selectedMarks.value.has(mark)

	return { selectedMarks, toggle, clear, isSelected }
}
```

**Why local composable instead of Pinia:**
- Filter state is view-specific (playlist view only)
- No need for persistence across navigation
- No cross-component sharing required
- Simpler, less overhead
- Consistent with how other view-specific state is handled (e.g., `open` state in UiDropdownMenu)

**Performance optimization:**
- Use `Set` instead of `Array` for O(1) lookup performance when checking selection state
- No need for `shallowRef` at current scale (~dozens of marks, not thousands)
- Consider `v-memo` directive if mark list exceeds 100+ items

### 3. Multi-Select Dropdown Pattern

**Use reka-ui's built-in CheckboxItem components:**

```vue
<DropdownMenuCheckboxItem
  v-for="mark in marks"
  :key="mark"
  :modelValue="isSelected(mark)"
  @update:modelValue="toggle(mark)"
>
  <DropdownMenuItemIndicator>
    <div :class="pika('i-f7:checkmark')" />
  </DropdownMenuItemIndicator>
  {{ markLabel(mark) }}
</DropdownMenuCheckboxItem>
```

**Why this pattern:**
- Leverages reka-ui's built-in multi-select capabilities (v-model, indicators)
- Automatically prevents menu from closing when selecting items
- Handles accessibility (aria attributes, keyboard navigation)
- ItemIndicator only renders when checked (built-in optimization)

### 4. Filtering Logic Integration

**Pattern: Computed property in parent view**

In `Playlist.vue` (or wherever the filter is used):

```typescript
const { selectedMarks, toggle, clear, isSelected } = useMarkFilter(availableMarks)

const filteredMusicList = computed(() => {
	if (selectedMarks.value.size === 0) {
		return playlist.value.list // No filter active, show all
	}

	return playlist.value.list
		.map(id => getMusicData(id))
		.filter(music => music && selectedMarks.value.has(music.data.mark))
})
```

**Why this approach:**
- OR logic: show tracks that match ANY selected mark
- Empty selection = no filter (show all)
- Computed ensures automatic reactivity when filter changes
- Integrates cleanly with existing playlist data structure

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| reka-ui CheckboxItem | Custom checkbox + Popover | Never for this use case - reka-ui already provides everything needed with better accessibility |
| Local composable state | Pinia store | If filter state needs to persist across navigation or be shared with other views (not required here) |
| Set for selection state | Array | If order of selection matters (doesn't for this use case) or for serialization (not needed) |
| Computed filtering | Watch + manual array update | Never - computed is reactive, cached, and more declarative |
| Extending UiDropdownMenu | New custom component | If the design diverges significantly from existing dropdown pattern (not the case) |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Custom Popover positioning | reka-ui already handles this perfectly with collision detection and auto-positioning | reka-ui DropdownMenu Content component |
| Deep watchers for Set changes | Sets aren't deeply reactive; watchers won't detect .add()/.delete() | Re-assign Set after mutation: `selectedMarks.value = new Set(selectedMarks.value)` |
| v-model:checked on CheckboxItem | Deprecated pattern | v-model / :modelValue |
| Inline event handlers in template | Makes template harder to read and logic not reusable | Methods in composable |
| Array.includes() for selection check | O(n) performance | Set.has() - O(1) |

## Stack Patterns by Variant

**If marks list is small (<20 items):**
- Use simple v-for rendering
- No virtualization needed
- Standard reka-ui CheckboxItem

**If marks list grows large (>50 items):**
- Add search/filter input at top of dropdown
- Use `v-memo="[mark, isSelected(mark)]"` for optimization
- Consider grouping marks by category
- Add "Select All" / "Clear All" utility buttons

**If filter state needs persistence:**
- Move to Pinia store
- Add to `SavedUserData` interface
- Persist via localforage (existing pattern)

**If multiple filter dimensions needed (marks + year + artist):**
- Create separate composables for each dimension
- Combine filtered results in parent component
- Consider moving to dedicated filter UI panel instead of dropdown

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| reka-ui@2.3.0 | Vue 3.5.16 | Full compatibility; reka-ui 2.x designed for Vue 3.5+ |
| PikaCSS@0.0.29 | Vue 3.5.16 | No direct dependency; pure CSS generation |
| @vueuse/core@13.3.0 | Vue 3.5.16 | Full compatibility; aligned with Vue 3.5 Composition API |

## Performance Considerations

### For Current Scale (Estimated ~100-500 tracks, ~10-30 marks):
- **No special optimizations needed** - standard reactive patterns are sufficient
- Set-based selection state provides O(1) lookups
- Computed filtering is instant for this dataset size

### If Scale Increases:
1. **For 1000+ tracks:**
   - Consider debouncing filter application (300ms delay after selection)
   - Use `shallowRef` for large arrays that don't need deep reactivity

2. **For 100+ marks:**
   - Add virtual scrolling to dropdown (vue-virtual-scroller)
   - Use `v-memo` directive on CheckboxItem
   - Add search/filter within dropdown

3. **For complex filtering (multiple dimensions):**
   - Move filtering logic to Web Worker if dataset >10,000 items
   - Cache filtered results with computed + WeakMap

### Current Implementation: No Optimizations Needed
Based on the existing codebase (`useMusicStore.ts` shows marks are grouped by cover image), the number of marks appears to be small (~10-30 range). Standard Vue 3 reactivity patterns are optimal for this scale.

## Styling Integration with PikaCSS

### Leverage Existing Shortcuts

```typescript
// Use existing PikaCSS shortcuts for consistent styling
const dropdownMenuStyles = pika('card', {
	padding: '8px',
	minWidth: '200px',
	zIndex: 2,
})

const checkboxItemStyles = pika('hover-mask', {
	display: 'flex',
	alignItems: 'center',
	gap: '8px',
	padding: '12px',
	cursor: 'pointer',
})
```

### Custom Styles for Filter-Specific UI

```typescript
// Indicator for "active filter" state
const triggerActiveStyles = pika({
	'color': 'var(--color-primary-1)',
	'$[data-active=true]::after': {
		content: '\'\'',
		position: 'absolute',
		right: '4px',
		top: '4px',
		width: '6px',
		height: '6px',
		borderRadius: '50%',
		backgroundColor: 'var(--color-primary-1)',
	}
})
```

### Theme Support
All PikaCSS variables automatically support light/dark themes via existing `@light` and `@dark` selectors. No additional work needed for theme compatibility.

## Accessibility Compliance

reka-ui DropdownMenu + CheckboxItem provides:
- ✅ WAI-ARIA Menu Button pattern compliance
- ✅ Keyboard navigation (Arrow keys, Space, Enter, Escape)
- ✅ Focus management (roving tabindex)
- ✅ Screen reader support (aria-checked, aria-disabled)
- ✅ Proper role attributes (menu, menuitem, checkbox)

**Additional considerations:**
- Add aria-label to filter trigger button describing current filter state
- Consider adding live region to announce "X items shown" after filtering

## Sources

- **reka-ui Documentation** — https://reka-ui.com/docs/components/dropdown-menu (HIGH confidence)
  - Verified: CheckboxItem component, multi-select patterns, API reference
  - Verified: ItemIndicator usage, accessibility features
- **Existing Codebase Patterns** — Project files (HIGH confidence)
  - `UiDropdownMenu.vue` - Component structure, styling patterns
  - `PlaylistDropdownMenu.vue` - Integration pattern with stores
  - `useMusicStore.ts` - Data structure, marks grouping
  - `pika.config.js` - Available shortcuts, theme variables
- **Vue 3 Composition API Best Practices** — General knowledge + VueUse patterns (HIGH confidence)
  - Set vs Array performance characteristics
  - Computed vs watch for filtering
  - Composable patterns for reusability
- **Performance Optimization Research** — Web search findings (MEDIUM confidence)
  - v-memo directive usage for list optimization
  - Set-based state for O(1) lookups
  - Virtual scrolling thresholds (flagged as general guidance, not hard requirement)

---
*Stack research for: Mark-based filtering dropdown for Vue 3 music player PWA*
*Researched: 2026-01-29*
