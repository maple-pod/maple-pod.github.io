---
id: 01a0aa2f-b0ed-7b9c-bffd-1af76a5e3a1b
title: Saved user-data portability and reset
summary: Provide portable personal-data transfer and two deliberate scopes for clearing Maple Pod-owned state.
rules:
  - id: 01a0aa2f-b4b5-70e7-8603-5038cf608544
    statement: |-
      Maple Pod must provide portable saved-data export/import through both a local JSON file and a transferable setup link. The portable contract consists of known preferences, Liked/custom playlists, and the World Map last-selected snapshot. Recent History, offline music/world-map data, and firstVisit/onboarding metadata must not be included in portable export/import.

      Incoming payloads must be decoded and validated for known fields before any mutation. Import must merge rather than replace: for each supplied known field or same-identity entity, the incoming value wins; omitted portable fields must preserve the current local value; unknown fields must be ignored and must not be persisted. Malformed, undecodable, or invalid known-field payloads must fail closed without changing local state. Import requires explicit user confirmation.

      The current transfer-link protocol is compatibility-sensitive and must remain readable: `/setup` plus hash payload containing action `import-saved-user-data`, serialized as JSON, compressed with DEFLATE, encoded as Base64 with URL-safe `-` and `_` substitutions and removed padding.

      Maple Pod must expose two reset scopes:
      - Reset Saved Data: restore preferences, Liked/custom playlists, World Map last-selected snapshot, and Recent History to defaults/empty state while preserving offline music/world-map data and firstVisit/onboarding metadata.
      - Factory Reset: clear all Maple Pod-owned local state, including everything cleared by Reset Saved Data plus offline music/world-map data and firstVisit/onboarding metadata.

      Both reset actions must require explicit user confirmation.
---

> Historical v0.0.1 explanatory notes; canonical semantics are the v1 frontmatter above.
> The original Feature and Requirement, including rationale and verification guidance,
> are preserved verbatim under docs/spec-migration/legacy/.

## Legacy Feature notes

## Capability
Provide portable personal-data transfer and two deliberate scopes for clearing Maple Pod-owned state.

## Semantics
Portable data is a selected subset of personal configuration, separate from device-local activity, cached content, and onboarding state. Import is a validated merge: supplied known values take precedence, omitted values remain local, and unknown values do not become opaque stored state. Reset Saved Data and Factory Reset have intentionally different ownership boundaries.

## Rules
- The portable boundary follows the Saved Data contract and excludes device-local history, offline content, and onboarding state.
- Reset Saved Data clears portable state and recent activity while preserving device-local offline and onboarding state.
- Factory Reset clears all Maple Pod-owned local state.
- Import and both destructive resets require explicit user confirmation where the contract specifies it.
- Transfer wire compatibility is defined by the separate Saved Data protocol requirement.

## Edge Cases
Partial valid imports update only supplied data. Invalid known data causes no mutation. A same-identity incoming entity follows incoming-wins merge semantics. A full reset may span several storage domains without changing the product-level scope.

## Legacy Requirement notes: Saved-data serialization, validation, and merge/reset behavior

## Contract
Maple Pod must provide portable saved-data export/import through both a local JSON file and a transferable setup link. The portable contract consists of known preferences, Liked/custom playlists, and the World Map last-selected snapshot. Recent History, offline music/world-map data, and firstVisit/onboarding metadata must not be included in portable export/import.

Incoming payloads must be decoded and validated for known fields before any mutation. Import must merge rather than replace: for each supplied known field or same-identity entity, the incoming value wins; omitted portable fields must preserve the current local value; unknown fields must be ignored and must not be persisted. Malformed, undecodable, or invalid known-field payloads must fail closed without changing local state. Import requires explicit user confirmation.

The current transfer-link protocol is compatibility-sensitive and must remain readable: `/setup` plus hash payload containing action `import-saved-user-data`, serialized as JSON, compressed with DEFLATE, encoded as Base64 with URL-safe `-` and `_` substitutions and removed padding.

Maple Pod must expose two reset scopes:
- Reset Saved Data: restore preferences, Liked/custom playlists, World Map last-selected snapshot, and Recent History to defaults/empty state while preserving offline music/world-map data and firstVisit/onboarding metadata.
- Factory Reset: clear all Maple Pod-owned local state, including everything cleared by Reset Saved Data plus offline music/world-map data and firstVisit/onboarding metadata.

Both reset actions must require explicit user confirmation.

## Rationale
Portability and reset serve different needs. Transfer should move intentional personal configuration without hauling large device-local caches or activity history, while reset needs a safe narrower scope and an explicit full-reset escape hatch. Merge semantics preserve local state not represented by older/partial payloads and support forward compatibility by ignoring unknown fields.

## Verification
Round-trip every portable field through JSON and setup-link export/import. Confirm Recent History, offline data, and firstVisit are absent from transfer. Import a partial payload and verify omitted local fields remain unchanged; import conflicting known values and verify incoming wins; include unknown fields and verify they are ignored; inject invalid known data and verify no mutation. Verify existing `/setup` links still decode. Execute Reset Saved Data and confirm portable state plus Recent History reset while offline data/onboarding metadata remain. Execute Factory Reset and confirm all Maple Pod-owned local state is cleared.
