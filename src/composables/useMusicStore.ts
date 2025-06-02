import type { CustomPlaylistId, MusicData, Playlist, PlaylistId, Resources } from '@/types'
import { decodeMarkImg } from '@/utils/common'
import { ofetch } from 'ofetch'

function createAllPlaylist(dataGroupedByCover: Map<string, MusicData[]>): Playlist {
	return {
		id: 'all',
		title: 'All',
		list: Array.from(
			dataGroupedByCover.values(),
			list => list.map(item => item.id),
		).flat(),
	}
}

function groupByCover(data: MusicData[]): Map<string, MusicData[]> {
	const map = new Map<string, MusicData[]>()
	for (const item of data) {
		if (!map.has(item.cover)) {
			map.set(item.cover, [])
		}
		map.get(item.cover)!.push(item)
	}
	const temp = map.get('/logo.png')
	map.delete('/logo.png')
	if (temp != null) {
		map.set('/logo.png', temp)
	}
	return map
}

export const useMusicStore = defineStore('music', () => {
	const {
		state: musicDataList,
		isReady: isDataReady,
	} = useAsyncState(
		async () => {
			const res = await ofetch<Resources>('/resources/data.json')

			const marks = res.marks
			return Promise.all<MusicData>(res.bgms.map(async bgm => ({
				id: bgm.filename,
				title: bgm.metadata.title,
				cover: await decodeMarkImg(marks[bgm.mark]!),
				src: `/resources/bgm/${bgm.filename}.mp3`,
				duration: bgm.duration,
				data: bgm,
			})))
		},
		[],
	)
	const musicMap = computed(() => new Map<string, MusicData>(musicDataList.value.map(item => [item.id, item])))
	const musicsGroupedByCover = computed(() => groupByCover(musicDataList.value))

	function getMusicData(id: string): MusicData | undefined {
		return musicMap.value.get(id)
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

	const audioPlayerLogic = useAudioPlayer({
		getAudioSrc: (id) => {
			if (id == null)
				return null
			const musicData = getMusicData(id)
			return musicData?.src ?? null
		},
	})
	const currentPlaylist = ref<Playlist | null>(null)
	const currentMusic = computed(() => getMusicData(audioPlayerLogic.currentAudioId.value || '') ?? null)
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

	if (navigator.mediaSession != null) {
		watch(
			currentMusic,
			() => {
				if (currentMusic.value == null) {
					navigator.mediaSession.metadata = null
					return
				}

				navigator.mediaSession.metadata = new MediaMetadata({
					title: currentMusic.value.title,
					artist: 'MapleStory',
					album: currentPlaylist.value?.title,
					artwork: [
						{
							src: currentMusic.value.cover,
							sizes: '96x96',
							type: 'image/png',
						},
						{
							src: currentMusic.value.cover,
							sizes: '128x128',
							type: 'image/png',
						},
						{
							src: currentMusic.value.cover,
							sizes: '192x192',
							type: 'image/png',
						},
						{
							src: currentMusic.value.cover,
							sizes: '256x256',
							type: 'image/png',
						},
						{
							src: currentMusic.value.cover,
							sizes: '384x384',
							type: 'image/png',
						},
						{
							src: currentMusic.value.cover,
							sizes: '512x512',
							type: 'image/png',
						},
					],
				})
			},
		)
	}

	const ready = until(isDataReady)
		.toBe(true)
		.then(() => {
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
						.map(src => src.split('/').pop()!.replace('.mp3', ''))
						.filter(getMusicData)

					return true
				})
			likedPlaylist.value.list = likedPlaylist.value.list
				// Process old data
				.map(src => src.split('/').pop()!.replace('.mp3', ''))
				.filter(getMusicData)
		})

	return {
		getMusicData,
		playlistList,
		likedPlaylist,
		savedPlaylists: computed(() => savedPlaylists.value.filter(playlist => isCustomPlaylist(playlist.id)).map(playlist => playlist)),
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
		ready,
	}
})

if (import.meta.hot)
	import.meta.hot.accept(acceptHMRUpdate(useMusicStore, import.meta.hot))
