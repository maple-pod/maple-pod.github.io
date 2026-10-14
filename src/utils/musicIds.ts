export function normalizeSavedMusicIds(list: string[], hasMusic: (id: string) => boolean): string[] {
	return list.map((value) => {
		if (hasMusic(value))
			return value

		// Persisted data before stable music IDs used the exact resource path.
		// Migrate it only when today's catalog resolves the filename identity.
		const legacy = value.match(/^\/resources\/bgm\/([^/]+)\.mp3$/)
		if (legacy != null && hasMusic(legacy[1]!))
			return legacy[1]!

		// Keep unresolved references until the catalog resolves them or the user
		// explicitly removes them from a saveable playlist.
		return value
	})
}
