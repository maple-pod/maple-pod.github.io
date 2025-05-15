import type { MusicData } from '@/types/MusicData'
import type { Playlist, PlaylistId, SaveablePlaylistId } from '@/types/Playlist'
import type { SavedPreferences } from '@/types/SavedPreferences'

function createAllPlaylist(data: Map<string, MusicData>): Playlist {
	return { id: 'all', title: 'All', list: Array.from(data.keys()) }
}

function createLikedPlaylist(): Playlist {
	return { id: 'liked', title: 'Liked', list: [] }
}

export const useMusicPlayerStore = defineStore('musicPlayer', () => {
	const audioLogic = useAudio()

	// #region Preferences
	const [muteState, pressMute] = [audioLogic.muted, (bool?: boolean) => audioLogic.muted.value = bool ?? !audioLogic.muted.value]
	const volume = audioLogic.volume

	const [randomState, pressRandom] = useToggle(false)

	const { state: repeatState, next: nextRepeatState } = useCycleList(['off', 'repeat', 'repeat-1'] as const)
	function pressRepeat(state?: 'off' | 'repeat' | 'repeat-1') {
		if (state == null) {
			nextRepeatState()
			return
		}

		repeatState.value = state
	}
	watch(repeatState, (newState) => {
		switch (newState) {
			case 'off':
			case 'repeat':
				audioLogic.loop.value = false
				break
			case 'repeat-1':
				audioLogic.loop.value = true
				break
		}
	})

	const savedPreferences = useLocalStorage<SavedPreferences>('preferences', {
		volume: 1,
		mute: false,
		random: false,
		repeat: 'off',
	})
	volume.value = savedPreferences.value.volume
	pressMute(savedPreferences.value.mute)
	pressRandom(savedPreferences.value.random)
	pressRepeat(savedPreferences.value.repeat)
	watch(
		[muteState, volume, randomState, repeatState],
		() => {
			savedPreferences.value.mute = muteState.value
			savedPreferences.value.volume = volume.value
			savedPreferences.value.random = randomState.value
			savedPreferences.value.repeat = repeatState.value
		},
	)
	// #endregion

	// #region Music
	const isPaused = audioLogic.isPaused
	const duration = audioLogic.duration
	const current = audioLogic.currentTime

	function pressPlay(bool?: boolean) {
		const method = bool == null
			? isPaused.value
				? 'play'
				: 'pause'
			: bool
				? 'play'
				: 'pause'
		audioLogic[method]()
	}
	// #endregion

	// #region Playlist
	const appStore = useAppStore()
	const { data } = storeToRefs(appStore)
	const { getMusicData } = appStore
	const playlistAll = computed(() => createAllPlaylist(data.value))
	const savedPlaylists = useLocalStorage<[SaveablePlaylistId, Playlist][]>('playlists', [['liked', createLikedPlaylist()]])
	const savedPlaylistsMap = computed<Map<SaveablePlaylistId, Playlist>>(() => new Map(savedPlaylists.value))

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

	const playingQueue = ref<string[]>([])
	const currentPlaylistId = ref<PlaylistId | null>(null)
	const currentPlaylist = computed(() => {
		if (currentPlaylistId.value == null)
			return null
		return getPlaylist(currentPlaylistId.value)
	})
	const {
		state: currentMusicSource,
		prev: _pressPrev,
		next: _pressNext,
	} = useCycleList(playingQueue)
	const currentMusic = computed<MusicData | null>(() => {
		if (currentMusicSource.value == null)
			return null
		return getMusicData(currentMusicSource.value) ?? null
	})
	function pressPrev() {
		if (current.value >= 3) {
			current.value = 0
			return
		}
		_pressPrev()
	}

	function pressNext() {
		_pressNext()
	}
	useEventListener(
		audioLogic.audio,
		'ended',
		() => {
			if (repeatState.value === 'repeat')
				pressNext()
		},
	)

	function pressMusicItem({ source, playlistId }: { source: string, playlistId: PlaylistId }) {
		const musicData = getMusicData(source)
		const playlist = getPlaylist(playlistId)
		if (
			musicData == null
			|| playlist == null
			|| playlist.list.includes(source) === false
		) {
			return
		}

		if (
			currentMusicSource.value === source
			&& currentPlaylistId.value === playlistId
		) {
			pressPlay()
			return
		}

		if (playlistId !== currentPlaylistId.value) {
			currentPlaylistId.value = playlistId
			playingQueue.value = playlist.list
		}

		currentMusicSource.value = source
	}

	watch(
		currentMusicSource,
		async () => {
			audioLogic.load(currentMusicSource.value)
		},
		{ immediate: true },
	)
	// #endregion

	if ('mediaSession' in navigator) {
		watch(
			currentMusic,
			(music) => {
				if (music == null)
					return

				navigator.mediaSession.metadata = new MediaMetadata({
					title: music.title,
					artist: 'Maple Story',
					artwork: [
						{ src: music.cover, sizes: '512x512', type: 'image/png' },
					],
				})
			},
			{ immediate: true },
		)
		watch(
			isPaused,
			(bool) => {
				navigator.mediaSession.playbackState = bool ? 'paused' : 'playing'
			},
			{ immediate: true },
		)
		navigator.mediaSession.setActionHandler('play', () => {
			pressPlay(true)
		})
		navigator.mediaSession.setActionHandler('pause', () => {
			pressPlay(false)
		})
		navigator.mediaSession.setActionHandler('previoustrack', () => {
			pressPrev()
		})
		navigator.mediaSession.setActionHandler('nexttrack', () => {
			pressNext()
		})
	}

	return {
		playingQueue,
		currentPlaylistId,
		currentPlaylist,
		getPlaylist,
		isMusicLiked,
		toggleMusicLike,
		currentMusicSource,
		currentMusic,

		canPlay: audioLogic.canPlay,
		isPaused,
		duration,
		current,
		volume,

		pressMusicItem,
		pressPrev,
		pressNext,
		pressPlay,

		repeatState,
		pressRepeat,
		randomState,
		pressRandom,
		muteState,
		pressMute,
	}
})

if (import.meta.hot) {
	import.meta.hot.accept(acceptHMRUpdate(useMusicPlayerStore, import.meta.hot))
}
