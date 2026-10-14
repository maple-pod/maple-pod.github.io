export function normalizeSavedMusicIds(
	list: string[],
	getCanonicalMusicId: (id: string) => string | undefined,
	dedupe = false,
): string[] {
	const seen = new Set<string>()
	const result: string[] = []
	for (const value of list) {
		let normalized = getCanonicalMusicId(value)

		if (normalized == null) {
			// Persisted data before stable music IDs used the exact resource path.
			// Migrate it only when today's catalog resolves the filename identity.
			const legacy = value.match(/^\/resources\/bgm\/([^/]+)\.mp3$/)
			if (legacy != null)
				normalized = getCanonicalMusicId(legacy[1]!)
		}

		// Keep unresolved references until the catalog resolves them or the user
		// explicitly removes them from a saveable playlist.
		normalized ??= value
		if (dedupe && seen.has(normalized))
			continue
		seen.add(normalized)
		result.push(normalized)
	}
	return result
}
