---
schema: ef/project@1
type: project
id: PROJECT
title: "Maple Pod"
status: active
summary: "A MapleStory music player, built as a Vue 3 single-page PWA and deployed to GitHub Pages."
tags: []
relations: []
resources: []
---
## Vision

Give MapleStory players a polished, installable web app for listening to the game's music (BGM) anywhere, with playlists, saved user data, and offline-capable PWA behavior.

## Scope

- Music playback with playlist support (queue, saved playlists, per-user saved data persisted via localforage)
- Playlist browsing and in-playlist track filtering
- PWA delivery: installable, auto-updating service worker, GitHub Pages hosting
- Music and background resources fetched from https://maple-pod.deviltea.me

## Non-goals

- No backend or user accounts: all user data stays client-side
- No hosting or distribution of audio assets in this repository; assets come from the external resource host
- No native mobile/desktop apps; the PWA is the only delivery target

## Context

Vue 3 + Vite SPA. State: Pinia + composables, persistence via localforage. UI primitives: reka-ui. Styling: PikaCSS. Runtime data validation: valibot. Deployed to GitHub Pages via GitHub Actions on push to master; dev server proxies /resources/* to maple-pod.deviltea.me.

## Terminology

| Term | Definition | Avoid or aliases |
|---|---|---|
| Liked | The built-in favorites playlist (fixed id `liked`) holding the user's liked musics. | "favorites" |
| custom playlist | A user-created playlist whose ID carries the `custom:` prefix; can be renamed and deleted. | "user playlist" |
| hash action | A typed payload carried in the URL fragment (`import-saveable-playlist`, `import-saved-user-data`), validated with valibot by route middleware before being applied. | — |
| mark | The categorical label on each music (`MusicData.mark`), used for mark-group playlists and in-playlist filtering. | Do not call it "tag" or "category". |
| music | One playable MapleStory BGM entry (corresponds to `MusicData` / `musicId` in code). | Do not mix with "track" or "song"; code uses "music" throughout. |
| offline music | A music whose audio blob is saved locally via localforage and can play without network access. | "downloaded music" |
| playing queue | The actual playback order derived from a playlist (shuffled when random is enabled). | "queue" |
| playlist | An ordered list of musics; either built-in (All, Liked, mark groups) or custom. | — |
| resource host | `https://maple-pod.deviltea.me`, the external host serving music data, audio, covers, and background images. | — |
| saveable playlist | The shareable/exportable form of a playlist (`SaveablePlaylistSchema`), the data carrier of playlist hash actions. | — |
| saved user data | The full client-side user data blob persisted under the localStorage key `maple-pod`: preferences + liked + playlists + history. | — |
