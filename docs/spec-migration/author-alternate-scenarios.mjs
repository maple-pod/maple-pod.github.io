// One-time reviewed conversion of all archived alternate/failure-flow bullets.
// The authored plan is intentionally separate from the mechanical v0.0.1 converter.
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { createSpecClient } from '@deviltea/spec-tool'
import YAML from 'yaml'
import { scenarioPlan, scopeOnlyBullets } from './alternate-scenario-plan.mjs'

async function main() {
	const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
	const archive = join(root, 'docs/spec-migration/legacy')
	const spec = join(root, '.spec')
	const client = createSpecClient(root)
	const before = await client.workspace.validate()
	assert.equal(before.valid, true, JSON.stringify(before.issues))
	const initial = (await client.graph.export()).data
	assert.equal(initial.nodes.filter(node => node.kind === 'scenario').length, 16, 'only original main-flow Scenarios may exist before authoring alternates')
	const known = new Set(initial.nodes.map(node => node.id))
	const sourceNames = readdirSync(join(archive, 'use-cases'))
		.sort()
	assert.deepEqual(Object.keys(scenarioPlan)
		.sort(), sourceNames.map(name => name.slice(0, -3)), 'every archived Use Case must be covered by exactly one plan entry')

	function readSource(kind, id) {
		const source = readFileSync(join(archive, kind, `${id}.md`), 'utf8')
		const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source)
		assert.ok(match, `malformed archived source: ${kind}/${id}`)
		return { meta: YAML.parse(match[1]), body: match[2] }
	}
	const featureByUseCase = new Map()
	for (const file of readdirSync(join(archive, 'features'))) {
		const feature = readSource('features', file.slice(0, -3))
		const parents = feature.meta.relations.filter(rel => rel.type === 'refines')
		assert.equal(parents.length, 1)
		assert.ok(!featureByUseCase.has(parents[0].target))
		featureByUseCase.set(parents[0].target, feature.meta.id)
	}
	const ruleByFeature = new Map()
	for (const file of readdirSync(join(archive, 'requirements'))) {
		const req = readSource('requirements', file.slice(0, -3))
		const parents = req.meta.relations.filter(rel => rel.type === 'refines')
		assert.equal(parents.length, 1)
		assert.ok(!ruleByFeature.has(parents[0].target))
		ruleByFeature.set(parents[0].target, req.meta.id)
	}
	function derivedUuid(sourceId, bulletIndex, caseIndex, purpose) {
		const timestamp = Buffer.from(sourceId.replaceAll('-', ''), 'hex')
			.subarray(0, 6)
		const bytes = createHash('sha256')
			.update(`maple-pod/spec-v1/alternate/${sourceId}/${bulletIndex}/${caseIndex}/${purpose}`)
			.digest()
			.subarray(0, 16)
		timestamp.copy(bytes, 0)
		bytes[6] = (bytes[6] & 0x0F) | 0x70
		bytes[8] = (bytes[8] & 0x3F) | 0x80
		const hex = bytes.toString('hex')
		return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
	}
	function singleLine(label, value) {
		assert.equal(typeof value, 'string', label)
		assert.ok(value.trim().length > 12, `too short ${label}`)
		assert.ok(!/[\r\n\u2028\u2029]/u.test(value), `multiline ${label}`)
		assert.ok(!/^(?:Given|When|Then|And|But)\s/u.test(value), `duplicate Gherkin keyword in ${label}`)
		return value.trim()
	}
	let bulletCount = 0
	let scenarioCount = 0
	const scopeOnly = new Map(Object.entries(scopeOnlyBullets))
	let scopeCount = 0
	const crosswalk = [
		'# Legacy alternate/failure-flow Scenario crosswalk',
		'',
		'This is traceability evidence, not additional normative authority. Original bullets are quoted from the byte-preserved historical archive and the current `.spec/` graph remains authoritative. Behavioral bullets map to observable Scenarios; one non-behavioral process scope/exclusion bullet is explicitly marked without a fabricated test. The numbered source index is one-based.',
		'',
	]
	for (const id of Object.keys(scenarioPlan)
		.sort()) {
		const uc = readSource('use-cases', id)
		const match = /(?:^|\n)## Alternate & Failure Flows\r?\n([\s\S]*?)(?=\r?\n## |$)/.exec(uc.body)
		assert.ok(match, `missing alternate section for ${id}`)
		const bullets = match[1].split(/\r?\n/)
			.filter(text => text.startsWith('- '))
			.map(text => text.slice(2)
				.trim())
		const plan = scenarioPlan[id]
		assert.equal(plan.length, bullets.length, `${id}: every source alternate bullet must have a plan entry`)
		const ruleId = ruleByFeature.get(featureByUseCase.get(id))
		assert.ok(known.has(ruleId), `unresolved owning Rule ${id}`)
		crosswalk.push(`## ${uc.meta.title} (${id})`, '')
		for (const [index, cases] of plan.entries()) {
			assert.ok(Array.isArray(cases), `missing plan for ${id} bullet ${index + 1}`)
			crosswalk.push(`### ${index + 1}. ${bullets[index]}`, '')
			bulletCount++
			if (cases.length === 0) {
				const key = `${id}:${index + 1}`
				const rationale = scopeOnly.get(key)
				assert.ok(rationale, `missing explicit non-Scenario rationale: ${key}`)
				assert.ok(bullets[index].includes('not part of this interaction'), `not a source scope exclusion: ${key}`)
				crosswalk.push(`- **Out-of-scope source note (no Scenario):** ${rationale}`, '')
				scopeOnly.delete(key)
				scopeCount++
				continue
			}
			assert.ok(!scopeOnly.has(`${id}:${index + 1}`), `scope-only entry has fabricated Scenarios: ${id}:${index + 1}`)
			for (const [subIndex, entry] of cases.entries()) {
				assert.deepEqual(Object.keys(entry)
					.sort(), ['given', 'then', 'title', 'when'])
				const title = singleLine('title', entry.title)
				const given = singleLine('given', entry.given)
				const when = singleLine('when', entry.when)
				const then = singleLine('then', entry.then)
				const semanticId = derivedUuid(id, index + 1, subIndex + 1, 'semantic')
				const storageId = derivedUuid(id, index + 1, subIndex + 1, 'storage')
				assert.ok(!known.has(semanticId) && !known.has(storageId) && semanticId !== storageId, `UUID collision ${id}/${index}/${subIndex}`)
				known.add(semanticId)
				known.add(storageId)
				const relative = `scenarios/${storageId}.feature`
				const file = join(spec, relative)
				assert.ok(!existsSync(file), `will not overwrite ${relative}`)
				writeFileSync(file, [
					`Feature: ${singleLine('use case title', uc.meta.title)}`,
					`  @spec:id:${semanticId}`,
					`  @spec:demonstrates:${ruleId}`,
					`  Scenario: ${title}`,
					`    Given ${given}`,
					`    When ${when}`,
					`    Then ${then}`,
					'',
				].join('\n'))
				crosswalk.push(`- [${title}](../../.spec/${relative}) — Scenario ID: \`${semanticId}\``, '')
				scenarioCount++
			}
		}
	}
	assert.equal(bulletCount, 51, 'exactly all 51 archived alternate/failure bullets must be mapped')
	assert.equal(scopeCount, 1, 'the source process-boundary note must not become an artificial Scenario')
	assert.equal(scopeOnly.size, 0, 'no unaccounted-for process-boundary notes')
	assert.equal(scenarioCount, 72, 'all 72 explicitly authored alternate Scenarios must be generated')
	const after = await client.workspace.validate()
	assert.equal(after.valid, true, JSON.stringify(after.issues))
	const graph = (await client.graph.export()).data
	assert.equal(graph.nodes.filter(node => node.kind === 'scenario').length, 16 + scenarioCount)
	assert.equal(graph.edges.filter(edge => edge.type === 'demonstrates').length, 16 + scenarioCount)
	const path = join(root, 'docs/spec-migration/alternate-scenario-crosswalk.md')
	writeFileSync(path, `${crosswalk.join('\n')
		.trimEnd()}\n`)
	process.stdout.write(`Authored ${scenarioCount} alternate Scenarios from ${bulletCount - scopeCount} behavioral bullets, preserved ${scopeCount} non-behavioral scope note; all ${bulletCount} archived bullets accounted for; validated ${graph.nodes.length} nodes and ${graph.edges.length} edges.\n`)
}

main()
	.catch((error) => {
		process.stderr.write(`${error.stack ?? error}\n`)
		process.exitCode = 1
	})
