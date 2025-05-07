import { icons } from '@pikacss/plugin-icons'
/// <reference path="./pika.gen.ts" />
import { defineEngineConfig } from '@pikacss/vite-plugin-pikacss'

export default defineEngineConfig({
	// Add your PikaCSS engine config here
	plugins: [
		icons(),
	],

	icons: {
		autoInstall: true,
	},
})
