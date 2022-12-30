<template>
  <HorizontalSlider
    v-model="currentTime"
    :max="duration"
    :min="0"
    :step="1"
    @mousedown="isDraggingCurrentTime = true"
    @mouseup="isDraggingCurrentTime = false"
    @touchstart="isDraggingCurrentTime = true"
    @touchend="isDraggingCurrentTime = false"
  ></HorizontalSlider>
</template>

<script setup lang="ts">
import { useMusicPlayer } from '@/modules/music-player'
import HorizontalSlider from './HorizontalSlider.vue'

const { isDraggingCurrentTime, currentTime, duration } = useMusicPlayer()
</script>
