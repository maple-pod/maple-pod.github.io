/** @type {import('./pika.gen')} */
import { icons } from '@pikacss/plugin-icons'
import { reset } from '@pikacss/plugin-reset'
import { defineEngineConfig } from '@pikacss/unplugin-pikacss'

export default defineEngineConfig({
	// Add your PikaCSS engine config here
	plugins: [
		reset(),
		icons(),
	],

	preflights: [
		{
			'*': {
				lineHeight: '1.25',
			},
			'body': {
				backgroundColor: 'var(--color-site-bg)',
				color: 'var(--color-primary-text)',
			},
			'a': {
				textDecoration: 'none',
				color: 'currentColor',
			},
			'button:not(:focus-visible)': {
				border: '0',
			},
		},
	],

	variables: {
		variables: {
			'--color-primary-1': 'rgb(219, 66, 66)',
			'--color-secondary-1': 'rgb(255, 193, 95)',
			'--color-danger-1': 'rgb(255, 82, 82)',

			'--color-primary-text': 'rgb(17, 17, 17)',
			'--color-secondary-text': 'rgba(77, 77, 77, 1)',
			'--color-primary-bg': 'rgb(254, 254, 254)',
			'--color-secondary-bg': 'rgb(153, 153, 153)',
			'--color-border': 'rgba(102, 102, 102, 0.2)',
			'--color-site-bg': 'rgb(220, 220, 220)',
			'--color-card-bg': 'rgba(254, 254, 254, 0.7)',
			'--color-hover-mask': 'rgba(16, 15, 15, 0.4)',

			'@dark': {
				'--color-primary-1': 'rgb(227, 98, 98)',
				'--color-primary-text': 'rgb(238, 238, 238)',
				'--color-secondary-text': 'rgb(170, 170, 170)',
				'--color-primary-bg': 'rgb(1, 1, 1)',
				'--color-secondary-bg': 'rgb(102, 102, 102)',
				'--color-border': 'rgba(170, 170, 170, 0.2)',
				'--color-site-bg': 'rgb(50, 50, 50)',
				'--color-card-bg': 'rgba(1, 1, 1, 0.6)',
				'--color-hover-mask': 'rgba(255, 255, 255, 0.4)',
			},
		},
		safeList: ['--color-site-bg', '--color-primary-text'],
	},

	keyframes: {
		keyframes: [
			['fade-in', {
				from: { opacity: 0 },
				to: { opacity: 1 },
			}],
			['fade-out', {
				from: { opacity: 1 },
				to: { opacity: 0 },
			}],
		],
	},

	selectors: {
		selectors: [
			['@light', '[color-scheme="light"]'],
			['@dark', '[color-scheme="dark"]'],
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
				'card-border',
				{
					border: '1px solid var(--color-border)',
					borderRadius: '16px',
				},
			],
			[
				'card',
				[
					'card-border',
					{
						padding: '16px',
						backgroundColor: 'var(--color-card-bg)',
						backdropFilter: 'blur(16px)',
					},
				],
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
						borderRadius: '16px',
						backgroundColor: 'var(--color-hover-mask)',
						opacity: '0',
						transition: 'opacity 0.1s',
						pointerEvents: 'none',
					},
					'$:not(:disabled,[data-disabled]):hover::before': {
						opacity: '0.2',
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
						'color': 'var(--color-secondary-text)',
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
