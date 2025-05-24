import { fileURLToPath, URL } from 'node:url'
import PikaCSS from '@pikacss/vite-plugin-pikacss'
import Vue from '@vitejs/plugin-vue'
import simpleGit from 'simple-git'
import Imports from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
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
			'/data/data.json': {
				target: 'https://maple-pod.deviltea.me',
				changeOrigin: true,
			},
			'/mark': {
				target: 'https://maple-pod.deviltea.me',
				changeOrigin: true,
			},
			'/bgm': {
				target: 'https://maple-pod.deviltea.me',
				changeOrigin: true,
			},
		},
	},
}))
