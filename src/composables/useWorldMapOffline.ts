import type { WorldMapManifest, WorldMapSnapshotId } from '@/schemas'
import {
	fetchWorldMapManifest,
	getWorldMapNodeAssetUrls,
	getWorldMapNodeResourceUrl,
} from '@/composables/useWorldMaps'
import {
	getWorldMapManifestUrl,
	getWorldMapSnapshotBase,
	withWorldMapCacheKey,
	WORLD_MAP_CACHE_KEY_QUERY,
	WORLD_MAP_CANONICAL_SCHEMA_VERSION,
	WORLD_MAP_RUNTIME_CACHE_NAMES,
	WORLD_MAP_RUNTIME_CONTRACT_ID,
	WORLD_MAP_RUNTIME_SCHEMA_VERSION,
} from '@/constants/worldMapRuntime'
import { parseWorldMapManifest, parseWorldMapNodeChunk } from '@/schemas'

const WORLD_MAP_OFFLINE_METADATA_PREFIX = 'maple-pod.world-map-offline'
const OFFLINE_METADATA_VERSION = 1
const WORLD_MAP_OFFLINE_ENTRY_PREFIX = `${WORLD_MAP_OFFLINE_METADATA_PREFIX}.${WORLD_MAP_RUNTIME_CONTRACT_ID}.metadata-v${OFFLINE_METADATA_VERSION}.snapshot.`
const DOWNLOAD_CONCURRENCY = 4

export type WorldMapOfflineStatus = 'idle' | 'downloading' | 'ready' | 'error'

export interface WorldMapOfflineProgress {
	phase: 'nodes' | 'images'
	completed: number
	total: number
	resourceCount: number
}

export interface WorldMapOfflineEntry {
	snapshotId: WorldMapSnapshotId
	cacheKey: string
	runtimeSchemaVersion: typeof WORLD_MAP_RUNTIME_SCHEMA_VERSION
	canonicalSchemaVersion: typeof WORLD_MAP_CANONICAL_SCHEMA_VERSION
	status: 'partial' | 'ready'
	updatedAt: number
}

interface DownloadErrorState {
	snapshotId: WorldMapSnapshotId
	cacheKey: string | null
	cause: unknown
}

const selectedSnapshotId = ref<WorldMapSnapshotId | null>(null)
const manifest = shallowRef<WorldMapManifest | null>(null)
const entriesBySnapshot = shallowRef<Record<string, WorldMapOfflineEntry>>(readRegistry())
const activeDownloadSnapshotId = ref<WorldMapSnapshotId | null>(null)
const activeDownloadCacheKey = ref<string | null>(null)
const activeDownloadProgress = shallowRef<WorldMapOfflineProgress | null>(null)
const downloadError = shallowRef<DownloadErrorState | null>(null)
const verifiedCacheKeys = shallowRef<Record<string, string>>({})
const manifestSyncGenerations = new Map<WorldMapSnapshotId, number>()
const fallbackSnapshotLocks = new Map<string, Promise<void>>()
let initializeRequest: Promise<void> | null = null
let downloadRequest: Promise<void> | null = null
let downloadController: AbortController | null = null
let generation = 0
let storageListenerInstalled = false

function isSnapshotId(value: unknown): value is WorldMapSnapshotId {
	return typeof value === 'string' && /^(?:GMS|TWMS)\/[^/]+$/.test(value)
}

function isOfflineEntry(value: unknown): value is WorldMapOfflineEntry {
	return value != null
		&& typeof value === 'object'
		&& !Array.isArray(value)
		&& 'snapshotId' in value && isSnapshotId(value.snapshotId)
		&& 'cacheKey' in value && typeof value.cacheKey === 'string'
		&& 'runtimeSchemaVersion' in value && value.runtimeSchemaVersion === WORLD_MAP_RUNTIME_SCHEMA_VERSION
		&& 'canonicalSchemaVersion' in value && value.canonicalSchemaVersion === WORLD_MAP_CANONICAL_SCHEMA_VERSION
		&& 'status' in value && (value.status === 'partial' || value.status === 'ready')
		&& 'updatedAt' in value && typeof value.updatedAt === 'number'
}

