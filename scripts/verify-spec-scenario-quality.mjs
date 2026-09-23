// Structural validation accepts any legal Gherkin text; this catches accidental
// duplication of its reserved keywords inside authored semantic step text.
import assert from 'node:assert/strict'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createSpecClient } from '@deviltea/spec-tool'

const args = process.argv.slice(2)
assert.ok(args.length === 0 || (args.length === 2 && args[0] === '--root' && args[1]), 'Usage: verify-spec-scenario-quality.mjs [--root <workspace>]')
const root = args.length ? resolve(args[1]) : resolve(dirname(fileURLToPath(import.meta.url)), '..')
async function main() {
	const { data: graph } = await createSpecClient(root).graph.export()
	const scenarios = graph.nodes.filter(node => node.kind === 'scenario')
	for (const scenario of scenarios) {
		for (const [index, step] of scenario.steps.entries()) {
			assert.ok(!/^(?:Given|When|Then|And|But)\s/u.test(step.text), `Duplicate Gherkin keyword in Scenario ${scenario.id}, step ${index + 1}: ${step.type} ${step.text}`)
		}
	}
	process.stdout.write(`Verified ${scenarios.length} Scenarios have no duplicated Gherkin step prefixes.\n`)
}
main()
	.catch((error) => {
		process.stderr.write(`${error.stack ?? error}\n`)
		process.exitCode = 1
	})
