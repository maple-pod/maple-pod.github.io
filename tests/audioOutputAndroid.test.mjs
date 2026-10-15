/* eslint-disable test/no-import-node-test -- Tests run with Node's built-in runner, without a test dependency. */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = readFileSync(path.join(root, 'src/composables/useAudioOutput.ts'), 'utf8')
	.replace('import { decibelsToLinearGain } from \'@/utils/loudness\'\n', '')
const compiled = ts.transpileModule(source, {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText.replace(/^export /gm, '')

function createAudioOutput(userAgent) {
	const audio = { volume: 0.6, paused: false, ended: false, muted: false }
	let userVolume = 0.6
	const context = {
		navigator: { userAgent },
		document: { visibilityState: 'hidden' },
		window: { setTimeout },
		performance,
		console,
		decibelsToLinearGain: () => 1,
		ref: value => ({ value }),
		computed: getter => ({ get value() { return getter() } }),
		useEventListener: () => {},
	}
	vm.runInNewContext(`${compiled}\nthis.createOutput = useAudioOutput;`, context)
	const output = context.createOutput({
		audio: { value: audio },
		getVolume: () => userVolume,
		getMuted: () => false,
	})
	function setVolume(value) {
		userVolume = value
	}
	return { audio, output, setVolume }
}

test('Android track transitions never zero native volume for a non-muted player', async () => {
	const { audio, output } = createAudioOutput('Mozilla/5.0 (Linux; Android 17; Pixel) AppleWebKit/537.36 Chrome/145')
	await output.fadeOutputTo(0, 0) // Candidate preparation before play().
	assert.equal(audio.volume, 0.6)
	await output.fadeOutputTo(0, 30) // Previous track handoff.
	assert.equal(audio.volume, 0.6)
	await output.fadeOutputTo(1, 30)
	assert.equal(audio.volume, 0.6)
})

test('Android user volume is still honored independently of transition gain', async () => {
	const { audio, output, setVolume } = createAudioOutput('Android')
	setVolume(0.3)
	output.syncOutputVolume()
	assert.equal(audio.volume, 0.3)
	setVolume(0)
	output.syncOutputVolume()
	assert.equal(audio.volume, 0)
})

test('non-Android native fallback still applies its transition gain', async () => {
	const { audio, output } = createAudioOutput('Mozilla/5.0 (X11; Linux x86_64) Chrome/145')
	await output.fadeOutputTo(0, 0)
	assert.equal(audio.volume, 0)
	await output.fadeOutputTo(1, 0)
	assert.equal(audio.volume, 0.6)
})
