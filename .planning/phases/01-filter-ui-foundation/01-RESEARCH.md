# Phase 1: Filter UI Foundation - Research

**Researched:** 2026-01-29
**Domain:** Vue 3 Multi-Select Filter Dropdown UI with Reka UI
**Confidence:** HIGH

## Summary

This phase focuses on building a standalone filter component for the playlist view using Vue 3 and Reka UI. The research confirms that Reka UI (v2.8.0) provides all necessary primitives for building an accessible, keyboard-navigable multi-select filter dropdown. The project already uses Reka UI successfully for other dropdowns (e.g., `UiDropdownMenu.vue`, `PlaylistDropdownMenu.vue`), providing a proven pattern to follow.

The standard approach for 2026 is to use headless UI libraries (like Reka UI) for logic and accessibility, while applying custom styling through PikaCSS (already integrated in this project). The project has established patterns for dropdown menus, button styles, and hover effects that should be extended to the filter component.

**Primary recommendation:** Use Reka UI's `DropdownMenuCheckboxItem` with `@select.prevent` to keep the dropdown open during multi-select interactions. Follow the existing `UiDropdownMenu.vue` component pattern for consistency.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vue 3 | 3.5.16 | Framework | Project standard, Composition API with `<script setup>` |
| Reka UI | 2.3.0 | Headless UI primitives | Provides accessible dropdown, checkbox, and keyboard navigation components; already integrated |
| PikaCSS | 0.0.29 | CSS-in-JS styling | Project standard for component styling with theme support |
| @vueuse/core | 13.3.0 | Vue utilities | Already available for state management, focus handling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @iconify-json/f7 | 1.2.2 | Framework7 icons | Project uses f7 icon set (e.g., `i-f7:funnel` for filter icon) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reka UI | Native HTML `<select multiple>` | No - inadequate for styled UI, poor UX for many items |
| Reka UI | Custom implementation | No - would miss accessibility features (ARIA, keyboard nav, focus management) |
| DropdownMenuCheckboxItem | Custom checkbox in DropdownMenuItem | No - loses built-in `v-model:checked` binding and accessibility |

**Installation:**
No new packages needed - all dependencies already installed.

## Architecture Patterns

### Recommended Component Structure
```
src/components/
├── PlaylistFilterDropdown.vue    # Main filter component (new)
└── UiDropdownMenu.vue             # Existing pattern to follow
```

### Pattern 1: Reka UI Dropdown with Checkboxes
**What:** Use `DropdownMenuRoot`, `DropdownMenuCheckboxItem`, and `DropdownMenuItemIndicator` from Reka UI
**When to use:** For any multi-select filter dropdown
**Example:**
```vue
<script setup lang="ts">
import {
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItemIndicator,
	DropdownMenuPortal,
	DropdownMenuRoot,
	DropdownMenuTrigger,
} from 'reka-ui'

const selectedMarks = ref<string[]>([])
</script>

<template>
	<DropdownMenuRoot v-model:open="isOpen">
		<DropdownMenuTrigger asChild>
			<button
				:class="pika('icon-btn-toggle')"
				:data-toggle="hasActiveFilters"
			>
				<div :class="pika('i-f7:line-horizontal-3-decrease')" />
			</button>
		</DropdownMenuTrigger>

		<DropdownMenuPortal>
			<DropdownMenuContent>
				<DropdownMenuCheckboxItem
					v-for="mark in marks"
					:key="mark"
					v-model:checked="selectedMarks[mark]"
					@select.prevent
				>
					<DropdownMenuItemIndicator>
						<div :class="pika('i-f7:checkmark')" />
					</DropdownMenuItemIndicator>
					{{ mark }}
				</DropdownMenuCheckboxItem>
			</DropdownMenuContent>
		</DropdownMenuPortal>
	</DropdownMenuRoot>
</template>
```
**Source:** Reka UI official docs - https://reka-ui.com/docs/components/dropdown-menu

### Pattern 2: Prevent Dropdown Close on Checkbox Interaction
**What:** Add `@select.prevent` to `DropdownMenuCheckboxItem` to prevent menu from closing
**When to use:** When users need to select multiple items without the menu closing after each selection
**Example:**
```vue
<DropdownMenuCheckboxItem
  v-model:checked="isChecked"
  @select.prevent
>
  Keep menu open when toggled
</DropdownMenuCheckboxItem>
```
**Source:** Reka UI docs and community best practices

