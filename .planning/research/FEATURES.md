# Feature Research: Mark-Based Multi-Select Filter Dropdown

**Domain:** Music Playlist Filter UI
**Researched:** 2026-01-29
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Clear All button** | Users need quick reset without deselecting each mark individually | LOW | Already specified in requirements; critical for undo-ability |
| **Visual checkbox indicators** | Multi-select requires clear visual state (selected/unselected) | LOW | Standard pattern; high contrast for accessibility (WCAG 3:1 ratio) |
| **Immediate visual feedback on filter** | When marks selected, button shows "active" state | LOW | Already in requirements; prevents confusion about whether filter applied |
| **Close on outside click** | Standard dropdown behavior; clicking outside dismisses menu | LOW | "Light dismiss" pattern; expected since 2020+ |
| **Keyboard navigation (Arrow keys)** | Power users + accessibility requirement | MEDIUM | Up/Down to navigate, Space to toggle selection, Escape to close |
| **Empty state handling** | When no marks exist in playlist, button disabled or hidden | LOW | Prevents confusing empty dropdown |
| **Zero-result feedback** | When selected marks yield no tracks, show "No tracks match" message | LOW | Prevents "Did the filter break?" confusion |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Search/filter within marks list** | For playlists with 15+ unique marks, scrolling is tedious | MEDIUM | Fuzzy search reduces cognitive load; auto-focus search on dropdown open |
| **Selected marks count badge** | Shows "3 filters active" on button without opening dropdown | LOW | Improves discoverability of active filters; reduce clicks to check state |
| **Mark count next to each mark** | "(12)" next to "Boss Battle" shows how many tracks have that mark | LOW | Helps prioritize which marks to select; prevents zero-result frustration |
| **"Select All" / "Deselect All"** | Quick bulk operations for power users | LOW | Not required per spec, but reduces clicks when user wants "everything except X" |
| **Keyboard shortcut to open filter** | Press `/` or `Ctrl+F` to toggle filter dropdown | MEDIUM | Power user feature; common in modern web apps (Slack, GitHub, etc.) |
| **Persist selected state visually in dropdown** | Checked marks stay at top or have visual grouping | MEDIUM | Prevents scroll-hunting when revisiting dropdown; UX quality of life |
| **Animated result count** | Briefly show "+42 tracks" → "24 tracks" as filters toggle | MEDIUM | Satisfying feedback; helps users understand impact of selections |
| **First-letter jump navigation** | Press "B" to jump to first mark starting with "B" | MEDIUM | W3C recommended pattern; helpful for alphabetical mark lists |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **AND logic filtering** | "Show tracks with BOTH Battle AND Calm marks" | Creates many zero-result states; cognitive overhead for UI representation | Keep OR-only logic per spec; if needed later, add as separate "Advanced Filter" mode |
| **Instant filter on single click** | "Why do I need to click Apply?" | For multi-select, causes jarring layout shifts as user clicks through options; expensive re-renders | Use checkbox pattern with implicit apply (no Apply button needed, but filter updates after each selection completes) |
| **Nested mark categories** | "Group marks into 'Mood', 'Tempo', 'Battle' categories" | Over-engineering; marks are flat tags, not hierarchical taxonomies | Keep flat list; use search if list is long |
| **Draggable mark priority** | "Drag marks to prioritize results" | Confusing interaction model; OR logic has no priority concept | If sorting needed, add simple "Sort by: First Appearance / A-Z / Frequency" toggle |
| **Remembering filter across sessions** | "Keep my filter when I reload" | Per spec, filter is ephemeral (resets on navigation); persistence adds complexity | Clear intent: filter is temporary exploration tool, not saved state |
| **Real-time animation during filter** | Tracks fade out/slide away as filter applies | Performance risk with large playlists; distracting motion for power users | Use simple CSS transition for list height change; keep track appear/disappear instant |
| **Multi-column mark list** | "Show marks in 2-3 columns to save vertical space" | Breaks keyboard navigation expectations (up/down vs. left/right/down); mobile-unfriendly | Keep single column; add virtual scrolling if performance needed |

## Feature Dependencies

