import type { WorldMapManifest } from '@/schemas'
import {
	fetchWorldMapManifest,
	getWorldMapNodeAssetUrls,
	getWorldMapNodeResourceUrl,
} from '@/composables/useWorldMaps'
import { WORLD_MAP_RUNTIME_CACHE_NAMES } from '@/constants/worldMapRuntime'
import { parseWorldMapNodeChunk } from '@/schemas'

const WORLD_MAP_OFFLINE_METADATA_KEY = 'maple-pod.world-map-offline'
const DOWNLOAD_CONCURRENCY = 4

export type WorldMapOfflineStatus = 'idle' | 'downloading' | 'ready' | 'error'

export interface WorldMapOfflineProgress {
	phase: 'nodes' | 'images'
	completed: number
	total: number
	resourceCount: number
}

interface WorldMapOfflineMetadata {
	cacheKey: string
	status: 'partial' | 'ready'
	updatedAt: number
}

const manifest = shallowRef<WorldMapManifest | null>(null)
const status = ref<WorldMapOfflineStatus>('idle')
const progress = shallowRef<WorldMapOfflineProgress | null>(null)
const error = shallowRef<unknown>(null)
const metadata = shallowRef<WorldMapOfflineMetadata | null>(readMetadata())
let initializeRequest: Promise<void> | null = null
let downloadRequest: Promise<void> | null = null
let downloadController: AbortController | null = null

function readMetadata(): WorldMapOfflineMetadata | null {
	try {
		const value: unknown = JSON.parse(localStorage.getItem(WORLD_MAP_OFFLINE_METADATA_KEY) ?? 'null')
		if (value == null || typeof value !== 'object' || Array.isArray(value))
			return null
		if ('cacheKey' in value && typeof value.cacheKey === 'string' && 'status' in value && (value.status === 'partial' || value.status === 'ready'))
			return value as WorldMapOfflineMetadata
	}
	catch {
		// Storage is optional; Cache Storage remains the source of resource data.
	}
	return null
}

function writeMetadata(value: WorldMapOfflineMetadata | null): void {
	metadata.value = value
	try {
		if (value == null)
			localStorage.removeItem(WORLD_MAP_OFFLINE_METADATA_KEY)
		else
			localStorage.setItem(WORLD_MAP_OFFLINE_METADATA_KEY, JSON.stringify(value))
	}
	catch {
		// A private browsing quota or disabled storage must not break downloads.
	}
}

function assertCacheStorage(): void {
	if (typeof caches === 'undefined')
		throw new Error('Cache Storage is unavailable in this browser.')
}

function isAbortError(cause: unknown): boolean {
	return cause instanceof DOMException && cause.name === 'AbortError'
}

function assertResponse(response: Response, url: string): void {
	if (!response.ok && response.status !== 0)
		throw new Error(`World map resource request failed with ${response.status}: ${url}`)
}

async function clearWorldMapCaches(includeManifest = true): Promise<void> {
	assertCacheStorage()
	const cacheNames = includeManifest
		? Object.values(WORLD_MAP_RUNTIME_CACHE_NAMES)
		: [WORLD_MAP_RUNTIME_CACHE_NAMES.nodes, WORLD_MAP_RUNTIME_CACHE_NAMES.images]
	await Promise.all(cacheNames
		.map(cacheName => caches.delete(cacheName)))
}

async function cachedOrFetched(cache: Cache, url: string, signal: AbortSignal): Promise<Response> {
	const cached = await cache.match(url)
	if (cached != null) {
		assertResponse(cached, url)
		return cached
	}

	const response = await fetch(url, { signal })
	assertResponse(response, url)
	await cache.put(url, response.clone())
	return response
}

async function runWithConcurrency<T>(items: readonly T[], worker: (item: T) => Promise<void>, signal: AbortSignal): Promise<void> {
	let nextIndex = 0
	const runWorker = async () => {
		while (true) {
			signal.throwIfAborted()
			const index = nextIndex++
			if (index >= items.length)
				return
			await worker(items[index]!)
		}
	}
	await Promise.all(Array.from({ length: Math.min(DOWNLOAD_CONCURRENCY, Math.max(items.length, 1)) }, runWorker))
}

function syncManifest(nextManifest: WorldMapManifest): void {
	manifest.value = nextManifest
	if (downloadRequest != null)
		return

	if (metadata.value?.cacheKey !== nextManifest.cacheKey) {
		if (metadata.value != null)
			writeMetadata(null)
		status.value = 'idle'
		return
	}

	status.value = metadata.value.status === 'ready' ? 'ready' : 'idle'
}

