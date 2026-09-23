// Regression audit for the one-time Spec Tool 0.0.1 → 0.1.0 migration.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSpecClient } from '@deviltea/spec-tool'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const legacy = join(root, 'docs/spec-migration/legacy')
const yaml = createRequire(import.meta.resolve('@deviltea/spec-tool'))('yaml')
const manifest = JSON.parse(readFileSync(join(root, 'docs/spec-migration/legacy-sha256.json'), 'utf8'))
const kinds = { 'projects': 1, 'stories': 11, 'use-cases': 16, 'features': 16, 'requirements': 16 }
const expectedPaths = ['config.yaml']
const records = {}
for (const [kind, expectedCount] of Object.entries(kinds)) {
	const names = readdirSync(join(legacy, kind))
		.sort()
	assert.equal(names.length, expectedCount, `${kind} archived count`)
	records[kind] = new Map(names.map((name) => {
		assert.match(name, /^[0-9a-f-]{36}\.md$/)
		const path = `${kind}/${name}`
		expectedPaths.push(path)
		const source = readFileSync(join(legacy, path), 'utf8')
		const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source)
		assert.ok(match, `${path} frontmatter`)
		const meta = yaml.parse(match[1])
		assert.equal(meta.id, name.slice(0, -3), path)
		return [meta.id, { meta, body: match[2] }]
	}))
}
assert.deepEqual(Object.keys(manifest)
	.sort(), expectedPaths.sort(), 'exact historical file manifest')
for (const path of expectedPaths) {
	const file = join(legacy, path)
	assert.ok(existsSync(file), `missing ${path}`)
	assert.equal(createHash('sha256')
		.update(readFileSync(file))
		.digest('hex'), manifest[path], `${path} archive byte integrity`)
}
const { valid, issues } = await createSpecClient(root).workspace.validate()
assert.equal(valid, true, JSON.stringify(issues))
const { data: graph } = await createSpecClient(root).graph.export()
assert.equal(graph.formatVersion, 1)
const byId = new Map(graph.nodes.map(node => [node.id, node]))
assert.equal(byId.size, 59, 'all 59 original semantic IDs are retained')
const countKinds = {}
for (const node of graph.nodes) countKinds[node.kind] = (countKinds[node.kind] ?? 0) + 1
assert.deepEqual(countKinds, { story: 11, scenario: 16, feature: 16, rule: 16 })
const edges = new Set(graph.edges.map(edge => `${edge.from}:${edge.type}:${edge.to}`))
assert.equal(edges.size, 32, '16 Story→Feature and 16 Scenario→Rule edges')
function parentOf(record) {
	const rel = record.meta.relations.filter(item => item.type === 'refines')
	assert.equal(rel.length, 1)
	return rel[0].target
}
const featureForUseCase = new Map([...records.features].map(([id, record]) => [parentOf(record), id]))
const ruleForFeature = new Map([...records.requirements].map(([id, record]) => [parentOf(record), id]))
function section(record, heading) {
	const match = new RegExp(`(?:^|\\n)## ${heading}\\r?\\n([\\s\\S]*?)(?=\\r?\\n## |$)`)
		.exec(record.body)
	assert.ok(match, `missing ${heading} in ${record.meta.id}`)
	return match[1].trim()
}
for (const [id, record] of records.stories) {
	const node = byId.get(id)
	assert.equal(node?.kind, 'story')
	assert.equal(node.title, record.meta.title)
	for (const field of ['Actor', 'Goal', 'Value']) assert.equal(node[field.toLowerCase()], section(record, field))
}
for (const [id, record] of records['use-cases']) {
	const node = byId.get(id)
	assert.equal(node?.kind, 'scenario')
	assert.equal(node.title, record.meta.title)
	const featureId = featureForUseCase.get(id)
	assert.ok(featureId, `no feature for ${id}`)
	const ruleId = ruleForFeature.get(featureId)
	assert.ok(ruleId, `no rule for ${featureId}`)
	assert.ok(edges.has(`${id}:demonstrates:${ruleId}`), `missing Scenario→Rule ${id}`)
	assert.ok(edges.has(`${parentOf(record)}:motivates:${featureId}`), `missing Story→Feature ${id}`)
	const normalize = text => text.replace(/\s+/g, ' ')
		.trim()
	assert.equal(node.steps[0]?.type, 'given')
	assert.equal(node.steps[0]?.text, normalize(section(record, 'Preconditions')))
	assert.equal(node.steps.at(-1)?.type, 'then')
	assert.equal(node.steps.at(-1)?.text, normalize(section(record, 'Observable Outcomes')))
	assert.ok(node.steps.some(step => step.type === 'when'), `no interactions in ${id}`)
}
for (const [id, record] of records.features) {
	const node = byId.get(id)
	assert.equal(node?.kind, 'feature')
	assert.equal(node.title, record.meta.title)
	assert.equal(node.summary, section(record, 'Capability'))
	const ruleId = ruleForFeature.get(id)
	const ruleNode = byId.get(ruleId)
	assert.equal(ruleNode?.kind, 'rule')
	assert.equal(ruleNode.ownerId, id)
	assert.equal(ruleNode.statement, section(records.requirements.get(ruleId), 'Contract'))
	const body = readFileSync(join(root, node.source.path), 'utf8')
	assert.ok(body.includes(record.body.trim()), `original Feature notes missing: ${id}`)
	assert.ok(body.includes(records.requirements.get(ruleId).body.trim()), `original REQ notes missing: ${ruleId}`)
}
assert.equal(graph.edges.filter(edge => edge.type === 'motivates').length, 16)
assert.equal(graph.edges.filter(edge => edge.type === 'demonstrates').length, 16)
console.log('Migration audit passed: 61 archived files, 59 preserved semantic IDs, 16 Story→Feature and 16 Scenario→Rule links.')
