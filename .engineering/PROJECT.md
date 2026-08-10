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
