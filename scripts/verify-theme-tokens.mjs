import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const assetsDir = resolve('dist/assets')
const cssFile = readdirSync(assetsDir)
	.find(name => /^index-.*\.css$/.test(name))

if (!cssFile)
	throw new Error('Unable to locate built application CSS in dist/assets')

const css = readFileSync(resolve(assetsDir, cssFile), 'utf8')
const darkRule = css.match(/\[color-scheme=dark\]\{([^}]*)\}/)?.[1]

if (!darkRule)
	throw new Error('Missing [color-scheme=dark] design-token rule in production CSS')

const required = [
	'--color-action-primary:',
	'--color-text-secondary:',
	'--color-surface-card:',
	'--color-surface-solid:',
	'--color-slider-thumb:#fefefe',
	'--color-border-subtle:',
	'--color-focus-ring:',
	'--color-state-hover-mask:',
]

const missing = required.filter(token => !darkRule.includes(token))
if (missing.length > 0)
	throw new Error(`Dark theme is missing semantic tokens: ${missing.join(', ')}`)

console.log(`Verified ${required.length} dark-theme semantic color tokens in ${cssFile}`)
