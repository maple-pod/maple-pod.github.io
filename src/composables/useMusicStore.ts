import type { MusicData } from '@/types/MusicData'
import type { Playlist, PlaylistId, SaveablePlaylistId } from '@/types/Playlist'
import { ofetch } from 'ofetch'

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
		async () => (await ofetch<any[]>('/data/data.json'))
			.map<MusicData>((data) => {
				const mark = data.marks.filter((m: string) => m !== 'None')[0]
				return {
					title: data.title,
					cover: mark == null
						? '/logo.png'
						: `/mark/${mark}.png`,
					src: `/bgm/${data.src}`,
				}
			}),
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

	function getPlaylist(id: PlaylistId) {
		if (id === 'all')
			return playlistAll.value
		return savedPlaylistsMap.value.get(id) ?? null
	}
	function findMusicInPlaylistIndex(playlistId: PlaylistId, musicsrc: string) {
		const playlist = getPlaylist(playlistId)
		if (playlist == null)
			return -1
		return playlist.list.indexOf(musicsrc)
	}
	function toggleMusicInPlaylist(playlistId: SaveablePlaylistId, musicsrc: string) {
		const playlist = getPlaylist(playlistId)
		if (playlist == null)
			return

		const index = playlist.list.indexOf(musicsrc)
		if (index !== -1) {
			playlist.list.splice(index, 1)
			return
		}

		if (index === -1) {
			playlist.list.push(musicsrc)
		}
	}

	function isMusicLiked(musicsrc: string) {
		return findMusicInPlaylistIndex('liked', musicsrc) !== -1
	}
	function toggleMusicLike(musicsrc: string) {
		toggleMusicInPlaylist('liked', musicsrc)
	}

	const audioPlayerLogic = useAudioPlayer()
	const currentPlaylist = ref<Playlist | null>(null)
	const currentMusic = computed(() => getMusicData(audioPlayerLogic.currentAudioSrc.value!) ?? null)
	function play(playlist: Playlist, musicsrc?: string) {
		if (musicsrc != null && (playlist.list.includes(musicsrc) === false))
			return

		currentPlaylist.value = playlist
		audioPlayerLogic.play(playlist.list, musicsrc)

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
			if (savedPlaylists.value.some(([id]) => id === 'liked') === false) {
				savedPlaylists.value.unshift(['liked', createLikedPlaylist()])
			}

			savedPlaylists.value = savedPlaylists.value
				.filter(([id, playlist]) => {
					if (id !== 'liked' && (id.startsWith('custom-') === false)) {
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
		getPlaylist,
		findMusicInPlaylistIndex,
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
