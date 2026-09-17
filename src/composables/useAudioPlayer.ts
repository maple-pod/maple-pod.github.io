import type { AudioPlaybackBackend, AudioPlaybackBackendFactory } from './useAudioPlaybackBackend'
import type { AudioQueueCandidate } from './useAudioQueue'

type AudioPlayerSource = string | {
	src: string
	normalizationGainDb?: number
	release?: () => void
}

interface ManagedPlaybackBackend {
	backend: AudioPlaybackBackend
	dispose: () => void
	disposed: Promise<void>
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

	const volume = ref(savedVolume.value)
	const muted = ref(savedMuted.value)
	const normalizationEnabled = ref(false)
	const normalizationGainDb = ref(0)
	const currentAudioId = ref<string | null>(null)

	const {
		state: repeated,
		next: nextRepeated,
	} = useCycleList(['off', 'repeat', 'repeat-1'] as const, {
		initialValue: savedRepeated.value,
	})

	function createManagedPlaybackBackend(): ManagedPlaybackBackend {
		const scope = effectScope()
		let isDisposed = false
		let resolveDisposed!: () => void
		const disposed = new Promise<void>(resolve => resolveDisposed = resolve)
		const backend = scope.run(() => createPlaybackBackend({
			autoplay: false,
			volume: volume.value,
			muted: muted.value,
			loop: repeated.value === 'repeat-1',
		}))
		if (backend == null)
			throw new Error('Audio playback backend could not be created.')
		backend.setNormalizationEnabled(normalizationEnabled.value)
		return {
			backend,
			disposed,
			dispose: () => {
				if (isDisposed)
					return
				isDisposed = true
				scope.stop()
				resolveDisposed()
			},
		}
	}

	const activePlayback = shallowRef(createManagedPlaybackBackend())
	const pendingPlaybacks = new Set<ManagedPlaybackBackend>()
	const pendingSourceReleases = new Set<() => void>()
	let releaseCurrentSource: (() => void) | null = null
	let sourceRequestId = 0
	let navigationCandidate: AudioQueueCandidate | null = null
	let navigationDirection: 'next' | 'previous' = 'next'
	let navigationOnCommit: (() => void) | undefined
	let navigationWrapNext = true
	let navigationRestartCurrentOnFailure = false
	let activeEndedWhilePending = false
	let disposed = false

	const currentTime = computed({
		get: () => activePlayback.value.backend.currentTime.value,
		set: (value) => {
			cancelPendingTransition()
			activePlayback.value.backend.currentTime.value = value
		},
	})
	const duration = computed(() => activePlayback.value.backend.duration.value)
	const isPaused = computed(() => activePlayback.value.backend.isPaused.value)
	const isWaiting = computed(() => activePlayback.value.backend.isWaiting.value)
	const canPlay = computed(() => activePlayback.value.backend.canPlay.value)
	const normalizationSupported = computed(() => activePlayback.value.backend.normalizationSupported.value)

	function setNormalizationEnabled(enabled: boolean) {
		normalizationEnabled.value = enabled
		activePlayback.value.backend.setNormalizationEnabled(enabled)
		for (const playback of pendingPlaybacks)
			playback.backend.setNormalizationEnabled(enabled)
	}

	function setNormalizationGainDb(gainDb: number) {
		normalizationGainDb.value = gainDb
		activePlayback.value.backend.setNormalizationGainDb(gainDb)
	}

	function toggleMuted(bool?: boolean) {
		muted.value = bool ?? !muted.value
	}

	function toggleRepeated(mode?: 'off' | 'repeat' | 'repeat-1') {
		if (mode == null)
			nextRepeated()
		else
			repeated.value = mode
	}

	const audioQueueLogic = useAudioQueue({
		isMusicDisabled,
		random: savedRandom.value,
	})
	const random = audioQueueLogic.random

	function cancelPendingTransition() {
		sourceRequestId++
		navigationCandidate = null
		navigationDirection = 'next'
		navigationOnCommit = undefined
		navigationWrapNext = true
		navigationRestartCurrentOnFailure = false
		activeEndedWhilePending = false
		for (const release of [...pendingSourceReleases])
			release()
		for (const playback of [...pendingPlaybacks])
			disposeCandidatePlayback(playback)
	}