### Pattern 3: Active State Indication for Toggle Button
**What:** Use PikaCSS `icon-btn-toggle` shortcut with `data-toggle` attribute
**When to use:** Show visual feedback when filters are active
**Example:**
```vue
<button
  :data-toggle="selectedMarks.length > 0"
  :class="pika('icon-btn-toggle')"
>
  <!-- Icon changes color and shows dot indicator when data-toggle=true -->
</button>
```
**Source:** Project's `pika.config.js:246-268` defines `icon-btn-toggle` behavior

### Pattern 4: Control Buttons Layout
**What:** Place "Clear all", "Select all", "Deselect all" buttons at top of dropdown
**When to use:** For multi-select dropdowns with many items
**Example:**
```vue
<DropdownMenuContent>
  <!-- Control buttons group -->
  <div :class="pika({ display: 'flex', gap: '8px', padding: '4px' })">
    <button @click="selectAll">Select all</button>
    <button @click="deselectAll">Deselect all</button>
    <button @click="clearAll">Clear all</button>
  </div>

  <DropdownMenuSeparator />

  <!-- Checkbox items -->
  <DropdownMenuCheckboxItem v-for="item in items" />
</DropdownMenuContent>
```

### Anti-Patterns to Avoid
- **Using plain `<div>` for trigger:** Always use `<button>` or semantic HTML for accessibility
- **Not using `asChild` prop:** Reka UI requires `asChild` when wrapping custom trigger elements
- **Deep watching selected items:** Use shallow refs or `Set` for performance with many items
- **Forgetting `@select.prevent`:** Without this, dropdown closes after each checkbox click

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dropdown positioning | Manual z-index and absolute positioning | Reka UI's `DropdownMenuPortal` | Handles viewport collision detection, auto-positioning, and `<Teleport>` to body |
| Keyboard navigation | Custom event handlers for Arrow/Escape/Enter keys | Reka UI's built-in keyboard support | Includes focus management, roving tabindex, and WAI-ARIA patterns |
| Checkbox state management | Custom `@click` handlers with state arrays | Reka UI's `v-model:checked` on `DropdownMenuCheckboxItem` | Two-way binding, accessibility attributes, and indeterminate state support |
| Focus trap/return | Manual focus() calls | Reka UI's automatic focus management | Returns focus to trigger on close, moves focus to first item on open |
| Click-outside-to-close | Manual document.addEventListener('click') | Reka UI's built-in dismissable layer | Handles edge cases like iframe clicks, nested dropdowns |

**Key insight:** Reka UI (Radix Vue) is battle-tested for accessibility and edge cases. Custom implementations inevitably miss ARIA attributes, screen reader announcements, or RTL support.

## Common Pitfalls

### Pitfall 1: Checkbox Selection Closes Dropdown
**What goes wrong:** By default, clicking any `DropdownMenuItem` (including checkbox items) closes the dropdown menu
**Why it happens:** Reka UI's default behavior is to close on item selection, which works for regular menu items but not multi-select
**How to avoid:** Add `@select.prevent` event handler to each `DropdownMenuCheckboxItem`
**Warning signs:** Dropdown closes immediately after checking a single box, forcing user to reopen for each selection

### Pitfall 2: Inconsistent Styling with Existing Components
**What goes wrong:** Filter dropdown looks visually different from other dropdowns in the app
**Why it happens:** Not following the established PikaCSS patterns (e.g., `card`, `hover-mask`, `icon-btn`)
**How to avoid:** Reference `UiDropdownMenu.vue` and `PlaylistDropdownMenu.vue` for styling patterns. Use the same padding, border-radius, and background colors
**Warning signs:** Different border styles, hover effects, or spacing compared to `PlaylistDropdownMenu`

### Pitfall 3: Not Showing Filter Count on Toggle Button
**What goes wrong:** Users can't see if filters are active without opening the dropdown
**Why it happens:** Forgetting to update toggle button state based on selections
**How to avoid:** Use computed property for `hasActiveFilters` and bind to `data-toggle` attribute. Consider showing count (e.g., "3 filters")
**Warning signs:** Toggle button looks identical whether filters are active or not

