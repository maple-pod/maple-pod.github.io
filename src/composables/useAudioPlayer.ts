export function useAudioPlayer() {
	const {
		volume: savedVolume,
		muted: savedMuted,
		random: savedRandom,
		repeated: savedRepeated,
	} = useSavedUserData()

	// ensure the saved preferences are valid
	if (
		savedVolume.value == null
		|| typeof savedVolume.value !== 'number'
		|| savedVolume.value < 0
		|| savedVolume.value > 1
	) {
		savedVolume.value = 1
	}
	if (
		savedMuted.value == null
		|| typeof savedMuted.value !== 'boolean'
	) {
		savedMuted.value = false
	}
	if (
		savedRandom.value == null
		|| typeof savedRandom.value !== 'boolean'
	) {
		savedRandom.value = false
	}
	if (
		['off', 'repeat', 'repeat-1'].includes(savedRepeated.value) === false
	) {
		savedRepeated.value = 'off'
	}

	const audioLogic = useAudio({
		volume: savedVolume.value,
		muted: savedMuted.value,
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
		initialValue: savedRepeated.value,
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
		random: savedRandom.value,
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
			savedMuted.value = muted.value
			savedVolume.value = volume.value
			savedRandom.value = random.value
			savedRepeated.value = repeated.value
		},
	)

	// register media session actions
	if ('mediaSession' in navigator) {
		watch(
			isPaused,
			bool => navigator.mediaSession.playbackState = bool ? 'paused' : 'playing',
			{ immediate: true },
		)
		watch(
			[currentTime, duration],
			() => {
				navigator.mediaSession.setPositionState({
					duration: duration.value,
					playbackRate: 1,
					position: currentTime.value,
				})
			},
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
