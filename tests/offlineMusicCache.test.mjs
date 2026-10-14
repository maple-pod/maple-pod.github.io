/* eslint-disable test/no-import-node-test -- This targeted suite uses Node's built-in runner without adding a test dependency. */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
	migrateOfflineMusicAliasStorageKey,
	reconcileOfflineMusicStorageValue,
} from '../src/utils/offlineMusicCache.ts'

function createMemoryStorage(entries = {}, overrides = {}) {
	const values = new Map(Object.entries(entries))
	return {
		values,
		async getItem(key) {
			return structuredClone(values.get(key) ?? null)
		},
		async setItem(key, value) {
			if (overrides.setItem != null)
				return overrides.setItem(key, value, values)
			values.set(key, structuredClone(value))
			return structuredClone(value)
		},
		async removeItem(key) {
			if (overrides.removeItem != null)
				return overrides.removeItem(key, values)
			values.delete(key)
		},
	}
}

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

test('offline media migrates from an upstream alias key to its stable ID and preserves the Blob', async () => {
	const blob = new Blob(['promoted-audio-bytes'], { type: 'audio/mpeg' })
	const storage = createMemoryStorage({
		OldUpstreamFilename: { source: '/resources/bgm/OldUpstreamFilename.mp3', blob },
	})
	const migrated = await migrateOfflineMusicAliasStorageKey(
		'OldUpstreamFilename',
		'supplemental:dimension-tower:old-login',
		await storage.getItem('OldUpstreamFilename'),
		'/resources/bgm/published-safe-name.mp3',
		storage,
	)

	assert.equal(migrated?.source, '/resources/bgm/published-safe-name.mp3')
	assert.equal(await migrated?.blob.text(), 'promoted-audio-bytes')
	assert.equal(storage.values.has('OldUpstreamFilename'), false)
	assert.equal((await storage.getItem('supplemental:dimension-tower:old-login')).source, '/resources/bgm/published-safe-name.mp3')
})

test('offline alias data remains when the canonical copy cannot be written or verified', async () => {
	const blob = new Blob(['preserve-this-audio'], { type: 'audio/mpeg' })
	const aliasEntry = { source: '/resources/bgm/OldUpstreamFilename.mp3', blob }
	const failedWriteStorage = createMemoryStorage({ OldUpstreamFilename: aliasEntry }, {
		setItem: async () => { throw new Error('storage write failed') },
	})
	await assert.rejects(migrateOfflineMusicAliasStorageKey(
		'OldUpstreamFilename',
		'supplemental:dimension-tower:old-login',
		await failedWriteStorage.getItem('OldUpstreamFilename'),
		'/resources/bgm/published-safe-name.mp3',
		failedWriteStorage,
	), /storage write failed/)
	assert.equal(failedWriteStorage.values.has('OldUpstreamFilename'), true)

	const unverifiedStorage = createMemoryStorage({ OldUpstreamFilename: aliasEntry }, {
		setItem: async () => null,
	})
	assert.equal(await migrateOfflineMusicAliasStorageKey(
		'OldUpstreamFilename',
		'supplemental:dimension-tower:old-login',
		await unverifiedStorage.getItem('OldUpstreamFilename'),
		'/resources/bgm/published-safe-name.mp3',
		unverifiedStorage,
	), null)
	assert.equal(unverifiedStorage.values.has('OldUpstreamFilename'), true)
})

test('a different valid canonical Blob does not cause the upstream alias Blob to be deleted', async () => {
	const aliasBlob = new Blob(['older-audio'], { type: 'audio/mpeg' })
	const canonicalBlob = new Blob(['current-audio'], { type: 'audio/mpeg' })
	const canonicalId = 'supplemental:dimension-tower:old-login'
	const storage = createMemoryStorage({
		OldUpstreamFilename: { source: '/resources/bgm/OldUpstreamFilename.mp3', blob: aliasBlob },
		[canonicalId]: { source: '/resources/bgm/published-safe-name.mp3', blob: canonicalBlob },
	})

	const result = await migrateOfflineMusicAliasStorageKey(
		'OldUpstreamFilename',
		canonicalId,
		await storage.getItem('OldUpstreamFilename'),
		'/resources/bgm/published-safe-name.mp3',
		storage,
	)
	assert.equal(await result?.blob.text(), 'current-audio')
	assert.equal(storage.values.has('OldUpstreamFilename'), true)
	assert.equal(storage.values.has(canonicalId), true)
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
