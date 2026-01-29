# Coding Conventions

**Analysis Date:** 2026-01-29

## Naming Patterns

**Files:**
- Vue components: PascalCase (e.g., `MusicPlayer.vue`, `UiDropdownMenu.vue`, `DefaultLayout.vue`)
- Composables: camelCase with `use` prefix (e.g., `useMusicStore.ts`, `useAudioPlayer.ts`, `useDragAndSort.ts`)
- Utilities: camelCase (e.g., `common.ts`)
- Types: camelCase (e.g., `index.ts`)
- Schemas: PascalCase (e.g., `SavedUserData.ts`, `SaveablePlaylist.ts`)
- Private components: PascalCase with `_` prefix (e.g., `_UiToast.vue`, `_UiConfirmDialog.vue`)

**Functions:**
- Regular functions: camelCase (e.g., `createPlaylist`, `toggleMusicLike`, `formatTime`)
- Composables: camelCase with `use` prefix (e.g., `useAudio()`, `useDragAndSort()`)
- Helper functions: camelCase (e.g., `mergeClasses`, `dataToUrlHash`, `chunkArray`)

**Variables:**
- Constants: SCREAMING_SNAKE_CASE (e.g., `MAX_HISTORY_LENGTH`, `RECORD_AFTER`)
- Regular variables: camelCase (e.g., `currentMusic`, `isReady`, `playlist`)
- Refs: camelCase with descriptive names (e.g., `isDragging`, `placeholderIndex`)

**Types:**
- Interfaces: PascalCase (e.g., `MusicData`, `Playlist`, `SavedUserData`, `UseAudioOptions`)
- Type aliases: PascalCase (e.g., `PlaylistId`, `CustomPlaylistId`, `TaskFn`)
- Generic parameters: Single uppercase letter or PascalCase (e.g., `T`, `Id extends PlaylistId`)

## Code Style

**Formatting:**
- Indentation: Tabs (detected in all files)
- Line length: No strict limit, but readability preferred
- Semicolons: Not used (except in rare cases)
- Quotes: Single quotes for strings
- Trailing commas: Used in multiline arrays and objects

**Linting:**
- Tool: ESLint 9.28.0
- Config: `@deviltea/eslint-config` (flat config format)
- Config file: `eslint.config.mjs`
- Run command: `pnpm lint`
- Fix command: `pnpm lint:fix`
- Pre-commit hook: Runs `lint-staged` which applies `eslint --fix` on all files

**Key linting patterns observed:**
```typescript
// Disable specific rules when needed
// eslint-disable-next-line no-restricted-properties

// Use non-null assertion sparingly
map.get(item.data.mark)!.push(item)

// Prefer template literals over concatenation
// eslint-disable-next-line prefer-template
return '#' + btoa(...)
```

## Import Organization

**Order:**
1. Type imports from external packages
2. Type imports from local files
3. Regular imports from external packages
4. Regular imports from local files (aliased with `@/`)
5. CSS imports

**Examples:**
```typescript
// Type imports first
import type { CustomPlaylistId, MusicData, Playlist } from '@/types'

// Then regular imports from packages
import localforage from 'localforage'
import { ofetch } from 'ofetch'

// Then component imports
import CreatePlaylistDialog from '@/components/CreatePlaylistDialog.vue'
```

**Path Aliases:**
- `@/` resolves to `src/` directory
- Used consistently throughout the codebase
- Example: `import { useMusicStore } from '@/composables/useMusicStore'`

**Auto-imports:**
- Vue APIs auto-imported (e.g., `ref`, `computed`, `watch`)
- VueUse composables auto-imported (e.g., `useAsyncState`, `useEventListener`)
- Pinia APIs auto-imported (e.g., `defineStore`, `storeToRefs`)
- Router auto-imported: `Routes` constant and `useRouter`
- Composables from `src/composables/` auto-imported
- Utilities from `src/utils/` auto-imported
- Components from `src/components/` auto-imported
- Generated type definitions: `auto-imports.d.ts`, `components.d.ts`

## Error Handling

**Patterns:**

**Try-catch for async operations:**
```typescript
try {
  const git = simpleGit()
  const shortHash = await git.revparse(['--short', 'HEAD'])
  return shortHash.trim()
}
catch (e) {
  console.warn('Failed to get Git commit hash:', e)
  return 'unknown'
}
```

**Null checking:**
```typescript
const musicData = getMusicData(musicId)
if (musicData == null)
  return

// Early returns for guard clauses
if (playlist == null || playlist.id === 'all')
  return
```

