<template>
  <div ref="content" class="max-w-full whitespace-nowrap">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { useCssVar, useDebounceFn } from '@vueuse/core'
import { onMounted, ref, watch, nextTick } from 'vue'

const content = ref<HTMLElement>()
const offsetX = useCssVar('--offset-x', content)

const isOverflow = ref(false)
const updateIsOverflow = () => {
  if (!content.value) return
  isOverflow.value = content.value.scrollWidth > content.value.clientWidth
  offsetX.value = `${-(content.value.scrollWidth - content.value.clientWidth)}px`
  requestAnimationFrame(updateIsOverflow)
}
const applyMarqueClass = useDebounceFn(async () => {
  await nextTick()
  content.value?.classList.add('marque')
}, 500)
watch(offsetX, async () => {
  await nextTick()
  content.value?.classList.remove('marque')
  if (!isOverflow.value) return
  await applyMarqueClass()
})
onMounted(() => {
  requestAnimationFrame(updateIsOverflow)
})
</script>

<style lang="scss">
  .marque {
    animation: 5s linear infinite both running marque;
  }

  @keyframes marque {
    0% {
      transform: translateX(0);
    }

    70%,
    100% {
      transform: translateX(var(--offset-x, -100%));
    }
  }
</style>
