import type {
	LocalizedWorldMapName,
	WorldMapGraphMap,
	WorldMapGraphSpot,
	WorldMapManifest,
	WorldMapManifestNode,
	WorldMapNode,
	WorldMapNodeSummary,
	WorldMapSnapshotCatalog,
	WorldMapSnapshotCatalogEntry,
	WorldMapSnapshotId,
} from '@/schemas'
import {
	getWorldMapManifestUrl,
	getWorldMapNodeUrl,
	WORLD_MAP_CACHE_KEY_QUERY,
	WORLD_MAP_CATALOG_URL,
	WORLD_MAP_RUNTIME_CACHE_NAMES,
} from '@/constants/worldMapRuntime'
import {
	getWorldMapAssetPath,
	parseWorldMapManifest,
	parseWorldMapNodeChunk,
	parseWorldMapSnapshotCatalog,
} from '@/schemas'

export interface WorldMapNameRow {
	region: 'GMS' | 'KMS' | 'JMS' | 'CMS' | 'TWMS' | 'SEA'
	name: string
}

export interface WorldMapNodeLoadState {
	status: 'idle' | 'loading' | 'loaded' | 'error'
	error?: unknown
}

let catalogCache: WorldMapSnapshotCatalog | null = null
let catalogRequest: Promise<WorldMapSnapshotCatalog> | null = null
const manifestCache = new Map<WorldMapSnapshotId, WorldMapManifest>()
const manifestRequests = new Map<WorldMapSnapshotId, Promise<WorldMapManifest>>()
const manifestRequestGenerations = new Map<WorldMapSnapshotId, number>()
const nodeCache = new Map<string, WorldMapNode>()
const nodeRequests = new Map<string, Promise<WorldMapNode>>()

function getManifestNode(manifest: WorldMapManifest, worldMapId: string): WorldMapManifestNode | null {
	return manifest.nodes.find(node => node.worldMapId === worldMapId) ?? null
}

function nodeCacheKey(snapshotId: WorldMapSnapshotId, manifest: WorldMapManifest, worldMapId: string): string {
	return `${snapshotId}:${manifest.cacheKey}:${worldMapId}`
}

function snapshotCachePrefix(snapshotId: WorldMapSnapshotId): string {
	return `${snapshotId}:`
}

export function clearWorldMapSnapshotMemoryCache(snapshotId: WorldMapSnapshotId): void {
	manifestCache.delete(snapshotId)
	manifestRequests.delete(snapshotId)
	manifestRequestGenerations.set(snapshotId, (manifestRequestGenerations.get(snapshotId) ?? 0) + 1)
	const prefix = snapshotCachePrefix(snapshotId)
	for (const key of nodeCache.keys()) {
		if (key.startsWith(prefix))
			nodeCache.delete(key)
	}
}

export function getWorldMapNodeResourceUrl(
	snapshotId: WorldMapSnapshotId,
	node: Pick<WorldMapManifestNode, 'chunk'>,
	cacheKey: string,
): string {
	return getWorldMapNodeUrl(snapshotId, node.chunk, cacheKey)
}

/** Asset enumeration is intentionally data-only so the offline manager can reuse it. */
export function getWorldMapNodeAssetUrls(node: WorldMapNode, cacheKey: string): string[] {
	return [...node.baseImages, ...node.links.flatMap(link => link.linkImage == null ? [] : [link.linkImage])]
		.map(asset => getWorldMapAssetPath(asset.file, cacheKey))
}

async function cacheResponse(cacheName: string, url: string, response: Response): Promise<void> {
	if (typeof caches === 'undefined')
		return
	try {
		const cache = await caches.open(cacheName)
		await cache.put(url, response.clone())
	}
	catch {
		// Cache Storage is an enhancement for normal progressive loading. The
		// explicit offline manager reports cache failures to its caller.
	}
}

