import deviltea from '@deviltea/eslint-config'

export default deviltea({
	ignores: [
		// EF engineering files are canonically formatted by the ef CLI
		'.engineering/**',
		// Tool-managed agent skill/hook files (npx skills add, npx impeccable install)
		'.agents/**',
		'.claude/**',
		'.codex/**',
		'skills-lock.json',
	],
})
