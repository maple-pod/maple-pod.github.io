import { icons } from '@pikacss/plugin-icons'
/// <reference path="./pika.gen.ts" />
import { defineEngineConfig } from '@pikacss/vite-plugin-pikacss'

export default defineEngineConfig({
	// Add your PikaCSS engine config here
	plugins: [
		icons(),
	],

	preflights: [
		'* { line-height: 1.25; } a { text-decoration: none; color: currentColor; } button:not(:focus-visible) { border: 0; }',
	],

	variables: {
		variables: [
			['--color-gray-1', '#FEFEFE'],
			['--color-gray-2', '#DFDFDF'],
			['--color-gray-3', '#888888'],
			['--color-gray-4', '#222222'],
			['--color-gray-5', '#111111'],
			['--color-primary-1', '#E36262'],
			['--color-danger-1', '#FF5252'],
		],
	},

	selectors: {
		selectors: [
			['@dark', '[color-scheme="dark"] $'],
			['@docpip', '@media all and (display-mode: picture-in-picture)'],
			[/^@screen (\*|\d+) to (\*|\d+)$/, ([, min, max]) => {
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
						boxShadow: '0 0 8px rgba(128, 128, 128, 0.1)',
					},
				},
			],
			[
				'hover-mask',
				{
					'position': 'relative',

					'$::before': {
						content: '\'\'',
						zIndex: '1',
						position: 'absolute',
						top: '0',
						left: '0',
						width: '100%',
						height: '100%',
						borderRadius: '8px',
						backgroundColor: 'var(--color-gray-3)',
						opacity: '0',
						transition: 'opacity 0.1s',
						pointerEvents: 'none',
					},
					'$:hover::before': {
						opacity: '0.1',
					},
				},
			],
			[
				'base-btn',
				{
					'position': 'relative',
					'display': 'inline-flex',
					'alignItems': 'center',
					'justifyContent': 'center',
					'padding': '8px 16px',
					'fontSize': '16px',
					'borderRadius': '8px',
					'cursor': 'pointer',
					'transition': 'all 0.1s',

					'$:disabled': {
						opacity: 0.5,
						cursor: 'not-allowed',
					},

					'$:not(:disabled):hover': {
						transform: 'scale(1.05)',
					},

					'$:not(:disabled):active': {
						transform: 'scale(0.95)',
					},

					'$::before': {
						content: '\'\'',
						position: 'absolute',
						top: 0,
						left: 0,
						zIndex: 1,
						display: 'block',
						width: '100%',
						height: '100%',
						borderRadius: '8px',
						backgroundColor: 'var(--color-gray-3)',
						opacity: 0,
						transition: 'opacity 0.1s',
					},

					'$:not(:disabled):hover::before': {
						opacity: 0.3,
					},
				},
			],
			[
				'primary-btn',
				[
					'base-btn',
					{
						color: 'var(--color-gray-1)',
						backgroundColor: 'var(--color-primary-1)',
					},
				],
			],
			[
				'primary-plain-btn',
				[
					'base-btn',
					{
						color: 'var(--color-primary-1)',
						backgroundColor: 'transparent',
					},
				],
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
					'padding': '8px',
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
			[
				/^font-comfortaa(-\d+)?$/,
				([, weight]) => ({
					fontFamily: 'Comfortaa',
					fontOpticalSizing: 'auto',
					fontWeight: weight ? -Number(weight) : 400,
					fontStyle: 'normal',
				}),
				[
					'font-comfortaa',
					'font-comfortaa-300',
					'font-comfortaa-400',
					'font-comfortaa-500',
					'font-comfortaa-600',
					'font-comfortaa-700',
				],
			],
		],
	},

	icons: {
		autoInstall: true,
	},
})