function entryStorageKey(snapshotId: WorldMapSnapshotId): string {
	return `${WORLD_MAP_OFFLINE_ENTRY_PREFIX}${encodeURIComponent(snapshotId)}`
}

function readRegistry(): Record<string, WorldMapOfflineEntry> {
	const result: Record<string, WorldMapOfflineEntry> = {}
	try {
		for (let index = 0; index < localStorage.length; index++) {
			const key = localStorage.key(index)
			if (key == null || !key.startsWith(WORLD_MAP_OFFLINE_ENTRY_PREFIX))
				continue
			const encodedSnapshotId = key.slice(WORLD_MAP_OFFLINE_ENTRY_PREFIX.length)
			let snapshotId: string
			try {
				snapshotId = decodeURIComponent(encodedSnapshotId)
			}
			catch {
				continue
			}
			if (!isSnapshotId(snapshotId))
				continue
			const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
			if (isOfflineEntry(value) && value.snapshotId === snapshotId)
				result[snapshotId] = value
		}
	}
	catch {
		// Unavailable or malformed storage does not make cached resources ready.
	}
	return result
}

function refreshEntriesFromStorage(): void {
	entriesBySnapshot.value = readRegistry()
}

function persistEntry(entry: WorldMapOfflineEntry): void {
	try {
		localStorage.setItem(entryStorageKey(entry.snapshotId), JSON.stringify(entry))
	}
	catch {
		// Cache Storage may still work for the current session, but offline readiness
		// cannot be restored after reload when metadata persistence is unavailable.
	}
}

function setEntry(entry: WorldMapOfflineEntry): void {
	entriesBySnapshot.value = {
		...entriesBySnapshot.value,
		[entry.snapshotId]: entry,
	}
	persistEntry(entry)
}

function deleteEntry(snapshotId: WorldMapSnapshotId): void {
	if (entriesBySnapshot.value[snapshotId] != null) {
		const next = { ...entriesBySnapshot.value }
		delete next[snapshotId]
		entriesBySnapshot.value = next
	}
	try {
		localStorage.removeItem(entryStorageKey(snapshotId))
	}
	catch {
		// Storage cleanup is best-effort when localStorage is unavailable.
	}
}

function getEntry(snapshotId: WorldMapSnapshotId): WorldMapOfflineEntry | null {
	return entriesBySnapshot.value[snapshotId] ?? null
}

function readStoredEntry(snapshotId: WorldMapSnapshotId): WorldMapOfflineEntry | null {
	try {
		const value: unknown = JSON.parse(localStorage.getItem(entryStorageKey(snapshotId)) ?? 'null')
		return isOfflineEntry(value) && value.snapshotId === snapshotId ? value : null
	}
	catch {
		return null
	}
}

async function withSnapshotLock<T>(snapshotId: WorldMapSnapshotId, task: () => Promise<T>): Promise<T> {
	const name = `maple-pod.world-map-offline.${WORLD_MAP_RUNTIME_CONTRACT_ID}.snapshot.${snapshotId}`
	if (typeof navigator !== 'undefined' && navigator.locks != null)
		return navigator.locks.request(name, task)

	const previous = fallbackSnapshotLocks.get(name)
		?.catch(() => undefined) ?? Promise.resolve()
	let release!: () => void
	const gate = new Promise<void>((resolve) => {
		release = resolve
	})
	const queued = previous.then(() => gate)
	fallbackSnapshotLocks.set(name, queued)
	await previous
	try {
		return await task()
	}
	finally {
		release()
		if (fallbackSnapshotLocks.get(name) === queued)
			fallbackSnapshotLocks.delete(name)
	}
}

function markVerified(snapshotId: WorldMapSnapshotId, cacheKey: string): void {
	verifiedCacheKeys.value = {
		...verifiedCacheKeys.value,
		[snapshotId]: cacheKey,
	}
}

function clearVerified(snapshotId: WorldMapSnapshotId): void {
	if (verifiedCacheKeys.value[snapshotId] == null)
		return
	const next = { ...verifiedCacheKeys.value }
	delete next[snapshotId]
	verifiedCacheKeys.value = next
}

