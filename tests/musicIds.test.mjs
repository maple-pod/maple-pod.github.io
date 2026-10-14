/* eslint-disable test/no-import-node-test -- This targeted suite uses Node's built-in runner without adding a test dependency. */
import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeSavedMusicIds } from '../src/utils/musicIds.ts'

test('saved liked, playlist, and history IDs keep stable and unresolved references', () => {
	const available = new Set(['upstream-login', 'supplemental:dimension-tower:old-login'])
	const values = [
		'supplemental:dimension-tower:old-login',
		'retired-supplemental-track',
		'/resources/bgm/upstream-login.mp3',
		'/resources/bgm/retired-track.mp3',
	]

	assert.deepEqual(normalizeSavedMusicIds(values, id => available.has(id)), [
		'supplemental:dimension-tower:old-login',
		'retired-supplemental-track',
		'upstream-login',
		'/resources/bgm/retired-track.mp3',
	])
})
