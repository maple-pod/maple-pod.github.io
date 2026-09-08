import { designTokens } from '@pikacss/plugin-design-tokens'
import { icons } from '@pikacss/plugin-icons/node'
import { reset } from '@pikacss/plugin-reset'
import { defineConfig } from '@pikacss/unplugin-pikacss'

export default defineConfig({
	engine: {
		// Add your PikaCSS engine config here
		plugins: [
			reset(),
			icons(),
			designTokens(),
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

		designTokens: {
			sources: {
				color: {
					'primary-1': { $value: 'rgb(219, 66, 66)', $type: 'color' },
					'secondary-1': { $value: 'rgb(255, 193, 95)', $type: 'color' },
					'danger-1': { $value: 'rgb(255, 82, 82)', $type: 'color' },

					'primary-text': { $value: 'rgb(17, 17, 17)', $type: 'color' },
					'secondary-text': { $value: 'rgba(77, 77, 77, 1)', $type: 'color' },
					'primary-bg': { $value: 'rgb(254, 254, 254)', $type: 'color' },
					'secondary-bg': { $value: 'rgb(153, 153, 153)', $type: 'color' },
					'border': { $value: 'rgba(102, 102, 102, 0.2)', $type: 'color' },
					'site-bg': { $value: 'rgb(220, 220, 220)', $type: 'color' },
					'card-bg': { $value: 'rgba(254, 254, 254, 0.7)', $type: 'color' },
					'hover-mask': { $value: 'rgba(16, 15, 15, 0.4)', $type: 'color' },
				},
			},
			themes: {
				dark: {
					selector: '[color-scheme="dark"]',
					sources: {
						color: {
							'primary-1': { $value: 'rgb(227, 98, 98)', $type: 'color' },
							'primary-text': { $value: 'rgb(238, 238, 238)', $type: 'color' },
							'secondary-text': { $value: 'rgb(170, 170, 170)', $type: 'color' },
							'primary-bg': { $value: 'rgb(1, 1, 1)', $type: 'color' },
							'secondary-bg': { $value: 'rgb(102, 102, 102)', $type: 'color' },
							'border': { $value: 'rgba(170, 170, 170, 0.2)', $type: 'color' },
							'site-bg': { $value: 'rgb(50, 50, 50)', $type: 'color' },
							'card-bg': { $value: 'rgba(1, 1, 1, 0.6)', $type: 'color' },
							'hover-mask': { $value: 'rgba(255, 255, 255, 0.4)', $type: 'color' },
						},
					},
				},
			},
		},

		variables: {
			safeList: ['--color-site-bg', '--color-primary-text'],
		},

		keyframes: {
			definitions: [
				{ name: 'fade-in', frames: { from: { opacity: '0' }, to: { opacity: '1' } } },
				{ name: 'fade-out', frames: { from: { opacity: '1' }, to: { opacity: '0' } } },
			],
		},

		selectors: {
			definitions: [
				{ name: '@light', value: '[color-scheme="light"]' },
				{ name: '@dark', value: '[color-scheme="dark"]' },
				{ name: '@docpip', value: '@media all and (display-mode: picture-in-picture)' },
				{
					pattern: /^@screen (\*|\d+) to (\*|\d+)$/,
					inputType: '`@screen $' + '{number | "*"} to $' + '{number | "*"}`',
					resolve: ([, min, max]) => {
						if (min === '*' && max !== '*')
							return `@media screen and (max-width: ${max}px)`
						if (min !== '*' && max === '*')
							return `@media screen and (min-width: ${min}px)`
						if (min !== '*' && max !== '*')
							return `@media screen and (min-width: ${min}px) and (max-width: ${max}px)`
					},
				},
				{ name: '@screen-xs-and-up', value: '@screen 360 to *' },
				{ name: '@screen-sm-and-up', value: '@screen 640 to *' },
				{ name: '@screen-md-and-up', value: '@screen 768 to *' },
				{ name: '@screen-lg-and-up', value: '@screen 1024 to *' },
				{ name: '@screen-xl-and-up', value: '@screen 1280 to *' },
				{
					pattern: /^@container (\*|\d+) to (\*|\d+)$/,
					inputType: '`@container $' + '{number | "*"} to $' + '{number | "*"}`',
					resolve: ([, min, max]) => {
						if (min === '*' && max !== '*')
							return `@container (max-width: ${max}px)`
						if (min !== '*' && max === '*')
							return `@container (min-width: ${min}px)`
						if (min !== '*' && max !== '*')
							return `@container (min-width: ${min}px) and (max-width: ${max}px)`
					},
				},
				{
					pattern: /^@container (.+) (\*|\d+) to (\*|\d+)$/,
					inputType: '`@container $' + '{string} $' + '{number | "*"} to $' + '{number | "*"}`',
					resolve: ([, name, min, max]) => {
						if (min === '*' && max !== '*')
							return `@container ${name} (max-width: ${max}px)`
						if (min !== '*' && max === '*')
							return `@container ${name} (min-width: ${min}px)`
						if (min !== '*' && max !== '*')
							return `@container ${name} (min-width: ${min}px) and (max-width: ${max}px)`
					},
				},
			],
		},

		shortcuts: {
			definitions: [
				{
					name: 'card-border',
					value: {
						border: '1px solid var(--color-border)',
						borderRadius: '16px',
					},
				},
				{
					name: 'card',
					value: [
						'card-border',
						{
							padding: '16px',
							backgroundColor: 'var(--color-card-bg)',
							backdropFilter: 'blur(16px)',
						},
					],
				},
				{
					name: 'hover-mask',
					value: {
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
				},
				{
					name: 'base-btn',
					value: {
						'position': 'relative',
						'display': 'inline-flex',
						'alignItems': 'center',
						'justifyContent': 'center',
						'flexShrink': '0',
						'padding': '8px 16px',
						'fontSize': '16px',
						'borderRadius': '8px',
						'cursor': 'pointer',
						'transition': 'all 0.1s',

						'$:disabled': {
							opacity: '0.3',
							cursor: 'not-allowed',
						},

						'$:not(:disabled):hover': {
							transform: 'scale(1.05)',
						},

						'$:not(:disabled):active': {
							transform: 'scale(0.95)',
						},
					},
				},
				{
					name: 'primary-btn',
					value: [
						'base-btn',
						{
							color: 'var(--color-primary-bg)',
							backgroundColor: 'var(--color-primary-1)',
						},
					],
				},
				{
					name: 'primary-plain-btn',
					value: [
						'base-btn',
						'hover-mask',
						{
							color: 'var(--color-primary-1)',
							backgroundColor: 'transparent',
						},
					],
				},
				{
					name: 'icon-btn',
					value: [
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
				},
				{
					name: 'icon-btn-toggle',
					value: [
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
				},
				{
					pattern: /^font-comfortaa(-\d+)?$/,
					inputType: '\'font-comfortaa\' | `font-comfortaa-$' + '{number}`',
					resolve: ([, weight]) => ({
						fontFamily: 'Comfortaa',
						fontOpticalSizing: 'auto',
						fontWeight: weight ? String(-Number(weight)) : '400',
						fontStyle: 'normal',
					}),
					autocomplete: [
						'font-comfortaa',
						'font-comfortaa-300',
						'font-comfortaa-400',
						'font-comfortaa-500',
						'font-comfortaa-600',
						'font-comfortaa-700',
					],
				},
			],
		},

		icons: {
			autoInstall: true,
		},

	},
})
