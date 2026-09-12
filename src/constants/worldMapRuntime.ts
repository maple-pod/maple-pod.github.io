export const WORLD_MAP_CATALOG_URL = '/resources/world-map/catalog.json'
export const WORLD_MAP_CACHE_KEY_QUERY = 'world-map-cache-key'
export const WORLD_MAP_RUNTIME_SCHEMA_VERSION = 3
export const WORLD_MAP_CANONICAL_SCHEMA_VERSION = 8
export const WORLD_MAP_RUNTIME_CACHE_PREFIX = 'maple-pod-world-map-'
export const WORLD_MAP_RUNTIME_CONTRACT_ID = `runtime-v${WORLD_MAP_RUNTIME_SCHEMA_VERSION}-canonical-v${WORLD_MAP_CANONICAL_SCHEMA_VERSION}`

export function withWorldMapCacheKey(url: string, cacheKey: string): string {
	const separator = url.includes('?') ? '&' : '?'
	return `${url}${separator}${WORLD_MAP_CACHE_KEY_QUERY}=${encodeURIComponent(cacheKey)}`
}

export function getWorldMapSnapshotBase(snapshotId: string): string {
	return `/resources/world-map/snapshots/${snapshotId}`
}

export function getWorldMapManifestUrl(snapshotId: string): string {
	return `${getWorldMapSnapshotBase(snapshotId)}/manifest.json`
}

export function getWorldMapNodeUrl(snapshotId: string, chunk: string, cacheKey: string): string {
	return withWorldMapCacheKey(`${getWorldMapSnapshotBase(snapshotId)}/${chunk}`, cacheKey)
}

export const WORLD_MAP_RUNTIME_CACHE_NAMES = {
	manifest: `${WORLD_MAP_RUNTIME_CACHE_PREFIX}${WORLD_MAP_RUNTIME_CONTRACT_ID}-manifest-cache`,
	nodes: `${WORLD_MAP_RUNTIME_CACHE_PREFIX}${WORLD_MAP_RUNTIME_CONTRACT_ID}-nodes-cache`,
	images: `${WORLD_MAP_RUNTIME_CACHE_PREFIX}${WORLD_MAP_RUNTIME_CONTRACT_ID}-images-cache`,
} as const
