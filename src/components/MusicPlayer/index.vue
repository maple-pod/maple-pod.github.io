<template>
  <div
    class="fixed bottom-0 left-0 w-screen p-4 rounded-t-3xl box-shadow bg-music-player-light dark:bg-music-player-dark"
  >
    <button
      v-show="!mdAndUp"
      class="absolute top-0 right-0 w-10 h-10 flex justify-center items-center rounded-1 text-secondary bg-music-player-light dark:bg-music-player-dark box-shadow transform -translate-x-1/2 -translate-y-1/2"
      @click="isMini = !isMini"
    >
      <icon-akar-icons-chevron-up v-show="isMini"></icon-akar-icons-chevron-up>
      <icon-akar-icons-chevron-down v-show="!isMini"></icon-akar-icons-chevron-down>
    </button>
    <NormalPlayer v-show="!isMini"></NormalPlayer>
    <MiniPlayer v-show="isMini"></MiniPlayer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBreakpoints } from '@/modules/breakpoints'
import NormalPlayer from './NormalPlayer.vue'
import MiniPlayer from './MiniPlayer.vue'

const { mdAndUp } = useBreakpoints()
const isMiniP = ref<boolean>(false)
const isMini = computed<boolean>({
  get () {
    if (mdAndUp.value) return false
    return isMiniP.value
  },
  set (value) {
    if (mdAndUp.value) return
    isMiniP.value = value
  }
})
</script>
