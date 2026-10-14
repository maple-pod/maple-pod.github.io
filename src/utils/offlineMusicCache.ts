export interface OfflineMusicEntry {
	source: string
	blob: Blob
}

export interface OfflineMusicStorageAdapter {
	getItem: (key: string) => Promise<unknown>
	setItem: (key: string, value: OfflineMusicEntry) => Promise<unknown>
	removeItem: (key: string) => Promise<unknown>
}

export type OfflineMusicReconciliation
	= { kind: 'ready', entry: OfflineMusicEntry, needsPersist: boolean }
		| { kind: 'retained-unresolved' }
		| { kind: 'remove' }
		| { kind: 'empty' }

export function isOfflineMusicEntry(value: unknown): value is OfflineMusicEntry {
	return value != null
		&& typeof value === 'object'
		&& 'source' in value
		&& typeof value.source === 'string'
		&& 'blob' in value
		&& value.blob instanceof Blob
		&& value.blob.size > 0
}

export function reconcileOfflineMusicStorageValue(
	musicId: string,
	value: unknown,
	expectedSource: string | undefined,
): OfflineMusicReconciliation {
	if (expectedSource == null) {
		if (isOfflineMusicEntry(value) || (value instanceof Blob && value.size > 0))
			return { kind: 'retained-unresolved' }
		return value == null ? { kind: 'empty' } : { kind: 'remove' }
	}

	if (isOfflineMusicEntry(value)) {
		return {
			kind: 'ready',
			entry: value.source === expectedSource ? value : { source: expectedSource, blob: value.blob },
			needsPersist: value.source !== expectedSource,
		}
	}

	const legacySource = `/resources/bgm/${musicId}.mp3`
	if (value instanceof Blob && value.size > 0 && expectedSource === legacySource) {
		return {
			kind: 'ready',
			entry: { source: legacySource, blob: value },
			needsPersist: true,
		}
	}

	return value == null ? { kind: 'empty' } : { kind: 'remove' }
}

async function haveSameBlobContents(first: Blob, second: Blob): Promise<boolean> {
	if (first.size !== second.size || first.type !== second.type)
		return false

	const chunkSize = 64 * 1024
	for (let offset = 0; offset < first.size; offset += chunkSize) {
		const [firstChunk, secondChunk] = await Promise.all([
			first
				.slice(offset, offset + chunkSize)
				.arrayBuffer(),
			second
				.slice(offset, offset + chunkSize)
				.arrayBuffer(),
		])
		const firstBytes = new Uint8Array(firstChunk)
		const secondBytes = new Uint8Array(secondChunk)
		if (firstBytes.length !== secondBytes.length)
			return false
		for (let index = 0; index < firstBytes.length; index++) {
			if (firstBytes[index] !== secondBytes[index])
				return false
		}
	}
	return true
}

export async function migrateOfflineMusicAliasStorageKey(
	aliasId: string,
	canonicalId: string,
	aliasValue: unknown,
	expectedSource: string | undefined,
	storage: OfflineMusicStorageAdapter,
): Promise<OfflineMusicEntry | null> {
	if (aliasId === canonicalId || expectedSource == null)
		return null

	const aliasEntry = isOfflineMusicEntry(aliasValue)
		? { source: expectedSource, blob: aliasValue.blob }
		: aliasValue instanceof Blob && aliasValue.size > 0
			? { source: expectedSource, blob: aliasValue }
			: null
	if (aliasEntry == null)
		return null

	const canonicalValue = await storage.getItem(canonicalId)
	const existingCanonical = reconcileOfflineMusicStorageValue(canonicalId, canonicalValue, expectedSource)
	const canonicalEntry = existingCanonical.kind === 'ready' ? existingCanonical.entry : aliasEntry
	const aliasAlreadyCopied = existingCanonical.kind !== 'ready'
		|| await haveSameBlobContents(existingCanonical.entry.blob, aliasEntry.blob)
	if (existingCanonical.kind !== 'ready' || existingCanonical.needsPersist)
		await storage.setItem(canonicalId, canonicalEntry)

	const copiedValue = await storage.getItem(canonicalId)
	const copied = reconcileOfflineMusicStorageValue(canonicalId, copiedValue, expectedSource)
	const copiedAliasContentMatches = !aliasAlreadyCopied
		|| (copied.kind === 'ready' && await haveSameBlobContents(copied.entry.blob, aliasEntry.blob))
	if (
		copied.kind !== 'ready'
		|| copied.entry.source !== expectedSource
		|| copied.entry.blob.size !== canonicalEntry.blob.size
		|| copied.entry.blob.type !== canonicalEntry.blob.type
		|| !copiedAliasContentMatches
	) {
		return null
	}

	if (aliasAlreadyCopied)
		await storage.removeItem(aliasId)
	return copied.entry
}
