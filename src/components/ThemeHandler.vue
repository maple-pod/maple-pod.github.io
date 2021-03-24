<template>
  <div class="hidden"></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useDark } from '@vueuse/core'

export default defineComponent({
  name: 'ThemeHandler',
  setup () {
    useDark()
  }
})
</script>