function isEntryVerified(entry: WorldMapOfflineEntry | null): boolean {
	return entry != null
		&& entry.status === 'ready'
		&& verifiedCacheKeys.value[entry.snapshotId] === entry.cacheKey
}

function installStorageListener(): void {
	if (storageListenerInstalled || typeof window === 'undefined')
		return
	storageListenerInstalled = true
	window.addEventListener('storage', (event) => {
		if (event.key != null && !event.key.startsWith(WORLD_MAP_OFFLINE_METADATA_PREFIX))
			return
		refreshEntriesFromStorage()
		verifiedCacheKeys.value = {}
		void verifyStoredReadyEntries()
	})
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

function isOlderContractGeneration(runtimeVersion: number, canonicalVersion: number | null): boolean {
	if (runtimeVersion !== WORLD_MAP_RUNTIME_SCHEMA_VERSION)
		return runtimeVersion < WORLD_MAP_RUNTIME_SCHEMA_VERSION
	return canonicalVersion == null || canonicalVersion < WORLD_MAP_CANONICAL_SCHEMA_VERSION
}

function shouldDeleteObsoleteCache(cacheName: string): boolean {
	if (Object.values(WORLD_MAP_RUNTIME_CACHE_NAMES)
		.includes(cacheName as typeof WORLD_MAP_RUNTIME_CACHE_NAMES[keyof typeof WORLD_MAP_RUNTIME_CACHE_NAMES])) {
		return false
	}

	const versioned = /^maple-pod-world-map-runtime-v(\d+)-canonical-v(\d+)-/.exec(cacheName)
	if (versioned != null)
		return isOlderContractGeneration(Number(versioned[1]), Number(versioned[2]))

	const runtimeOnly = /^maple-pod-world-map-runtime-v(\d+)-/.exec(cacheName)
	if (runtimeOnly != null)
		return isOlderContractGeneration(Number(runtimeOnly[1]), null)

	return cacheName === 'maple-pod-world-map-manifest-cache'
		|| cacheName === 'maple-pod-world-map-nodes-cache'
		|| cacheName === 'maple-pod-world-map-images-cache'
}

function shouldDeleteObsoleteMetadata(key: string): boolean {
	if (!key.startsWith(WORLD_MAP_OFFLINE_METADATA_PREFIX))
		return false
	if (key.startsWith(WORLD_MAP_OFFLINE_ENTRY_PREFIX))
		return false
	if (key === WORLD_MAP_OFFLINE_METADATA_PREFIX)
		return true

	const versioned = /^maple-pod\.world-map-offline\.runtime-v(\d+)-canonical-v(\d+)(?:\.|$)/.exec(key)
	if (versioned != null) {
		const runtimeVersion = Number(versioned[1])
		const canonicalVersion = Number(versioned[2])
		if (runtimeVersion === WORLD_MAP_RUNTIME_SCHEMA_VERSION && canonicalVersion === WORLD_MAP_CANONICAL_SCHEMA_VERSION)
			return true
		return isOlderContractGeneration(runtimeVersion, canonicalVersion)
	}

	const runtimeOnly = /^maple-pod\.world-map-offline\.runtime-v(\d+)(?:\.|$)/.exec(key)
	return runtimeOnly != null && isOlderContractGeneration(Number(runtimeOnly[1]), null)
}

async function cleanupObsoleteSchemaStorage(): Promise<void> {
	if (typeof caches !== 'undefined') {
		const cacheNames = await caches.keys()
		await Promise.all(cacheNames.map(cacheName => shouldDeleteObsoleteCache(cacheName)
			? caches.delete(cacheName)
			: Promise.resolve(false)))
	}
	try {
		const keys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
		for (const key of keys) {
			if (key != null && shouldDeleteObsoleteMetadata(key))
				localStorage.removeItem(key)
		}
	}
	catch {
		// Legacy/schema-incompatible metadata cleanup is best-effort when storage is unavailable.
	}
}

async function deleteSnapshotEntriesFromCache(
	cacheName: string,
	snapshotId: WorldMapSnapshotId,
	keepCacheKey?: string,
	shouldContinue: () => boolean = () => true,
): Promise<void> {
	const cache = await caches.open(cacheName)
	const snapshotPrefix = `${getWorldMapSnapshotBase(snapshotId)}/`
	const requests = await cache.keys()
	await Promise.all(requests.map((request) => {
		if (!shouldContinue())
			return Promise.resolve(false)
		const url = new URL(request.url)
		if (!url.pathname.startsWith(snapshotPrefix))
			return Promise.resolve(false)
		if (keepCacheKey != null && url.searchParams.get(WORLD_MAP_CACHE_KEY_QUERY) === keepCacheKey)
			return Promise.resolve(false)
		return cache.delete(request)
	}))
}

async function pruneSnapshotRevision(
	snapshotId: WorldMapSnapshotId,
	keepCacheKey: string,
	shouldContinue: () => boolean = () => true,
): Promise<void> {
	if (typeof caches === 'undefined')
		return
	await Promise.all([
		deleteSnapshotEntriesFromCache(WORLD_MAP_RUNTIME_CACHE_NAMES.manifest, snapshotId, keepCacheKey, shouldContinue),
		deleteSnapshotEntriesFromCache(WORLD_MAP_RUNTIME_CACHE_NAMES.nodes, snapshotId, keepCacheKey, shouldContinue),
		deleteSnapshotEntriesFromCache(WORLD_MAP_RUNTIME_CACHE_NAMES.images, snapshotId, keepCacheKey, shouldContinue),
	])
}

async function removeSnapshotCaches(snapshotId: WorldMapSnapshotId): Promise<void> {
	assertCacheStorage()
	await Promise.all([
		deleteSnapshotEntriesFromCache(WORLD_MAP_RUNTIME_CACHE_NAMES.manifest, snapshotId),
		deleteSnapshotEntriesFromCache(WORLD_MAP_RUNTIME_CACHE_NAMES.nodes, snapshotId),
		deleteSnapshotEntriesFromCache(WORLD_MAP_RUNTIME_CACHE_NAMES.images, snapshotId),
	])
}

async function verifyReadyEntry(entry: WorldMapOfflineEntry): Promise<boolean> {
	if (entry.status !== 'ready' || typeof caches === 'undefined')
		return false
	try {
		const manifestCache = await caches.open(WORLD_MAP_RUNTIME_CACHE_NAMES.manifest)
		const nodeCache = await caches.open(WORLD_MAP_RUNTIME_CACHE_NAMES.nodes)
		const imageCache = await caches.open(WORLD_MAP_RUNTIME_CACHE_NAMES.images)
		const manifestResponse = await manifestCache.match(withWorldMapCacheKey(getWorldMapManifestUrl(entry.snapshotId), entry.cacheKey))
		if (manifestResponse == null)
			return false
		const cachedManifest = parseWorldMapManifest(await manifestResponse.clone()
			.json())
		if (cachedManifest.cacheKey !== entry.cacheKey)
			return false

		const assetUrls = new Set<string>()
		const nodes = await Promise.all(cachedManifest.nodes.map(async (manifestNode) => {
			const nodeUrl = getWorldMapNodeResourceUrl(entry.snapshotId, manifestNode, entry.cacheKey)
			const response = await nodeCache.match(nodeUrl)
			if (response == null)
				return null
			const node = parseWorldMapNodeChunk(await response.clone()
				.json())
			if (node.worldMapId !== manifestNode.worldMapId)
				return null
			return node
		}))
		if (nodes.some(node => node == null))
			return false
		for (const node of nodes) {
			for (const assetUrl of getWorldMapNodeAssetUrls(node!, entry.cacheKey))
				assetUrls.add(assetUrl)
		}
		const images = await Promise.all([...assetUrls].map(url => imageCache.match(url)))
		return images.every(response => response != null)
	}
	catch {
		return false
	}
}

async function verifyStoredReadyEntries(): Promise<void> {
	const snapshotIds = Object.values(entriesBySnapshot.value)
		.map(entry => entry.snapshotId)
	for (const snapshotId of snapshotIds) {
		await withSnapshotLock(snapshotId, async () => {
			const entry = readStoredEntry(snapshotId)
			if (entry == null || entry.status !== 'ready') {
				clearVerified(snapshotId)
				return
			}

			const valid = await verifyReadyEntry(entry)
			const current = readStoredEntry(snapshotId)
			if (current?.cacheKey !== entry.cacheKey || current.status !== 'ready')
				return
			if (valid) {
				markVerified(snapshotId, entry.cacheKey)
				return
			}

			clearVerified(snapshotId)
			await removeSnapshotCaches(snapshotId)
			setEntry({ ...entry, status: 'partial', updatedAt: Date.now() })
		})
	}
	refreshEntriesFromStorage()
}

async function cacheManifestForOffline(snapshotId: WorldMapSnapshotId, nextManifest: WorldMapManifest): Promise<void> {
	assertCacheStorage()
	const cache = await caches.open(WORLD_MAP_RUNTIME_CACHE_NAMES.manifest)
	await cache.put(withWorldMapCacheKey(getWorldMapManifestUrl(snapshotId), nextManifest.cacheKey), new Response(JSON.stringify(nextManifest), {
		headers: { 'content-type': 'application/json' },
	}))
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

function downloadMatches(snapshotId: WorldMapSnapshotId, cacheKey: string): boolean {
	return downloadRequest != null
		&& activeDownloadSnapshotId.value === snapshotId
		&& activeDownloadCacheKey.value === cacheKey
}

function syncSnapshot(snapshotId: WorldMapSnapshotId): void {
	if (selectedSnapshotId.value === snapshotId)
		return
	selectedSnapshotId.value = snapshotId
	manifest.value = null
	downloadError.value = null
}

async function syncManifest(snapshotId: WorldMapSnapshotId, nextManifest: WorldMapManifest): Promise<void> {
	if (selectedSnapshotId.value !== snapshotId)
		syncSnapshot(snapshotId)

	const syncGeneration = (manifestSyncGenerations.get(snapshotId) ?? 0) + 1
	manifestSyncGenerations.set(snapshotId, syncGeneration)
	const isCurrentSync = () => manifestSyncGenerations.get(snapshotId) === syncGeneration

	if (
		downloadRequest != null
		&& activeDownloadSnapshotId.value === snapshotId
		&& activeDownloadCacheKey.value != null
		&& activeDownloadCacheKey.value !== nextManifest.cacheKey
	) {
		generation++
		downloadController?.abort()
		await downloadRequest.catch(() => null)
		if (!isCurrentSync())
			return
	}

	await withSnapshotLock(snapshotId, async () => {
		if (!isCurrentSync())
			return

		const stored = readStoredEntry(snapshotId)
		if (stored != null && stored.cacheKey !== nextManifest.cacheKey) {
			clearVerified(snapshotId)
			deleteEntry(snapshotId)
		}

		await pruneSnapshotRevision(snapshotId, nextManifest.cacheKey, isCurrentSync)
		if (!isCurrentSync())
			return

		try {
			await cacheManifestForOffline(snapshotId, nextManifest)
		}
		catch {
			// Runtime manifest loading remains usable even if Cache Storage is unavailable.
		}
		if (!isCurrentSync())
			return

		if (selectedSnapshotId.value === snapshotId)
			manifest.value = nextManifest
		if (downloadError.value?.snapshotId === snapshotId && downloadError.value.cacheKey !== nextManifest.cacheKey)
			downloadError.value = null
	})
}

let initialized = false

async function initialize(): Promise<void> {
	if (initialized)
		return
	if (initializeRequest != null)
		return initializeRequest
	initializeRequest = (async () => {
		await cleanupObsoleteSchemaStorage()
		refreshEntriesFromStorage()
		verifiedCacheKeys.value = {}
		await verifyStoredReadyEntries()
		initialized = true
	})()
		.finally(() => {
			initializeRequest = null
		})
	return initializeRequest
}

async function downloadSnapshot(snapshotId: WorldMapSnapshotId): Promise<void> {
	await initialize()

	if (downloadRequest != null) {
		if (activeDownloadSnapshotId.value === snapshotId)
			return downloadRequest
		generation++
		downloadController?.abort()
		await downloadRequest.catch(() => null)
	}

	manifestSyncGenerations.set(snapshotId, (manifestSyncGenerations.get(snapshotId) ?? 0) + 1)
	downloadController = new AbortController()
	const signal = downloadController.signal
	const currentGeneration = ++generation
	activeDownloadSnapshotId.value = snapshotId
	activeDownloadCacheKey.value = null
	activeDownloadProgress.value = null
	downloadError.value = null

	const request = withSnapshotLock(snapshotId, async () => {
		assertCacheStorage()
		signal.throwIfAborted()
		const nextManifest = await fetchWorldMapManifest(snapshotId, true, signal)
		activeDownloadCacheKey.value = nextManifest.cacheKey
		signal.throwIfAborted()

		if (selectedSnapshotId.value === snapshotId) {
			const currentManifest = manifest.value
			if (currentManifest != null && currentManifest.cacheKey !== nextManifest.cacheKey)
				throw new DOMException('World map manifest changed while preparing the download.', 'AbortError')
			manifest.value = nextManifest
		}

		const stored = readStoredEntry(snapshotId)
		if (stored != null && stored.cacheKey !== nextManifest.cacheKey)
			deleteEntry(snapshotId)
		clearVerified(snapshotId)
		await pruneSnapshotRevision(snapshotId, nextManifest.cacheKey)
		signal.throwIfAborted()
		await cacheManifestForOffline(snapshotId, nextManifest)
		setEntry({
			snapshotId,
			cacheKey: nextManifest.cacheKey,
			runtimeSchemaVersion: WORLD_MAP_RUNTIME_SCHEMA_VERSION,
			canonicalSchemaVersion: WORLD_MAP_CANONICAL_SCHEMA_VERSION,
			status: 'partial',
			updatedAt: Date.now(),
		})

		const nodeCache = await caches.open(WORLD_MAP_RUNTIME_CACHE_NAMES.nodes)
		const imageCache = await caches.open(WORLD_MAP_RUNTIME_CACHE_NAMES.images)
		const assetUrls = new Set<string>()
		let completedNodes = 0
		activeDownloadProgress.value = {
			phase: 'nodes',
			completed: 0,
			total: nextManifest.nodes.length,
			resourceCount: nextManifest.nodes.length,
		}

		await runWithConcurrency(nextManifest.nodes, async (manifestNode) => {
			const response = await cachedOrFetched(
				nodeCache,
				getWorldMapNodeResourceUrl(snapshotId, manifestNode, nextManifest.cacheKey),
				signal,
			)
			const chunk = parseWorldMapNodeChunk(await response.clone()
				.json())
			if (chunk.worldMapId !== manifestNode.worldMapId)
				throw new Error(`World map node response was "${chunk.worldMapId}", expected "${manifestNode.worldMapId}".`)
			for (const assetUrl of getWorldMapNodeAssetUrls(chunk, nextManifest.cacheKey))
				assetUrls.add(assetUrl)
			completedNodes++
			if (generation === currentGeneration && downloadMatches(snapshotId, nextManifest.cacheKey)) {
				activeDownloadProgress.value = {
					phase: 'nodes',
					completed: completedNodes,
					total: nextManifest.nodes.length,
					resourceCount: nextManifest.nodes.length,
				}
			}
		}, signal)

		const imageUrls = [...assetUrls]
		let completedImages = 0
		if (generation === currentGeneration && downloadMatches(snapshotId, nextManifest.cacheKey)) {
			activeDownloadProgress.value = {
				phase: 'images',
				completed: nextManifest.nodes.length,
				total: nextManifest.nodes.length + imageUrls.length,
				resourceCount: nextManifest.nodes.length + imageUrls.length,
			}
		}
		await runWithConcurrency(imageUrls, async (url) => {
			await cachedOrFetched(imageCache, url, signal)
			completedImages++
			if (generation === currentGeneration && downloadMatches(snapshotId, nextManifest.cacheKey)) {
				activeDownloadProgress.value = {
					phase: 'images',
					completed: nextManifest.nodes.length + completedImages,
					total: nextManifest.nodes.length + imageUrls.length,
					resourceCount: nextManifest.nodes.length + imageUrls.length,
				}
			}
		}, signal)

		if (
			generation !== currentGeneration
			|| !downloadMatches(snapshotId, nextManifest.cacheKey)
			|| (selectedSnapshotId.value === snapshotId && manifest.value?.cacheKey !== nextManifest.cacheKey)
		) {
			throw new DOMException('World map download was superseded.', 'AbortError')
		}

		markVerified(snapshotId, nextManifest.cacheKey)
		setEntry({
			snapshotId,
			cacheKey: nextManifest.cacheKey,
			runtimeSchemaVersion: WORLD_MAP_RUNTIME_SCHEMA_VERSION,
			canonicalSchemaVersion: WORLD_MAP_CANONICAL_SCHEMA_VERSION,
			status: 'ready',
			updatedAt: Date.now(),
		})
	})

	downloadRequest = request
	try {
		await request
	}
	catch (cause) {
		if (!isAbortError(cause)) {
			downloadError.value = {
				snapshotId,
				cacheKey: activeDownloadCacheKey.value,
				cause,
			}
		}
	}
	finally {
		if (downloadRequest === request) {
			downloadRequest = null
			downloadController = null
			activeDownloadSnapshotId.value = null
			activeDownloadCacheKey.value = null
			activeDownloadProgress.value = null
		}
	}
}

async function downloadAll(): Promise<void> {
	const snapshotId = selectedSnapshotId.value
	if (snapshotId == null)
		return
	return downloadSnapshot(snapshotId)
}

function cancel(): void {
	if (downloadRequest == null)
		return
	generation++
	downloadController?.abort()
}

async function remove(snapshotId = selectedSnapshotId.value): Promise<void> {
	if (snapshotId == null)
		return
	manifestSyncGenerations.set(snapshotId, (manifestSyncGenerations.get(snapshotId) ?? 0) + 1)
	if (activeDownloadSnapshotId.value === snapshotId && downloadRequest != null) {
		cancel()
		await downloadRequest.catch(() => null)
	}
	await withSnapshotLock(snapshotId, async () => {
		await removeSnapshotCaches(snapshotId)
		clearVerified(snapshotId)
		deleteEntry(snapshotId)
	})
	if (downloadError.value?.snapshotId === snapshotId)
		downloadError.value = null
}

const status = computed<WorldMapOfflineStatus>(() => {
	const snapshotId = selectedSnapshotId.value
	const currentManifest = manifest.value
	if (snapshotId == null || currentManifest == null)
		return 'idle'
	if (downloadMatches(snapshotId, currentManifest.cacheKey))
		return 'downloading'
	if (downloadError.value?.snapshotId === snapshotId && (downloadError.value.cacheKey == null || downloadError.value.cacheKey === currentManifest.cacheKey))
		return 'error'
	const stored = getEntry(snapshotId)
	return stored?.cacheKey === currentManifest.cacheKey && isEntryVerified(stored) ? 'ready' : 'idle'
})

const progress = computed(() => {
	const snapshotId = selectedSnapshotId.value
	const currentManifest = manifest.value
	return snapshotId != null
		&& currentManifest != null
		&& downloadMatches(snapshotId, currentManifest.cacheKey)
		? activeDownloadProgress.value
		: null
})

const error = computed(() => {
	const snapshotId = selectedSnapshotId.value
	const currentManifest = manifest.value
	return snapshotId != null
		&& currentManifest != null
		&& downloadError.value?.snapshotId === snapshotId
		&& (downloadError.value.cacheKey == null || downloadError.value.cacheKey === currentManifest.cacheKey)
		? downloadError.value.cause
		: null
})

const isReady = computed(() => status.value === 'ready')
const isDownloading = computed(() => downloadRequest != null)
const offlineSnapshots = computed(() => Object.values(entriesBySnapshot.value)
	.map(entry => isEntryVerified(entry) ? entry : { ...entry, status: 'partial' as const })
	.sort((a, b) => a.snapshotId.localeCompare(b.snapshotId)))

export function useWorldMapOffline() {
	installStorageListener()
	onMounted(() => {
		void initialize()
	})

	return {
		selectedSnapshotId,
		manifest,
		status,
		progress,
		error,
		isReady,
		isDownloading,
		offlineSnapshots,
		activeDownloadSnapshotId,
		activeDownloadProgress,
		setSnapshot: syncSnapshot,
		setManifest: syncManifest,
		downloadAll,
		downloadSnapshot,
		cancel,
		remove,
	}
}
