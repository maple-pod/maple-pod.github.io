<script setup lang="ts">
import type { UiDropdownMenuItem } from './UiDropdownMenu.vue'
import type { HashActionImportSavedUserData, PortableSavedUserData } from '@/types'
import { safeParse } from 'valibot'
import AboutDialog from '@/components/AboutDialog.vue'
import { PortableSavedUserDataSchema } from '@/schemas'
import { chunkArray } from '@/utils/common'

const appStore = useAppStore()
const { setTheme } = appStore
const { theme, bgData, savedBgImage, currentAutoBgPreview } = storeToRefs(appStore)

const musicStore = useMusicStore()
const { normalizeSavedPlaylists, clearSavedOfflineMusics } = musicStore
const { clearAll: clearAllWorldMapOffline } = useWorldMapOffline()
const {
	exportPortableSavedUserData,
	mergePortableSavedUserData,
	resetSavedData,
} = useSavedDataPortability()

function handleDownloadSavedDataFile() {
	const timeStr = new Date()
		.toISOString()
	exportToJSONFile(exportPortableSavedUserData(), `maple-pod.${timeStr}.json`)
}

const { confirm } = useUiConfirmDialog()

const importSavedDataFileDialog = useFileDialog({
	accept: '.json',
	multiple: false,
	directory: false,
	reset: true,
})
importSavedDataFileDialog.onChange(async (files) => {
	if (files == null || files.length === 0)
		return

	const file = files[0]!
	let data: unknown
	try {
		data = JSON.parse(await file.text())
	}
	catch (cause) {
		console.error('Failed to decode saved user data:', cause)
		return
	}

	const result = safeParse(PortableSavedUserDataSchema, data)
	if (result.success === false) {
		console.error('Failed to parse saved user data:', result.issues)
		return
	}

	const agreed = await confirm({
		title: 'Import Saved Data',
		description: 'Import the validated saved data and merge it with your current Maple Pod data?',
	})
	if (!agreed)
		return

	mergePortableSavedUserData(result.output as PortableSavedUserData)
	normalizeSavedPlaylists()
	window.location.reload()
})

function handleUploadSavedDataFile() {
	importSavedDataFileDialog.open()
}

async function handleResetSavedData() {
	const agreed = await confirm({
		title: 'Reset Saved Data',
		description: 'Reset preferences, playlists, World Map selection, and recent history? Offline data and first-visit state will be preserved.',
	})

	if (!agreed)
		return

	resetSavedData()
	window.location.reload()
}

const FACTORY_RESET_RUNTIME_CACHE_NAMES = new Set([
	'google-fonts-cache',
	'gstatic-fonts-cache',
	'maple-pod-data-cache',
	'maple-pod-loudness-cache',
])

const FACTORY_RESET_QUIESCE_MESSAGE = 'MAPLE_POD_FACTORY_RESET_QUIESCE'
const FACTORY_RESET_QUIESCED_MESSAGE = 'MAPLE_POD_FACTORY_RESET_QUIESCED'
const FACTORY_RESET_QUIESCE_FAILED_MESSAGE = 'MAPLE_POD_FACTORY_RESET_QUIESCE_FAILED'
const FACTORY_RESET_ABORT_MESSAGE = 'MAPLE_POD_FACTORY_RESET_ABORT'
const FACTORY_RESET_ABORTED_MESSAGE = 'MAPLE_POD_FACTORY_RESET_ABORTED'
const FACTORY_RESET_FINALIZE_MESSAGE = 'MAPLE_POD_FACTORY_RESET_FINALIZE'
const FACTORY_RESET_FINALIZED_MESSAGE = 'MAPLE_POD_FACTORY_RESET_FINALIZED'
const FACTORY_RESET_QUIESCE_TIMEOUT_MS = 15_000

async function clearWorkboxExpirationMetadata(cacheNames: string[]) {
	if (typeof indexedDB === 'undefined' || cacheNames.length === 0)
		return

	await new Promise<void>((resolve, reject) => {
		const request = indexedDB.open('workbox-expiration')
		let createdDatabase = false
		request.onupgradeneeded = () => {
			createdDatabase = true
		}
		request.onerror = () => reject(request.error)
		request.onsuccess = () => {
			const database = request.result
			if (createdDatabase || !database.objectStoreNames.contains('cache-entries')) {
				database.close()
				if (!createdDatabase) {
					resolve()
					return
				}
				const deleteRequest = indexedDB.deleteDatabase('workbox-expiration')
				deleteRequest.onsuccess = () => resolve()
				deleteRequest.onerror = () => reject(deleteRequest.error)
				deleteRequest.onblocked = () => reject(new Error('Workbox expiration metadata deletion is blocked by another connection.'))
				return
			}

			const transaction = database.transaction('cache-entries', 'readwrite')
			const cacheNameIndex = transaction.objectStore('cache-entries')
				.index('cacheName')
			for (const cacheName of cacheNames) {
				const cursorRequest = cacheNameIndex.openCursor(IDBKeyRange.only(cacheName))
				cursorRequest.onsuccess = () => {
					const cursor = cursorRequest.result
					if (cursor == null)
						return
					cursor.delete()
					cursor.continue()
				}
				cursorRequest.onerror = () => transaction.abort()
			}
			transaction.oncomplete = () => {
				database.close()
				resolve()
			}
			transaction.onerror = () => {
				database.close()
				reject(transaction.error)
			}
			transaction.onabort = () => {
				database.close()
				reject(transaction.error)
			}
		}
	})
}

