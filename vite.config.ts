import { fileURLToPath, URL } from 'node:url'

import PikaCSS from '@pikacss/vite-plugin-pikacss'
import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import VueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		PikaCSS(),
		Vue(),
		VueDevTools(),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
})