async function initialize(): Promise<void> {
	if (initializeRequest != null)
		return initializeRequest
	initializeRequest = fetchWorldMapManifest()
		.then(syncManifest)
		.catch((cause) => {
			status.value = 'error'
			error.value = cause
		})
		.finally(() => {
			initializeRequest = null
		})
	return initializeRequest
}

async function downloadAll(): Promise<void> {
	if (downloadRequest != null || status.value === 'ready')
		return downloadRequest ?? Promise.resolve()

	downloadController = new AbortController()
	const signal = downloadController.signal
	const request = (async () => {
		status.value = 'downloading'
		error.value = null
		progress.value = null
		assertCacheStorage()

		const nextManifest = await fetchWorldMapManifest(true, signal)
		syncManifest(nextManifest)
		if (metadata.value?.cacheKey !== nextManifest.cacheKey) {
			await clearWorldMapCaches(false)
			writeMetadata({ cacheKey: nextManifest.cacheKey, status: 'partial', updatedAt: Date.now() })
		}

		const nodeCache = await caches.open(WORLD_MAP_RUNTIME_CACHE_NAMES.nodes)
		const imageCache = await caches.open(WORLD_MAP_RUNTIME_CACHE_NAMES.images)
		const assetUrls = new Set<string>()
		let completedNodes = 0
		progress.value = {
			phase: 'nodes',
			completed: 0,
			total: nextManifest.nodes.length,
			resourceCount: nextManifest.nodes.length,
		}

		await runWithConcurrency(nextManifest.nodes, async (manifestNode) => {
			const response = await cachedOrFetched(nodeCache, getWorldMapNodeResourceUrl(manifestNode), signal)
			const chunk = parseWorldMapNodeChunk(await response.clone()
				.json())
			if (chunk.worldMapId !== manifestNode.worldMapId)
				throw new Error(`World map node response was "${chunk.worldMapId}", expected "${manifestNode.worldMapId}".`)
			for (const assetUrl of getWorldMapNodeAssetUrls(chunk))
				assetUrls.add(assetUrl)
			completedNodes++
			progress.value = {
				phase: 'nodes',
				completed: completedNodes,
				total: nextManifest.nodes.length,
				resourceCount: nextManifest.nodes.length,
			}
		}, signal)

		const imageUrls = [...assetUrls]
		let completedImages = 0
		progress.value = {
			phase: 'images',
			completed: nextManifest.nodes.length,
			total: nextManifest.nodes.length + imageUrls.length,
			resourceCount: nextManifest.nodes.length + imageUrls.length,
		}
		await runWithConcurrency(imageUrls, async (url) => {
			await cachedOrFetched(imageCache, url, signal)
			completedImages++
			progress.value = {
				phase: 'images',
				completed: nextManifest.nodes.length + completedImages,
				total: nextManifest.nodes.length + imageUrls.length,
				resourceCount: nextManifest.nodes.length + imageUrls.length,
			}
		}, signal)

		writeMetadata({ cacheKey: nextManifest.cacheKey, status: 'ready', updatedAt: Date.now() })
		manifest.value = nextManifest
		status.value = 'ready'
		progress.value = {
			phase: 'images',
			completed: nextManifest.nodes.length + imageUrls.length,
			total: nextManifest.nodes.length + imageUrls.length,
			resourceCount: nextManifest.nodes.length + imageUrls.length,
		}
	})()

	downloadRequest = request
	try {
		await request
	}
	catch (cause) {
		if (isAbortError(cause)) {
			status.value = 'idle'
			return
		}
		status.value = 'error'
		error.value = cause
	}
	finally {
		if (downloadRequest === request) {
			downloadRequest = null
			downloadController = null
		}
		if ((status.value as WorldMapOfflineStatus) !== 'ready')
			progress.value = null
	}
}

function cancel(): void {
	downloadController?.abort()
}

async function remove(): Promise<void> {
	cancel()
	await downloadRequest?.catch(() => null)
	await clearWorldMapCaches()
	writeMetadata(null)
	status.value = 'idle'
	progress.value = null
	error.value = null
}

export function useWorldMapOffline() {
	onMounted(() => {
		void initialize()
	})

	return {
		manifest,
		status,
		progress,
		error,
		isReady: computed(() => status.value === 'ready' && metadata.value?.cacheKey === manifest.value?.cacheKey),
		isDownloading: computed(() => status.value === 'downloading'),
		setManifest: syncManifest,
		downloadAll,
		cancel,
		remove,
	}
}
