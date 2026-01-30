# Codebase Concerns

**Analysis Date:** 2026-01-29

## Tech Debt

**Large Generated File (`pika.gen.ts`):**
- Issue: Auto-generated CSS-in-JS file is 161KB, not tracked in git but grows with each style definition
- Files: `pika.gen.ts` (root directory)
- Impact: Large file size affects IDE performance, increases build time, potential for unused styles accumulation
- Fix approach: Consider tree-shaking unused styles, or migrate to a more static CSS approach

**Unsafe Property Access Pattern (`useAudio` loop setter/getter):**
- Issue: Uses deprecated `__lookupSetter__` and `__lookupGetter__` to override Audio element `loop` property
- Files: `src/composables/useAudio.ts` (lines 22-29)
- Impact: Relies on non-standard deprecated APIs, may break in future browser versions
- Fix approach: Use custom wrapper around Audio element or proxy pattern instead of prototype manipulation

**Inconsistent Error Handling:**
- Issue: Mix of silent catch blocks returning null and console.error logging, no centralized error reporting
- Files:
  - `src/composables/useMusicStore.ts` (line 381)
  - `src/utils/common.ts` (lines 106, 185, 191)
  - `src/components/AppBackground.vue` (line 33)
- Impact: Silent failures make debugging difficult, users may not see meaningful error messages
- Fix approach: Implement centralized error handling service with toast notifications for user-facing errors

**Type Safety Workarounds:**
- Issue: Heavy use of `any` type and type assertions throughout codebase
- Files:
  - `src/composables/useAppDialog.ts` (lines 5, 8, 9, 39)
  - `src/utils/common.ts` (lines 4, 5, 8, 18, 38, 116, 118, 130)
  - `src/composables/useDocumentPictureInPicture.ts` (lines 58, 59, 68, 76)
- Impact: Loses TypeScript's type safety benefits, potential runtime errors
- Fix approach: Define proper types for all any usages, especially for Dialog component props and common utility functions

**Data Migration Code in Production:**
- Issue: Old data format conversion logic runs on every app startup
- Files: `src/composables/useMusicStore.ts` (lines 320-330)
- Impact: Performance overhead, complexity in production code for legacy format support
- Fix approach: Create one-time migration script or deprecate after sufficient time has passed

## Known Bugs

**Object URL Memory Leaks:**
- Symptoms: Background images create blob URLs that are not properly revoked
- Files:
  - `src/components/AppBackground.vue` (line 31)
  - `src/utils/common.ts` (lines 40, 61)
- Trigger: Changing background images or decoding images repeatedly
- Workaround: Music player audio URLs are properly cleaned up (lines 173-177 in `useMusicStore.ts`)
- Fix: Add URL.revokeObjectURL() cleanup in watch cleanup function or onUnmounted hook

**Playlist Validation Only on Startup:**
- Symptoms: Invalid playlists are only filtered on initial load
- Files: `src/composables/useMusicStore.ts` (lines 309-326)
- Trigger: Occurs when saved playlists reference non-existent music IDs
- Workaround: Console warnings are logged
- Fix: Add runtime validation when adding music to playlists or implement schema validation with Valibot

## Security Considerations

**Development Environment Variables Exposed:**
- Risk: `.env.development` file contains magic header keys/values that could be exposed
- Files: `.env.development`
- Current mitigation: Development-only configuration, not in production build
- Recommendations: Ensure these values are never committed to production env files, consider using environment-specific key rotation

**No Input Sanitization on Export Functions:**
- Risk: User-controlled data exported to JSON files without sanitization
- Files: `src/utils/common.ts` (`exportToJSONFile`, line 38)
- Current mitigation: Client-side only, no server interaction
- Recommendations: Add filename sanitization to prevent directory traversal or XSS in filename

**LocalStorage/IndexedDB Data Persistence:**
- Risk: Sensitive user data (playlists, history) stored unencrypted in browser storage
- Files:
  - `src/composables/useSavedUserData.ts` (uses localStorage)
  - `src/composables/useMusicStore.ts` (uses localforage/IndexedDB, line 365)
- Current mitigation: No personally identifiable information stored, music preferences only
- Recommendations: Document data retention policy, implement data export/delete features for privacy compliance

**Experimental API Usage (Document Picture-in-Picture):**
- Risk: Uses unstable browser API with type casting
- Files: `src/composables/useDocumentPictureInPicture.ts` (lines 68, 76)
- Current mitigation: Feature detection with fallback (`isSupported` check, line 4)
- Recommendations: Monitor browser support, add polyfill or more graceful degradation

## Performance Bottlenecks

**Large Data File Loading on Startup:**
- Problem: `/resources/data.json` loaded synchronously on app initialization
- Files: `src/composables/useMusicStore.ts` (line 39)
- Cause: All music metadata (BGM list with marks) loaded at once
- Improvement path: Implement lazy loading for playlists or paginated data loading

**Image Decompression on Every Item:**
- Problem: Each music cover image is decompressed from binary on load
- Files:
  - `src/composables/useMusicStore.ts` (line 45)
  - `src/utils/common.ts` (`decodeImageFromBinary`, lines 57-63)
- Cause: Compressed binary marks decoded individually with blob URL creation
- Improvement path: Use web workers for decompression, implement image caching layer, or pre-decompress on server

