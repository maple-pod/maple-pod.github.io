<template>
  <div class="flex items-center">
    <button class="p-2 text-2xl text-secondary">
      <icon-bi-heart-fill></icon-bi-heart-fill>
    </button>
    <img
      class="ml-2 w-16 h-16 rounded-xl bg-white"
      :src="mark ?? ''"
      alt="Papulatus"
    />
    <div ref="nameWrapper" class="ml-2 mr-2 overflow-hidden">
      <AutoMarque class="text-4xl text-primary">{{ songName }}</AutoMarque>
      <AutoMarque class="text-xl text-secondary">{{ artist }}</AutoMarque>
    </div>
    <span class="ml-auto mr-2 text-primary font-semibold">{{ currentTimeText }}</span>
    <button class="mr-0 p-2 text-2xl text-secondary hover:text-primary" :disabled="!isLoaded" @click="togglePlay">
      <icon-clarity-pause-solid v-if="isPlaying"></icon-clarity-pause-solid>
      <icon-clarity-play-solid v-else></icon-clarity-play-solid>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useMusicPlayer, useSong } from '@/modules/music-player'
import AutoMarque from './AutoMarque.vue'

const { mark, name: songName, artist } = useSong()
const { currentTimeText, isPlaying, isLoaded, togglePlay } = useMusicPlayer()
</script>
