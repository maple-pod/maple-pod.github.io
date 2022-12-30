<template>
  <input
    v-model="value"
    :style="`--progress: ${100 * value / max}%;`"
    ref="slider"
    type="range"
    :min="min"
    :max="max"
    class="horizontal-slider"
  />
</template>

<script setup lang="ts">
import { computed, defineEmit, defineProps } from 'vue'

const props = defineProps({
  min: {
    type: Number,
    required: true
  },
  max: {
    type: Number,
    required: true
  },
  modelValue: {
    type: Number,
    required: true
  }
})

const emit = defineEmit(['update:modelValue'])

const value = computed<number>({
  get () {
    return props.modelValue
  },
  set (newVal) {
    emit('update:modelValue', +newVal)
  }
})
</script>

<style lang="scss">
.horizontal-slider {
  @apply bg-secondary;
  @apply rounded-2xl;

  position: relative;
  appearance: none;
  width: 100%;
  height: 0.4rem;
  outline: none;
  cursor: pointer;

  &::after {
    @apply bg-primary;
    @apply rounded-2xl;

    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: var(--progress);
    height: 100%;
    z-index: 0;
  }

  &::before {
    $size: 1rem;

    @apply bg-white;

    content: "";
    position: absolute;
    top: 50%;
    left: var(--progress);
    width: $size;
    height: $size;
    border-radius: 50%;
    box-shadow: 0 0 0.1rem #000;
    cursor: pointer;
    transform: translate(-50%, -50%);
    z-index: 2;
  }

  @mixin default-thumb-style {
    $size: 0;

    width: $size;
    height: $size;
  }

  &::-webkit-slider-thumb {
    appearance: none;

    @include default-thumb-style;
  }

  &::-moz-range-thumb {
    @include default-thumb-style;
  }
}
</style>
