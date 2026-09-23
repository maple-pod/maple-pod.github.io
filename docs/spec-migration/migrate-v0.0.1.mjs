// One-time, fail-closed conversion of Maple Pod's v0.0.1 workspace to frozen v1.
// The immutable input snapshot is retained under docs/spec-migration/legacy/.
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const stepEdits = JSON.parse(readFileSync(join(root, 'docs/spec-migration/main-flow-step-edits.json'), 'utf8'))
const legacyRoot = join(root, 'docs/spec-migration/legacy')
const specRoot = join(root, '.spec')
const kinds = ['projects', 'stories', 'use-cases', 'features', 'requirements']
if (existsSync(join(specRoot, 'spec.yaml')))
	throw new Error('Already migrated; refusing to overwrite v1')
if (!existsSync(join(specRoot, 'config.yaml')))
	throw new Error('Expected original v0.0.1 .spec/config.yaml')
// Existing archived files are compared byte-for-byte before resume

// Archive first. Compare original and archive bytes before replacing a single source.
const archived = []
for (const kind of kinds) {
	for (const name of readdirSync(join(specRoot, kind))
		.filter(name => name.endsWith('.md'))
		.sort()) {
		const from = join(specRoot, kind, name)
		const to = join(legacyRoot, kind, name)
		mkdirSync(dirname(to), { recursive: true })
		if (!existsSync(to))
			copyFileSync(from, to)
		if (!readFileSync(from)
			.equals(readFileSync(to))) {
			throw new Error(`Archive mismatch: ${kind}/${name}`)
		}
		archived.push(`${kind}/${name}`)
	}
}
mkdirSync(legacyRoot, { recursive: true })
if (!existsSync(join(legacyRoot, 'config.yaml')))
	copyFileSync(join(specRoot, 'config.yaml'), join(legacyRoot, 'config.yaml'))
if (!readFileSync(join(specRoot, 'config.yaml'))
	.equals(readFileSync(join(legacyRoot, 'config.yaml')))) {
	throw new Error('Archive config mismatch')
}
if (archived.length !== 60)
	throw new Error(`Expected exactly 60 legacy Artifacts, got ${archived.length}`)