function getAppServiceWorkerScope(): string {
	return new URL(import.meta.env.BASE_URL, window.location.origin).href
}

async function requestFactoryResetServiceWorker(
	worker: ServiceWorker,
	messageType: string,
	expectedResponseType: string,
	resetId: string,
): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const channel = new MessageChannel()
		const timeout = window.setTimeout(() => {
			channel.port1.close()
			reject(new Error(`Timed out while waiting for the Maple Pod service worker to handle ${messageType}.`))
		}, FACTORY_RESET_QUIESCE_TIMEOUT_MS)
		const finish = (callback: () => void) => {
			window.clearTimeout(timeout)
			channel.port1.close()
			callback()
		}
		channel.port1.onmessage = (event) => {
			if (event.data?.resetId !== resetId) {
				finish(() => reject(new Error('Maple Pod service worker returned a mismatched Factory Reset response.')))
				return
			}
			if (event.data?.type === FACTORY_RESET_QUIESCE_FAILED_MESSAGE) {
				finish(() => reject(new Error(event.data?.message || 'Maple Pod service worker failed to coordinate Factory Reset.')))
				return
			}
			if (event.data?.type !== expectedResponseType) {
				finish(() => reject(new Error('Maple Pod service worker returned an unexpected Factory Reset response.')))
				return
			}
			finish(resolve)
		}
		channel.port1.onmessageerror = () => {
			finish(() => reject(new Error('Failed to decode the Maple Pod service worker Factory Reset response.')))
		}
		worker.postMessage({ type: messageType, resetId }, [channel.port2])
	})
}

async function waitForServiceWorkerInstallation(worker: ServiceWorker): Promise<void> {
	if (worker.state !== 'installing')
		return

	await new Promise<void>((resolve, reject) => {
		let timeout: number | undefined
		const onStateChange = () => {
			if (worker.state === 'installing')
				return
			if (timeout != null)
				window.clearTimeout(timeout)
			worker.removeEventListener('statechange', onStateChange)
			resolve()
		}
		timeout = window.setTimeout(() => {
			worker.removeEventListener('statechange', onStateChange)
			reject(new Error('Timed out while waiting for the Maple Pod service worker installation to settle.'))
		}, FACTORY_RESET_QUIESCE_TIMEOUT_MS)
		worker.addEventListener('statechange', onStateChange)
		onStateChange()
	})
}

interface FactoryResetServiceWorkerCoordination {
	registrations: ServiceWorkerRegistration[]
	workers: ServiceWorker[]
}

async function quiesceAppServiceWorkers(
	scope: string,
	resetId: string,
): Promise<FactoryResetServiceWorkerCoordination> {
	if (!('serviceWorker' in navigator))
		return { registrations: [], workers: [] }

	const registrations = (await navigator.serviceWorker.getRegistrations())
		.filter(registration => registration.scope === scope)
	const installingWorkers = registrations
		.map(registration => registration.installing)
		.filter((worker): worker is ServiceWorker => worker != null)
	await Promise.all(installingWorkers.map(waitForServiceWorkerInstallation))

	const workers = new Set<ServiceWorker>()
	for (const registration of registrations) {
		if (registration.active != null)
			workers.add(registration.active)
		if (registration.waiting != null)
			workers.add(registration.waiting)
	}

	const workerList = [...workers]
	try {
		await Promise.all(workerList.map(worker => requestFactoryResetServiceWorker(
			worker,
			FACTORY_RESET_QUIESCE_MESSAGE,
			FACTORY_RESET_QUIESCED_MESSAGE,
			resetId,
		)))
	}
	catch (error) {
		await Promise.allSettled(workerList.map(worker => requestFactoryResetServiceWorker(
			worker,
			FACTORY_RESET_ABORT_MESSAGE,
			FACTORY_RESET_ABORTED_MESSAGE,
			resetId,
		)))
		throw error
	}

	return { registrations, workers: workerList }
}