```
[Clear All button]
    └──requires──> [Selected state tracking]

[Mark count badge]
    └──requires──> [Selected state tracking]

[Search within marks]
    └──enhances──> [Keyboard navigation]
    └──requires──> [Fuzzy string matching]

[First-letter jump]
    └──conflicts──> [Search within marks]
    (If search field exists and is focused, letter keys should type in search, not jump)

[Animated result count]
    └──requires──> [Filtered track count computed property]
```

### Dependency Notes

- **Clear All requires Selected state:** Can't clear if we don't track what's selected; trivial dependency
- **Search enhances Keyboard navigation:** Arrow keys should work within filtered search results, not full list
- **First-letter jump conflicts with Search:** If search input exists, prioritize typing in search over jump navigation; fallback to jump only when search is unfocused or doesn't exist
- **Animated count requires computed property:** Already needed for filtering logic; just exposes it visually

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] **Clear All button** — Per spec; critical for usability
- [x] **Visual checkbox indicators** — Multi-select requires this; accessibility baseline
- [x] **Filter active state on button** — Per spec; prevents confusion
- [x] **Close on outside click** — Expected behavior; table stakes for dropdowns
- [x] **Basic keyboard navigation** — Arrow keys + Space + Escape; accessibility requirement
- [x] **Empty state handling** — Disable/hide button when no marks; prevents broken UX
- [x] **Zero-result feedback** — Show message when filter yields no tracks; prevents confusion

**Rationale:** These 7 features cover the core interaction loop: open → select → filter → clear → close. Anything less would feel broken or inaccessible.

### Add After Validation (v1.x)

Features to add once core is working and users request them.

- [ ] **Search within marks** — Trigger: playlist with 20+ unique marks or user feedback
- [ ] **Selected marks count badge** — Trigger: users ask "How do I see what's filtered without opening dropdown?"
- [ ] **Mark count next to each mark** — Trigger: users report selecting marks that yield zero results
- [ ] **Select All / Deselect All** — Trigger: users report tedious clicking when they want "almost everything"
- [ ] **First-letter jump navigation** — Trigger: marks are alphabetically organized or users are power users

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Keyboard shortcut to open filter** — Wait for analytics on how frequently filter is used; not worth keybinding if usage < 30%
- [ ] **Animated result count** — Polish feature; defer until performance is proven solid
- [ ] **Persist selected state visually in dropdown** — UX quality of life; not core functionality

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Clear All button | HIGH | LOW | P1 (MVP) |
| Visual checkboxes | HIGH | LOW | P1 (MVP) |
| Filter active state | HIGH | LOW | P1 (MVP) |
| Close on outside click | HIGH | LOW | P1 (MVP) |
| Keyboard navigation | HIGH | MEDIUM | P1 (MVP) |
| Empty state handling | MEDIUM | LOW | P1 (MVP) |
| Zero-result feedback | MEDIUM | LOW | P1 (MVP) |
| Search within marks | HIGH | MEDIUM | P2 (Post-MVP) |
| Mark count badge | MEDIUM | LOW | P2 (Post-MVP) |
| Mark count per mark | MEDIUM | LOW | P2 (Post-MVP) |
| Select All/Deselect All | MEDIUM | LOW | P2 (Post-MVP) |
| First-letter jump | MEDIUM | MEDIUM | P2 (Post-MVP) |
| Keyboard shortcut | LOW | MEDIUM | P3 (Future) |
| Animated result count | LOW | MEDIUM | P3 (Future) |
| Persist visual state | LOW | MEDIUM | P3 (Future) |

**Priority key:**
- P1: Must have for launch (specified in requirements or table stakes)
- P2: Should have when possible (improves UX without blocking launch)
- P3: Nice to have (polish features for future iterations)

## Complexity Notes

### LOW Complexity (1-2 hours)
- Clear All: Single click handler that resets Set/Array to empty
- Visual checkboxes: Standard HTML input + label pattern
- Filter active state: Boolean computed property `isFilterActive = selectedMarks.size > 0`
- Close on outside click: `vOnClickOutside` from VueUse or reka-ui built-in
- Empty state handling: `v-if="uniqueMarks.length === 0"` conditional rendering
- Zero-result feedback: `v-if="filteredTracks.length === 0"` with message slot
- Mark count badge: Simple `{{ selectedMarks.size }}` interpolation
- Mark count per mark: Single computed property with `tracks.filter(t => t.mark === mark).length`
- Select All/Deselect All: Two click handlers, toggle all marks on/off

