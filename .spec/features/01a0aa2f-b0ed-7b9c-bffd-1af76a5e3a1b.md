---
schema: spec/feature@1
kind: feature
id: 01a0aa2f-b0ed-7b9c-bffd-1af76a5e3a1b
title: Saved user-data portability and reset
status: active
relations:
  - type: refines
    target: 01a0aa2f-ad23-7cdf-be52-1a1914e7ffbf
resources: []
---
## Capability
Provide portable saved-data export/import and two distinct destructive reset scopes: Reset Saved Data and Factory Reset.

## Semantics
Portable saved data contains known personal configuration intended to transfer between browser/storage instances: preferences, Liked/custom playlists, and World Map last-selected snapshot. Recent History, offline media/world-map caches, and firstVisit/onboarding metadata are device-local and excluded from transfer. Import is a validated merge, not replacement: incoming known values win when supplied, omitted fields preserve local values, and unknown fields are ignored.

Reset Saved Data is broader than the portable payload because it also clears Recent History, but it deliberately preserves offline downloads/caches and onboarding metadata. Factory Reset clears all Maple Pod-owned local state, including those preserved categories.

## Rules
- Export/import must round-trip all known portable fields.
- Recent History is not portable.
- World Map last-selected snapshot is portable.
- Offline music/world-map data and firstVisit/onboarding metadata are not portable.
- Import must validate known fields before mutation.
- Incoming known values override corresponding local values.
- Missing portable fields preserve local values.
- Unknown incoming fields are ignored and are not persisted.
- Reset Saved Data clears portable state plus Recent History, but preserves offline data and onboarding metadata.
- Factory Reset clears all Maple Pod-owned local state, including offline data and onboarding metadata.
- Both destructive reset scopes require explicit user confirmation.
- The existing `/setup` hash transport is compatibility-sensitive.

## Edge Cases
A partial-but-valid import updates only supplied known fields. A same-ID custom playlist supplied by import replaces/updates that local entity according to incoming-wins semantics. Invalid known-field data must prevent the import from mutating local state. Unknown future fields must not cause rejection or opaque persistence. Factory Reset may require clearing multiple storage mechanisms; the mechanism is non-normative, but the resulting owned-state boundary is normative.

## Reverse-spec evidence
Observed across saved-data store/schema, settings UI, `/setup` route, world-map selection persistence, offline stores/caches, and onboarding state. Current implementation exports broader runtime SavedUserData, imports by replacement, and exposes a single reset path; those are implementation gaps where they conflict with the accepted contract.
