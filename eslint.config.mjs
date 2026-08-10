import deviltea from '@deviltea/eslint-config'

export default deviltea({
	ignores: [
		'.planning/**',
		// Tool-managed agent skill/hook files (npx skills add, npx impeccable install)
		'.agents/**',
		'.claude/**',
		'.codex/**',
		'skills-lock.json',
	],
})