### MEDIUM Complexity (3-6 hours)
- Keyboard navigation: Requires focus management, `aria-activedescendant`, Up/Down/Space/Escape handlers
- Search within marks: Fuzzy matching algorithm (Fuse.js or simple `.includes()`) + filtered list rendering
- Persist visual state: Requires tracking scroll position or moving selected items to top (DOM manipulation or list reordering)
- First-letter jump: Requires debounced key listener + index jumping logic
- Keyboard shortcut: Requires global event listener + focus stealing considerations
- Animated result count: Requires transition state management + number interpolation logic

## Accessibility Considerations (WCAG 2.2 / ARIA 1.2)

### Critical (Must Implement for MVP)

| Requirement | Implementation | Validation |
|-------------|----------------|------------|
| **Keyboard navigation** | Arrow keys, Space, Enter, Escape | Test with keyboard only; no mouse needed to operate |
| **Focus management** | `aria-activedescendant` for virtual focus | Screen reader announces focused mark as user navigates |
| **Visual contrast** | Checkbox + background change (not color alone) | 3:1 contrast ratio; verify with colorblind simulation |
| **ARIA roles** | `role="listbox"`, `role="option"`, `aria-multiselectable="true"` | Screen reader announces "listbox with 12 options, multi-selectable" |
| **Live regions** | `aria-live="polite"` for "3 marks selected, 24 tracks shown" | Screen reader announces filter results without stealing focus |
| **Touch targets** | Minimum 44px × 44px clickable area | Test on mobile; no "fat-finger" mis-clicks |

### Recommended (Post-MVP)

| Requirement | Implementation | Validation |
|-------------|----------------|------------|
| **Search field labeling** | `aria-label="Filter marks by name"` | Screen reader announces purpose when focused |
| **First-letter jump** | Standard W3C pattern for single-select combobox; adapt for multi-select | Test with screen reader; verify announcements |
| **Keyboard shortcut** | `aria-keyshortcuts="/"` attribute + global listener | Document in help/tooltip; verify no conflicts with browser shortcuts |

## Competitor Feature Analysis

| Feature | Spotify (Playlist Filter) | Apple Music (Smart Playlist) | Our Approach |
|---------|---------------------------|------------------------------|--------------|
| Multi-criteria filtering | Genre, Mood, BPM, etc. | 20+ criteria including playcount, rating | Single criterion (marks) per spec; simpler mental model |
| AND/OR logic | AND by default, OR not available | Complex rule builder with AND/OR/NOT | OR-only per spec; avoids complexity |
| Persistent filters | Saved in "Smart Playlist" | Saved as playlist metadata | Ephemeral per spec; temporary exploration |
| Real-time filter | Instant on checkbox toggle | Rule-based, applies on save | Instant per modern patterns; no "Apply" button |
| Search within filters | Yes, for genre/mood lists | Yes, for all criteria | Add post-MVP when mark lists grow large |
| Visual feedback | Tag pills above results | Filter summary in sidebar | Tag pills or badge on button; TBD in design phase |

**Key Insight:** Our approach is intentionally simpler than competitors. Spotify/Apple Music have complex filtering because they manage thousands of tracks. We're filtering a single playlist (typically < 200 tracks) by one dimension (marks). Simplicity is the feature.

## Sources

- **Multi-select UI patterns:** Google Search "multi-select dropdown filter UI patterns best practices 2026" (HIGH confidence — corroborated by multiple sources)
- **Music filtering UX:** Google Search "music playlist filtering features Spotify Apple Music 2026" (MEDIUM confidence — WebSearch only, but patterns observable in live products)
- **Accessibility patterns:** W3C WAI-ARIA Authoring Practices Guide (APG) — [Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) (HIGH confidence — official W3C documentation)
- **Keyboard navigation:** Google Search "filter dropdown keyboard navigation patterns aria 2025" (HIGH confidence — W3C APG referenced + multiple sources agree)
- **Anti-patterns:** Google Search "music tag filter UI anti-patterns avoid mistakes 2026" (MEDIUM confidence — WebSearch only, but aligns with general UX principles)

---
*Feature research for: Mark-based multi-select filter dropdown for playlist view*
*Researched: 2026-01-29*
