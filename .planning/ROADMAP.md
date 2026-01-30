# Roadmap: Playlist Mark Filter

## Overview

This roadmap delivers a mark-based filtering feature for the playlist view in three focused phases. Phase 1 establishes the UI foundation (toggle button, dropdown, multi-select checkboxes with keyboard navigation). Phase 2 implements the filtering logic (mark extraction, OR-logic filtering, reactive updates). Phase 3 integrates the feature into the playlist view with empty states and user feedback. Each phase delivers a verifiable, coherent capability that enables the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Filter UI Foundation** - Standalone filter component with visual controls
- [x] **Phase 2: Filter Logic Core** - Mark extraction and filtering implementation
- [ ] **Phase 3: Playlist Integration** - Live integration with empty states and feedback
- [ ] **Phase 4: Upgrade Dependencies** - Upgrade all dependencies including devDependencies while maintaining stability

## Phase Details

### Phase 1: Filter UI Foundation
**Goal**: Users can interact with a standalone filter component displaying marks with multi-select checkboxes, keyboard navigation, and visual state feedback
**Depends on**: Nothing (first phase)
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-07, UI-09, UI-10, UI-11, UI-12, UI-13, UI-14
**Success Criteria** (what must be TRUE):
  1. Toggle button displays with funnel icon and shows active/inactive state based on selections
  2. Dropdown menu opens when toggle button is clicked and closes when clicking outside
  3. Users can select/deselect individual marks using checkboxes with visual indicators
  4. Users can clear all selections with "Clear all" button or select/deselect all marks with corresponding buttons
  5. Users can navigate dropdown using keyboard (Enter/Space toggles, Escape closes)
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md — Build PlaylistFilterDropdown component and integrate into Playlist header

### Phase 2: Filter Logic Core
**Goal**: Filter component extracts marks from data and reactively filters tracks based on user selections using OR logic
**Depends on**: Phase 1
**Requirements**: FILTER-01, FILTER-02, FILTER-03, FILTER-04, FILTER-05, FILTER-06, FILTER-07, UI-06, UI-08
**Success Criteria** (what must be TRUE):
  1. Filter component automatically extracts unique marks from current playlist's tracks in order of first appearance
  2. Each mark displays with a track count badge showing how many tracks have that mark
  3. When users select marks, track list updates reactively to show only tracks matching any selected mark
  4. When no marks are selected, all tracks are shown (default behavior)
  5. Filter state automatically clears when user navigates away from playlist view
**Plans**: 1 plan

Plans:
- [x] 02-01-PLAN.md — Implement mark extraction, badge counts, and OR-logic filtering with lifecycle management

### Phase 3: Playlist Integration
**Goal**: Filter feature is fully integrated into playlist view with proper empty state handling and user feedback
**Depends on**: Phase 2
**Requirements**: EMPTY-01, EMPTY-02, EMPTY-03
**Success Criteria** (what must be TRUE):
  1. Filter toggle button appears alongside PlaylistDropdownMenu in playlist header
  2. When playlist has no marks, empty state message displays to users
  3. When applied filters match zero tracks, "No results" message displays
  4. When filters are active, result count displays showing "X/Y tracks"
**Plans**: TBD

Plans:
- [ ] 03-01: [Plan description TBD during plan-phase]

### Phase 4: Upgrade Dependencies
**Goal**: All project dependencies upgraded to latest stable versions while maintaining project stability
**Depends on**: Phase 3
**Requirements**: All dependencies current, no security vulnerabilities, build and features verified
**Success Criteria** (what must be TRUE):
  1. All patch, minor, and major dependency upgrades completed successfully
  2. Build toolchain (Vite 7, TypeScript 5.9) functions correctly
  3. Vue Router 5 migration complete and navigation works
  4. All application features verified working after upgrades
  5. `pnpm outdated` shows no critical outdated packages
**Plans**: 4 plans

Plans:
- [ ] 04-01-PLAN.md — Upgrade patch-level dependencies safely
- [ ] 04-02-PLAN.md — Upgrade minor-level dependencies within current majors
- [ ] 04-03-PLAN.md — Upgrade development tooling to major versions (Vite 7, TypeScript)
- [ ] 04-04-PLAN.md — Upgrade runtime dependencies to major versions (Vue Router 5)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Filter UI Foundation | 1/1 | Complete | 2026-01-30 |
| 2. Filter Logic Core | 1/1 | Complete | 2026-01-30 |
| 3. Playlist Integration | 0/1 | Not started | - |
| 4. Upgrade Dependencies | 0/4 | Not started | - |

---
*Roadmap created: 2026-01-29*
*Last updated: 2026-01-30 after Phase 4 planning*
