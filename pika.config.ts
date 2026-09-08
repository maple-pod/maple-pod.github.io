import { designTokens } from '@pikacss/plugin-design-tokens'
import { icons } from '@pikacss/plugin-icons/node'
import { reset } from '@pikacss/plugin-reset'
import { defineConfig } from '@pikacss/unplugin-pikacss'

const semanticColorTokens = {
	'action-primary': { $value: '{color.primary-1}', $type: 'color' },
	'action-secondary': { $value: '{color.secondary-1}', $type: 'color' },
	'action-danger': { $value: '{color.danger-1}', $type: 'color' },
	'text-primary': { $value: '{color.primary-text}', $type: 'color' },
	'text-secondary': { $value: '{color.secondary-text}', $type: 'color' },
	'surface-canvas': { $value: '{color.site-bg}', $type: 'color' },
	'surface-card': { $value: '{color.card-bg}', $type: 'color' },
	'surface-solid': { $value: '{color.primary-bg}', $type: 'color' },
	'border-subtle': { $value: '{color.border}', $type: 'color' },
	'focus-ring': { $value: '{color.primary-1}', $type: 'color' },
	'state-hover-mask': { $value: '{color.hover-mask}', $type: 'color' },
} as const

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
			strict: {
				level: 'warn',
				overrides: { dimension: 'off', duration: 'off' },
			},
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

					...semanticColorTokens,
				},
				spacing: {
					1: { $value: '4px', $type: 'dimension' },
					2: { $value: '8px', $type: 'dimension' },
					3: { $value: '12px', $type: 'dimension' },
					4: { $value: '16px', $type: 'dimension' },
					6: { $value: '24px', $type: 'dimension' },
					8: { $value: '32px', $type: 'dimension' },
				},
				radius: {
					control: { $value: '8px', $type: 'dimension' },
					surface: { $value: '16px', $type: 'dimension' },
					pill: { $value: '9999px', $type: 'dimension' },
				},
				size: {
					'touch-target': { $value: '44px', $type: 'dimension' },
					'icon-default': { $value: '24px', $type: 'dimension' },
					'icon-compact': { $value: '20px', $type: 'dimension' },
				},
				duration: {
					fast: { $value: '100ms', $type: 'duration' },
					normal: { $value: '200ms', $type: 'duration' },
					slow: { $value: '300ms', $type: 'duration' },
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

							// Semantic aliases are scoped again so they resolve against dark foundations.
							...semanticColorTokens,
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
				{ name: '@reduced-motion', value: '@media (prefers-reduced-motion: reduce)' },
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
						border: '1px solid var(--color-border-subtle)',
						borderRadius: 'var(--radius-surface)',
					},
				},
				{
					name: 'card',
					value: [
						'card-border',
						{
							padding: 'var(--spacing-4)',
							backgroundColor: 'var(--color-surface-card)',
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
							borderRadius: 'var(--radius-surface)',
							backgroundColor: 'var(--color-state-hover-mask)',
							opacity: '0',
							transition: 'opacity var(--duration-fast)',
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
						'padding': 'var(--spacing-2) var(--spacing-4)',
						'fontSize': '16px',
						'borderRadius': 'var(--radius-control)',
						'cursor': 'pointer',
						'transition': 'transform var(--duration-fast), color var(--duration-fast), background-color var(--duration-fast), opacity var(--duration-fast)',

						'$:disabled': {
							opacity: '0.3',
							cursor: 'not-allowed',
						},

						'$:focus-visible': {
							outline: '2px solid var(--color-focus-ring)',
							outlineOffset: '2px',
						},

						'$:not(:disabled):hover': {
							transform: 'scale(1.05)',
						},

						'$:not(:disabled):active': {
							transform: 'scale(0.95)',
						},

						'@reduced-motion': {
							'transition': 'color var(--duration-fast), background-color var(--duration-fast), opacity var(--duration-fast)',
							'$:not(:disabled):hover': { transform: 'none' },
							'$:not(:disabled):active': { transform: 'none' },
						},
					},
				},
				{
					name: 'primary-btn',
					value: [
						'base-btn',
						{
							color: 'var(--color-surface-solid)',
							backgroundColor: 'var(--color-action-primary)',
						},
					],
				},
				{
					name: 'primary-plain-btn',
					value: [
						'base-btn',
						'hover-mask',
						{
							color: 'var(--color-action-primary)',
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
							'--size': 'var(--size-icon-default)',
							'--padding': 'calc(var(--size) / 4)',
							'padding': 'var(--padding)',
							'fontSize': 'var(--size)',
							'color': 'var(--color-text-secondary)',
							'backgroundColor': 'transparent',
							'borderRadius': '50%',

							'$:not(:disabled):hover': {
								color: 'var(--color-action-primary)',
							},

							'$::before': {
								borderRadius: '50%',
							},

							'@screen-sm-and-up': {
								'--size': 'var(--size-icon-compact)',
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
								color: 'var(--color-action-primary)',
							},
							'$[data-toggle=true]::after': {
								content: '\'\'',
								position: 'absolute',
								left: '50%',
								bottom: 'calc(var(--size) / 10)',
								width: '4px',
								height: '4px',
								borderRadius: '9999px',
								backgroundColor: 'var(--color-action-primary)',
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