async function getCachedResponse(cacheName: string, url: string): Promise<Response | null> {
	if (typeof caches === 'undefined')
		return null
	try {
		const cache = await caches.open(cacheName)
		const response = await cache.match(url)
		return response?.ok ? response : null
	}
	catch {
		return null
	}
}

async function getCachedWorldMapManifest(snapshotId: WorldMapSnapshotId, url: string): Promise<WorldMapManifest | null> {
	if (typeof caches === 'undefined')
		return null
	try {
		const cache = await caches.open(WORLD_MAP_RUNTIME_CACHE_NAMES.manifest)
		const manifestPath = getWorldMapManifestUrl(snapshotId)
		const versionedRequests = (await cache.keys()).filter((request) => {
			const cachedUrl = new URL(request.url)
			return cachedUrl.pathname === manifestPath && cachedUrl.searchParams.has(WORLD_MAP_CACHE_KEY_QUERY)
		})
		if (versionedRequests.length === 1) {
			const request = versionedRequests[0]!
			const response = await cache.match(request)
			if (response?.ok !== true)
				return null
			const value = parseWorldMapManifest(await response.json())
			const cachedUrl = new URL(request.url)
			return cachedUrl.searchParams.get(WORLD_MAP_CACHE_KEY_QUERY) === value.cacheKey ? value : null
		}
		if (versionedRequests.length > 1)
			return null

		const response = await cache.match(url)
		return response?.ok === true ? parseWorldMapManifest(await response.json()) : null
	}
	catch {
		return null
	}
}

export async function fetchWorldMapCatalog(force = false, signal?: AbortSignal): Promise<WorldMapSnapshotCatalog> {
	if (!force && catalogCache != null)
		return catalogCache
	if (!force && catalogRequest != null)
		return catalogRequest

	const request = fetch(WORLD_MAP_CATALOG_URL, { signal, cache: force ? 'no-cache' : 'default' })
		.then(async (response) => {
			if (!response.ok)
				throw new Error(`World map catalog request failed with ${response.status}.`)
			const value = parseWorldMapSnapshotCatalog(await response.clone()
				.json())
			await cacheResponse(WORLD_MAP_RUNTIME_CACHE_NAMES.manifest, WORLD_MAP_CATALOG_URL, response)
			return value
		})
		.catch(async (cause) => {
			if (!force) {
				const cached = await getCachedResponse(WORLD_MAP_RUNTIME_CACHE_NAMES.manifest, WORLD_MAP_CATALOG_URL)
				if (cached != null)
					return parseWorldMapSnapshotCatalog(await cached.json())
			}
			throw cause
		})
		.then((value) => {
			catalogCache = value
			return value
		})

	if (!force)
		catalogRequest = request
	try {
		return await request
	}
	finally {
		if (catalogRequest === request)
			catalogRequest = null
	}
}

export async function fetchWorldMapManifest(
	snapshotId: WorldMapSnapshotId,
	force = false,
	signal?: AbortSignal,
): Promise<WorldMapManifest> {
	if (!force) {
		const cached = manifestCache.get(snapshotId)
		if (cached != null)
			return cached
		const pending = manifestRequests.get(snapshotId)
		if (pending != null)
			return pending
	}

	const url = getWorldMapManifestUrl(snapshotId)
	const requestGeneration = (manifestRequestGenerations.get(snapshotId) ?? 0) + 1
	manifestRequestGenerations.set(snapshotId, requestGeneration)
	const assertCurrentRequest = () => {
		if (manifestRequestGenerations.get(snapshotId) !== requestGeneration)
			throw new DOMException('World map manifest request was superseded.', 'AbortError')
	}
	const request = fetch(url, { signal, cache: force ? 'no-cache' : 'default' })
		.then(async (response) => {
			if (!response.ok)
				throw new Error(`World map manifest request failed with ${response.status}.`)
			const value = parseWorldMapManifest(await response.clone()
				.json())
			assertCurrentRequest()
			return value
		})
		.catch(async (cause) => {
			if (cause instanceof DOMException && cause.name === 'AbortError')
				throw cause
			if (!force) {
				const value = await getCachedWorldMapManifest(snapshotId, url)
				if (value != null) {
					assertCurrentRequest()
					return value
				}
			}
			throw cause
		})
		.then((value) => {
			assertCurrentRequest()
			manifestCache.set(snapshotId, value)
			return value
		})

	if (!force)
		manifestRequests.set(snapshotId, request)
	try {
		return await request
	}
	finally {
		if (manifestRequests.get(snapshotId) === request)
			manifestRequests.delete(snapshotId)
	}
}