async function abortFactoryResetServiceWorkers(
	coordination: FactoryResetServiceWorkerCoordination,
	resetId: string,
): Promise<void> {
	await Promise.allSettled(coordination.workers
		.filter(worker => worker.state !== 'redundant')
		.map(worker => requestFactoryResetServiceWorker(
			worker,
			FACTORY_RESET_ABORT_MESSAGE,
			FACTORY_RESET_ABORTED_MESSAGE,
			resetId,
		)))
}

async function finalizeFactoryResetServiceWorkers(
	coordination: FactoryResetServiceWorkerCoordination,
	resetId: string,
): Promise<void> {
	const coordinator = coordination.workers.find(worker => worker.state !== 'redundant')
	if (coordinator != null) {
		await requestFactoryResetServiceWorker(
			coordinator,
			FACTORY_RESET_FINALIZE_MESSAGE,
			FACTORY_RESET_FINALIZED_MESSAGE,
			resetId,
		)
		return
	}

	await Promise.all(coordination.registrations.map(async (registration) => {
		if (!await registration.unregister())
			throw new Error(`Failed to unregister Maple Pod service worker for ${registration.scope}.`)
	}))
}

function isOwnedPrecache(cacheName: string, appScope: string): boolean {
	return cacheName.includes('-precache-') && cacheName.includes(appScope)
}

async function clearFactoryResetCaches(appScope: string) {
	if (typeof caches === 'undefined')
		return

	const cacheNames = await caches.keys()
	const ownedCacheNames = cacheNames.filter(cacheName =>
		FACTORY_RESET_RUNTIME_CACHE_NAMES.has(cacheName) || isOwnedPrecache(cacheName, appScope))
	await clearWorkboxExpirationMetadata([...FACTORY_RESET_RUNTIME_CACHE_NAMES])
	const deletionResults = await Promise.all(ownedCacheNames.map(cacheName => caches.delete(cacheName)))
	if (deletionResults.some(deleted => !deleted))
		throw new Error('One or more Maple Pod caches could not be deleted.')
}

async function performFactoryReset(appScope: string) {
	const cleanupResults = await Promise.allSettled([
		clearSavedOfflineMusics(),
		clearAllWorldMapOffline(),
		clearFactoryResetCaches(appScope),
	])
	const failures = cleanupResults
		.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
		.map(result => result.reason)
	if (failures.length > 0)
		throw new AggregateError(failures, 'Factory Reset storage cleanup was incomplete.')

	resetSavedData()
	localStorage.removeItem('maple-pod')
	localStorage.removeItem('firstVisit')
}

async function handleFactoryReset() {
	const agreed = await confirm({
		title: 'Factory Reset',
		description: 'Clear all Maple Pod local state, including saved data, offline music, World Map offline data, and first-visit state?',
	})
	if (!agreed)
		return

	const reset = beginFactoryReset()
	const appScope = getAppServiceWorkerScope()
	let coordination: FactoryResetServiceWorkerCoordination | null = null
	let completed = false
	try {
		while (true) {
			try {
				coordination ??= await quiesceAppServiceWorkers(appScope, reset.resetId)
				await performFactoryReset(appScope)
				await finalizeFactoryResetServiceWorkers(coordination, reset.resetId)
				completed = true
				window.location.reload()
				return
			}
			catch (error) {
				console.error('Factory Reset storage cleanup failed:', error)
				const retry = await confirm({
					title: 'Factory Reset incomplete',
					description: 'Some Maple Pod local data could not be cleared. Retry the cleanup before reloading?',
					confirmText: 'Retry',
					cancelText: 'Close',
				})
				if (!retry)
					return
			}
		}
	}
	finally {
		if (!completed) {
			if (coordination != null)
				await abortFactoryResetServiceWorkers(coordination, reset.resetId)
			reset.end()
		}
	}
}

const { copyLink } = useCopyLink()
async function handleCopySavedDataLink() {
	const data: HashActionImportSavedUserData = {
		type: 'import-saved-user-data',
		data: exportPortableSavedUserData(),
	}

	const hash = dataToUrlHash(data)
	const link = `${window.location.origin}${import.meta.env.BASE_URL}setup/${hash}`

	copyLink({
		link,
	})
}

const { dialog } = useAppDialog()
function handleShowAboutDialog() {
	dialog(AboutDialog, {})
}
const bgChunks = computed(() => {
	if (bgData.value == null)
		return []

	return [
		['none', 'auto'],
		...chunkArray(bgData.value.list, 2),
	]
})

