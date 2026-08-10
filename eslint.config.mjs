import deviltea from '@deviltea/eslint-config'

export default deviltea({
	ignores: [
		'.planning/**',
		// Tool-managed agent skill/hook files (npx skills add, npx impeccable install)
		'.agents/**',
		'.claude/**',
		'.codex/**',
		'.github/agents/**',
		'.github/hooks/**',
		'.github/skills/**',
		'skills-lock.json',
	],
})
