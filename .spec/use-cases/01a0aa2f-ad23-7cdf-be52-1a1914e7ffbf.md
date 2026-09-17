---
schema: spec/use-case@1
kind: use-case
id: 01a0aa2f-ad23-7cdf-be52-1a1914e7ffbf
title: Export, import, transfer, and reset saved user data
status: active
relations:
  - type: refines
    target: 01a0aa2f-ab3b-776c-97a5-7fd26d96823e
resources: []
---
## Preconditions
Maple Pod may have portable saved data and other Maple Pod-owned local state.

## Main Flow
1. The user may export portable saved data as JSON or a transferable setup link.
2. An incoming file/link payload is decoded and validated for known portable fields.
3. Import asks for explicit confirmation before applying changes.
4. Accepted import merges known incoming fields into local portable state: incoming values win on fields/entities supplied by the payload, omitted portable fields keep their local values, and unknown fields are ignored.
5. The portable payload covers preferences, Liked/custom playlists, and the World Map last-selected snapshot; Recent History, offline downloads/caches, and first-visit metadata are not transferred.
6. The user may choose Reset Saved Data to clear preferences, Liked/custom playlists, World Map last-selected snapshot, and Recent History back to defaults/empty state while retaining offline downloads and onboarding metadata.
7. The user may choose Factory Reset to clear all Maple Pod-owned local state, including offline music/world-map data and firstVisit/onboarding metadata.

## Alternate & Failure Flows
- Malformed, undecodable, or invalid known fields must fail closed and make no local-state change.
- Unknown incoming fields are ignored rather than persisted.
- Omitted portable fields are treated as no-op for that field during merge.
- Destructive reset actions require explicit confirmation.

## Observable Outcomes
The user can transfer portable personal configuration without copying device-local caches/history, merge it into another installation predictably, perform a narrower saved-data reset, or deliberately perform a full factory reset.

## Compatibility Protocol
The current saved-data transfer link is compatibility-sensitive: `/setup` with a hash carrying action `import-saved-user-data`, serialized as JSON, compressed with the current DEFLATE helper (`fflate`), encoded with Base64 URL-safe `-`/`_` substitutions and removed padding. Existing links must remain parseable unless a deliberate compatibility migration supersedes this contract.

## Reverse-spec evidence
Observed in settings handlers, `/setup` middleware, shared hash encoding helpers, saved-data store/schema, world-map selection persistence, offline storage, and `firstVisit`. Merge semantics, portable scope, and reset layering were explicitly accepted during product review and may differ from current implementation.
