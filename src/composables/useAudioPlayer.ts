type AudioPlayerSource = string | {
	src: string
	normalizationGainDb?: number
	release?: () => void
}

export function useAudioPlayer({
	getAudioSrc,
	isMusicDisabled,
}: {
	getAudioSrc: (id: string | null) => AudioPlayerSource | null | Promise<AudioPlayerSource | null>
	isMusicDisabled: (id: string | null) => boolean
}) {
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
		autoplay: false,
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
	const hasError = audioLogic.hasError
	const normalizationSupported = audioLogic.normalizationSupported
	const normalizationEnabled = audioLogic.normalizationEnabled
	const normalizationGainDb = audioLogic.normalizationGainDb

	const TRACK_SWITCH_FADE_MS = 30
	let sourceRequestId = 0
	let releaseCurrentSource: (() => void) | null = null

	const audioQueueLogic = useAudioQueue({
		isMusicDisabled,
		random: savedRandom.value,
	})

	const random = audioQueueLogic.random
	const toggleRandom = audioQueueLogic.toggleRandom

	const currentAudioId = audioQueueLogic.current
	watch(
		currentAudioId,
		async (audioId) => {
			const requestId = ++sourceRequestId
			const resolvedSource = await getAudioSrc(audioId)
			const source = typeof resolvedSource === 'string'
				? { src: resolvedSource }
				: resolvedSource

			if (requestId !== sourceRequestId) {
				source?.release?.()
				return
			}

			await audioLogic.fadeOutputTo(0, TRACK_SWITCH_FADE_MS)
			if (requestId !== sourceRequestId) {
				source?.release?.()
				return
			}

			releaseCurrentSource?.()
			releaseCurrentSource = null
			audioLogic.setNormalizationGainDb(source?.normalizationGainDb ?? 0)

			if (source == null) {
				audioLogic.unload()
				return
			}

			releaseCurrentSource = source.release ?? null
			audioLogic.load(source.src)
			const playbackStarted = audioLogic.play()
			if (audio.value.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
				await until(computed(() => canPlay.value || hasError.value))
					.toBe(true)
			}

			if (requestId !== sourceRequestId)
				return
			if (hasError.value || await playbackStarted === false) {
				await audioLogic.fadeOutputTo(1, 0)
				return
			}
			if (requestId !== sourceRequestId)
				return
			await audioLogic.fadeOutputTo(1, TRACK_SWITCH_FADE_MS)
		},
	)

	tryOnScopeDispose(() => {
		releaseCurrentSource?.()
		releaseCurrentSource = null
	})

	function play(...args: Parameters<typeof audioQueueLogic.initQueue>) {
		audioLogic.preparePlayback()
		return audioQueueLogic.initQueue(...args)
	}
	function togglePlay() {
		if (isPaused.value)
			audioLogic.play()
		else
			audioLogic.pause()
	}
	const goNext = audioQueueLogic.goNext
	function goPrevious() {
		if (currentAudioId.value == null)
			return

		if (currentTime.value > 3) {
			currentTime.value = 0
			return
		}

		audioQueueLogic.goPrevious()
	}

	useEventListener(audio, 'ended', () => {
		if (repeated.value === 'off' && audioQueueLogic.hasReachedEnd.value === false) {
			goNext()
			return
		}

		if (repeated.value === 'repeat') {
			const previousAudioId = currentAudioId.value
			goNext()
			if (currentAudioId.value === previousAudioId) {
				currentTime.value = 0
				audioLogic.play()
			}
		}
	})

	const toPlayQueue = audioQueueLogic.toPlayQueue
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

	return {
		audio,
		currentTime,
		duration,
		volume,

		normalizationSupported,
		normalizationEnabled,
		normalizationGainDb,
		setNormalizationEnabled: audioLogic.setNormalizationEnabled,
		setNormalizationGainDb: audioLogic.setNormalizationGainDb,

		muted,
		toggleMuted,

		repeated,
		toggleRepeated,

		random,
		toggleRandom,

		isPaused,
		isWaiting,
		canPlay,

		currentAudioId,
		togglePlay,
		goNext,
		goPrevious,

		play,

		toPlayQueue,
		playToPlayQueueItem,
	}
}
