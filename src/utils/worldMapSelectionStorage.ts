const LAST_SELECTED_SNAPSHOT_STORAGE_KEY = 'maple-pod:world-map:last-selected-snapshot'

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

export function writeLastSelectedSnapshotId(snapshotId: string | null): void {
	if (typeof window === 'undefined')
		return
	try {
		if (snapshotId == null)
			window.localStorage.removeItem(LAST_SELECTED_SNAPSHOT_STORAGE_KEY)
		else
			window.localStorage.setItem(LAST_SELECTED_SNAPSHOT_STORAGE_KEY, snapshotId)
	}
	catch {
		// Snapshot persistence is a convenience; route-backed selection still works without storage.
	}
}
