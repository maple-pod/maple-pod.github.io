<template>
  <RouterView></RouterView>
  <MusicPlayer v-if="song"></MusicPlayer>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useMusicPlayer, useSong } from '@/modules/music-player'
import { setupModules } from '@/modules'
import MusicPlayer from '@/components/MusicPlayer/index.vue'

setupModules()
const { loadSong } = useMusicPlayer()
const { song } = useSong()

onMounted(async () => {
  await loadSong({
    description: 'Evan tutorial',
    filename: 'DragonDream',
    mark: 'DragonDream',
    metadata: {
      albumArtist: 'Wizet',
      artist: 'StudioEIM',
      title: 'Dragon Dream',
      year: '2009'
    },
    source: {
      client: 'KMST',
      date: '2009-11-19',
      structure: 'Bgm00',
      version: '1.2.267'
    },
    youtube: 'mM_27SaY7tE',
    maps: [
      {
        id: '100030301',
        street: '潘姆之路',
        map: '茂密的森林'
      },
      {
        id: '900010000',
        street: '夢中',
        map: '夢見的森林入口'
      },
      {
        id: '900010100',
        street: '夢中',
        map: '夢見的路'
      },
      {
        id: '900010200',
        street: '夢中',
        map: '夢現的森林'
      },
      {
        id: '900020200',
        street: '隱密之地',
        map: '遺失的森林入口'
      },
      {
        id: '900020210',
        street: '隱密之地',
        map: '遺失的路'
      },
      {
        id: '900020220',
        street: '隱密之地',
        map: '遺失的森林'
      },
      {
        id: '900090100',
        street: '動畫',
        map: '新手村0'
      },
      {
        id: '900090101',
        street: '動畫',
        map: '新手村1'
      },
      {
        id: '900090103',
        street: '動畫',
        map: '轉職'
      }
    ],
    downloadable: true
  })
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