function readKind(kind) {
	return new Map(readdirSync(join(legacyRoot, kind))
		.sort()
		.map((name) => {
			const source = readFileSync(join(legacyRoot, kind, name), 'utf8')
			const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(source)
			if (!match)
				throw new Error(`Malformed source ${kind}/${name}`)
			const meta = YAML.parse(match[1])
			const body = match[2]
			const parts = body.split(/^## ([^\r\n]+)\r?\n/m)
			const sections = {}
			for (let i = 1; i < parts.length; i += 2) {
				if (Object.hasOwn(sections, parts[i]))
					throw new Error(`Repeated heading: ${name}/${parts[i]}`)
				sections[parts[i]] = parts[i + 1].trim()
			}
			if (meta.id !== name.slice(0, -3))
				throw new Error(`ID filename mismatch: ${name}`)
			return [meta.id, { meta, body, sections, oldPath: `${kind}/${name}` }]
		}))
}
const stories = readKind('stories')
const useCases = readKind('use-cases')
const features = readKind('features')
const requirements = readKind('requirements')
const projects = readKind('projects')
if ([stories.size, useCases.size, features.size, requirements.size, projects.size].join(',') !== '11,16,16,16,1')
	throw new Error('Unexpected legacy counts')
function onlyParent(record, expectedKind) {
	const refs = record.meta.relations?.filter(x => x.type === 'refines') || []
	if (refs.length !== 1)
		throw new Error(`Expected one parent for ${record.meta.id} (${expectedKind})`)
	return refs[0].target
}
const featureByUseCase = new Map()
for (const f of features.values()) {
	const uc = onlyParent(f, 'use-case')
	if (!useCases.has(uc) || featureByUseCase.has(uc))
		throw new Error(`Invalid 1:1 feature→use-case: ${f.meta.id}`)
	featureByUseCase.set(uc, f.meta.id)
}
const ruleByFeature = new Map()
for (const r of requirements.values()) {
	const featureId = onlyParent(r, 'feature')
	if (!features.has(featureId) || ruleByFeature.has(featureId))
		throw new Error(`Invalid 1:1 requirement→feature: ${r.meta.id}`)
	ruleByFeature.set(featureId, r)
}
const motivatedByStory = new Map([...stories.keys()].map(id => [id, []]))
for (const uc of useCases.values()) {
	const storyId = onlyParent(uc, 'story')
	if (!stories.has(storyId) || !featureByUseCase.has(uc.meta.id))
		throw new Error(`Unresolved use-case chain: ${uc.meta.id}`)
	motivatedByStory.get(storyId)
		.push(featureByUseCase.get(uc.meta.id))
}
for (const [storyId, ids] of motivatedByStory) {
	if (!ids.length)
		throw new Error(`Story has no Feature: ${storyId}`)
}
for (const id of features.keys()) {
	if (!ruleByFeature.has(id))
		throw new Error(`Feature has no Requirement: ${id}`)
}

// Deterministic, independent UUIDv7 storage IDs. Semantic IDs stay unchanged.
function storageId(id) {
	const old = Buffer.from(id.replaceAll('-', ''), 'hex')
	const bytes = createHash('sha256')
		.update(`maple-pod/spec-v1/scenario-container/${id}`)
		.digest()
		.subarray(0, 16)
	old.copy(bytes, 0, 0, 6)
	bytes[6] = (bytes[6] & 0x0F) | 0x70
	bytes[8] = (bytes[8] & 0x3F) | 0x80
	const hex = bytes.toString('hex')
	const result = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
	if (result === id)
		throw new Error('Unexpected semantic/storage ID collision')
	return result
}
function md(meta, notes = '') {
	return `---\n${YAML.stringify(meta, { lineWidth: 0 })
		.trimEnd()}\n---\n${notes}`
}
function write(relative, text) {
	const file = join(specRoot, relative)
	mkdirSync(dirname(file), { recursive: true })
	writeFileSync(file, text)
}
function line(text) {
	return text.replace(/\s+/g, ' ')
		.trim()
}
function section(record, key) {
	const text = record.sections[key]
	if (!text)
		throw new Error(`Missing ${key} in ${record.oldPath}`)
	return text
}
function mainFlow(text) {
	const items = text.split(/\r?\n(?=\d+\.\s)/)
		.map((x) => {
			const original = line(x.replace(/^\d+\.\s*/, ''))
			return stepEdits[original] ?? original
		})
		.filter(Boolean)
	return items.length ? items : [line(text)]
}
// Render everything in memory before deleting old persistence.
const rendered = new Map([['spec.yaml', 'formatVersion: 1\n']])
for (const s of stories.values()) {
	const id = s.meta.id
	rendered.set(`stories/${id}.md`, md({
		id,
		title: s.meta.title,
		actor: section(s, 'Actor'),
		goal: section(s, 'Goal'),
		value: section(s, 'Value'),
		motivates: [...new Set(motivatedByStory.get(id))].sort(),
	}))
}
for (const f of features.values()) {
	const r = ruleByFeature.get(f.meta.id)
	const rule = { id: r.meta.id, statement: section(r, 'Contract') }
	const historicalNotes = `\n> Historical v0.0.1 explanatory notes; canonical semantics are the v1 frontmatter above.\n> The original Feature and Requirement, including rationale and verification guidance,\n> are preserved verbatim under docs/spec-migration/legacy/.\n\n## Legacy Feature notes\n\n${f.body.trim()}\n\n## Legacy Requirement notes: ${r.meta.title}\n\n${r.body.trim()}\n`
	rendered.set(`features/${f.meta.id}.md`, md({ id: f.meta.id, title: f.meta.title, summary: section(f, 'Capability'), rules: [rule] }, historicalNotes))
}
for (const uc of useCases.values()) {
	const fId = featureByUseCase.get(uc.meta.id)
	const ruleId = ruleByFeature.get(fId).meta.id
	const steps = [
		`    Given ${line(section(uc, 'Preconditions'))}`,
		...mainFlow(section(uc, 'Main Flow'))
			.map(step => `    When ${step}`),
		`    Then ${line(section(uc, 'Observable Outcomes'))}`,
	]
	const file = [
		`Feature: ${line(uc.meta.title)}`,
		`  @spec:id:${uc.meta.id}`,
		`  @spec:demonstrates:${ruleId}`,
		`  Scenario: ${line(uc.meta.title)}`,
		...steps,
		'',
	].join('\n')
	rendered.set(`scenarios/${storageId(uc.meta.id)}.feature`, file)
}
if (rendered.size !== 44)
	throw new Error(`Unexpected rendered files: ${rendered.size}`)
rmSync(specRoot, { recursive: true, force: false })
for (const [relative, text] of rendered) write(relative, text)
writeFileSync(join(root, 'docs/spec-migration/legacy-sha256.json'), `${JSON.stringify(Object.fromEntries(
	['config.yaml', ...archived].map(relative => [relative, createHash('sha256')
		.update(readFileSync(join(legacyRoot, relative)))
		.digest('hex')]),
), null, '\t')}\n`)
process.stdout.write(`Migrated: ${stories.size} Stories; ${features.size} Features with ${requirements.size} Rules; ${useCases.size} Scenarios; 0 Contracts. Archived: ${archived.length + 1} original files.\n`)
