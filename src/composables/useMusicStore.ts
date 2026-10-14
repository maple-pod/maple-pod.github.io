import type { CustomPlaylistId, LoudnessAnalysisReport, MusicData, Playlist, PlaylistId } from '@/types'
import type { ResourcesInput } from '@/utils/resourceCatalog'
import localforage from 'localforage'
import { ofetch } from 'ofetch'
import { convertImageDataUrlToDataUrl512, decodeImageFromBinary } from '@/utils/common'
import { isFactoryResetting, registerFactoryResetQuiesceHandler } from '@/utils/factoryReset'
import { normalizeSavedMusicIds } from '@/utils/musicIds'
import { migrateOfflineMusicAliasStorageKey, reconcileOfflineMusicStorageValue } from '@/utils/offlineMusicCache'
import {
	getCompatibleLoudnessMeasurements,
	getResourceBgmId,
	getResourceBgmMarkBinary,
	getResourceBgmSrc,
	normalizeResourceCatalog,
} from '@/utils/resourceCatalog'

function createAllPlaylist(dataGroupedByCover: Map<string, MusicData[]>): Playlist {
	return {
		id: 'all',
		title: 'All',
		list: Array.from(
			dataGroupedByCover.values(),
			list => list.map(item => item.id),
		)
			.flat(),
	}
}

function groupByMark(data: MusicData[]): Map<string, MusicData[]> {
	const map = new Map<string, MusicData[]>()
	for (const item of data) {
		const mark = item.data.mark ?? '/logo.png'
		if (!map.has(mark)) {
			map.set(mark, [])
		}
		map.get(mark)!.push(item)
	}
	const temp = map.get('/logo.png')
	map.delete('/logo.png')
	if (temp != null) {
		map.set('/logo.png', temp)
	}
	return map
}

