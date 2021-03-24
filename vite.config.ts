import { join } from 'path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'
import Stylelint from '@amatlash/vite-plugin-stylelint'
import { ViteSSGOptions } from 'vite-ssg'

const ssgOptions: ViteSSGOptions = {
  script: 'async',
  includedRoutes: (routes) => {
    return [
      '/',
      '404'
    ]
  }
}

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
  ssgOptions
})