### Pitfall 4: Missing Empty State Handling
**What goes wrong:** Showing empty dropdown or broken UI when playlist has no marks
**Why it happens:** Not checking if marks list is empty before rendering dropdown
**How to avoid:** Add conditional rendering: show message like "No marks available" or hide filter button entirely when `marks.length === 0`
**Warning signs:** Empty dropdown with just control buttons and no items

### Pitfall 5: Performance Issues with Many Marks
**What goes wrong:** UI lags when rendering 50+ checkbox items
**Why it happens:** Rendering all items in DOM at once without virtualization
**How to avoid:** For this phase, marks list is expected to be small (~10-20 items). If marks exceed 30, consider virtual scrolling in future phase. Use `v-if` for dropdown content (not `v-show`) to avoid initial render cost
**Warning signs:** Noticeable delay when opening dropdown, high Lighthouse scores

### Pitfall 6: Keyboard Navigation Not Working
**What goes wrong:** Tab/Enter/Escape keys don't work as expected
**Why it happens:** Not using Reka UI components correctly, or adding `@click.stop.prevent` in wrong places
**How to avoid:** Let Reka UI handle keyboard events. Only use `@select.prevent` on checkbox items, not on other event handlers
**Warning signs:** Can't close dropdown with Escape, Tab doesn't move focus, Enter doesn't toggle checkboxes

## Code Examples

Verified patterns from official sources:

### Toggle Button with Active State
```vue
<!-- Source: Project's icon-btn-toggle pattern in pika.config.js -->
<script setup lang="ts">
const hasActiveFilters = computed(() => selectedMarks.value.length > 0)
</script>

<template>
	<button
		:data-toggle="hasActiveFilters"
		:class="pika('icon-btn-toggle')"
		aria-label="Filter by marks"
	>
		<!-- Framework7 filter icon (funnel alternative) -->
		<div :class="pika('i-f7:line-horizontal-3-decrease')" />
	</button>
</template>
```

### Dropdown Menu with Checkboxes (Keep Open)
```vue
<!-- Source: Reka UI official docs + project patterns -->
<script setup lang="ts">
import {
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItemIndicator,
	DropdownMenuPortal,
	DropdownMenuRoot,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from 'reka-ui'

const open = ref(false)
const selectedMarks = ref<Set<string>>(new Set())

function toggleMark(mark: string) {
	if (selectedMarks.value.has(mark)) {
		selectedMarks.value.delete(mark)
	}
	else {
		selectedMarks.value.add(mark)
	}
}
</script>

<template>
	<DropdownMenuRoot v-model:open="open">
		<DropdownMenuTrigger asChild>
			<slot name="trigger" />
		</DropdownMenuTrigger>

		<DropdownMenuPortal>
			<DropdownMenuContent
				:class="pika('card', {
					padding: '8px',
					minWidth: '200px',
					zIndex: 2,
				})"
			>
				<!-- Control buttons -->
				<div :class="pika({ display: 'flex', gap: '4px', marginBottom: '8px' })">
					<button
						:class="pika('primary-plain-btn', { fontSize: '12px', padding: '4px 8px' })"
						@click="selectAll"
					>
						Select all
					</button>
					<button
						:class="pika('primary-plain-btn', { fontSize: '12px', padding: '4px 8px' })"
						@click="clearAll"
					>
						Clear all
					</button>
				</div>

				<DropdownMenuSeparator />

				<!-- Checkbox items -->
				<DropdownMenuCheckboxItem
					v-for="mark in marks"
					:key="mark"
					:checked="selectedMarks.has(mark)"
					:class="pika('hover-mask', {
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						padding: '12px',
						cursor: 'pointer',
					})"
					@select.prevent
					@update:checked="toggleMark(mark)"
				>
					<DropdownMenuItemIndicator>
						<div :class="pika('i-f7:checkmark')" />
					</DropdownMenuItemIndicator>
					<span>{{ mark }}</span>
				</DropdownMenuCheckboxItem>
			</DropdownMenuContent>
		</DropdownMenuPortal>
	</DropdownMenuRoot>
</template>
```

