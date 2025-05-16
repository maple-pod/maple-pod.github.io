import type { MusicData } from '@/types/MusicData'
import type { Playlist, PlaylistId, SaveablePlaylistId } from '@/types/Playlist'
import { ofetch } from 'ofetch'

function createAllPlaylist(data: Map<string, MusicData>): Playlist {
	return { id: 'all', title: 'All', list: Array.from(data.keys()) }
}

function createLikedPlaylist(): Playlist {
	return { id: 'liked', title: 'Liked', list: [] }
}

export const useMusicStore = defineStore('music', () => {
	const {
		state: data,
		isReady: isDataReady,
	} = useAsyncState(
		async () => new Map<string, MusicData>(
			(await ofetch<any[]>('/data/bgm.json'))
				.map<MusicData>(data => ({
					title: data.metadata.title,
					cover: `/mark/${data.mark}.png`,
					source: `/bgm/${data.source.structure}/${data.filename}.mp3`,
					info: {
						maps: data.maps,
					},
				}))
				.map<[string, MusicData]>(data => [data.source, data]),
		),
		new Map<string, MusicData>(),
	)

	function getMusicData(source: string): MusicData | undefined {
		return data.value.get(source)
	}

	const playlistAll = computed(() => createAllPlaylist(data.value))
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
	function findMusicInPlaylistIndex(playlistId: PlaylistId, musicSource: string) {
		const playlist = getPlaylist(playlistId)
		if (playlist == null)
			return -1
		return playlist.list.indexOf(musicSource)
	}
	function toggleMusicInPlaylist(playlistId: SaveablePlaylistId, musicSource: string) {
		const playlist = getPlaylist(playlistId)
		if (playlist == null)
			return

		const index = playlist.list.indexOf(musicSource)
		if (index !== -1) {
			playlist.list.splice(index, 1)
			return
		}

		if (index === -1) {
			playlist.list.push(musicSource)
		}
	}

	function isMusicLiked(musicSource: string) {
		return findMusicInPlaylistIndex('liked', musicSource) !== -1
	}
	function toggleMusicLike(musicSource: string) {
		toggleMusicInPlaylist('liked', musicSource)
	}

	const audioPlayerLogic = useAudioPlayer()
	const currentPlaylist = ref<Playlist | null>(null)
	const currentMusic = computed(() => getMusicData(audioPlayerLogic.currentAudioSrc.value!) ?? null)
	function play(playlist: Playlist, musicSource?: string) {
		if (musicSource != null && (playlist.list.includes(musicSource) === false))
			return

		currentPlaylist.value = playlist
		audioPlayerLogic.play(playlist.list, musicSource)

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
					artist: 'BGM',
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

					// Ensure all music sources in the playlist exist in the data
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
