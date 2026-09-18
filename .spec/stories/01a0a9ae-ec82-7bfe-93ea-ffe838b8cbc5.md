---
schema: spec/story@1
kind: story
id: 01a0a9ae-ec82-7bfe-93ea-ffe838b8cbc5
title: Organize music into reusable playlists
status: active
relations: []
resources: []
---
## Actor
A person organizing music in Maple Pod.

## Goal
Keep music in reusable collections through All, Liked, and custom playlists.

## Value
Return to known music collections without rebuilding them each session.

## Reverse-spec evidence
Observed in `src/views/Playlists.vue`, `src/views/Playlist.vue`, playlist dialogs/menus, `src/composables/useMusicStore.ts`, and `src/composables/useSavedUserData.ts`. During reverse-spec review, All, Liked, and custom playlists were explicitly accepted as stable product concepts; this intent was explicitly accepted during reverse-spec review.