const menuItems = computed<UiDropdownMenuItem[]>(() => [
	{
		icon: pika('i-f7:sun-max', { '@dark': ['i-f7:moon'] }),
		label: `Theme: ${theme.value === 'auto' ? 'Auto' : theme.value === 'dark' ? 'Dark' : 'Light'}`,
		items: [
			{
				label: `Light${theme.value === 'light' ? ' ✓' : ''}`,
				onSelect: () => setTheme('light'),
			},
			{
				label: `Dark${theme.value === 'dark' ? ' ✓' : ''}`,
				onSelect: () => setTheme('dark'),
			},
			{
				label: `Auto (System)${theme.value === 'auto' ? ' ✓' : ''}`,
				onSelect: () => setTheme('auto'),
			},
		],
	},
	{
		icon: pika('i-f7:photo-on-rectangle'),
		label: 'Background',
		disabled: bgData.value == null,
		id: 'bg-menu',
	},
	{
		icon: pika('i-f7:archivebox'),
		label: 'Saved Data',
		items: [
			{
				icon: pika('i-f7:arrow-up-doc'),
				label: 'Upload',
				onSelect: handleUploadSavedDataFile,
			},
			{
				icon: pika('i-f7:arrow-down-doc'),
				label: 'Download',
				onSelect: handleDownloadSavedDataFile,
			},
			{
				icon: pika('i-f7:link'),
				label: 'Copy Link',
				onSelect: handleCopySavedDataLink,
			},
			{
				icon: pika('i-f7:arrow-counterclockwise'),
				label: 'Reset Saved Data',
				onSelect: handleResetSavedData,
			},

			{
				icon: pika('i-f7:trash'),
				label: 'Factory Reset',
				onSelect: handleFactoryReset,
			},
		],
	},
	{
		icon: pika('i-f7:info-circle'),
		label: 'About',
		onSelect: handleShowAboutDialog,
	},
])
</script>

<template>
	<UiDropdownMenu
		:items="menuItems"
		triggerTooltip="Settings"
	>
		<template #trigger>
			<button
				:class="pika('icon-btn')"
				aria-label="Settings"
				@click.stop
			>
				<div
					:class="pika('i-f7:gear-alt')"
				/>
			</button>
		</template>

		<template
			v-if="bgData != null"
			#bg-menu
		>
			<div
				:class="pika({
					height: '400px',
					borderRadius: '16px',
					overflow: 'hidden',
				})"
			>
				<UiVerticalList
					:items="bgChunks"
					:itemHeight="108"
				>
					<template #item="{ item: chunk }">
						<div
							:class="pika({
								display: 'flex',
								gap: '8px',
								marginBottom: '8px',
							})"
						>
							<div
								v-for="bg in chunk"
								:key="bg"
								:data-is-selected="savedBgImage === bg"
								role="button"
								:class="pika({
									'position': 'relative',
									'display': 'block',
									'width': 'calc((100% - 8px) / 2)',
									'height': '100px',
									'cursor': 'pointer',
									'borderRadius': '16px',
									'overflow': 'hidden',
									'$[data-is-selected=true]::after': {
										content: '\'\'',
										position: 'absolute',
										zIndex: '1',
										top: '0',
										left: '0',
										width: '100%',
										height: '100%',
										border: '2px solid var(--color-primary-1)',
										borderRadius: '16px',
										boxSizing: 'border-box',
										pointerEvents: 'none',
									},
								})"
								@click="savedBgImage = bg"
							>
								<div
									v-if="bg === 'none'"
									:class="pika('card', {
										position: 'relative',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										width: '100%',
										height: '100%',
										borderRadius: '16px',
									})"
								>
									<div
										:class="pika('card', {
											padding: '8px 16px',
											borderRadius: '9999px',
											fontSize: '12px',
										})"
									>
										None
									</div>
								</div>
								<div
									v-else-if="bg === 'auto'"
									:class="pika('card', {
										position: 'relative',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										width: '100%',
										height: '100%',
										borderRadius: '16px',
									})"
								>
									<img
										v-if="currentAutoBgPreview"
										:src="currentAutoBgPreview"
										:alt="bg"
										:class="pika({
											position: 'absolute',
											zIndex: '-1',
											top: '0',
											left: '0',
											display: 'block',
											width: '100%',
											height: '100%',
											objectFit: 'cover',
											filter: 'blur(4px)',
										})"
									>
									<div
										:class="pika('card', {
											padding: '8px 16px',
											borderRadius: '9999px',
											fontSize: '12px',
										})"
									>
										Auto
									</div>
								</div>
								<img
									v-else
									:class="pika({
										display: 'block',
										width: 'auto',
										height: '100%',
									})"
									:src="bgData.preview[bg]"
									:alt="bg"
								>
							</div>
						</div>
					</template>
				</UiVerticalList>
			</div>
		</template>
	</UiDropdownMenu>
</template>