	function toggleRandom(bool?: boolean) {
		const pendingCandidate = navigationCandidate
		const pendingDirection = navigationDirection
		const pendingOnCommit = navigationOnCommit
		const pendingWrapNext = navigationWrapNext
		const pendingRestartCurrentOnFailure = navigationRestartCurrentOnFailure
		cancelPendingTransition()
		audioQueueLogic.toggleRandom(bool)
		if (pendingCandidate == null)
			return

		requestQueueCandidate(
			audioQueueLogic.initQueue(pendingCandidate.state.originalAudioIdList, pendingCandidate.audioId),
			pendingOnCommit,
			{
				direction: pendingDirection,
				wrapNext: pendingWrapNext,
				restartCurrentOnFailure: pendingRestartCurrentOnFailure,
			},
		)
	}

	watch(
		[volume, muted],
		([nextVolume, nextMuted]) => {
			activePlayback.value.backend.volume.value = nextVolume
			activePlayback.value.backend.muted.value = nextMuted
			for (const playback of pendingPlaybacks) {
				playback.backend.volume.value = nextVolume
				playback.backend.muted.value = nextMuted
			}
		},
		{ flush: 'sync' },
	)
	watch(
		() => repeated.value === 'repeat-1',
		(loop) => {
			activePlayback.value.backend.loop.value = loop
			for (const playback of pendingPlaybacks)
				playback.backend.loop.value = loop
		},
		{ immediate: true, flush: 'sync' },
	)

	const TRACK_SWITCH_FADE_MS = 30
	const seekedListeners = new Set<() => void>()
	let stopActiveEndedListener = () => {}
	let stopActiveSeekedListener = () => {}

	function bindActivePlaybackListeners() {
		stopActiveEndedListener()
		stopActiveSeekedListener()
		stopActiveEndedListener = activePlayback.value.backend.onEnded(handleEnded)
		stopActiveSeekedListener = activePlayback.value.backend.onSeeked(() => {
			for (const listener of seekedListeners)
				listener()
		})
	}

	function trackSourceRelease(source: Exclude<AudioPlayerSource, string>) {
		let released = false
		const release = () => {
			if (released)
				return
			released = true
			pendingSourceReleases.delete(release)
			source.release?.()
		}
		pendingSourceReleases.add(release)
		return {
			release,
			promote: () => pendingSourceReleases.delete(release),
		}
	}

	function disposeCandidatePlayback(playback: ManagedPlaybackBackend) {
		pendingPlaybacks.delete(playback)
		playback.dispose()
	}

	function nextUnattemptedCandidate(
		candidate: AudioQueueCandidate,
		attempted: Set<string>,
		direction: 'next' | 'previous',
		wrapNext: boolean,
	) {
		let next: AudioQueueCandidate | null = candidate
		const maxAttempts = candidate.state.originalAudioIdList.length
		for (let index = 0; index < maxAttempts; index++) {
			next = direction === 'previous'
				? audioQueueLogic.goPrevious(next)
				: audioQueueLogic.goNext(next, wrapNext)
			if (next == null)
				return null
			if (!attempted.has(next.audioId) && next.audioId !== currentAudioId.value)
				return next
		}
		return null
	}

