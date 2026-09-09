import type {
	LocalizedWorldMapName,
	WorldMapGraphMap,
	WorldMapGraphSpot,
	WorldMapManifest,
	WorldMapManifestNode,
	WorldMapNode,
	WorldMapNodeSummary,
} from '@/schemas'
import { ofetch } from 'ofetch'
import {
	WORLD_MAP_MANIFEST_URL,
	WORLD_MAP_RUNTIME_CACHE_NAMES,
} from '@/constants/worldMapRuntime'
import { getWorldMapAssetPath, parseWorldMapManifest, parseWorldMapNodeChunk } from '@/schemas'

export interface WorldMapNameRow {
	region: 'GMS' | 'KMS' | 'JMS' | 'CMS' | 'TWMS' | 'SEA'
	name: string
}

export interface WorldMapNodeLoadState {
	status: 'idle' | 'loading' | 'loaded' | 'error'
	error?: unknown
}

let manifestCache: WorldMapManifest | null = null
let manifestRequest: Promise<WorldMapManifest> | null = null
const nodeCache = new Map<string, WorldMapNode>()
const nodeRequests = new Map<string, Promise<WorldMapNode>>()

function getManifestNode(manifest: WorldMapManifest, worldMapId: string): WorldMapManifestNode | null {
	return manifest.nodes.find(node => node.worldMapId === worldMapId) ?? null
}

export function getWorldMapNodeResourceUrl(node: Pick<WorldMapManifestNode, 'chunk'>): string {
	return getWorldMapAssetPath(`world-map/${node.chunk}`)
}

/** Asset enumeration is intentionally data-only so a future offline action can reuse it. */
export function getWorldMapNodeAssetUrls(node: WorldMapNode): string[] {
	return [...node.baseImages, ...node.links.flatMap(link => link.linkImage == null ? [] : [link.linkImage])]
		.map(asset => getWorldMapAssetPath(asset.file))
}

async function cacheManifestResponse(response: Response): Promise<void> {
	if (typeof caches === 'undefined')
		return
	try {
		const cache = await caches.open(WORLD_MAP_RUNTIME_CACHE_NAMES.manifest)
		await cache.put(WORLD_MAP_MANIFEST_URL, response.clone())
	}
	catch {
		// Cache Storage is an enhancement for normal progressive loading. The
		// explicit offline manager reports cache failures to its caller.
	}
}

export async function fetchWorldMapManifest(force = false, signal?: AbortSignal): Promise<WorldMapManifest> {
	if (!force && manifestCache != null)
		return manifestCache
	if (!force && manifestRequest != null)
		return manifestRequest

	const request = fetch(WORLD_MAP_MANIFEST_URL, { signal, cache: force ? 'no-cache' : 'default' })
		.then(async (response) => {
			if (!response.ok)
				throw new Error(`World map manifest request failed with ${response.status}.`)
			const value = parseWorldMapManifest(await response.clone()
				.json())
			await cacheManifestResponse(response)
			return value
		})
		.then((value) => {
			manifestCache = value
			return value
		})
	manifestRequest = request
	try {
		return await request
	}
	catch (cause) {
		if (!force && typeof caches !== 'undefined') {
			try {
				const cache = await caches.open(WORLD_MAP_RUNTIME_CACHE_NAMES.manifest)
				const cachedResponse = await cache.match(WORLD_MAP_MANIFEST_URL)
				if (cachedResponse != null && cachedResponse.ok) {
					const value = parseWorldMapManifest(await cachedResponse.json())
					manifestCache = value
					return value
				}
			}
			catch {
				// Preserve the original request error when the fallback is unavailable.
			}
		}
		throw cause
	}
	finally {
		if (manifestRequest === request)
			manifestRequest = null
	}
}

export function useWorldMaps() {
	const manifest = shallowRef<WorldMapManifest | null>(manifestCache)
	const loadedNodes = shallowRef(new Map<string, WorldMapNode>())
	const nodeStates = shallowRef(new Map<string, WorldMapNodeLoadState>())
	const loading = ref(false)
	const error = shallowRef<unknown>(null)

	function setNodeState(worldMapId: string, state: WorldMapNodeLoadState) {
		nodeStates.value = new Map(nodeStates.value)
		nodeStates.value.set(worldMapId, state)
	}

	function setLoadedNode(node: WorldMapNode) {
		loadedNodes.value = new Map(loadedNodes.value)
		loadedNodes.value.set(node.worldMapId, node)
	}

	async function load(force = false) {
		loading.value = true
		error.value = null
		try {
			manifest.value = await fetchWorldMapManifest(force)
		}
		catch (cause) {
			error.value = cause
			manifest.value = null
		}
		finally {
			loading.value = false
		}
	}

	async function loadNode(worldMapId: string, force = false): Promise<WorldMapNode> {
		const currentManifest = manifest.value ?? await fetchWorldMapManifest()
		const manifestNode = getManifestNode(currentManifest, worldMapId)
		if (manifestNode == null)
			throw new Error(`World map node "${worldMapId}" is not listed in the manifest.`)

		const cachedNode = nodeCache.get(worldMapId)
		if (!force && cachedNode != null) {
			setLoadedNode(cachedNode)
			setNodeState(worldMapId, { status: 'loaded' })
			return cachedNode
		}
		if (!force && nodeRequests.has(worldMapId))
			return nodeRequests.get(worldMapId)!

		setNodeState(worldMapId, { status: 'loading' })
		const request = ofetch<unknown>(getWorldMapNodeResourceUrl(manifestNode))
			.then(parseWorldMapNodeChunk)
			.then((node) => {
				if (node.worldMapId !== worldMapId)
					throw new Error(`World map node response was "${node.worldMapId}", expected "${worldMapId}".`)
				nodeCache.set(worldMapId, node)
				setLoadedNode(node)
				setNodeState(worldMapId, { status: 'loaded' })
				return node
			})
			.catch((cause) => {
				setNodeState(worldMapId, { status: 'error', error: cause })
				throw cause
			})
		nodeRequests.set(worldMapId, request)
		try {
			return await request
		}
		finally {
			if (nodeRequests.get(worldMapId) === request)
				nodeRequests.delete(worldMapId)
		}
	}

	function getNodeState(worldMapId: string): WorldMapNodeLoadState {
		return nodeStates.value.get(worldMapId) ?? { status: 'idle' }
	}

	onMounted(() => {
		void load()
	})

	return {
		manifest,
		loadedNodes,
		nodeStates,
		loading,
		error,
		load,
		loadNode,
		reload: () => load(true),
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
