/* eslint-disable test/no-import-node-test -- This targeted suite uses Node's built-in runner without adding a test dependency. */
import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeSavedMusicIds } from '../src/utils/musicIds.ts'

test('saved liked, playlist, and history IDs retain unknown references and normalize exact catalog aliases', () => {
	const canonicalById = new Map([
		['upstream-login', 'upstream-login'],
		['supplemental:dimension-tower:old-login', 'supplemental:dimension-tower:old-login'],
		['OldUpstreamFilename', 'supplemental:dimension-tower:old-login'],
	])
	const values = [
		'OldUpstreamFilename',
		'supplemental:dimension-tower:old-login',
		'/resources/bgm/OldUpstreamFilename.mp3',
		'retired-supplemental-track',
		'/resources/bgm/upstream-login.mp3',
		'/resources/bgm/retired-track.mp3',
	]

	assert.deepEqual(normalizeSavedMusicIds(values, id => canonicalById.get(id), true), [
		'supplemental:dimension-tower:old-login',
		'retired-supplemental-track',
		'upstream-login',
		'/resources/bgm/retired-track.mp3',
	])
})

test('history alias migration preserves each occurrence and its order', () => {
	const canonicalById = new Map([
		['OldUpstreamFilename', 'supplemental:dimension-tower:old-login'],
		['supplemental:dimension-tower:old-login', 'supplemental:dimension-tower:old-login'],
	])
	assert.deepEqual(normalizeSavedMusicIds([
		'OldUpstreamFilename',
		'supplemental:dimension-tower:old-login',
		'other-track',
		'OldUpstreamFilename',
	], id => canonicalById.get(id)), [
		'supplemental:dimension-tower:old-login',
		'supplemental:dimension-tower:old-login',
		'other-track',
		'supplemental:dimension-tower:old-login',
	])
})