	async function transitionToCandidate(
		requestId: number,
		initialCandidate: AudioQueueCandidate,
		direction: 'next' | 'previous',
		wrapNext: boolean,
		restartCurrentOnFailure: boolean,
		onCommit?: () => void,
	) {
		const attempted = new Set<string>()
		let candidate: AudioQueueCandidate | null = initialCandidate

		while (candidate != null) {
			if (requestId !== sourceRequestId || disposed)
				return
			if (candidate.audioId === currentAudioId.value && !activePlayback.value.backend.hasError.value) {
				const backend = activePlayback.value.backend
				const previousTime = backend.currentTime.value
				backend.currentTime.value = 0
				const playbackStarted = await backend.play()
				if (requestId !== sourceRequestId || disposed)
					return
				if (!playbackStarted || backend.hasError.value || backend.hasEnded.value) {
					backend.currentTime.value = previousTime
					navigationCandidate = null
					activeEndedWhilePending = false
					return
				}

				audioQueueLogic.commit(candidate)
				navigationCandidate = null
				activeEndedWhilePending = false
				onCommit?.()
				return
			}
			if (attempted.has(candidate.audioId))
				break
			attempted.add(candidate.audioId)
			navigationCandidate = candidate

			let resolvedSource: AudioPlayerSource | null
			try {
				resolvedSource = await getAudioSrc(candidate.audioId)
			}
			catch {
				if (requestId !== sourceRequestId || disposed)
					return
				candidate = nextUnattemptedCandidate(candidate, attempted, direction, wrapNext)
				continue
			}

			const source = typeof resolvedSource === 'string'
				? { src: resolvedSource }
				: resolvedSource
			if (requestId !== sourceRequestId || disposed) {
				source?.release?.()
				return
			}
			if (source == null) {
				candidate = nextUnattemptedCandidate(candidate, attempted, direction, wrapNext)
				continue
			}

			const sourceRelease = trackSourceRelease(source)
			const candidatePlayback = createManagedPlaybackBackend()
			pendingPlaybacks.add(candidatePlayback)
			const candidateBackend = candidatePlayback.backend
			candidateBackend.setNormalizationGainDb(source.normalizationGainDb ?? 0)
			await candidateBackend.fadeOutputTo(0, 0)
			candidateBackend.load(source.src)
			const playbackStartedPromise = candidateBackend.play()
			await candidateBackend.waitUntilReady()

			if (requestId !== sourceRequestId || disposed) {
				sourceRelease.release()
				disposeCandidatePlayback(candidatePlayback)
				return
			}
			if (candidateBackend.hasError.value || candidateBackend.hasEnded.value) {
				sourceRelease.release()
				disposeCandidatePlayback(candidatePlayback)
				candidate = nextUnattemptedCandidate(candidate, attempted, direction, wrapNext)
				continue
			}

			const playbackStarted = await Promise.race([
				playbackStartedPromise,
				candidatePlayback.disposed.then(() => null),
			])
			if (playbackStarted == null || requestId !== sourceRequestId || disposed) {
				sourceRelease.release()
				disposeCandidatePlayback(candidatePlayback)
				return
			}
			if (playbackStarted === false) {
				sourceRelease.release()
				disposeCandidatePlayback(candidatePlayback)
				candidate = nextUnattemptedCandidate(candidate, attempted, direction, wrapNext)
				continue
			}

			const previousPlayback = activePlayback.value
			await previousPlayback.backend.fadeOutputTo(0, TRACK_SWITCH_FADE_MS)
			if (requestId !== sourceRequestId || disposed) {
				await previousPlayback.backend.fadeOutputTo(1, TRACK_SWITCH_FADE_MS)
				sourceRelease.release()
				disposeCandidatePlayback(candidatePlayback)
				return
			}
			if (candidateBackend.hasError.value || candidateBackend.hasEnded.value) {
				await previousPlayback.backend.fadeOutputTo(1, TRACK_SWITCH_FADE_MS)
				sourceRelease.release()
				disposeCandidatePlayback(candidatePlayback)
				candidate = nextUnattemptedCandidate(candidate, attempted, direction, wrapNext)
				continue
			}

			candidateBackend.volume.value = volume.value
			candidateBackend.muted.value = muted.value
			candidateBackend.loop.value = repeated.value === 'repeat-1'
			candidateBackend.setNormalizationEnabled(normalizationEnabled.value)
			candidateBackend.setNormalizationGainDb(source.normalizationGainDb ?? 0)
			candidateBackend.currentTime.value = 0

			pendingPlaybacks.delete(candidatePlayback)
			stopActiveEndedListener()
			stopActiveSeekedListener()
			activePlayback.value = candidatePlayback
			bindActivePlaybackListeners()
			audioQueueLogic.commit(candidate)
			currentAudioId.value = candidate.audioId
			normalizationGainDb.value = source.normalizationGainDb ?? 0
			navigationCandidate = null
			activeEndedWhilePending = false
			sourceRelease.promote()
			releaseCurrentSource?.()
			releaseCurrentSource = sourceRelease.release
			onCommit?.()
			previousPlayback.dispose()
			await candidateBackend.fadeOutputTo(1, TRACK_SWITCH_FADE_MS)
			return
		}

		if (requestId === sourceRequestId) {
			const shouldHandleEnded = activeEndedWhilePending
			navigationCandidate = null
			activeEndedWhilePending = false
			if (restartCurrentOnFailure && currentAudioId.value != null) {
				activePlayback.value.backend.currentTime.value = 0
				void activePlayback.value.backend.play()
			}
			else if (shouldHandleEnded) {
				handleEnded()
			}
		}
	}