async function fetchWorldMapNode(
	snapshotId: WorldMapSnapshotId,
	manifest: WorldMapManifest,
	worldMapId: string,
	force = false,
): Promise<WorldMapNode> {
	const manifestNode = getManifestNode(manifest, worldMapId)
	if (manifestNode == null)
		throw new Error(`World map node "${worldMapId}" is not listed in the ${snapshotId} manifest.`)

	const key = nodeCacheKey(snapshotId, manifest, worldMapId)
	if (!force) {
		const cached = nodeCache.get(key)
		if (cached != null)
			return cached
		const pending = nodeRequests.get(key)
		if (pending != null)
			return pending
	}

	const url = getWorldMapNodeResourceUrl(snapshotId, manifestNode, manifest.cacheKey)
	const request = fetch(url, { cache: force ? 'no-cache' : 'default' })
		.then(async (response) => {
			if (!response.ok)
				throw new Error(`World map node request failed with ${response.status}.`)
			const node = parseWorldMapNodeChunk(await response.clone()
				.json())
			if (node.worldMapId !== worldMapId)
				throw new Error(`World map node response was "${node.worldMapId}", expected "${worldMapId}".`)
			await cacheResponse(WORLD_MAP_RUNTIME_CACHE_NAMES.nodes, url, response)
			return node
		})
		.catch(async (cause) => {
			if (!force) {
				const cached = await getCachedResponse(WORLD_MAP_RUNTIME_CACHE_NAMES.nodes, url)
				if (cached != null) {
					const node = parseWorldMapNodeChunk(await cached.json())
					if (node.worldMapId === worldMapId)
						return node
				}
			}
			throw cause
		})
		.then((node) => {
			nodeCache.set(key, node)
			return node
		})

	if (!force)
		nodeRequests.set(key, request)
	try {
		return await request
	}
	finally {
		if (nodeRequests.get(key) === request)
			nodeRequests.delete(key)
	}
}

