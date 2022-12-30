import { Howler, Howl } from 'howler'
import { computed, ref, watch } from 'vue'
import { useToggle } from '@vueuse/core'
import { useSong } from './song'
import { createModuleHook, createModuleSetup } from '../utils'

import type { InjectionKey } from 'vue'
import type { MapleBgmData, RepeatType, UseMusicPlayer } from './types'

const timeToText = (sec: number) => `${`${Math.floor(sec / 60)}`.padStart(2, '0')}:${`${sec % 60}`.padStart(2, '0')}`
function loadMusic (src: string) {
  return new Promise<Howl>((resolve, reject) => {
    const music: Howl = new Howl({
      src,
      html5: true,
      onload: () => resolve(music),
      onloaderror: (_, error) => reject(error)
    })
  })
}

const PROVIDE_KEY: InjectionKey<UseMusicPlayer> = Symbol('music-player')
function _useMusicPlayer () {
  const { song, music } = useSong()

  async function loadSong (data: MapleBgmData) {
    song.value = {
      mark: `https://maple-pod.github.io/mark/${data.mark}.png`,
      name: data.metadata.title,
      albumArtist: data.metadata.albumArtist,
      artist: data.metadata.artist,
      description: data.description,
      keywords: data.maps.map((m) => [m.street, m.map].join('-')).join(','),
      music: null
    }
    song.value.music = await loadMusic(`https://maple-pod.github.io/bgm/${data.source.structure}/${data.filename}.mp3`)
  }

  const currentTime = ref(0)
  const isDraggingCurrentTime = ref(false)
  watch(isDraggingCurrentTime, (bool) => {
    if (!bool && music.value !== null) {
      music.value.seek(currentTime.value)
      if (!isPlaying.value) {
        music.value.play()
      }
    }
  })
  const updateCurrentTime = () => {
    if (music.value === null) {
      if (currentTime.value !== 0) currentTime.value = 0
    } else if (music.value.playing() && !isDraggingCurrentTime.value) {
      currentTime.value = Number(Math.round(Number(music.value.seek()) || 0))
    }
  }
  const currentTimeText = computed(() => timeToText(currentTime.value))

  const duration = computed(() => Math.round(music.value?.duration() ?? 0))
  const durationText = computed(() => timeToText(duration.value))

  const [isMuted, toggleMute] = useToggle(false)
  watch(isMuted, (bool) => {
    Howler.mute(bool)
  }, {
    immediate: true
  })

  const volume = ref(1)
  const updateVolume = () => {
    if (volume.value === Howler.volume()) return
    Howler.volume(volume.value)
  }

  const isPlaying = ref(false)
  const updateIsPlaying = () => {
    isPlaying.value = music.value === null
      ? false
      : music.value.playing()
  }

  const isLoaded = ref(false)
  const updateIsLoaded = () => {
    isLoaded.value = music.value === null
      ? false
      : music.value.state() === 'loaded'
  }

  const togglePlay = () => {
    if (isPlaying.value) {
      music.value?.pause()
    } else {
      music.value?.play()
    }
  }

  const repeatType = ref<RepeatType>('none')
  const toggleRepeat = () => {
    const types: RepeatType[] = ['none', 'all', 'single']
    const index = types.indexOf(repeatType.value)
    repeatType.value = types[(index + 1) % types.length]
  }

  const [isRandomMode, toggleRandomMode] = useToggle(false)

  const updatePerFrame = () => {
    updateVolume()
    updateCurrentTime()
    updateIsPlaying()
    updateIsLoaded()
    requestAnimationFrame(updatePerFrame)
  }
  requestAnimationFrame(updatePerFrame)

  return {
    loadSong,
    isMuted,
    toggleMute,
    volume,
    isDraggingCurrentTime,
    currentTime,
    currentTimeText,
    duration,
    durationText,
    isPlaying,
    isLoaded,
    togglePlay,
    repeatType,
    toggleRepeat,
    isRandomMode,
    toggleRandomMode
  }
}

export const setup = createModuleSetup(PROVIDE_KEY, _useMusicPlayer)
export const useMusicPlayer = createModuleHook(PROVIDE_KEY, _useMusicPlayer)
