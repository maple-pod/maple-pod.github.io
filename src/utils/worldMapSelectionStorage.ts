import { isFactoryResetting } from '@/utils/factoryReset'

const LAST_SELECTED_SNAPSHOT_STORAGE_KEY = 'maple-pod:world-map:last-selected-snapshot'
let selectionWriteEpoch = 0

export function readLastSelectedSnapshotId(): string | null {
	if (typeof window === 'undefined')
		return null
	try {
		return window.localStorage.getItem(LAST_SELECTED_SNAPSHOT_STORAGE_KEY)
	}
	catch {
		return null
	}
}

export function getLastSelectedSnapshotWriteEpoch(): number {
	return selectionWriteEpoch
}

export function isLastSelectedSnapshotWriteEpochCurrent(expectedEpoch: number): boolean {
	return expectedEpoch === selectionWriteEpoch && !isFactoryResetting()
}

function persistLastSelectedSnapshotId(snapshotId: string | null): boolean {
	if (typeof window === 'undefined')
		return true
	try {
		if (snapshotId == null)
			window.localStorage.removeItem(LAST_SELECTED_SNAPSHOT_STORAGE_KEY)
		else
			window.localStorage.setItem(LAST_SELECTED_SNAPSHOT_STORAGE_KEY, snapshotId)
		return true
	}
	catch {
		return false
	}
}

export function writeLastSelectedSnapshotId(snapshotId: string | null, expectedEpoch?: number): boolean {
	if (isFactoryResetting())
		return false
	if (expectedEpoch == null)
		selectionWriteEpoch++
	else if (expectedEpoch !== selectionWriteEpoch)
		return false

	const persisted = persistLastSelectedSnapshotId(snapshotId)
	if (persisted && expectedEpoch != null)
		selectionWriteEpoch++
	return persisted
}

export function clearLastSelectedSnapshotId(): boolean {
	selectionWriteEpoch++
	return persistLastSelectedSnapshotId(null)
}
