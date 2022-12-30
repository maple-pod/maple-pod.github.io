import { ref, computed } from 'vue'
import { createModuleHook, createModuleSetup } from '../utils'

import type { Howl } from 'howler'
import type { ComputedRef, InjectionKey } from 'vue'
import type { Song, UseSong } from './types'

const PROVIDE_KEY: InjectionKey<UseSong> = Symbol('song')

function _useSong () {
  const song = ref<Song | null>(null)

  function computedSongProp<T extends Song[keyof Song]> (key: keyof Song) {
    return computed<Song[keyof Song]>(() => {
      return song.value === null
        ? null
        : song.value[key]
    }) as ComputedRef<T>
  }

  const mark = computedSongProp<string | null>('mark')
  const name = computedSongProp<string | null>('name')
  const albumArtist = computedSongProp<string | null>('albumArtist')
  const artist = computedSongProp<string | null>('artist')
  const description = computedSongProp<string | null>('description')
  const keywords = computedSongProp<string | null>('keywords')
  const music = computedSongProp<Howl | null>('music')

  return {
    song,
    mark,
    name,
    albumArtist,
    artist,
    description,
    keywords,
    music
  }
}

export const setup = createModuleSetup(PROVIDE_KEY, _useSong)
export const useSong = createModuleHook(PROVIDE_KEY, _useSong)
