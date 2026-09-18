import type { CustomPlaylistId, Playlist, PortableSavedUserData, SavedUserData } from '@/types'
import { createInitialSavedUserData, useSavedUserData } from '@/composables/useSavedUserData'
import { clearLastSelectedSnapshotId, readLastSelectedSnapshotId, writeLastSelectedSnapshotId } from '@/utils/worldMapSelectionStorage'

function clonePlaylist<Id extends Playlist['id']>(playlist: Playlist<Id>): Playlist<Id> {
	return {
		...playlist,
		list: [...playlist.list],
	}
}

function mergeCustomPlaylists(
	local: Playlist<CustomPlaylistId>[],
	incoming: Playlist<CustomPlaylistId>[],
): Playlist<CustomPlaylistId>[] {
	const incomingById = new Map(incoming.map(playlist => [playlist.id, playlist] as const))
	const localIds = new Set(local.map(playlist => playlist.id))
	const merged = local.map((playlist) => {
		const replacement = incomingById.get(playlist.id)
		return clonePlaylist(replacement ?? playlist)
	})

	for (const playlist of incomingById.values()) {
		if (localIds.has(playlist.id))
			continue
		merged.push(clonePlaylist(playlist))
	}

	return merged
}

export function useSavedDataPortability() {
	const { savedUserData } = useSavedUserData()

	function exportPortableSavedUserData(): PortableSavedUserData {
		return {
			preferences: { ...savedUserData.value.preferences },
			liked: clonePlaylist(savedUserData.value.liked),
			playlists: savedUserData.value.playlists.map(clonePlaylist),
			worldMap: {
				lastSelectedSnapshot: readLastSelectedSnapshotId(),
			},
		}
	}

	function mergePortableSavedUserData(incoming: PortableSavedUserData): void {
		const current = savedUserData.value
		const merged: SavedUserData = {
			preferences: incoming.preferences == null
				? { ...current.preferences }
				: { ...current.preferences, ...incoming.preferences },
			liked: incoming.liked == null
				? clonePlaylist(current.liked)
				: clonePlaylist(incoming.liked),
			playlists: incoming.playlists == null
				? current.playlists.map(clonePlaylist)
				: mergeCustomPlaylists(current.playlists, incoming.playlists),
			history: [...current.history],
		}

		if (
			incoming.worldMap != null
			&& 'lastSelectedSnapshot' in incoming.worldMap
			&& !writeLastSelectedSnapshotId(incoming.worldMap.lastSelectedSnapshot ?? null)
		) {
			throw new Error('Failed to persist the imported World Map selection.')
		}
		savedUserData.value = merged
	}

	function resetSavedData(): void {
		if (!clearLastSelectedSnapshotId()) {
			throw new Error('Failed to clear the saved World Map selection.')
		}
		savedUserData.value = createInitialSavedUserData()
	}

	return {
		exportPortableSavedUserData,
		mergePortableSavedUserData,
		resetSavedData,
	}
}