**Repeated Image Scaling Operations:**
- Problem: Convert images to 512x512 for MediaSession API on every music change
- Files: `src/utils/common.ts` (`convertImageDataUrlToDataUrl512`, lines 197-234)
- Cause: Canvas-based image scaling runs in main thread
- Improvement path: Cache scaled images, use CSS scaling instead, or compute during data processing

**No Virtual Scrolling for Large Playlists:**
- Problem: Large music lists render all items in DOM
- Files: Component uses `UiVerticalList.vue` but full list analysis needed
- Cause: Standard list rendering without virtualization
- Improvement path: Implement virtual scrolling for playlists with >100 items

## Fragile Areas

**Audio Queue Management:**
- Files: `src/composables/useAudioQueue.ts`, `src/composables/useAudioPlayer.ts`
- Why fragile: Complex state management with random/repeat modes and queue modifications
- Safe modification: Always test with all repeat modes (off/one/all) and random on/off combinations
- Test coverage: No test files found for audio queue logic

**Playlist State Synchronization:**
- Files: `src/composables/useMusicStore.ts` (lines 186-199)
- Why fragile: currentPlaylist ref must stay in sync with audioPlayerLogic state
- Safe modification: Use watcher to validate playlist-music consistency, ensure atomic updates
- Test coverage: No automated tests for playlist state transitions

**Service Worker Cache Strategy:**
- Files: `vite.config.ts` (lines 65-111)
- Why fragile: Multiple cache strategies (CacheFirst, NetworkFirst) with different expiration rules
- Safe modification: Test offline functionality thoroughly, verify cache invalidation works
- Test coverage: Manual testing required for PWA functionality

**HMR (Hot Module Replacement) Hooks:**
- Files:
  - `src/composables/useMusicStore.ts` (lines 430-431)
  - `src/composables/useAppStore.ts` (lines 141-142)
- Why fragile: Manual HMR accept calls for Pinia stores, can cause state loss on hot reload
- Safe modification: Test HMR behavior during development, ensure state persistence
- Test coverage: Development-only concern

## Scaling Limits

**LocalForage Storage Quota:**
- Current capacity: Browser-dependent (typically 50MB-1GB for IndexedDB)
- Limit: Offline music storage limited by browser quota, no quota monitoring
- Scaling path: Implement quota checking API, show storage usage to user, add cleanup options for old downloads

**Client-Side Download Queue (5 concurrent):**
- Current capacity: `PromiseQueue` limited to 5 concurrent downloads
- Limit: `src/composables/useMusicStore.ts` (line 392)
- Scaling path: Make concurrency configurable, implement priority queue for user-requested downloads

**History Array Growth (50 items max):**
- Current capacity: History limited to 50 most recent tracks
- Limit: `src/composables/useMusicStore.ts` (line 205)
- Scaling path: Consider implementing pagination or archive older history to separate storage

## Dependencies at Risk

**Vue Router Middleware (Low Usage Package):**
- Risk: `@deviltea/vue-router-middleware` is a low-adoption package (^0.0.3)
- Impact: Router middleware functionality may lack community support
- Migration plan: Consider extracting middleware logic or migrating to official Vue Router navigation guards

**PikaCSS (Experimental):**
- Risk: `@pikacss/vite-plugin-pikacss` and `@pikacss/plugin-icons` are at 0.0.29 (pre-1.0)
- Impact: API may change, breaking changes possible, limited documentation
- Migration plan: Plan migration to established CSS solution (UnoCSS, Tailwind) or vanilla CSS modules

**TypeScript 5.8 (~5.8.0):**
- Risk: Using tilde range for TypeScript, may not get patch updates
- Impact: Missing bug fixes in TypeScript compiler
- Migration plan: Change to caret (^5.8.0) for patch updates or explicit version management

## Missing Critical Features

**Error Boundary:**
- Problem: No global error boundary for Vue component errors
- Blocks: Graceful degradation when components fail, error reporting
- Priority: Medium

**Offline Detection UI:**
- Problem: Limited feedback when offline mode is active (only music disable state)
- Blocks: User awareness of offline limitations
- Priority: Low

**Data Import/Validation:**
- Problem: User data export exists but no import functionality
- Blocks: Cannot restore backups or migrate between devices easily
- Priority: Medium

## Test Coverage Gaps

**No Test Files:**
- What's not tested: Entire codebase has no `.test.*` or `.spec.*` files
- Files: All application logic
- Risk: Regressions undetected, refactoring dangerous
- Priority: High

**Complex State Management Untested:**
- What's not tested: Pinia store logic, playlist operations, audio queue management
- Files:
  - `src/composables/useMusicStore.ts` (431 lines)
  - `src/composables/useAudioPlayer.ts` (175 lines)
  - `src/composables/useAudioQueue.ts` (132 lines)
- Risk: State corruption, race conditions, edge cases in random/repeat logic
- Priority: High

**Browser API Integration Untested:**
- What's not tested: MediaSession API, Document Picture-in-Picture, Service Worker
- Files:
  - `src/composables/useMusicStore.ts` (lines 239-302)
  - `src/composables/useDocumentPictureInPicture.ts`
- Risk: Browser compatibility issues, API usage errors
- Priority: Medium

**Data Migration Logic Untested:**
- What's not tested: Old data format conversion for playlists
- Files: `src/composables/useMusicStore.ts` (lines 309-331)
- Risk: Data loss during migration, invalid state after migration
- Priority: High

---

*Concerns audit: 2026-01-29*
