import { join } from 'path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'
import Stylelint from '@amatlash/vite-plugin-stylelint'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@/': join(__dirname, 'src/')
    }
  },
  plugins: [
    Vue(),
    WindiCSS(),
    Stylelint({
      exclude: /(node_modules)|(windi\.css)/
    })
  ],
  ssgOptions: {
    script: 'async'
  }
})
