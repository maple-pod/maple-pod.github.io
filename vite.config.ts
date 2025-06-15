import { fileURLToPath, URL } from 'node:url'
import PikaCSS from '@pikacss/vite-plugin-pikacss'
import Vue from '@vitejs/plugin-vue'
import simpleGit from 'simple-git'
import Imports from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import VueDevTools from 'vite-plugin-vue-devtools'

async function getGitCommitHash() {
	try {
		const git = simpleGit()
		const shortHash = await git.revparse(['--short', 'HEAD'])
		return shortHash.trim()
	}
	catch (e) {
		console.warn('Failed to get Git commit hash:', e)
		return 'unknown'
	}
}

// https://vite.dev/config/
export default defineConfig(async () => ({
	plugins: [

		VitePWA({
			registerType: 'autoUpdate',
			devOptions: {
				enabled: true,
				type: 'module',
				navigateFallback: 'index.html',
				suppressWarnings: true,
			},
			manifest: {
				name: 'Maple Pod',
				short_name: 'Maple Pod',
				description: 'A MapleStory music player',
				theme_color: '#000000',
				icons: [
					{
						src: 'pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: 'pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable',
					},
				],
			},
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
						handler: 'CacheFirst',
						options: {
							cacheName: 'gstatic-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
					{
						urlPattern: /\/resources\/data\.json$/,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'maple-pod-data-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
							},
							cacheableResponse: {
								statuses: [0, 200],
							},
						},
					},
				],
			},
		}),
		PikaCSS({
			target: ['**/*.vue', '**/*.ts'],
		}),
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
				'src/utils',
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
	define: {
		__GIT_COMMIT_HASH__: JSON.stringify(await getGitCommitHash()),
	},
	server: {
		proxy: {
			'/resources/data.json': {
				target: 'https://maple-pod.deviltea.me',
				changeOrigin: true,
			},
			'/resources/mark': {
				target: 'https://maple-pod.deviltea.me',
				changeOrigin: true,
			},
			'/resources/bgm': {
				target: 'https://maple-pod.deviltea.me',
				changeOrigin: true,
			},
			'/resources/bg.json': {
				target: 'https://maple-pod.deviltea.me',
				changeOrigin: true,
			},
			'/resources/bg': {
				target: 'https://maple-pod.deviltea.me',
				changeOrigin: true,
			},
		},
	},
}))