export const useMusicStore = defineStore('music', () => {
	const loudnessNormalizationAvailable = ref(false)
	const resourceBuiltAt = ref<number>()
	let loudnessLoadPromise: Promise<boolean> | null = null
	const {
		state: musicDataList,
		isReady: isDataReady,
	} = useAsyncState(
		async () => {
			const res = normalizeResourceCatalog(await ofetch<ResourcesInput>('/resources/data.json'))
			resourceBuiltAt.value = res.builtAt
			const marks = res.marks
			return Promise.all<MusicData>(res.bgms.map(async (bgm) => {
				const markBinary = getResourceBgmMarkBinary(bgm, marks)
				return {
					id: getResourceBgmId(bgm),
					title: bgm.metadata.title,
					cover: await decodeImageFromBinary(markBinary),
					src: getResourceBgmSrc(bgm),
					duration: bgm.duration,
					data: bgm,
				}
			}))
		},
		[],
	)
	const musicMap = computed(() => new Map<string, MusicData>(musicDataList.value.map(item => [item.id, item])))
	const musicAliasMap = computed(() => new Map<string, string>(musicDataList.value.flatMap((music) => {
		return (music.data.aliases ?? []).map(alias => [alias, music.id] as const)
	})))
	const musicAliasesById = computed(() => new Map<string, string[]>(musicDataList.value.flatMap((music) => {
		return music.data.aliases?.length ? [[music.id, music.data.aliases] as const] : []
	})))
	const musicsGroupedByCover = computed(() => groupByMark(musicDataList.value))

	function getCanonicalMusicId(id: string): string | undefined {
		if (musicMap.value.has(id))
			return id
		return musicAliasMap.value.get(id)
	}

	function getMusicAliasIds(id: string): string[] {
		return musicAliasesById.value.get(id) ?? []
	}

	function getMusicData(id: string): MusicData | undefined {
		const canonicalId = getCanonicalMusicId(id)
		return canonicalId == null ? undefined : musicMap.value.get(canonicalId)
	}

	async function loadLoudnessMeasurements(): Promise<boolean> {
		if (loudnessNormalizationAvailable.value)
			return true
		if (loudnessLoadPromise != null)
			return loudnessLoadPromise

		loudnessLoadPromise = (async () => {
			try {
				const report = await ofetch<LoudnessAnalysisReport>('/resources/loudness-analysis.json')
				const measurements = getCompatibleLoudnessMeasurements(
					report,
					musicDataList.value.map(music => music.data),
					resourceBuiltAt.value,
				)
				if (measurements == null) {
					console.warn('[audio] Loudness report is incompatible with the current resource catalog; normalization is unavailable.')
					return false
				}

				for (const music of musicDataList.value)
					music.loudness = measurements.get(music.id)
				loudnessNormalizationAvailable.value = true
				return true
			}
			catch (error) {
				console.warn('[audio] Could not load loudness report; normalization is unavailable.', error)
				return false
			}
		})()

		const result = await loudnessLoadPromise
		if (!result)
			loudnessLoadPromise = null
		return result
	}

	const playlistAll = computed(() => createAllPlaylist(musicsGroupedByCover.value))
	const { likedPlaylist, savedPlaylists } = useSavedUserData()
	const savedPlaylistsMap = computed(() => new Map(savedPlaylists.value.map(playlist => [playlist.id, playlist])))
	const playlistList = computed(() => [
		playlistAll.value,
		likedPlaylist.value,
		...savedPlaylists.value,
	])

	function isCustomPlaylist(id: PlaylistId): id is CustomPlaylistId {
		return id.startsWith('custom:')
	}

	function isAddedInPlaylist(playlistId: PlaylistId, musicId: string) {
		const playlist = getPlaylist(playlistId)
		if (playlist == null)
			return false
		return playlist.list.includes(getCanonicalMusicId(musicId) ?? musicId)
	}

	function validatePlaylistTitle(title: string): string | undefined {
		const value = title.trim()
		switch (true) {
			case value.length === 0:
				return 'Playlist title is required'
			case value.length > 50:
				return 'Playlist title must be less than 50 characters'
			default:
				return undefined
		}
	}
	function createPlaylist(title: string, list: string[] = []): [id: CustomPlaylistId, error: null] | [null, error: string] {
		const id = `custom:${Date.now()}` as CustomPlaylistId

		const playlist: Playlist<CustomPlaylistId> = {
			id,
			title,
			list,
		}
		savedPlaylists.value.push(playlist)

		return [id, null]
	}
	function deletePlaylist(id: CustomPlaylistId) {
		const index = savedPlaylists.value.findIndex(({ id: playlistId }) => playlistId === id)
		if (index !== -1) {
			savedPlaylists.value.splice(index, 1)
		}
	}
	function getPlaylist(id: PlaylistId) {
		if (id === 'all')
			return playlistAll.value
		if (id === 'liked')
			return likedPlaylist.value
		return savedPlaylistsMap.value.get(id) ?? null
	}
	function findMusicInPlaylistIndex(playlistId: PlaylistId, musicId: string) {
		const playlist = getPlaylist(playlistId)
		if (playlist == null)
			return -1
		return playlist.list.indexOf(getCanonicalMusicId(musicId) ?? musicId)
	}
	function toggleMusicInPlaylist(playlistId: PlaylistId, musicId: string, action?: 'add' | 'remove') {
		const playlist = getPlaylist(playlistId)
		if (playlist == null || playlist.id === 'all')
			return

		const canonicalId = getCanonicalMusicId(musicId) ?? musicId
		const index = playlist.list.indexOf(canonicalId)
		if (index !== -1 && (action === 'remove' || action == null)) {
			playlist.list.splice(index, 1)
			return
		}

		if (index === -1 && (action === 'add' || action == null)) {
			playlist.list.push(canonicalId)
		}
	}

	function isMusicLiked(musicId: string) {
		return findMusicInPlaylistIndex('liked', musicId) !== -1
	}
	function toggleMusicLike(musicId: string) {
		toggleMusicInPlaylist('liked', musicId)
	}

	const {

		offlineReadyMusics,
		loadOfflineMusics,
		offlineMusicDownloadingProgress,
		offlineMusicDownloadErrors,
		saveMusicForOffline: _saveMusicForOffline,
		cancelOfflineMusicDownload: _cancelOfflineMusicDownload,
		removeSavedOfflineMusic: _removeSavedOfflineMusic,
		clearSavedOfflineMusics,
		getSavedOfflineMusicBlob,
	} = useOfflineMusics()
	async function saveMusicForOffline(musicId: string) {
		const musicData = getMusicData(musicId)

		if (musicData == null)
			return

		await _saveMusicForOffline(musicData.id, musicData.src)
	}
	function cancelOfflineMusicDownload(musicId: string) {
		_cancelOfflineMusicDownload(getCanonicalMusicId(musicId) ?? musicId)
	}
	async function removeSavedOfflineMusic(musicId: string) {
		const canonicalId = getCanonicalMusicId(musicId) ?? musicId
		await _removeSavedOfflineMusic(canonicalId, getMusicAliasIds(canonicalId))
	}

	const audioPlayerLogic = useAudioPlayer({
		getAudioSrc: async (id) => {
			if (id == null)
				return null

			const musicData = getMusicData(id)
			if (musicData == null)
				return null

			const normalizationGainDb = musicData.loudness == null
				? undefined
				: calculateNormalizationGainDb(musicData.loudness)
			const blob = await getSavedOfflineMusicBlob(id, musicData.src)
			if (blob != null) {
				const objUrl = URL.createObjectURL(blob)
				return {
					src: objUrl,
					normalizationGainDb,
					release: () => URL.revokeObjectURL(objUrl),
				}
			}

			return {
				src: musicData.src,
				normalizationGainDb,
			}
		},
		isMusicDisabled: id => isMusicDisabled(id ?? ''),
	})
	function applySavedPlaybackPreferences() {
		const { volume, muted, random, repeated } = useSavedUserData()
		audioPlayerLogic.volume.value = volume.value
		audioPlayerLogic.toggleMuted(muted.value)
		audioPlayerLogic.toggleRandom(random.value)
		audioPlayerLogic.toggleRepeated(repeated.value)
	}

	const currentPlaylist = ref<Playlist | null>(null)
	const currentMusic = computed(() => getMusicData(audioPlayerLogic.currentAudioId.value || '') ?? null)

	function syncCurrentNormalizationGain() {
		const measurement = currentMusic.value?.loudness
		audioPlayerLogic.setNormalizationGainDb(measurement == null
			? 0
			: calculateNormalizationGainDb(measurement))
	}
	watch(currentMusic, syncCurrentNormalizationGain, { immediate: true })

	watch(
		isDataReady,
		async (dataReady) => {
			if (!dataReady)
				return

			const loaded = await loadLoudnessMeasurements()
			if (!loaded) {
				audioPlayerLogic.setNormalizationEnabled(false)
				return
			}

			syncCurrentNormalizationGain()
			audioPlayerLogic.setNormalizationEnabled(true)
		},
		{ immediate: true },
	)
	function play(playlistId: PlaylistId, musicId?: string): void
	function play(playlist: Playlist, musicId?: string): void
	function play(playlistOrId: Playlist | PlaylistId, musicId?: string) {
		const playlist = typeof playlistOrId === 'string' ? getPlaylist(playlistOrId) : playlistOrId
		if (playlist == null)
			return

		const canonicalMusicId = musicId == null ? undefined : getCanonicalMusicId(musicId) ?? musicId
		if (canonicalMusicId != null && (playlist.list.includes(canonicalMusicId) === false))
			return

		audioPlayerLogic.play(playlist.list, canonicalMusicId, () => {
			currentPlaylist.value = playlist
		})
	}

	const MAX_HISTORY_LENGTH = 50
	const RECORD_AFTER = 3000
	const { history } = useSavedUserData()
	let historyTimer = 0
	watch(
		currentMusic,
		(newMusic) => {
			if (historyTimer) {
				window.clearTimeout(historyTimer)
			}
			historyTimer = window.setTimeout(() => {
				if (newMusic != null && history.value[0] !== newMusic.id) {
					history.value.unshift(newMusic.id)
					history.value = history.value.slice(0, MAX_HISTORY_LENGTH)
				}
			}, RECORD_AFTER)
		},
	)
	tryOnScopeDispose(() => {
		window.clearTimeout(historyTimer)
	})

	function getPlayMusicLink(musicId: string) {
		const canonicalMusicId = getCanonicalMusicId(musicId) ?? musicId
		return `${window.location.origin}${import.meta.env.BASE_URL}play/?musicId=${encodeURIComponent(canonicalMusicId)}`
	}

	const isOnline = useOnline()
	function isMusicDisabled(musicId: string) {
		const canonicalMusicId = getCanonicalMusicId(musicId)
		if (canonicalMusicId == null)
			return true
		if (isOnline.value)
			return false

		return offlineReadyMusics.value.has(canonicalMusicId) === false
	}

	if (navigator.mediaSession != null) {
		watch(
			currentMusic,
			() => {
				if (currentMusic.value == null) {
					navigator.mediaSession.metadata = null
					return
				}
				convertImageDataUrlToDataUrl512(currentMusic.value.cover)
					.then((cover) => {
						navigator.mediaSession.metadata = new MediaMetadata({
							title: currentMusic.value!.title,
							artist: 'MapleStory',
							album: currentPlaylist.value?.title,
							artwork: [
								{
									src: cover,
									type: 'image/png',
									sizes: '512x512',
								},
							],
						})
					})

				navigator.mediaSession.setPositionState({
					duration: currentMusic.value.duration,
					playbackRate: 1,
					position: 0,
				})
			},
		)
		watch(
			audioPlayerLogic.isPaused,
			bool => navigator.mediaSession.playbackState = bool ? 'paused' : 'playing',
			{ immediate: true },
		)
		const stopSeekedListener = audioPlayerLogic.onSeeked(() => {
			navigator.mediaSession.setPositionState({
				duration: audioPlayerLogic.duration.value,
				playbackRate: 1,
				position: audioPlayerLogic.currentTime.value,
			})
		})
		tryOnScopeDispose(stopSeekedListener)
		navigator.mediaSession.setActionHandler('play', () => {
			audioPlayerLogic.togglePlay()
		})
		navigator.mediaSession.setActionHandler('pause', () => {
			audioPlayerLogic.togglePlay()
		})
		navigator.mediaSession.setActionHandler('previoustrack', () => {
			audioPlayerLogic.goPrevious()
		})
		navigator.mediaSession.setActionHandler('nexttrack', () => {
			audioPlayerLogic.goNext()
		})
		navigator.mediaSession.setActionHandler('seekto', (details) => {
			if (details.seekTime != null)
				audioPlayerLogic.currentTime.value = details.seekTime
		})
	}

	function normalizeMusicIds(list: string[], dedupe = false): string[] {
		return normalizeSavedMusicIds(list, getCanonicalMusicId, dedupe)
	}

	function normalizePlaylistMusicIds(list: string[]): string[] {
		return normalizeMusicIds(list, true)
	}

	function normalizeRecentHistory(): void {
		history.value = normalizeMusicIds(history.value)
	}

	function normalizeSavedPlaylists(): void {
		const normalizedPlaylists = savedPlaylists.value
			.filter((playlist) => {
				if (playlist.id.startsWith('custom:') === false) {
					console.warn(`Invalid playlist ID: ${playlist.id}`)
					return false
				}
				if (playlist.list == null || !Array.isArray(playlist.list)) {
					console.warn(`Invalid playlist: ${playlist.id}`)
					return false
				}

				return true
			})
			.map(playlist => ({
				...playlist,
				list: normalizePlaylistMusicIds(playlist.list),
			}))
		const normalizedLiked = normalizePlaylistMusicIds(likedPlaylist.value.list)

		if (JSON.stringify(normalizedPlaylists) !== JSON.stringify(savedPlaylists.value))
			savedPlaylists.value = normalizedPlaylists
		if (JSON.stringify(normalizedLiked) !== JSON.stringify(likedPlaylist.value.list))
			likedPlaylist.value.list = normalizedLiked
	}

	const ready = until(isDataReady)
		.toBe(true)
		.then(async () => {
			await loadOfflineMusics(getMusicData)
			normalizeSavedPlaylists()
			normalizeRecentHistory()
		})

	return {
		getMusicData,
		getCanonicalMusicId,
		normalizeMusicIds,
		playlistList,
		likedPlaylist,
		savedPlaylists: computed(() => savedPlaylists.value.filter(playlist => isCustomPlaylist(playlist.id))
			.map(playlist => playlist)),
		normalizeSavedPlaylists,
		applySavedPlaybackPreferences,
		normalizeRecentHistory,
		getPlaylist,
		findMusicInPlaylistIndex,
		isCustomPlaylist,
		isAddedInPlaylist,
		validatePlaylistTitle,
		createPlaylist,
		deletePlaylist,
		toggleMusicInPlaylist,
		isMusicLiked,
		toggleMusicLike,
		...audioPlayerLogic,
		currentPlaylist,
		currentMusic,
		play,
		history,
		getPlayMusicLink,
		offlineMusicDownloadingProgress,
		offlineMusicDownloadErrors,
		offlineReadyMusics,
		saveMusicForOffline,
		cancelOfflineMusicDownload,
		removeSavedOfflineMusic,
		clearSavedOfflineMusics,
		isMusicDisabled,
		ready,
	}
})

