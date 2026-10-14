/* eslint-disable test/no-import-node-test -- This targeted suite uses Node's built-in runner without adding a test dependency. */
import assert from 'node:assert/strict'
import test from 'node:test'
import { reconcileOfflineMusicStorageValue } from '../src/utils/offlineMusicCache.ts'

test('cached media migrates its source association across a stable-ID resource rename', () => {
	const blob = new Blob(['audio-bytes'], { type: 'audio/mpeg' })
	const result = reconcileOfflineMusicStorageValue(
		'supplemental:dimension-tower:old-login',
		{ source: '/resources/bgm/old-login.mp3', blob },
		'/resources/bgm/dimension-tower-old-login.mp3',
	)

	assert.equal(result.kind, 'ready')
	assert.equal(result.needsPersist, true)
	assert.equal(result.entry.source, '/resources/bgm/dimension-tower-old-login.mp3')
	assert.equal(result.entry.blob, blob)
})

test('unresolved media is retained without being marked ready', () => {
	const blob = new Blob(['audio-bytes'])
	const entry = { source: '/resources/bgm/old-login.mp3', blob }
	assert.deepEqual(
		reconcileOfflineMusicStorageValue('supplemental:dimension-tower:old-login', entry, undefined),
		{ kind: 'retained-unresolved' },
	)
	assert.deepEqual(
		reconcileOfflineMusicStorageValue('old-login', blob, undefined),
		{ kind: 'retained-unresolved' },
	)
})

test('last-known-good raw Blob migration still requires the explicit legacy source to match', () => {
	const legacyBlob = new Blob(['legacy-audio'])
	const legacy = reconcileOfflineMusicStorageValue('old-login', legacyBlob, '/resources/bgm/old-login.mp3')
	assert.equal(legacy.kind, 'ready')
	assert.equal(legacy.needsPersist, true)
	assert.equal(legacy.entry.blob, legacyBlob)

	assert.equal(
		reconcileOfflineMusicStorageValue('supplemental:dimension-tower:old-login', legacyBlob, '/resources/bgm/old-login.mp3').kind,
		'remove',
	)
})

test('invalid or empty stored values never become ready', () => {
	assert.equal(reconcileOfflineMusicStorageValue('old-login', null, '/resources/bgm/old-login.mp3').kind, 'empty')
	assert.equal(reconcileOfflineMusicStorageValue('old-login', { source: 'old', blob: new Blob() }, '/resources/bgm/old-login.mp3').kind, 'remove')
})
