import type { CustomPlaylistId, LoudnessAnalysisReport, MusicData, Playlist, PlaylistId, Resources } from '@/types'
import localforage from 'localforage'
import { ofetch } from 'ofetch'
import { convertImageDataUrlToDataUrl512, decodeImageFromBinary } from '@/utils/common'

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

function getResourceBgmSrc(bgm: Resources['bgms'][number]): string {
	return `/resources/bgm/${bgm.audio?.file ?? `${bgm.filename}.mp3`}`
}

function groupByMark(data: MusicData[]): Map<string, MusicData[]> {
	const map = new Map<string, MusicData[]>()
	for (const item of data) {
		if (!map.has(item.data.mark)) {
			map.set(item.data.mark, [])
		}
		map.get(item.data.mark)!.push(item)
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
			const res = await ofetch<Resources>('/resources/data.json')
			resourceBuiltAt.value = res.builtAt
			const marks = res.marks
			return Promise.all<MusicData>(res.bgms.map(async bgm => ({
				id: bgm.filename,
				title: bgm.metadata.title,
				cover: await decodeImageFromBinary(marks[bgm.mark]!),
				src: getResourceBgmSrc(bgm),
				duration: bgm.duration,
				data: bgm,
			})))
		},
		[],
	)
	const musicMap = computed(() => new Map<string, MusicData>(musicDataList.value.map(item => [item.id, item])))
	const musicsGroupedByCover = computed(() => groupByMark(musicDataList.value))

	function getMusicData(id: string): MusicData | undefined {
		return musicMap.value.get(id)
	}

	async function loadLoudnessMeasurements(): Promise<boolean> {
		if (loudnessNormalizationAvailable.value)
			return true
		if (loudnessLoadPromise != null)
			return loudnessLoadPromise

		loudnessLoadPromise = (async () => {
			try {
				const report = await ofetch<LoudnessAnalysisReport>('/resources/loudness-analysis.json')
				const reportMatchesResources = report.failureCount === 0
					&& report.successCount === musicDataList.value.length
					&& report.trackCount === musicDataList.value.length
					&& report.resourceBuiltAt === resourceBuiltAt.value
				if (!reportMatchesResources) {
					console.warn('[audio] Loudness report does not match the current resource build; normalization is unavailable.')
					return false
				}

				const measurements = new Map(report.tracks.map(track => [track.filename, track]))
				if (measurements.size !== musicDataList.value.length) {
					console.warn('[audio] Loudness report is incomplete; normalization is unavailable.')
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
		return playlist.list.includes(musicId)
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
		return playlist.list.indexOf(musicId)
	}
	function toggleMusicInPlaylist(playlistId: PlaylistId, musicId: string, action?: 'add' | 'remove') {
		const playlist = getPlaylist(playlistId)
		if (playlist == null || playlist.id === 'all')
			return

		const index = playlist.list.indexOf(musicId)
		if (index !== -1 && (action === 'remove' || action == null)) {
			playlist.list.splice(index, 1)
			return
		}

		if (index === -1 && (action === 'add' || action == null)) {
			playlist.list.push(musicId)
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
		saveMusicForOffline: _saveMusicForOffline,
		cancelOfflineMusicDownload,
		removeSavedOfflineMusic,
		getSavedOfflineMusicBlob,
	} = useOfflineMusics()
	async function saveMusicForOffline(musicId: string) {
		const musicData = getMusicData(musicId)

		if (musicData == null)
			return

		await _saveMusicForOffline(musicId, musicData.src)
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

		if (musicId != null && (playlist.list.includes(musicId) === false))
			return

		currentPlaylist.value = playlist
		audioPlayerLogic.play(playlist.list, musicId)

		// ensure the audio is reset
		audioPlayerLogic.currentTime.value = 0
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
				if (newMusic != null) {
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
		return `${window.location.origin}${import.meta.env.BASE_URL}play/?musicId=${musicId}`
	}

	const isOnline = useOnline()
	function isMusicDisabled(musicId: string) {
		if (isOnline.value)
			return false

		return offlineReadyMusics.value.has(musicId) === false
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
		useEventListener(
			audioPlayerLogic.audio,
			'seeked',
			() => {
				navigator.mediaSession.setPositionState({
					duration: audioPlayerLogic.duration.value,
					playbackRate: 1,
					position: audioPlayerLogic.currentTime.value,
				})
			},
		)
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

	const ready = until(isDataReady)
		.toBe(true)
		.then(async () => {
			await loadOfflineMusics(id => getMusicData(id)?.src)
			// ensure the saved playlists are valid
			savedPlaylists.value = savedPlaylists.value
				.filter((playlist) => {
					if (playlist.id.startsWith('custom:') === false) {
						console.warn(`Invalid playlist ID: ${playlist.id}`)
						return false
					}
					if (playlist.list == null || !Array.isArray(playlist.list)) {
						console.warn(`Invalid playlist: ${playlist.id}`)
						return false
					}

					playlist.list = playlist.list
						// Process old data
						.map(src => src.split('/')
							.pop()!.replace('.mp3', ''))
						.filter(getMusicData)

					return true
				})
			likedPlaylist.value.list = likedPlaylist.value.list
				// Process old data
				.map(src => src.split('/')
					.pop()!.replace('.mp3', ''))
				.filter(getMusicData)
		})

	return {
		getMusicData,
		playlistList,
		likedPlaylist,
		savedPlaylists: computed(() => savedPlaylists.value.filter(playlist => isCustomPlaylist(playlist.id))
			.map(playlist => playlist)),
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
		offlineReadyMusics,
		saveMusicForOffline,
		cancelOfflineMusicDownload,
		removeSavedOfflineMusic,
		isMusicDisabled,
		ready,
	}
})

function useOfflineMusics() {
	interface OfflineMusicEntry {
		source: string
		blob: Blob
	}

	function isOfflineMusicEntry(value: unknown): value is OfflineMusicEntry {
		return value != null
			&& typeof value === 'object'
			&& 'source' in value
			&& typeof value.source === 'string'
			&& 'blob' in value
			&& value.blob instanceof Blob
	}

	const storage = localforage.createInstance({ name: 'maple-pod' })
	const offlineReadyMusics = ref(new Set<string>())
	async function loadOfflineMusics(getExpectedSource: (musicId: string) => string | undefined) {
		const keys = await storage.keys()
		const ready = new Set<string>()
		await Promise.all(keys.map(async (musicId) => {
			const value = await storage.getItem<unknown>(musicId)
			const expectedSource = getExpectedSource(musicId)
			if (expectedSource != null && isOfflineMusicEntry(value) && value.source === expectedSource) {
				ready.add(musicId)
				return
			}

			const legacySource = `/resources/bgm/${musicId}.mp3`
			if (value instanceof Blob && expectedSource === legacySource) {
				await storage.setItem<OfflineMusicEntry>(musicId, { source: legacySource, blob: value })
				ready.add(musicId)
				return
			}

			// Entries for an old representation must not silently override the
			// source-selected audio after its resource path changes.
			if (value != null)
				await storage.removeItem(musicId)
		}))
		offlineReadyMusics.value = ready
	}
	const cancelFns = new Map<string, () => void>()
	const offlineMusicDownloadingProgress = ref<Map<string, 'pending' | number>>(new Map())
	async function _saveMusicForOffline(musicId: string, src: string, signal: AbortSignal) {
		const blob = await fetchBlob(
			src,
			(loaded, total) => {
				const percent = Math.round((loaded / total) * 100)
				offlineMusicDownloadingProgress.value.set(musicId, percent)
			},
			signal,
		)
			.catch(() => null)
		offlineMusicDownloadingProgress.value.delete(musicId)

		if (blob == null) {
			await storage.removeItem(musicId)
			return
		}

		await storage.setItem<OfflineMusicEntry>(musicId, { source: src, blob })
		offlineReadyMusics.value.add(musicId)
	}
	const offlineMusicsQueue = new PromiseQueue(5)
	async function saveMusicForOffline(musicId: string, src: string) {
		if (offlineMusicDownloadingProgress.value.has(musicId) || offlineReadyMusics.value.has(musicId)) {
			return
		}

		offlineMusicDownloadingProgress.value.set(musicId, 'pending')
		const abortController = new AbortController()
		const task = offlineMusicsQueue.add(() => _saveMusicForOffline(musicId, src, abortController.signal))
		cancelFns.set(musicId, () => {
			task.cancel()
			abortController.abort()
			offlineMusicDownloadingProgress.value.delete(musicId)
			cancelFns.delete(musicId)
		})
	}
	async function getSavedOfflineMusicBlob(musicId: string, expectedSource: string): Promise<Blob | null> {
		const value = await storage.getItem<unknown>(musicId)
		if (isOfflineMusicEntry(value) && value.source === expectedSource)
			return value.blob

		const legacySource = `/resources/bgm/${musicId}.mp3`
		if (value instanceof Blob && expectedSource === legacySource) {
			await storage.setItem<OfflineMusicEntry>(musicId, { source: legacySource, blob: value })
			return value
		}

		if (value != null)
			await storage.removeItem(musicId)
		offlineReadyMusics.value.delete(musicId)
		return null
	}
	function cancelOfflineMusicDownload(musicId: string) {
		cancelFns.get(musicId)?.()
	}
	async function removeSavedOfflineMusic(musicId: string) {
		await storage.removeItem(musicId)
		offlineReadyMusics.value.delete(musicId)
	}

	return {
		offlineReadyMusics,
		loadOfflineMusics,
		offlineMusicDownloadingProgress,
		saveMusicForOffline,
		getSavedOfflineMusicBlob,
		cancelOfflineMusicDownload,
		removeSavedOfflineMusic,
	}
}

if (import.meta.hot)
	import.meta.hot.accept(acceptHMRUpdate(useMusicStore, import.meta.hot))