**Safe parsing with valibot:**
```typescript
const result = safeParse(HashActionImportSavedUserDataSchema, data)
if (result.success) {
  // Use result.output
}
```

**Custom error classes:**
```typescript
export class CancelledError extends Error {
  constructor(message: string = 'Task was cancelled') {
    super(message)
    this.name = 'CancelledError'
  }
}
```

**Error handling in promises:**
```typescript
task.run()
  .then(() => {
    this.running--
    this.runNext()
  })
  .catch((error) => {
    if (error instanceof CancelledError) {
      // Handle cancelled tasks
    }
    else {
      console.error('Task failed:', error)
    }
  })
```

## Logging

**Framework:** Console API

**Patterns:**
- `console.warn()` for non-critical issues (e.g., build warnings, validation failures)
- `console.error()` for errors that need attention
- No logging framework detected
- Limited logging in production code

**Examples:**
```typescript
console.warn('Failed to get Git commit hash:', e)
console.warn(`Invalid playlist ID: ${playlist.id}`)
console.error('Task failed:', error)
```

## Comments

**When to Comment:**
- Complex logic or non-obvious behavior
- TypeScript suppression explanations
- TODO markers (though none found in current codebase)

**JSDoc/TSDoc:**
- Minimal JSDoc usage
- Interfaces and types are self-documenting through TypeScript
- Function signatures serve as documentation

**Comment style:**
```typescript
// Single-line comments for brief explanations
// Multiple single-line comments for longer explanations

/* Multi-line comments for config or special cases */

// Custom event to notify when the audio.loop property is updated
// @ts-expect-error expect HTMLMediaElement.prototype.__lookupSetter__ to exist
```

## Function Design

**Size:** 
- Small focused functions preferred
- Longer functions (100+ lines) only in store/composable files
- Helper functions typically 5-30 lines

**Parameters:** 
- Options objects for functions with multiple parameters
- Type-safe with TypeScript interfaces
```typescript
export function useAudio(options: UseAudioOptions = {}) {
  const { autoplay = true, loop = false, muted = false, volume = 1 } = options
  // ...
}
```

**Return Values:** 
- Composables return object with named properties
- Helper functions return primitive values or typed objects
- Tuple returns for success/error patterns:
```typescript
function createPlaylist(title: string, list: string[] = []): 
  [id: CustomPlaylistId, error: null] | [null, error: string]
```

**Async patterns:**
- Use `async/await` consistently
- Return promises for composables with async state
```typescript
const ready = until(isDataReady)
  .toBe(true)
  .then(async () => {
    await loadOfflineMusics()
  })
```

## Module Design

**Exports:** 
- Named exports preferred
- No default exports for utilities
- Default export only for Vue components and router
```typescript
export function formatTime(timeInSeconds: number) { }
export class PromiseQueue { }
export const useMusicStore = defineStore('music', () => { })
```

**Barrel Files:** 
- Used for schemas: `src/schemas/index.ts`
- Used for types: `src/types/index.ts`
- Not used for components (auto-imported by unplugin-vue-components)

## Vue-Specific Conventions

**Component structure:**
```vue
<script setup lang="ts">
// Type imports
// Composable usage
// Local state and logic
</script>

<template>
  <!-- Template with PikaCSS styling -->
</template>
```

**Composition API:**
- Exclusive use of `<script setup>` syntax
- No Options API usage
- Composables extracted for reusable logic

**Props and emits:**
```typescript
const props = defineProps<{
  playlistId: PlaylistId
}>()

const modelValue = defineModel<string>({ required: true })
```

**PikaCSS utility:**
- Inline style definitions using `pika()` function
- Type-safe CSS-in-JS approach
- Used via `:class` binding
```vue
<div :class="pika({
  position: 'relative',
  width: '100%',
  height: '100dvh',
})">
```

**Reactivity:**
- `ref()` for primitive values
- `computed()` for derived state
- `watch()` for side effects
- `storeToRefs()` to destructure store state while maintaining reactivity

## TypeScript Conventions

**Type safety:**
- Strict mode enabled (via `@deviltea/tsconfig`)
- Type assertions used sparingly with `!` operator
- Generic types for flexible APIs
- Union types for state machines (e.g., `'off' | 'repeat' | 'repeat-1'`)

**Interface vs Type:**
- Interfaces for object shapes (e.g., `MusicData`, `Playlist`)
- Type aliases for unions and mapped types (e.g., `PlaylistId`)

**Type guards:**
```typescript
function isCustomPlaylist(id: PlaylistId): id is CustomPlaylistId {
  return id.startsWith('custom:')
}
```

---

*Convention analysis: 2026-01-29*
