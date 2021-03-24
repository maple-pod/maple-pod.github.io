<template>
  <input v-model="value" :style="{ '--progress': `${100 * value / max}%` }" ref="slider" type="range" :min="min" :max="max" class="horizontal-slider">
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

export default defineComponent({
  name: 'HorizontalSlider',
  props: {
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
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    const value = computed<number>({
      get () {
        return props.modelValue
      },
      set (newVal) {
        emit('update:modelValue', +newVal)
      }
    })

    return {
      value
    }
  }
})
</script>

<style lang="scss">
.horizontal-slider {
  @apply bg-secondary;

  position: relative;
  appearance: none;
  width: 100%;
  height: 0.4rem;
  outline: none;
  cursor: pointer;

  &::after {
    @apply bg-primary;

    content: '';
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

    content: '';
    position: absolute;
    top: 50%;
    left: var(--progress);
    width: $size;
    height: $size;
    border-radius: 50%;
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
