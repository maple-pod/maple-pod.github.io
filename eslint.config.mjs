import deviltea from '@deviltea/eslint-config'

export default deviltea({
	ignores: [
		// Spec workspace files are managed by the spec CLI
		'.spec/**',
		// Tool-managed agent skill/hook files (npx skills add, npx impeccable install)
		'.agents/**',
		'.claude/**',
		'.codex/**',
		'skills-lock.json',
	],
})
