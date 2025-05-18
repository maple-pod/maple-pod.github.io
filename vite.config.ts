import { fileURLToPath, URL } from 'node:url'
import PikaCSS from '@pikacss/vite-plugin-pikacss'
import Vue from '@vitejs/plugin-vue'
import Imports from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import VueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		PikaCSS(),
		Vue(),
		VueDevTools(),
		Imports({
			dts: true,
			imports: [
				'vue',
				'vue-router',
				'pinia',
				'@vueuse/core',
				{
					imports: ['Routes'],
					from: '@/router/index',
				},
			],
			dirs: [
				'src/composables',
			],
		}),
		Components({
			dts: true,
		}),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	server: {
		proxy: {
			'/data/data.json': {
				target: 'https://maple-pod.github.io',
				changeOrigin: true,
			},
			'/mark': {
				target: 'https://maple-pod.github.io',
				changeOrigin: true,
			},
			'/bgm': {
				target: 'https://maple-pod.github.io',
				changeOrigin: true,
			},
		},
	},
})
