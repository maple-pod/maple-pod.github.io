<template>
  <RouterView></RouterView>
  <ClientOnly>
    <ThemeHandler></ThemeHandler>
  </ClientOnly>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useHead } from '@vueuse/head'
import ThemeHandler from '@/components/ThemeHandler.vue'

export default defineComponent({
  name: 'App',
  components: {
    ThemeHandler
  },
  setup () {
    useHead({
      title: '即將開放 | Maple Pod',
      meta: [
        {
          name: 'description',
          content: '方便、好用的楓之谷音樂播放 App'
        }
      ]
    })
  }
})
</script>

<style lang="scss">
#app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  p {
    margin-top: 1rem;
    color: #f4f4f4;
    font-size: 4rem;
    font-family: "Comfortaa", cursive;
    text-shadow: 0 3px 6px rgba(0, 0, 0, 0.6);
  }
}
</style>
