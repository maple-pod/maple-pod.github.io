export interface SavedPreferences {
	volume: number
	muted: boolean
	random: boolean
	repeated: 'off' | 'repeat' | 'repeat-1'
}

export function useAudioPlayer() {
	const savedPreferences = useLocalStorage<SavedPreferences>('preferences', {
		volume: 1,
		muted: false,
		random: false,
		repeated: 'off',
	})

	// ensure the saved preferences are valid
	if (
		savedPreferences.value.volume == null
		|| typeof savedPreferences.value.volume !== 'number'
		|| savedPreferences.value.volume < 0
		|| savedPreferences.value.volume > 1
	) {
		savedPreferences.value.volume = 1
	}
	if (
		savedPreferences.value.muted == null
		|| typeof savedPreferences.value.muted !== 'boolean'
	) {
		savedPreferences.value.muted = false
	}
	if (
		savedPreferences.value.random == null
		|| typeof savedPreferences.value.random !== 'boolean'
	) {
		savedPreferences.value.random = false
	}
	if (
		['off', 'repeat', 'repeat-1'].includes(savedPreferences.value.repeated) === false
	) {
		savedPreferences.value.repeated = 'off'
	}

	const audioLogic = useAudio({
		volume: savedPreferences.value.volume,
		muted: savedPreferences.value.muted,
	})

	const audio = audioLogic.audio
	const currentTime = audioLogic.currentTime
	const duration = audioLogic.duration
	const volume = audioLogic.volume

	const muted = audioLogic.muted
	function toggleMuted(bool?: boolean) {
		muted.value = bool ?? !muted.value
	}

	const {
		state: repeated,
		next: nextRepeated,
	} = useCycleList(['off', 'repeat', 'repeat-1'] as const, {
		initialValue: savedPreferences.value.repeated,
	})
	function toggleRepeated(mode?: 'off' | 'repeat' | 'repeat-1') {
		if (mode == null)
			nextRepeated()
		else
			repeated.value = mode
	}
	watch(
		() => repeated.value === 'repeat-1',
		loop => audioLogic.loop.value = loop,
		{ immediate: true, flush: 'sync' },
	)

	const isPaused = audioLogic.isPaused
	const isWaiting = audioLogic.isWaiting
	const canPlay = audioLogic.canPlay

	const load = useDebounceFn(audioLogic.load, 300)

	const audioQueueLogic = useAudioQueue({
		random: savedPreferences.value.random,
	})

	const random = audioQueueLogic.random
	const toggleRandom = audioQueueLogic.toggleRandom

	const currentAudioSrc = audioQueueLogic.currentAudioSrc
	watch(
		currentAudioSrc,
		(audioSrc) => {
			if (audioSrc == null)
				return

			// stop the current playing audio first
			audioLogic.load('')
			load(audioSrc)
		},
	)

	const play = audioQueueLogic.initQueue
	function togglePlay() {
		if (isPaused.value)
			audioLogic.play()
		else
			audioLogic.pause()
	}
	const goNext = audioQueueLogic.goNext
	function goPrevious() {
		if (currentAudioSrc.value == null)
			return

		if (currentTime.value > 3) {
			currentTime.value = 0
			return
		}

		audioQueueLogic.goPrevious()
	}

	useEventListener(audio, 'ended', () => {
		if (
			(repeated.value === 'off' && audioQueueLogic.hasReachedEnd.value === false)
			|| (repeated.value === 'repeat')
		) {
			goNext()
		}
	})

	const displayQueue = audioQueueLogic.displayQueue
	const addToTemporaryQueue = audioQueueLogic.addToTemporaryQueue
	const removeFromTemporaryQueue = audioQueueLogic.removeFromTemporaryQueue
	const clearTemporaryQueue = audioQueueLogic.clearTemporaryQueue
	const playTempQueueItem = audioQueueLogic.playTempQueueItem
	const playToPlayQueueItem = audioQueueLogic.playToPlayQueueItem

	watch(
		[muted, volume, random, repeated],
		() => {
			savedPreferences.value.muted = muted.value
			savedPreferences.value.volume = volume.value
			savedPreferences.value.random = random.value
			savedPreferences.value.repeated = repeated.value
		},
	)

	// register media session actions
	if ('mediaSession' in navigator) {
		watch(
			isPaused,
			bool => navigator.mediaSession.playbackState = bool ? 'paused' : 'playing',
			{ immediate: true },
		)
		navigator.mediaSession.setActionHandler('play', () => {
			audioLogic.play()
		})
		navigator.mediaSession.setActionHandler('pause', () => {
			audioLogic.pause()
		})
		navigator.mediaSession.setActionHandler('previoustrack', () => {
			goPrevious()
		})
		navigator.mediaSession.setActionHandler('nexttrack', () => {
			goNext()
		})
	}

	return {
		audio,
		currentTime,
		duration,
		volume,

		muted,
		toggleMuted,

		repeated,
		toggleRepeated,

		random,
		toggleRandom,

		isPaused,
		isWaiting,
		canPlay,

		currentAudioSrc,
		togglePlay,
		goNext,
		goPrevious,

		play,

		displayQueue,
		addToTemporaryQueue,
		removeFromTemporaryQueue,
		clearTemporaryQueue,
		playTempQueueItem,
		playToPlayQueueItem,
	}
}
