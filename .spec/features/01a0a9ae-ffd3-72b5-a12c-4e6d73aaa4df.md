---
schema: spec/feature@1
kind: feature
id: 01a0a9ae-ffd3-72b5-a12c-4e6d73aaa4df
title: Guarded link-based music and playlist sharing
status: active
relations:
  - type: refines
    target: 01a0a9ae-fbe8-7b66-bc4a-0f7c376d2d23
resources: []
---
## Capability
Transfer a music selection or saveable playlist through a guarded Maple Pod link action.

## Semantics
A link represents a reconstructable selection, not an immediate side effect. Music and playlist actions have different receiver outcomes. A playlist action carries an ordered selection whose receiver-side identity is independent of the sender's custom identity. Unresolved members are visible loss, not silent deletion.

## Rules
- Only music items and saveable Liked/custom playlists participate in this sharing capability.
- The receiver must authorize the requested action before playback or playlist creation can proceed.
- A valid playlist action opens a prefilled creation flow rather than creating a playlist directly.
- A reduced playlist action requires explicit acceptance after unresolved members are disclosed and preserves the remaining order.
- Transport shape and encoding are defined by the separate sharing protocol requirement.

## Edge Cases
Unknown selections, invalid payloads, rejected authorization, rejected reduction, and cancelled creation produce no shared-action side effect. Sender-side custom identity is not required to become receiver-side identity.
