import { join } from 'path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@/': join(__dirname, 'src/')
    }
  },
  plugins: [
    Vue(),
    WindiCSS()
  ],
  ssgOptions: {
    script: 'async'
  }
})
