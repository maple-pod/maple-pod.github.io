# Requirements: Playlist Mark Filter

**Defined:** 2026-01-29
**Core Value:** Users can quickly find specific tracks in a playlist by filtering through marks without manually scrolling through the entire list.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### UI Components

- [ ] **UI-01**: Filter toggle button displays `i-f7:funnel` icon
- [ ] **UI-02**: Toggle button positioned alongside PlaylistDropdownMenu in playlist header
- [ ] **UI-03**: Toggle button shows active state when filters are applied
- [ ] **UI-04**: Toggle button shows inactive state when no filters are applied
- [ ] **UI-05**: Dropdown menu displays when toggle button is clicked
- [ ] **UI-06**: Dropdown menu lists all unique marks from current playlist
- [ ] **UI-07**: Each mark displays with a visual checkbox
- [ ] **UI-08**: Each mark displays track count badge showing number of tracks with that mark
- [ ] **UI-09**: Dropdown includes "Clear all" button to reset all selections
- [ ] **UI-10**: Dropdown includes "Select all" button to select all marks
- [ ] **UI-11**: Dropdown includes "Deselect all" button to deselect all marks
- [ ] **UI-12**: Dropdown closes when clicking outside the dropdown area
- [ ] **UI-13**: Keyboard navigation supports Enter/Space to toggle selection
- [ ] **UI-14**: Keyboard navigation supports Escape to close dropdown

### Filter Logic

- [ ] **FILTER-01**: System extracts unique marks from current playlist's tracks
- [ ] **FILTER-02**: Marks are listed in order of first appearance in playlist
- [ ] **FILTER-03**: Users can select multiple marks via checkboxes
- [ ] **FILTER-04**: Selected marks apply OR logic (show tracks matching any selected mark)
- [ ] **FILTER-05**: All tracks are shown when no marks are selected (default state)
- [ ] **FILTER-06**: Filter state clears when navigating away from playlist view
- [ ] **FILTER-07**: Filtered track list updates reactively when marks are selected/deselected

### Empty States & Feedback

- [ ] **EMPTY-01**: Empty state message displays when current playlist has no marks
- [ ] **EMPTY-02**: No results message displays when applied filters match zero tracks
- [ ] **EMPTY-03**: Result count displays showing "X/Y tracks" when filters are active

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Filtering

- **ENHANCE-01**: Search input within dropdown to filter marks list
- **ENHANCE-02**: Persist filter state across page reloads via localStorage
- **ENHANCE-03**: Support AND logic filtering option
- **ENHANCE-04**: Filter by multiple criteria (marks + year + genre)

### UI Polish

- **POLISH-01**: Keyboard shortcuts (e.g., Cmd+F to open filter)
- **POLISH-02**: Smooth animations for dropdown open/close
- **POLISH-03**: Virtual scrolling for mark lists with 50+ items

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Filtering empty/null marks | Data should not contain these cases; ignore if present |
| AND logic filtering | Only OR logic supported in v1 to keep complexity low |
| Multi-criteria filtering | Only mark filtering for now; other dimensions deferred to v2+ |
| Sorting marks alphabetically | Preserve extraction order to maintain predictability |
| Nested mark categories | Flat list only; no hierarchical structure |
| Drag-to-reorder mark priority | Simple checkbox selection only; no priority system |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UI-01 | Phase 1 | Pending |
| UI-02 | Phase 1 | Pending |
| UI-03 | Phase 1 | Pending |
| UI-04 | Phase 1 | Pending |
| UI-05 | Phase 1 | Pending |
| UI-06 | Phase 2 | Complete |
| UI-07 | Phase 1 | Pending |
| UI-08 | Phase 2 | Complete |
| UI-09 | Phase 1 | Pending |
| UI-10 | Phase 1 | Pending |
| UI-11 | Phase 1 | Pending |
| UI-12 | Phase 1 | Pending |
| UI-13 | Phase 1 | Pending |
| UI-14 | Phase 1 | Pending |
| FILTER-01 | Phase 2 | Complete |
| FILTER-02 | Phase 2 | Complete |
| FILTER-03 | Phase 2 | Complete |
| FILTER-04 | Phase 2 | Complete |
| FILTER-05 | Phase 2 | Complete |
| FILTER-06 | Phase 2 | Complete |
| FILTER-07 | Phase 2 | Complete |
| EMPTY-01 | Phase 3 | Pending |
| EMPTY-02 | Phase 3 | Pending |
| EMPTY-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24 ✓
- Unmapped: 0

---
*Requirements defined: 2026-01-29*
*Last updated: 2026-01-30 after Phase 2 completion*
