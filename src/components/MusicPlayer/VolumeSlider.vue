<template>
  <HorizontalSlider v-model="volume" :max="1" :min="0" :step="0.05"></HorizontalSlider>
</template>

<script setup lang="ts">
import { useMusicPlayer } from '@/modules/music-player'
import HorizontalSlider from './HorizontalSlider.vue'

const { volume } = useMusicPlayer()
</script>