export function useWorldMaps() {
	const catalog = shallowRef<WorldMapSnapshotCatalog | null>(catalogCache)
	const selectedSnapshotId = ref<WorldMapSnapshotId | null>(null)
	const manifest = shallowRef<WorldMapManifest | null>(null)
	const loadedNodes = shallowRef(new Map<string, WorldMapNode>())
	const nodeStates = shallowRef(new Map<string, WorldMapNodeLoadState>())
	const loading = ref(false)
	const error = shallowRef<unknown>(null)
	let generation = 0

	const selectableSnapshots = computed(() => (catalog.value?.entries ?? []).filter(entry => entry.selectable))
	const selectedSnapshot = computed<WorldMapSnapshotCatalogEntry | null>(() => {
		const id = selectedSnapshotId.value
		return id == null ? null : selectableSnapshots.value.find(entry => entry.id === id) ?? null
	})

	function resolveSnapshotId(value: unknown): WorldMapSnapshotId | null {
		const currentCatalog = catalog.value
		if (currentCatalog == null)
			return null
		const requested = typeof value === 'string' ? value : null
		if (requested != null && selectableSnapshots.value.some(entry => entry.id === requested))
			return requested as WorldMapSnapshotId
		return currentCatalog.defaultSnapshot
	}

	function setNodeState(worldMapId: string, state: WorldMapNodeLoadState) {
		nodeStates.value = new Map(nodeStates.value)
		nodeStates.value.set(worldMapId, state)
	}

	function setLoadedNode(node: WorldMapNode) {
		loadedNodes.value = new Map(loadedNodes.value)
		loadedNodes.value.set(node.worldMapId, node)
	}

	async function loadCatalog(force = false) {
		loading.value = true
		error.value = null
		try {
			catalog.value = await fetchWorldMapCatalog(force)
		}
		catch (cause) {
			error.value = cause
			catalog.value = null
		}
		finally {
			loading.value = false
		}
	}

	async function selectSnapshot(snapshotId: WorldMapSnapshotId, force = false) {
		const currentCatalog = catalog.value ?? await fetchWorldMapCatalog()
		catalog.value = currentCatalog
		const entry = currentCatalog.entries.find(candidate => candidate.id === snapshotId && candidate.selectable)
		if (entry == null)
			throw new Error(`World map snapshot "${snapshotId}" is not selectable.`)

		if (!force && selectedSnapshotId.value === snapshotId && manifest.value != null)
			return manifest.value

		const previousSnapshotId = selectedSnapshotId.value
		const currentGeneration = ++generation
		selectedSnapshotId.value = snapshotId
		manifest.value = null
		loadedNodes.value = new Map()
		nodeStates.value = new Map()
		loading.value = true
		error.value = null
		if (previousSnapshotId != null && previousSnapshotId !== snapshotId)
			clearWorldMapSnapshotMemoryCache(previousSnapshotId)

		try {
			const nextManifest = await fetchWorldMapManifest(snapshotId, force)
			if (generation === currentGeneration && selectedSnapshotId.value === snapshotId)
				manifest.value = nextManifest
			return nextManifest
		}
		catch (cause) {
			if (generation === currentGeneration && selectedSnapshotId.value === snapshotId) {
				error.value = cause
				manifest.value = null
			}
			throw cause
		}
		finally {
			if (generation === currentGeneration && selectedSnapshotId.value === snapshotId)
				loading.value = false
		}
	}

	async function loadNode(worldMapId: string, force = false): Promise<WorldMapNode> {
		const snapshotId = selectedSnapshotId.value
		const currentManifest = manifest.value
		if (snapshotId == null || currentManifest == null)
			throw new Error('World map snapshot manifest is not loaded.')
		const currentGeneration = generation
		if (getManifestNode(currentManifest, worldMapId) == null)
			throw new Error(`World map node "${worldMapId}" is not listed in the manifest.`)

		setNodeState(worldMapId, { status: 'loading' })
		try {
			const node = await fetchWorldMapNode(snapshotId, currentManifest, worldMapId, force)
			if (generation === currentGeneration && selectedSnapshotId.value === snapshotId && manifest.value?.cacheKey === currentManifest.cacheKey) {
				setLoadedNode(node)
				setNodeState(worldMapId, { status: 'loaded' })
			}
			return node
		}
		catch (cause) {
			if (generation === currentGeneration && selectedSnapshotId.value === snapshotId)
				setNodeState(worldMapId, { status: 'error', error: cause })
			throw cause
		}
	}

	function getNodeState(worldMapId: string): WorldMapNodeLoadState {
		return nodeStates.value.get(worldMapId) ?? { status: 'idle' }
	}

	onMounted(() => {
		if (catalog.value == null)
			void loadCatalog()
	})

	return {
		catalog,
		selectableSnapshots,
		selectedSnapshotId,
		selectedSnapshot,
		manifest,
		loadedNodes,
		nodeStates,
		loading,
		error,
		loadCatalog,
		resolveSnapshotId,
		selectSnapshot,
		loadNode,
		reload: async () => {
			if (selectedSnapshotId.value != null)
				return selectSnapshot(selectedSnapshotId.value, true)
			return loadCatalog(true)
		},
		retryNode: (worldMapId: string) => loadNode(worldMapId, true),
		getNodeState,
	}
}