### Mark Extraction from Music Store
```typescript
// Source: Project's useMusicStore.ts pattern
const musicStore = useMusicStore()
const { musicDataList } = storeToRefs(musicStore)

// Get unique marks in order of first appearance
const marks = computed(() => {
	const seen = new Set<string>()
	const result: string[] = []

	for (const music of musicDataList.value) {
		const mark = music.data.mark
		if (!seen.has(mark)) {
			seen.add(mark)
			result.push(mark)
		}
	}

	return result
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Radix Vue | Reka UI | 2024 | Reka UI is the rebranded, actively maintained version. Same API, better docs |
| `v-model` on Root | `v-model:open` on Root, `v-model:checked` on CheckboxItem | Vue 3.3+ (2023) | More explicit, supports multiple v-models |
| Manual Teleport | DropdownMenuPortal | Reka UI v2+ (2024) | Simpler API, handles edge cases |
| CSS z-index wars | Native Popover API | 2024-2026 | For future phases - not yet in Reka UI v2.8, but coming |
| Deep watch arrays | Shallow refs / Set | Vue 3.3+ (2023) | Better performance for large lists |

**Deprecated/outdated:**
- **Radix Vue package name**: Now called Reka UI, but API is backward compatible
- **`modelValue` without prefix**: Use `v-model:checked` and `v-model:open` for clarity in Vue 3.4+

## Open Questions

1. **Filter icon choice**
   - What we know: Project uses Framework7 icons (@iconify-json/f7). Standard funnel icon is `i-f7:slider-horizontal-3` or `i-f7:line-horizontal-3-decrease` (more modern)
   - What's unclear: User preference for icon style (traditional funnel vs. modern filter lines)
   - Recommendation: Use `i-f7:line-horizontal-3-decrease` - matches modern design trends and Framework7 icon set

2. **Selection count display format**
   - What we know: Requirement UI-12 mentions showing count (e.g., "3 filters")
   - What's unclear: Where to display count - on button as text, as badge, or tooltip?
   - Recommendation: Show count next to icon only when space allows (desktop), use dot indicator only on mobile (existing `icon-btn-toggle` pattern)

3. **Empty state message**
   - What we know: UI-14 requires empty state handling
   - What's unclear: Exact message and when to show (no marks in data vs. no marks in current view)
   - Recommendation: Hide filter button entirely when playlist has no marks (simplest UX)

## Sources

### Primary (HIGH confidence)
- Reka UI v2.8.0 official documentation - https://reka-ui.com/docs/components/dropdown-menu (Accessed 2026-01-29)
- Reka UI Checkbox documentation - https://reka-ui.com/docs/components/checkbox (Accessed 2026-01-29)
- Project codebase: `src/components/UiDropdownMenu.vue`, `src/components/PlaylistDropdownMenu.vue`
- Project codebase: `package.json` (confirmed Reka UI v2.3.0 installed)
- Project codebase: `pika.config.js` (styling patterns and shortcuts)

### Secondary (MEDIUM confidence)
- Google Search: "reka-ui Vue 3 dropdown menu checkbox component 2026" - Confirmed DropdownMenuCheckboxItem usage with v-model:checked and @select.prevent pattern
- Google Search: "Vue 3 filter dropdown UI best practices keyboard navigation accessibility 2026" - Validated headless UI approach, focus management patterns, ARIA requirements

### Tertiary (LOW confidence)
- None - all key findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use in project
- Architecture: HIGH - Existing dropdown components provide proven patterns to follow
- Pitfalls: MEDIUM - Based on Reka UI docs and common Vue patterns, but phase-specific validation needed during implementation

**Research date:** 2026-01-29
**Valid until:** 2026-02-28 (30 days - Reka UI is stable, but frequent Vue ecosystem updates)

**Notes:**
- Project already has Reka UI fully integrated with working dropdown examples
- PikaCSS styling system is well-established with shortcuts for buttons, cards, and hover effects
- Framework7 icon set provides all necessary icons
- No new dependencies required for this phase
- Phase 2 will implement actual filtering logic (deferred from this phase)
