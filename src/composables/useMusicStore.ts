import { ofetch } from 'ofetch'

export interface MusicData {
	title: string
	cover: string
	src: string
}

export type LikedPlaylistId = 'liked'
export type CustomPlaylistId = `custom:${string}`
export type SaveablePlaylistId = CustomPlaylistId | LikedPlaylistId
export type PlaylistId = 'all' | SaveablePlaylistId

export interface Playlist<Id extends PlaylistId = PlaylistId> {
	id: Id
	title: string
	list: string[]
}

function createAllPlaylist(dataGroupedByCover: Map<string, MusicData[]>): Playlist {
	return {
		id: 'all',
		title: 'All',
		list: Array.from(
			dataGroupedByCover.values(),
			list => list.map(item => item.src),
		).flat(),
	}
}

function createLikedPlaylist(): Playlist {
	return { id: 'liked', title: 'Liked', list: [] }
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
		state: dataList,
		isReady: isDataReady,
	} = useAsyncState(
		async () => (await ofetch<MusicData[]>('/data/data.json')),
		[],
	)
	const dataMap = computed(() => new Map<string, MusicData>(dataList.value.map(item => [item.src, item])))
	const dataGroupedByCover = computed(() => groupByCover(dataList.value))

	function getMusicData(src: string): MusicData | undefined {
		return dataMap.value.get(src)
	}

	const playlistAll = computed(() => createAllPlaylist(dataGroupedByCover.value))
	const savedPlaylists = useLocalStorage<[SaveablePlaylistId, Playlist][]>('playlists', [])
	const savedPlaylistsMap = computed<Map<SaveablePlaylistId, Playlist>>(() => new Map(savedPlaylists.value))
	const playlistList = computed(() => [
		playlistAll.value,
		...Array.from(savedPlaylistsMap.value.values())
			.sort((a, b) => {
				const weightA = a.id === 'liked' ? 0 : 1
				const weightB = b.id === 'liked' ? 0 : 1
				return weightA - weightB
			}),
	])

	function isCustomPlaylist(id: PlaylistId): id is CustomPlaylistId {
		return id.startsWith('custom:')
	}

	function isAddedInPlaylist(playlistId: PlaylistId, musicSrc: string) {
		const playlist = getPlaylist(playlistId)
		if (playlist == null)
			return false
		return playlist.list.includes(musicSrc)
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
	function createPlaylist(title: string): [id: SaveablePlaylistId, error: null] | [null, error: string] {
		const id = `custom:${Date.now()}` as const

		const playlist: Playlist = {
			id,
			title,
			list: [],
		}
		savedPlaylists.value.push([id, playlist])

		return [id, null]
	}
	function deletePlaylist(id: SaveablePlaylistId) {
		if (id === 'liked') {
			return
		}

		const index = savedPlaylists.value.findIndex(([playlistId]) => playlistId === id)
		if (index !== -1) {
			savedPlaylists.value.splice(index, 1)
		}
	}
	function getPlaylist(id: PlaylistId) {
		if (id === 'all')
			return playlistAll.value
		return savedPlaylistsMap.value.get(id) ?? null
	}
	function findMusicInPlaylistIndex(playlistId: PlaylistId, musicSrc: string) {
		const playlist = getPlaylist(playlistId)
		if (playlist == null)
			return -1
		return playlist.list.indexOf(musicSrc)
	}
	function toggleMusicInPlaylist(playlistId: PlaylistId, musicSrc: string, action?: 'add' | 'remove') {
		const playlist = getPlaylist(playlistId)
		if (playlist == null || playlist.id === 'all')
			return

		const index = playlist.list.indexOf(musicSrc)
		if (index !== -1 && (action === 'remove' || action == null)) {
			playlist.list.splice(index, 1)
			return
		}

		if (index === -1 && (action === 'add' || action == null)) {
			playlist.list.push(musicSrc)
		}
	}

	function isMusicLiked(musicSrc: string) {
		return findMusicInPlaylistIndex('liked', musicSrc) !== -1
	}
	function toggleMusicLike(musicSrc: string) {
		toggleMusicInPlaylist('liked', musicSrc)
	}

	const audioPlayerLogic = useAudioPlayer()
	const currentPlaylist = ref<Playlist | null>(null)
	const currentMusic = computed(() => getMusicData(audioPlayerLogic.currentAudioSrc.value!) ?? null)
	function play(playlistId: PlaylistId, musicSrc?: string): void
	function play(playlist: Playlist, musicSrc?: string): void
	function play(playlistOrId: Playlist | PlaylistId, musicSrc?: string) {
		const playlist = typeof playlistOrId === 'string' ? getPlaylist(playlistOrId) : playlistOrId
		if (playlist == null)
			return

		if (musicSrc != null && (playlist.list.includes(musicSrc) === false))
			return

		currentPlaylist.value = playlist
		audioPlayerLogic.play(playlist.list, musicSrc)

		// ensure the audio is reset
		audioPlayerLogic.currentTime.value = 0
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
			if (savedPlaylists.value.every(([id]) => id !== 'liked')) {
				savedPlaylists.value.unshift(['liked', createLikedPlaylist()])
			}

			savedPlaylists.value = savedPlaylists.value
				.filter(([id, playlist]) => {
					if (id !== 'liked' && (id.startsWith('custom:') === false)) {
						console.warn(`Invalid playlist ID: ${id}`)
						return false
					}
					if (id !== playlist.id) {
						console.warn(`Playlist ID mismatch: ${id} !== ${playlist.id}`)
						return false
					}
					if (playlist.list == null || !Array.isArray(playlist.list)) {
						console.warn(`Invalid playlist: ${id}`)
						return false
					}

					// Ensure all music srcs in the playlist exist in the data
					playlist.list = playlist.list.filter(getMusicData)

					return true
				})
		})

	return {
		getMusicData,
		playlistList,
		savedPlaylists: computed(() => savedPlaylists.value.filter(([, playlist]) => isCustomPlaylist(playlist.id)).map(([, playlist]) => playlist)),
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
		ready,
	}
})

if (import.meta.hot)
	import.meta.hot.accept(acceptHMRUpdate(useMusicStore, import.meta.hot))
