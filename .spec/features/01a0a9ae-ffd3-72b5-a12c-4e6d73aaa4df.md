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
Generate and consume Maple Pod links that carry either a music selection or a saveable Liked/custom playlist, using the current link protocol and guarded receiver actions.

## Semantics
Music sharing and playlist sharing are two forms of the same product capability: transferring a reconstructable music selection by URL. Music links identify a music item through the `/play/` route and `musicId` query parameter. Playlist links use `/import-playlist` and a compressed serialized payload in the URL hash. Playlist payload semantics include an import action type, playlist kind (`liked` or custom), title, and ordered music IDs. Sender-side custom playlist identity is not authoritative receiver-side identity even though the current wire representation carries an `id` field. Opening a valid link identifies a requested action but does not itself authorize that action; explicit receiver confirmation is required before playback or playlist import proceeds.

## Rules
- Music sharing uses `/play/?musicId=...` as the protocol for identifying the requested music item.
- Playlist sharing uses `/import-playlist` with a URL hash encoded as JSON serialized data, DEFLATE-compressed with the current `fflate` path, then represented with the current Base64URL-style transformation.
- The route shape, query/hash placement, and compression/serialization algorithm above are compatibility-sensitive protocol behavior.
- Only Liked and custom playlists are shareable; All is not shareable as a saveable playlist.
- The normative playlist payload semantics are: expected action type, playlist kind, title, and ordered music IDs. A sender-side custom playlist identity is not required to become the receiver's playlist identity.
- The receiver must explicitly confirm before a shared music item starts playback or a shared playlist enters its prefilled creation flow.
- Music-link handling must resolve the referenced music before confirmation can lead to playback.
- Playlist-link handling must successfully decode and validate the payload and classify each referenced music ID as resolved or unresolved.
- When all playlist music resolves, normal sharing confirmation may proceed with the full ordered list.
- When one or more playlist music IDs are unresolved, Maple Pod must disclose those unresolved items before any reduced import can proceed.
- Dropping unresolved music and continuing with only the resolvable subset requires a separate explicit receiver acceptance; otherwise no import proceeds.
- A reduced import must preserve the relative order of the resolvable music from the shared playlist.
- Confirming a shared playlist authorizes loading the accepted data into a prefilled creation flow, not immediate playlist creation. The receiver must still complete that creation flow.

## Edge Cases
Unknown music IDs in single-music shares, undecodable playlist hashes, wrong action types, schema-invalid playlist payloads, rejected sharing confirmation, rejection of reduced import, or cancelled playlist creation leave the user without the requested shared side effect. Unresolved playlist music may be omitted only through the explicit disclosure-and-consent branch.

## Reverse-spec evidence
Observed in `src/router/index.ts`, `src/utils/common.ts`, sharing UI components, `src/schemas/HashActionImportSaveablePlaylistData.ts`, and `src/schemas/SaveablePlaylist.ts`. The transport protocol, semantic payload boundary, Liked/custom shareability, confirmation gate, prefilled creation flow, and unresolved-music disclosure/consent semantics were explicitly accepted as normative. Per-music resolution and the reduced-import consent branch are accepted intent that the current import route does not yet enforce.