	function requestQueueCandidate(
		candidate: AudioQueueCandidate | null,
		onCommit?: () => void,
		options: {
			direction?: 'next' | 'previous'
			wrapNext?: boolean
			restartCurrentOnFailure?: boolean
		} = {},
	) {
		cancelPendingTransition()
		const requestId = sourceRequestId
		const direction = options.direction ?? 'next'
		const wrapNext = options.wrapNext ?? true
		const restartCurrentOnFailure = options.restartCurrentOnFailure ?? false
		navigationCandidate = candidate
		navigationDirection = direction
		navigationOnCommit = onCommit
		navigationWrapNext = wrapNext
		navigationRestartCurrentOnFailure = restartCurrentOnFailure
		if (candidate != null) {
			void transitionToCandidate(
				requestId,
				candidate,
				direction,
				wrapNext,
				restartCurrentOnFailure,
				onCommit,
			)
		}
		return candidate?.audioId ?? null
	}

	function play(
		audioIdList: string[],
		audioId?: string | null,
		onCommit?: () => void,
	) {
		activePlayback.value.backend.preparePlayback()
		return requestQueueCandidate(audioQueueLogic.initQueue(audioIdList, audioId), onCommit)
	}

	function togglePlay() {
		cancelPendingTransition()
		const backend = activePlayback.value.backend
		if (backend.isPaused.value)
			void backend.play()
		else
			backend.pause()
	}

	function goNext() {
		const base = navigationCandidate
		const onCommit = navigationOnCommit
		const wrapNext = navigationWrapNext
		const restartCurrentOnFailure = navigationRestartCurrentOnFailure
		return requestQueueCandidate(
			audioQueueLogic.goNext(base),
			onCommit,
			{ wrapNext, restartCurrentOnFailure },
		)
	}

	function goPrevious() {
		if (currentAudioId.value == null) {
			cancelPendingTransition()
			return
		}

		if (currentTime.value > 3) {
			cancelPendingTransition()
			activePlayback.value.backend.currentTime.value = 0
			return
		}

		const base = navigationCandidate
		const onCommit = navigationOnCommit
		const wrapNext = navigationWrapNext
		const restartCurrentOnFailure = navigationRestartCurrentOnFailure
		requestQueueCandidate(
			audioQueueLogic.goPrevious(base),
			onCommit,
			{ direction: 'previous', wrapNext, restartCurrentOnFailure },
		)
	}

	function handleEnded() {
		if (navigationCandidate != null) {
			activeEndedWhilePending = true
			return
		}
		if (repeated.value === 'off' && !audioQueueLogic.hasReachedEnd.value) {
			requestQueueCandidate(audioQueueLogic.goNext(), undefined, { wrapNext: false })
			return
		}

		if (repeated.value === 'repeat') {
			const previousAudioId = currentAudioId.value
			const nextAudioId = requestQueueCandidate(
				audioQueueLogic.goNext(),
				undefined,
				{ restartCurrentOnFailure: true },
			)
			if (nextAudioId == null || nextAudioId === previousAudioId) {
				activePlayback.value.backend.currentTime.value = 0
				void activePlayback.value.backend.play()
			}
		}
	}

	bindActivePlaybackListeners()

	const toPlayQueue = audioQueueLogic.toPlayQueue
	function playToPlayQueueItem(audioId: string) {
		return requestQueueCandidate(audioQueueLogic.playToPlayQueueItem(audioId))
	}

	function onSeeked(listener: () => void) {
		seekedListeners.add(listener)
		return () => seekedListeners.delete(listener)
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

	tryOnScopeDispose(() => {
		disposed = true
		sourceRequestId++
		stopActiveEndedListener()
		stopActiveSeekedListener()
		seekedListeners.clear()
		for (const release of [...pendingSourceReleases])
			release()
		for (const playback of [...pendingPlaybacks])
			disposeCandidatePlayback(playback)
		releaseCurrentSource?.()
		releaseCurrentSource = null
		activePlayback.value.dispose()
	})

	return {
		currentTime,
		duration,
		volume,

		normalizationSupported,
		normalizationEnabled,
		normalizationGainDb,
		setNormalizationEnabled,
		setNormalizationGainDb,

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
		onSeeked,
	}
}
