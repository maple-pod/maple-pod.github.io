import type { MusicData } from '@/types/MusicData'
import type { Playlist, PlaylistId, SaveablePlaylistId } from '@/types/Playlist'
import type { SavedPreferences } from '@/types/SavedPreferences'
import type { HowlOptions } from 'howler'
import { Howl } from 'howler'

function createAllPlaylist(data: Map<string, MusicData>): Playlist {
	return { id: 'all', title: 'All', list: Array.from(data.keys()) }
}

function createLikedPlaylist(): Playlist {
	return { id: 'liked', title: 'Liked', list: [] }
}

export const useMusicPlayerStore = defineStore('musicPlayer', () => {
	const loadedHowl = shallowRef<Howl | null>(null)

	// #region Preferences
	const [muteState, pressMute] = useToggle(false)

	const volume = ref(1)
	watch(
		volume,
		() => {
			if (loadedHowl.value == null)
				return
			loadedHowl.value.volume(volume.value)
		},
	)
	watch(
		muteState,
		() => {
			if (loadedHowl.value == null)
				return
			if (muteState.value === true) {
				loadedHowl.value.mute(true)
			}
			else {
				loadedHowl.value.mute(false)
				loadedHowl.value.volume(volume.value)
			}
		},
	)

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
		if (loadedHowl.value == null)
			return

		switch (newState) {
			case 'off':
			case 'repeat':
				loadedHowl.value.loop(false)
				break
			case 'repeat-1':
				loadedHowl.value.loop(true)
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
	const isPlaying = ref(false)
	const isLoading = ref(false)
	const duration = ref(0)
	const _current = ref(0)
	const current = computed({
		get: () => _current.value,
		set: (value) => {
			_current.value = value

			if (loadedHowl.value == null)
				return

			loadedHowl.value.seek(value)
		},
	})
	useRafFn(() => {
		if (loadedHowl.value == null)
			return

		_current.value = loadedHowl.value.seek()
	})

	function pressPlay(state?: boolean) {
		if (loadedHowl.value == null)
			return

		const method = state == null
			? isPlaying.value
				? 'pause'
				: 'play'
			: state
				? 'play'
				: 'pause'
		loadedHowl.value[method]()
	}

	function resetMusic() {
		if (loadedHowl.value != null) {
			loadedHowl.value.unload()
			loadedHowl.value = null
		}

		isPlaying.value = false
		isLoading.value = false
		current.value = 0
		duration.value = 0
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

	const callbacks: Omit<HowlOptions, 'src'> = {
		onplay: () => isPlaying.value = true,
		onpause: () => isPlaying.value = false,
		onend: () => {
			isPlaying.value = false
			if (repeatState.value === 'repeat')
				pressNext()
		},
		onstop: () => isPlaying.value = false,
	}
	const loadHowl = useDebounceFn(async () => {
		const source = currentMusicSource.value
		const musicData = getMusicData(source)
		if (musicData == null)
			return

		const howl = await new Promise<Howl | null>((resolve) => {
			try {
				const instance = new Howl({
					src: musicData.source,
					html5: true,
					volume: volume.value,
					mute: muteState.value,
					loop: repeatState.value === 'repeat-1',
					autoplay: false,
					...callbacks,
					onload: () => resolve(instance),
					onloaderror: (id, err) => {
						console.error('Error loading music:', id, err)
						resolve(null)
					},
				})
			}
			catch (err) {
				console.error('Error creating Howl instance:', err)
				resolve(null)
			}
		})

		if (howl == null || currentMusicSource.value !== source) {
			howl?.unload()
			return
		}

		loadedHowl.value = howl
		duration.value = howl.duration()
		howl.play()
	}, 500)
	watch(
		currentMusicSource,
		async () => {
			resetMusic()
			loadHowl()
		},
	)
	// #endregion

	if ('mediaSession' in navigator) {
		watch(
			isPlaying,
			(bool) => {
				navigator.mediaSession.playbackState = bool ? 'playing' : 'paused'
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
		loadedHowl,
		isPlaying,
		isLoading,
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
