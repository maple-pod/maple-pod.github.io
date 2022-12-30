<template>
  <template v-if="mdAndUp">
    <div class="px-64 mdOnly:px-6">
      <div class="flex items-center">
        <div class="w-1/4 flex">
          <div class="flex flex-col justify-center items-center">
            <img
              class="w-12 h-12 dark:bg-white bg-gray-300 rounded"
              :src="mark ?? ''"
              alt="Papulatus"
            />
            <div class="pt-1">
              <button class="p-2 text-2xl text-secondary">
                <icon-bi-heart-fill></icon-bi-heart-fill>
              </button>
            </div>
          </div>
          <div class="ml-2 text-secondary text-xl overflow-hidden">
            <AutoMarque>{{ albumArtist ?? '' }}</AutoMarque>
            <AutoMarque class="py-1 text-primary text-3xl">{{ songName }}</AutoMarque>
            <AutoMarque>{{ artist }}</AutoMarque>
          </div>
        </div>
        <div class="w-2/4 flex justify-center items-center text-xl text-secondary">
          <button
            class="p-2 hover:text-primary"
            :class="{ 'text-primary': isRandomMode }"
            @click="toggleRandomMode"
          >
            <icon-clarity-shuffle-line></icon-clarity-shuffle-line>
          </button>
          <button class="p-2 hover:text-primary transform flip-x">
            <icon-clarity-step-forward-solid></icon-clarity-step-forward-solid>
          </button>
          <button class="p-2 hover:text-primary text-3xl" :disabled="!isLoaded" @click="togglePlay">
            <icon-clarity-pause-solid v-if="isPlaying"></icon-clarity-pause-solid>
            <icon-clarity-play-solid v-else></icon-clarity-play-solid>
          </button>
          <button class="p-2 hover:text-primary">
            <icon-clarity-step-forward-solid></icon-clarity-step-forward-solid>
          </button>
          <button
            class="p-2 hover:text-primary"
            :class="{ 'text-primary': repeatType !== 'none' }"
            @click="toggleRepeat"
          >
            <icon-clarity-replay-one-line v-if="repeatType === 'single'"></icon-clarity-replay-one-line>
            <icon-clarity-replay-all-line v-else></icon-clarity-replay-all-line>
          </button>
        </div>
        <div class="w-1/4 flex items-center text-secondary text-xl">
          <button @click="toggleMute">
            <template v-if="isMuted">
              <icon-clarity-volume-mute-solid></icon-clarity-volume-mute-solid>
            </template>
            <template v-else>
              <icon-clarity-volume-down-solid v-if="volume < 0.5"></icon-clarity-volume-down-solid>
              <icon-clarity-volume-up-solid v-else></icon-clarity-volume-up-solid>
            </template>
          </button>
          <VolumeSlider class="ml-4"></VolumeSlider>
        </div>
      </div>
      <div class="mt-6 flex items-center text-secondary font-semibold">
        <span class="w-1/12 text-center">{{ currentTimeText }}</span>
        <CurrentTimeSlider class="mx-4"></CurrentTimeSlider>
        <span class="w-1/12 text-center">{{ durationText }}</span>
      </div>
    </div>
  </template>
  <template v-else>
    <div class="flex flex-col items-center relative">
      <img
        class="-mt-4 w-24 h-24 bg-white dark:bg-gray-800 absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        :src="mark ?? ''"
        alt="Papulatus"
      />
      <div class="pt-10">
        <button class="p-2 text-2xl text-secondary">
          <icon-bi-heart-fill></icon-bi-heart-fill>
        </button>
      </div>
      <div class="max-w-full flex flex-col items-center text-secondary text-xl overflow-hidden">
        <AutoMarque>{{ albumArtist }}</AutoMarque>
        <AutoMarque class="py-1 text-primary text-3xl">{{ songName }}</AutoMarque>
        <AutoMarque>{{ artist }}</AutoMarque>
      </div>
      <div class="w-full px-8 py-4 smOnly:w-2/3">
        <div>
          <CurrentTimeSlider></CurrentTimeSlider>
        </div>
        <div class="flex justify-between">
          <span class="text-primary font-semibold">{{ currentTimeText }}</span>
          <span class="text-secondary font-semibold">{{ durationText }}</span>
        </div>
      </div>
      <div class="flex items-center text-xl text-secondary">
        <button
          class="p-2 hover:text-primary"
          :class="{ 'text-primary': isRandomMode }"
          @click="toggleRandomMode"
        >
          <icon-clarity-shuffle-line></icon-clarity-shuffle-line>
        </button>
        <button class="p-2 hover:text-primary transform flip-x">
          <icon-clarity-step-forward-solid></icon-clarity-step-forward-solid>
        </button>
        <button class="p-2 hover:text-primary text-3xl" :disabled="!isLoaded" @click="togglePlay">
          <icon-clarity-pause-solid v-if="isPlaying"></icon-clarity-pause-solid>
          <icon-clarity-play-solid v-else></icon-clarity-play-solid>
        </button>
        <button class="p-2 hover:text-primary">
          <icon-clarity-step-forward-solid></icon-clarity-step-forward-solid>
        </button>
        <button
          class="p-2 hover:text-primary"
          :class="{ 'text-primary': repeatType !== 'none' }"
          @click="toggleRepeat"
        >
          <icon-clarity-replay-one-line v-if="repeatType === 'single'"></icon-clarity-replay-one-line>
          <icon-clarity-replay-all-line v-else></icon-clarity-replay-all-line>
        </button>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useBreakpoints } from '@/modules/breakpoints'
import { useMusicPlayer, useSong } from '@/modules/music-player'
import CurrentTimeSlider from './CurrentTimeSlider.vue'
import VolumeSlider from './VolumeSlider.vue'
import AutoMarque from './AutoMarque.vue'

const { mdAndUp } = useBreakpoints()
const { mark, name: songName, albumArtist, artist } = useSong()
const {
  isMuted,
  toggleMute,
  volume,
  currentTimeText,
  durationText,
  isPlaying,
  isLoaded,
  togglePlay,
  repeatType,
  toggleRepeat,
  isRandomMode,
  toggleRandomMode
} = useMusicPlayer()
</script>
