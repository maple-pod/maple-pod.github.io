// Replay the frozen one-time migration in an isolated workspace, not against the
// evolving current .spec tree. --compare-live is an explicit premerge-only check.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createSpecClient } from '@deviltea/spec-tool'

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const docs = join(repo, 'docs/spec-migration')
// Pin the hash of the archive manifest to make editing archived files together
// with the manifest insufficient to rewrite historical migration evidence.
const originalManifestSha256 = 'a85f99117f3bda838793b7ad9f22984f05957b0e00d4d8f6c652cc6e6289d959'
const expectedFrozenRevision = 'ba6cf9e8888d266f1860998f0b84ba67712935f4dae89cf1b3dba14451c772db'
const flags = process.argv.slice(2)
assert.ok(flags.length === 0 || (flags.length === 1 && flags[0] === '--compare-live'), 'Usage: replay-spec-migration.mjs [--compare-live]')
const compareLive = flags.length === 1
const originalManifest = readFileSync(join(docs, 'legacy-sha256.json'))
assert.equal(createHash('sha256')
	.update(originalManifest)
	.digest('hex'), originalManifestSha256, 'frozen archive manifest integrity')

function run(args, options = {}) {
	const result = spawnSync(process.execPath, args, { cwd: options.cwd ?? repo, env: { ...process.env, ...options.env }, encoding: 'utf8', maxBuffer: 1024 * 1024 * 8 })
	assert.equal(result.status, 0, `${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`)
	return result.stdout.trim()
}
function allFiles(dir, relative = '') {
	return readdirSync(join(dir, relative), { withFileTypes: true })
		.flatMap((entry) => {
			const name = join(relative, entry.name)
			return entry.isDirectory() ? allFiles(dir, name) : [name]
		})
		.sort()
}

async function main() {
	const scratch = mkdtempSync(join(tmpdir(), 'maple-pod-spec-v1-replay-'))
	try {
		const workspace = join(scratch, '.spec')
		const tempDocs = join(scratch, 'docs/spec-migration')
		mkdirSync(tempDocs, { recursive: true })
		cpSync(join(docs, 'legacy'), workspace, { recursive: true })
		cpSync(join(docs, 'legacy'), join(tempDocs, 'legacy'), { recursive: true })
		for (const name of ['migrate-v0.0.1.mjs', 'main-flow-step-edits.json', 'alternate-scenario-plan.mjs', 'author-alternate-scenarios.mjs'])
			copyFileSync(join(docs, name), join(tempDocs, name))
		// Installed dependencies are reused, while source files and all generated
		// canonical state stay in the isolated scratch directory.
		symlinkSync(join(repo, 'node_modules'), join(scratch, 'node_modules'), 'dir')
		const initial = run([join(tempDocs, 'migrate-v0.0.1.mjs')], { cwd: scratch })
		const mechanical = run([join(repo, 'scripts/verify-spec-migration.mjs')], { cwd: scratch, env: { SPEC_MIGRATION_ROOT: scratch } })
		assert.deepEqual(readFileSync(join(tempDocs, 'legacy-sha256.json')), originalManifest, 'replayed archive hashes must exactly match frozen manifest')
		const authored = run([join(tempDocs, 'author-alternate-scenarios.mjs')], { cwd: scratch })
		assert.deepEqual(readFileSync(join(tempDocs, 'alternate-scenario-crosswalk.md')), readFileSync(join(docs, 'alternate-scenario-crosswalk.md')), 'reviewed source-to-Scenario crosswalk must reproduce exactly')
		const client = createSpecClient(scratch)
		const { valid, issues, revision } = await client.workspace.validate()
		assert.equal(valid, true, JSON.stringify(issues))
		assert.equal(revision, expectedFrozenRevision, 'immutable migrated semantic baseline')
		const { data: graph } = await client.graph.export()
		assert.equal(graph.nodes.length, 131)
		assert.equal(graph.nodes.filter(node => node.kind === 'scenario').length, 88)
		assert.equal(graph.edges.length, 104)
		if (compareLive) {
			const replayed = allFiles(workspace)
			assert.deepEqual(allFiles(join(repo, '.spec')), replayed, 'canonical file paths differ from reviewed baseline')
			for (const file of replayed) {
				assert.deepEqual(readFileSync(join(repo, '.spec', file)), readFileSync(join(workspace, file)), `canonical migrated file differs: ${file}`)
			}
		}
		process.stdout.write(`${initial}\n${mechanical}\n${authored}\nFrozen migration replay passed: ${graph.nodes.length} nodes, ${graph.edges.length} edges, immutable archive, deterministic crosswalk${compareLive ? ', and current tree identical to initial baseline' : '; current .spec remains free to evolve'}.\n`)
	}
	finally {
		rmSync(scratch, { recursive: true, force: true })
	}
}

main()
	.catch((error) => {
		process.stderr.write(`${error.stack ?? error}\n`)
		process.exitCode = 1
	})