function useOfflineMusics() {
	const storage = localforage.createInstance({ name: 'maple-pod' })
	let storageGeneration = 0
	let clearingStorage = false
	const storageMutationRequests = new Set<Promise<unknown>>()
	async function runStorageMutation<T>(mutation: () => Promise<T>): Promise<T> {
		const request = mutation()
		storageMutationRequests.add(request)
		try {
			return await request
		}
		finally {
			storageMutationRequests.delete(request)
		}
	}

	const offlineReadyMusics = ref(new Set<string>())
	async function loadOfflineMusics(getMusicData: (musicId: string) => MusicData | undefined) {
		if (!isOfflineStorageWritable())
			return
		const generation = storageGeneration
		const keys = await storage.keys()
		const storedValues = new Map(await Promise.all(keys.map(async (musicId) => {
			return [musicId, await storage.getItem<unknown>(musicId)] as const
		})))
		const aliasKeys = new Set(keys.filter((musicId) => {
			const musicData = getMusicData(musicId)
			return musicData != null && musicData.id !== musicId
		}))
		const ready = new Set<string>()
		const migratedCanonicalIds = new Set<string>()
		for (const aliasId of aliasKeys) {
			const musicData = getMusicData(aliasId)
			const value = storedValues.get(aliasId)
			if (musicData == null || value == null)
				continue

			try {
				const migrated = await runStorageMutation(async () => {
					if (!isOfflineStorageWritable() || generation !== storageGeneration)
						return null
					return migrateOfflineMusicAliasStorageKey(
						aliasId,
						musicData.id,
						value,
						musicData.src,
						storage,
					)
				})
				if (migrated != null && isOfflineStorageWritable() && generation === storageGeneration) {
					ready.add(musicData.id)
					migratedCanonicalIds.add(musicData.id)
				}
			}
			catch (error) {
				console.warn(`Could not migrate offline music key "${aliasId}" to "${musicData.id}"; the old key was retained.`, error)
			}
		}

		const keysToReconcile = keys.filter(musicId => !aliasKeys.has(musicId) && !migratedCanonicalIds.has(musicId))
		await Promise.all(keysToReconcile.map(async (musicId) => {
			const value = storedValues.get(musicId)
			if (!isOfflineStorageWritable() || generation !== storageGeneration)
				return
			const expectedSource = getMusicData(musicId)?.src
			const reconciliation = reconcileOfflineMusicStorageValue(musicId, value, expectedSource)
			if (reconciliation.kind === 'ready') {
				if (reconciliation.needsPersist) {
					// Stable IDs survive resource renames and upstream promotion. Retain
					// the full cached media and update only its catalog-source association.
					await runStorageMutation(async () => {
						if (!isOfflineStorageWritable() || generation !== storageGeneration)
							return
						await storage.setItem(musicId, reconciliation.entry)
					})
				}
				if (isOfflineStorageWritable() && generation === storageGeneration)
					ready.add(musicId)
				return
			}

			if (reconciliation.kind === 'retained-unresolved' || reconciliation.kind === 'empty')
				return

			if (reconciliation.kind === 'remove') {
				await runStorageMutation(async () => {
					if (!isOfflineStorageWritable() || generation !== storageGeneration)
						return
					await storage.removeItem(musicId)
				})
			}
		}))
		if (isOfflineStorageWritable() && generation === storageGeneration)
			offlineReadyMusics.value = ready
	}
	const cancelFns = new Map<string, () => void>()
	const activeAttempts = new Map<string, number>()
	const activeAttemptRequests = new Map<string, Promise<void>>()
	let nextAttemptId = 0
	const offlineMusicDownloadingProgress = ref<Map<string, 'pending' | number>>(new Map())
	const offlineMusicDownloadErrors = ref(new Set<string>())

	function isOfflineStorageWritable(): boolean {
		return !clearingStorage && !isFactoryResetting()
	}

	function isCurrentAttempt(musicId: string, attemptId: number, generation: number, signal: AbortSignal) {
		return isOfflineStorageWritable()
			&& generation === storageGeneration
			&& !signal.aborted
			&& activeAttempts.get(musicId) === attemptId
	}

	async function removeAttemptStorage(musicId: string): Promise<void> {
		try {
			await storage.removeItem(musicId)
		}
		catch (error) {
			console.error('Failed to clean up offline music storage:', error)
		}
	}

	async function _saveMusicForOffline(
		musicId: string,
		src: string,
		signal: AbortSignal,
		generation: number,
		attemptId: number,
	) {
		try {
			const blob = await fetchBlob(
				src,
				(loaded, total) => {
					if (!isCurrentAttempt(musicId, attemptId, generation, signal))
						return
					const percent = Math.round((loaded / total) * 100)
					offlineMusicDownloadingProgress.value.set(musicId, percent)
				},
				signal,
			)
			if (blob.size === 0)
				throw new Error('Offline music download returned an empty response.')
			if (!isCurrentAttempt(musicId, attemptId, generation, signal))
				return

			await storage.setItem(musicId, { source: src, blob })
			if (!isCurrentAttempt(musicId, attemptId, generation, signal)) {
				await removeAttemptStorage(musicId)
				return
			}

			offlineMusicDownloadErrors.value.delete(musicId)
			offlineReadyMusics.value.add(musicId)
		}
		catch {
			const cancelled = signal.aborted
				|| generation !== storageGeneration
				|| !isOfflineStorageWritable()
			await removeAttemptStorage(musicId)
			if (!cancelled && activeAttempts.get(musicId) === attemptId) {
				offlineReadyMusics.value.delete(musicId)
				offlineMusicDownloadErrors.value.add(musicId)
			}
		}
		finally {
			if (activeAttempts.get(musicId) === attemptId) {
				activeAttempts.delete(musicId)
				cancelFns.delete(musicId)
				offlineMusicDownloadingProgress.value.delete(musicId)
			}
		}
	}

	const offlineMusicsQueue = new PromiseQueue(5)
	async function saveMusicForOffline(musicId: string, src: string) {
		if (!isOfflineStorageWritable() || activeAttempts.has(musicId) || offlineReadyMusics.value.has(musicId))
			return

		offlineMusicDownloadErrors.value.delete(musicId)
		offlineMusicDownloadingProgress.value.set(musicId, 'pending')
		const abortController = new AbortController()
		const generation = storageGeneration
		const attemptId = ++nextAttemptId
		activeAttempts.set(musicId, attemptId)
		let started = false
		const task = offlineMusicsQueue.add(async () => {
			started = true
			const request = runStorageMutation(() => _saveMusicForOffline(musicId, src, abortController.signal, generation, attemptId))
			activeAttemptRequests.set(musicId, request)
			try {
				await request
			}
			finally {
				if (activeAttemptRequests.get(musicId) === request)
					activeAttemptRequests.delete(musicId)
			}
		})
		cancelFns.set(musicId, () => {
			if (activeAttempts.get(musicId) !== attemptId)
				return
			task.cancel()
			abortController.abort()
			offlineMusicDownloadErrors.value.delete(musicId)
			if (!started) {
				offlineMusicDownloadingProgress.value.delete(musicId)
				activeAttempts.delete(musicId)
				cancelFns.delete(musicId)
			}
			// A running attempt retains its progress entry until its abort/cleanup
			// settles, so the UI cannot expose Retry while this attempt still owns
			// the per-track lock.
		})
	}
	async function getSavedOfflineMusicBlob(musicId: string, expectedSource: string): Promise<Blob | null> {
		if (!isOfflineStorageWritable())
			return null
		const generation = storageGeneration
		const value = await storage.getItem<unknown>(musicId)
		if (!isOfflineStorageWritable() || generation !== storageGeneration)
			return null
		const reconciliation = reconcileOfflineMusicStorageValue(musicId, value, expectedSource)
		if (reconciliation.kind === 'ready') {
			if (reconciliation.needsPersist) {
				await runStorageMutation(async () => {
					if (!isOfflineStorageWritable() || generation !== storageGeneration)
						return
					await storage.setItem(musicId, reconciliation.entry)
				})
			}
			return isOfflineStorageWritable() && generation === storageGeneration ? reconciliation.entry.blob : null
		}

		if (reconciliation.kind === 'remove') {
			await runStorageMutation(async () => {
				if (isOfflineStorageWritable() && generation === storageGeneration)
					await storage.removeItem(musicId)
			})
		}
		offlineReadyMusics.value.delete(musicId)
		return null
	}
	function cancelOfflineMusicDownload(musicId: string) {
		cancelFns.get(musicId)?.()
	}
	async function removeSavedOfflineMusic(musicId: string, aliasIds: string[] = []) {
		cancelOfflineMusicDownload(musicId)
		await activeAttemptRequests.get(musicId)
			?.catch(() => null)
		await runStorageMutation(async () => {
			await storage.removeItem(musicId)
			await Promise.all(aliasIds.map(aliasId => storage.removeItem(aliasId)))
		})
		offlineReadyMusics.value.delete(musicId)
		offlineMusicDownloadErrors.value.delete(musicId)
	}
	const unregisterFactoryResetQuiesce = registerFactoryResetQuiesceHandler(async () => {
		storageGeneration++
		for (const cancel of [...cancelFns.values()])
			cancel()
		await Promise.allSettled([...activeAttemptRequests.values()])
		await Promise.allSettled([...storageMutationRequests])
		cancelFns.clear()
		activeAttempts.clear()
		offlineMusicDownloadingProgress.value = new Map()
		offlineMusicDownloadErrors.value = new Set()
	})
	tryOnScopeDispose(unregisterFactoryResetQuiesce)

	async function clearSavedOfflineMusics() {
		clearingStorage = true
		storageGeneration++
		try {
			for (const cancel of [...cancelFns.values()])
				cancel()
			await Promise.allSettled([...activeAttemptRequests.values()])
			await Promise.allSettled([...storageMutationRequests])
			cancelFns.clear()
			activeAttempts.clear()
			await storage.clear()
			offlineReadyMusics.value = new Set()
			offlineMusicDownloadingProgress.value = new Map()
			offlineMusicDownloadErrors.value = new Set()
		}
		finally {
			clearingStorage = false
		}
	}

	return {
		offlineReadyMusics,
		loadOfflineMusics,
		offlineMusicDownloadingProgress,
		offlineMusicDownloadErrors,
		saveMusicForOffline,
		getSavedOfflineMusicBlob,
		cancelOfflineMusicDownload,
		removeSavedOfflineMusic,
		clearSavedOfflineMusics,
	}
}

if (import.meta.hot)
	import.meta.hot.accept(acceptHMRUpdate(useMusicStore, import.meta.hot))