function getBrowserLocales(): string[] {
	const locales = navigator.languages?.filter(Boolean) ?? []
	if (locales.length > 0)
		return locales
	return navigator.language ? [navigator.language] : []
}

export function getPreferredWorldMapName(
	canonicalName: string | null,
	localizedNames: Record<string, LocalizedWorldMapName>,
	locales: readonly string[] = getBrowserLocales(),
): string | null {
	for (const locale of locales) {
		const name = localizedNames[locale]?.name
		if (name != null && name.trim().length > 0)
			return name
	}

	const localeLanguages = new Set(locales
		.map(locale => locale.split('-')[0]?.toLowerCase())
		.filter((language): language is string => Boolean(language)))
	for (const language of localeLanguages) {
		const candidates = Object.entries(localizedNames)
			.filter(([locale, value]) => locale.split('-')[0]?.toLowerCase() === language && value.name != null && value.name.trim().length > 0)
		if (candidates.length === 1)
			return candidates[0]![1].name!
	}

	return canonicalName
}

export function getWorldMapNameRows(
	canonicalName: string | null,
	localizedNames: Record<string, LocalizedWorldMapName>,
): WorldMapNameRow[] {
	const rows: WorldMapNameRow[] = []
	if (canonicalName != null && canonicalName.trim().length > 0)
		rows.push({ region: 'GMS', name: canonicalName })

	for (const [locale, region] of [['ko-KR', 'KMS'], ['ja-JP', 'JMS'], ['zh-CN', 'CMS'], ['zh-TW', 'TWMS'], ['en-SG', 'SEA']] as const) {
		const name = localizedNames[locale]?.name
		if (name != null && name.trim().length > 0)
			rows.push({ region, name })
	}
	return rows
}

export function getWorldMapNodeLabel(node: WorldMapNodeSummary): string {
	return getPreferredWorldMapName(node.canonicalLabel, node.localizedNames ?? {})
		?? node.canonicalLabel
		?? node.worldMapName
}

export function getWorldMapGmsNodeLabel(node: WorldMapNodeSummary): string {
	const canonicalLabel = node.canonicalLabel?.trim()
	if (canonicalLabel)
		return canonicalLabel

	const enUsName = node.localizedNames?.['en-US']?.name?.trim()
	if (enUsName)
		return enUsName

	return node.worldMapName
}

export function getWorldMapNodeById(nodes: readonly WorldMapNodeSummary[] | null, worldMapId: string | null): WorldMapNodeSummary | null {
	if (nodes == null || worldMapId == null)
		return null
	return nodes.find(node => node.worldMapId === worldMapId) ?? null
}

export function getWorldMapBreadcrumb(nodes: readonly WorldMapNodeSummary[], worldMapId: string): WorldMapNodeSummary[] {
	const byId = new Map(nodes.map(node => [node.worldMapId, node]))
	const result: WorldMapNodeSummary[] = []
	const visited = new Set<string>()
	let current = byId.get(worldMapId)
	while (current != null && !visited.has(current.worldMapId)) {
		visited.add(current.worldMapId)
		result.unshift(current)
		current = current.parentWorldMapId == null ? undefined : byId.get(current.parentWorldMapId)
	}
	return result
}

export function getWorldMapSpotRepresentative(spot: WorldMapGraphSpot): WorldMapGraphMap | null {
	if (spot.maps.length === 0)
		return null

	const byId = new Map(spot.maps.map(map => [map.mapId, map]))
	const nativeOrder = spot.mapNumbers.map(mapId => byId.get(mapId))
		.filter((map): map is WorldMapGraphMap => map != null)
	const candidates = nativeOrder.length > 0 ? nativeOrder : spot.maps
	return candidates.find(map => map.selection.trackId != null)
		?? candidates.find(map => map.name != null && map.name.trim().length > 0)
		?? candidates[0]
		?? null
}
