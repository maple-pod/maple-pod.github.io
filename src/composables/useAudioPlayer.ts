import type { AudioPlaybackBackendFactory } from './useAudioPlaybackBackend'

type AudioPlayerSource = string | {
	src: string
	normalizationGainDb?: number
	release?: () => void
}

export function useAudioPlayer({
	getAudioSrc,
	isMusicDisabled,
	createPlaybackBackend = useHtmlAudioPlaybackBackend,
}: {
	getAudioSrc: (id: string | null) => AudioPlayerSource | null | Promise<AudioPlayerSource | null>
	isMusicDisabled: (id: string | null) => boolean
	createPlaybackBackend?: AudioPlaybackBackendFactory
}) {
	const {
		volume: savedVolume,
		muted: savedMuted,
		random: savedRandom,
		repeated: savedRepeated,
	} = useSavedUserData()

	if (
		savedVolume.value == null
		|| typeof savedVolume.value !== 'number'
		|| savedVolume.value < 0
		|| savedVolume.value > 1
	) {
		savedVolume.value = 1
	}
	if (savedMuted.value == null || typeof savedMuted.value !== 'boolean')
		savedMuted.value = false
	if (savedRandom.value == null || typeof savedRandom.value !== 'boolean')
		savedRandom.value = false
	if (!['off', 'repeat', 'repeat-1'].includes(savedRepeated.value))
		savedRepeated.value = 'off'

	const playbackBackend = createPlaybackBackend({
		autoplay: false,
		volume: savedVolume.value,
		muted: savedMuted.value,
	})
	const currentTime = playbackBackend.currentTime
	const duration = playbackBackend.duration
	const volume = playbackBackend.volume
	const muted = playbackBackend.muted

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
		loop => playbackBackend.loop.value = loop,
		{ immediate: true, flush: 'sync' },
	)

	const TRACK_SWITCH_FADE_MS = 30
	let sourceRequestId = 0
	let candidateBackendRequestId: number | null = null
	let releaseCurrentSource: (() => void) | null = null

	const audioQueueLogic = useAudioQueue({
		isMusicDisabled,
		random: savedRandom.value,
	})
	const random = audioQueueLogic.random
	const toggleRandom = audioQueueLogic.toggleRandom
	const currentAudioId = ref<string | null>(null)
	const playbackRequest = ref<{ id: number, audioId: string } | null>(null)

	watch(
		playbackRequest,
		async (request) => {
			if (request == null)
				return

			const { id: requestId, audioId } = request
			const resolvedSource = await getAudioSrc(audioId)
			const source = typeof resolvedSource === 'string'
				? { src: resolvedSource }
				: resolvedSource

			if (requestId !== sourceRequestId) {
				source?.release?.()
				return
			}

			await playbackBackend.fadeOutputTo(0, TRACK_SWITCH_FADE_MS)
			if (requestId !== sourceRequestId) {
				source?.release?.()
				return
			}

			if (source == null) {
				await playbackBackend.fadeOutputTo(1, 0)
				return
			}

			const candidateSource = source
			const releasePreviousSource = releaseCurrentSource
			async function discardLoadedCandidate() {
				candidateSource.release?.()
				if (candidateBackendRequestId !== requestId)
					return

				candidateBackendRequestId = null
				releasePreviousSource?.()
				releaseCurrentSource = null
				currentAudioId.value = null
				playbackBackend.unload()
				await playbackBackend.fadeOutputTo(1, 0)
			}

			playbackBackend.setNormalizationGainDb(candidateSource.normalizationGainDb ?? 0)
			candidateBackendRequestId = requestId
			playbackBackend.load(candidateSource.src)
			const playbackStarted = playbackBackend.play()
			await playbackBackend.waitUntilReady()

			if (requestId !== sourceRequestId) {
				await discardLoadedCandidate()
				return
			}
			if (playbackBackend.hasError.value || await playbackStarted === false) {
				await discardLoadedCandidate()
				return
			}
			if (requestId !== sourceRequestId) {
				await discardLoadedCandidate()
				return
			}

			releasePreviousSource?.()
			candidateBackendRequestId = null
			releaseCurrentSource = candidateSource.release ?? null
			currentTime.value = 0
			currentAudioId.value = audioId
			await playbackBackend.fadeOutputTo(1, TRACK_SWITCH_FADE_MS)
		},
	)

	function requestQueueCandidate(audioId: string | null) {
		if (audioId != null) {
			const id = ++sourceRequestId
			playbackRequest.value = { id, audioId }
		}
		return audioId
	}

	function play(...args: Parameters<typeof audioQueueLogic.initQueue>) {
		playbackBackend.preparePlayback()
		return requestQueueCandidate(audioQueueLogic.initQueue(...args))
	}
	function togglePlay() {
		if (playbackBackend.isPaused.value)
			void playbackBackend.play()
		else
			playbackBackend.pause()
	}
	function goNext() {
		return requestQueueCandidate(audioQueueLogic.goNext())
	}
	function goPrevious() {
		if (currentAudioId.value == null)
			return

		if (currentTime.value > 3) {
			currentTime.value = 0
			return
		}

		requestQueueCandidate(audioQueueLogic.goPrevious())
	}

	const stopEndedListener = playbackBackend.onEnded(() => {
		if (repeated.value === 'off' && !audioQueueLogic.hasReachedEnd.value) {
			goNext()
			return
		}

		if (repeated.value === 'repeat') {
			const previousAudioId = currentAudioId.value
			const nextAudioId = goNext()
			if (nextAudioId == null || nextAudioId === previousAudioId) {
				currentTime.value = 0
				void playbackBackend.play()
			}
		}
	})

	tryOnScopeDispose(() => {
		stopEndedListener()
		releaseCurrentSource?.()
		releaseCurrentSource = null
	})

	const toPlayQueue = audioQueueLogic.toPlayQueue
	function playToPlayQueueItem(audioId: string) {
		return requestQueueCandidate(audioQueueLogic.playToPlayQueueItem(audioId))
	}

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
		currentTime,
		duration,
		volume,

		normalizationSupported: playbackBackend.normalizationSupported,
		normalizationEnabled: playbackBackend.normalizationEnabled,
		normalizationGainDb: playbackBackend.normalizationGainDb,
		setNormalizationEnabled: playbackBackend.setNormalizationEnabled,
		setNormalizationGainDb: playbackBackend.setNormalizationGainDb,

		muted,
		toggleMuted,

		repeated,
		toggleRepeated,

		random,
		toggleRandom,

		isPaused: playbackBackend.isPaused,
		isWaiting: playbackBackend.isWaiting,
		canPlay: playbackBackend.canPlay,

		currentAudioId,
		togglePlay,
		goNext,
		goPrevious,

		play,

		toPlayQueue,
		playToPlayQueueItem,
		onSeeked: playbackBackend.onSeeked,
	}
}
