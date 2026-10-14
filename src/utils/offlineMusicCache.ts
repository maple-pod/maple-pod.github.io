export interface OfflineMusicEntry {
	source: string
	blob: Blob
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
