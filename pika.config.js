import { icons } from '@pikacss/plugin-icons'
/// <reference path="./pika.gen.ts" />
import { defineEngineConfig } from '@pikacss/vite-plugin-pikacss'

export default defineEngineConfig({
	// Add your PikaCSS engine config here
	plugins: [
		icons(),
	],

	variables: {
		variables: [
			['--color-gray-1', '#FEFEFE'],
			['--color-gray-2', '#DFDFDF'],
			['--color-gray-3', '#888888'],
			['--color-gray-4', '#222222'],
			['--color-gray-5', '#111111'],
			['--color-primary-1', '#E36262'],
		],
	},

	selectors: {
		selectors: [
			['@dark', '[color-scheme="dark"] $'],
			['@docpip', '@media all and (display-mode: picture-in-picture)'],
			[/@screen (\*|\d+) to (\*|\d+)/, ([, min, max]) => {
				if (min === '*' && max !== '*') {
					return `@media screen and (max-width: ${(max)}px)`
				}
				if (min !== '*' && max === '*') {
					return `@media screen and (min-width: ${min}px)`
				}
				if (min !== '*' && max !== '*') {
					return `@media screen and (min-width: ${min}px) and (max-width: ${max}px)`
				}
				// never
				return ''
			}],
		],
	},

	shortcuts: {
		shortcuts: [
			[
				'theme',
				{
					'color': 'var(--color-gray-5)',
					'backgroundColor': 'var(--color-gray-2)',

					'@dark': {
						color: 'var(--color-gray-1)',
						backgroundColor: 'var(--color-gray-5)',
					},
				},
			],
			[
				'card',
				{
					'padding': '16px',
					'backgroundColor': 'var(--color-gray-1)',
					'borderRadius': '16px',
					'boxShadow': '0 0 8px rgba(0, 0, 0, 0.1)',

					'@dark': {
						backgroundColor: 'var(--color-gray-4)',
					},
				},
			],
			[
				'icon-btn',
				{
					'display': 'flex',
					'alignItems': 'center',
					'justifyContent': 'center',
					'flexShrink': 0,
					'width': 'var(--size)',
					'height': 'var(--size)',
					'fontSize': 'var(--size)',
					'color': 'var(--color-gray-3)',
					'backgroundColor': 'transparent',
					'borderRadius': '50%',
					'cursor': 'pointer',
					'transition': 'all 0.1s',

					'$:disabled': {
						opacity: 0.5,
						cursor: 'not-allowed',
					},

					'$:not(:disabled):hover': {
						color: 'var(--color-primary-1)',
						transform: 'scale(1.05)',
					},

					'$:not(:disabled):active': {
						transform: 'scale(0.95)',
					},

					'$:not(:focus-visible)': {
						border: 0,
					},
				},
			],
			[
				'icon-btn-toggle',
				[
					'icon-btn',
					{
						'$[data-toggle=true]': {
							position: 'relative',
							color: 'var(--color-primary-1)',
						},
						'$[data-toggle=true]::after': {
							content: '\'\'',
							position: 'absolute',
							left: '50%',
							bottom: '-2px',
							width: '4px',
							height: '4px',
							borderRadius: '9999px',
							backgroundColor: 'var(--color-primary-1)',
							transform: 'translateX(-50%)',
						},
					},
				],
			],
			[
				'circle-icon-btn',
				[
					'icon-btn',
					{
						'fontSize': 'calc(var(--size) * 0.6)',
						'color': 'var(--color-gray-1)',
						'backgroundColor': 'var(--color-primary-1)',
						'cursor': 'pointer',

						'$:not(:disabled):hover': {
							color: null,
						},
					},
				],
			],
		],
	},

	icons: {
		autoInstall: true,
	},
})
