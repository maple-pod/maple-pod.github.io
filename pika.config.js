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
			['--color-gray-2', '#F2F2F2'],
			['--color-gray-3', '#888888'],
			['--color-gray-4', '#222222'],
			['--color-gray-5', '#111111'],
			['--color-primary-1', '#E36262'],
			['--color-secondary-1', '#FFC15F'],
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
			['@screen-xs-and-up', '@screen 360 to *'],
			['@screen-sm-and-up', '@screen 640 to *'],
			['@screen-md-and-up', '@screen 768 to *'],
			['@screen-lg-and-up', '@screen 1024 to *'],
			['@screen-xl-and-up', '@screen 1280 to *'],
			[/^@container (\*|\d+) to (\*|\d+)$/, ([, min, max]) => {
				if (min === '*' && max !== '*') {
					return `@container (max-width: ${(max)}px)`
				}
				if (min !== '*' && max === '*') {
					return `@container (min-width: ${min}px)`
				}
				if (min !== '*' && max !== '*') {
					return `@container (min-width: ${min}px) and (max-width: ${max}px)`
				}
				// never
				return ''
			}],
			[/^@container (.*) (\*|\d+) to (\*|\d+)$/, ([, name, min, max]) => {
				if (min === '*' && max !== '*') {
					return `@container ${name} (max-width: ${(max)}px)`
				}
				if (min !== '*' && max === '*') {
					return `@container ${name} (min-width: ${min}px)`
				}
				if (min !== '*' && max !== '*') {
					return `@container ${name} (min-width: ${min}px) and (max-width: ${max}px)`
				}
				// never
				return ''
			}],
		],
	},

	shortcuts: {
		shortcuts: [
			[
				'theme-color',
				{
					'color': 'var(--color-gray-5)',

					'@dark': {
						color: 'var(--color-gray-1)',
					},
				},
			],
			[
				'theme-bg',
				{
					'backgroundColor': 'var(--color-gray-2)',

					'@dark': {
						backgroundColor: 'var(--color-gray-5)',
					},
				},
			],
			[
				'theme',
				['theme-color', 'theme-bg'],
			],
			[
				'card',
				{
					'padding': '16px',
					'borderRadius': '16px',
					'backgroundColor': 'rgba(255, 255, 255, 0.6)',
					'backdropFilter': 'blur(8px)',
					'border': '1px solid rgba(0, 0, 0, 0.1)',

					'@dark': {
						backgroundColor: 'rgba(30, 30, 30, 0.6)',
						border: '1px solid rgba(255, 255, 255, 0.1)',
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
					'$:not(:disabled,[data-disabled]):hover::before': {
						opacity: '0.05',
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
					'flexShrink': 0,
					'padding': '8px 16px',
					'fontSize': '16px',
					'borderRadius': '8px',
					'cursor': 'pointer',
					'transition': 'all 0.1s',

					'$:disabled': {
						opacity: 0.3,
						cursor: 'not-allowed',
					},

					'$:not(:disabled):hover': {
						transform: 'scale(1.05)',
					},

					'$:not(:disabled):active': {
						transform: 'scale(0.95)',
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
					'hover-mask',
					{
						color: 'var(--color-primary-1)',
						backgroundColor: 'transparent',
					},
				],
			],
			[
				'icon-btn',
				[
					'base-btn',
					'hover-mask',
					{
						'--size': '24px',
						'--padding': 'calc(var(--size) / 4)',
						'padding': 'var(--padding)',
						'fontSize': 'var(--size)',
						'color': 'var(--color-gray-3)',
						'backgroundColor': 'transparent',
						'borderRadius': '50%',

						'$:not(:disabled):hover': {
							color: 'var(--color-primary-1)',
						},

						'$::before': {
							borderRadius: '50%',
						},

						'@screen-sm-and-up': {
							'--size': '20px',
						},
					},
				],
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
							bottom: 'calc(var(--size) / 10)',
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
