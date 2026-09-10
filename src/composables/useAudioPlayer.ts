import type { MseAudioSource } from './useMseAudioPlayback'

type AudioPlayerSource = string | MseAudioSource

export function useAudioPlayer({
	getAudioSrc,
	getAudioMimeType,
	isMusicDisabled,
}: {
	getAudioSrc: (id: string | null) => AudioPlayerSource | null | Promise<AudioPlayerSource | null>
	getAudioMimeType: (id: string | null) => string | null
	isMusicDisabled: (id: string | null) => boolean
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

	const audioLogic = useAudio({
		autoplay: false,
		volume: savedVolume.value,
		muted: savedMuted.value,
	})
	const audio = audioLogic.audio
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

	const audioQueueLogic = useAudioQueue({
		isMusicDisabled,
		random: savedRandom.value,
	})
	const random = audioQueueLogic.random
	const toggleRandom = audioQueueLogic.toggleRandom
	const currentAudioId = audioQueueLogic.current
	const toPlayQueue = audioQueueLogic.toPlayQueue
	const playedQueue = audioQueueLogic.playedQueue

	let playbackSyncedAudioId: string | null = null
	let directSourceRequestId = 0
	let releaseCurrentDirectSource: (() => void) | null = null
	let mseReconcileRevision = 0
	let lastReconciledAudioId: string | null = null
	let bufferedQueueDirty = false

	function playablePreviousIds() {
		return playedQueue.value.filter(id => !isMusicDisabled(id))
	}
	function playableFutureIds() {
		if (repeated.value === 'repeat-1')
			return []
		return toPlayQueue.value.filter(id => !isMusicDisabled(id))
	}

	async function resolveAudioSource(id: string | null): Promise<MseAudioSource | null> {
		const resolved = await getAudioSrc(id)
		return typeof resolved === 'string' ? { src: resolved } : resolved
	}

	const msePlayback = useMseAudioPlayback({
		audio,
		loadSource: audioLogic.load,
		getAudioSource: async id => await resolveAudioSource(id),
		getMimeType: id => getAudioMimeType(id),
		previousCount: 1,
		futureCount: 3,
		onCurrentEntryChange: (id, normalizationGainDb) => {
			if (repeated.value === 'repeat-1')
				return
			playbackSyncedAudioId = id
			if (audioQueueLogic.syncCurrentFromPlayback(id))
				audioLogic.setNormalizationGainDb(normalizationGainDb)
			else if (playbackSyncedAudioId === id)
				playbackSyncedAudioId = null
		},
	})

	const currentTime = computed({
		get: () => msePlayback.active.value ? msePlayback.currentTime.value : audioLogic.currentTime.value,
		set: (value) => {
			if (!msePlayback.seekLocal(value))
				audioLogic.currentTime.value = value
		},
	})
	const duration = computed(() => msePlayback.active.value ? msePlayback.duration.value : audioLogic.duration.value)

	watch(
		[repeated, msePlayback.active],
		() => audioLogic.loop.value = repeated.value === 'repeat-1' && !msePlayback.active.value,
		{ immediate: true, flush: 'sync' },
	)

	async function reconcileMse(audioId: string, seekToCurrent: boolean): Promise<'used' | 'unsupported' | 'superseded'> {
		const revision = ++mseReconcileRevision
		const used = await msePlayback.reconcile({
			previousIds: playablePreviousIds(),
			currentId: audioId,
			futureIds: playableFutureIds(),
			seekToCurrent,
		})
		if (revision !== mseReconcileRevision)
			return 'superseded'
		if (!used)
			return 'unsupported'
		audioLogic.setNormalizationGainDb(msePlayback.normalizationGainDb.value)
		return 'used'
	}

	async function loadDirect(audioId: string | null, requestId: number) {
		const source = await resolveAudioSource(audioId)
		if (requestId !== directSourceRequestId) {
			source?.release?.()
			return
		}

		await audioLogic.fadeOutputTo(0, 30)
		if (requestId !== directSourceRequestId) {
			source?.release?.()
			return
		}

		msePlayback.deactivate()
		releaseCurrentDirectSource?.()
		releaseCurrentDirectSource = null
		audioLogic.setNormalizationGainDb(source?.normalizationGainDb ?? 0)
		if (source == null) {
			audioLogic.unload()
			return
		}

		releaseCurrentDirectSource = source.release ?? null
		audioLogic.load(source.src)
		const playbackStarted = audioLogic.play()
		if (audio.value.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
			await until(computed(() => audioLogic.canPlay.value || audioLogic.hasError.value))
				.toBe(true)
		}
		if (requestId !== directSourceRequestId)
			return
		if (audioLogic.hasError.value || await playbackStarted === false) {
			await audioLogic.fadeOutputTo(1, 0)
			return
		}
		await audioLogic.fadeOutputTo(1, 30)
	}

	watch(
		currentAudioId,
		async (audioId) => {
			const directRequestId = ++directSourceRequestId
			const naturalMseTransition = audioId != null && playbackSyncedAudioId === audioId
			if (naturalMseTransition)
				playbackSyncedAudioId = null

			if (audioId != null && msePlayback.canUse(audioId)) {
				const wasMseActive = msePlayback.active.value
				const shouldSeek = !naturalMseTransition
				if (shouldSeek && wasMseActive)
					await audioLogic.fadeOutputTo(0, 30)
				try {
					const result = await reconcileMse(audioId, shouldSeek)
					if (result === 'superseded')
						return
					if (result === 'used') {
						lastReconciledAudioId = audioId
						releaseCurrentDirectSource?.()
						releaseCurrentDirectSource = null
						if (!naturalMseTransition)
							await audioLogic.play()
						if (shouldSeek && wasMseActive)
							await audioLogic.fadeOutputTo(1, 30)
						if (bufferedQueueDirty && currentAudioId.value === audioId) {
							bufferedQueueDirty = false
							void reconcileMse(audioId, false)
						}
						return
					}
				}
				catch (error) {
					console.warn('[audio] MSE playback setup failed; falling back to direct source.', error)
				}
				if (shouldSeek && wasMseActive)
					await audioLogic.fadeOutputTo(1, 0)
			}

			mseReconcileRevision++
			msePlayback.deactivate()
			await loadDirect(audioId, directRequestId)
			if (directRequestId === directSourceRequestId)
				lastReconciledAudioId = audioId
		},
	)

	watch(
		[playedQueue, toPlayQueue, repeated],
		async () => {
			const audioId = currentAudioId.value
			if (audioId == null || !msePlayback.active.value || !msePlayback.canUse(audioId))
				return
			if (lastReconciledAudioId !== audioId) {
				bufferedQueueDirty = true
				return
			}
			try {
				await reconcileMse(audioId, false)
			}
			catch (error) {
				console.warn('[audio] Could not reconcile the buffered MSE queue.', error)
			}
		},
		{ deep: false },
	)

	tryOnScopeDispose(() => {
		releaseCurrentDirectSource?.()
		releaseCurrentDirectSource = null
	})

	function play(...args: Parameters<typeof audioQueueLogic.initQueue>) {
		audioLogic.preparePlayback()
		return audioQueueLogic.initQueue(...args)
	}
	function togglePlay() {
		if (audioLogic.isPaused.value)
			void audioLogic.play()
		else
			audioLogic.pause()
	}
	function goNext() {
		audioQueueLogic.goNext()
	}
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
		if (msePlayback.active.value && repeated.value === 'repeat-1') {
			currentTime.value = 0
			void audioLogic.play()
			return
		}
		if (repeated.value === 'off' && !audioQueueLogic.hasReachedEnd.value) {
			goNext()
			return
		}
		if (repeated.value === 'repeat') {
			const previousAudioId = currentAudioId.value
			goNext()
			if (currentAudioId.value === previousAudioId) {
				currentTime.value = 0
				void audioLogic.play()
			}
		}
	})

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

		normalizationSupported: audioLogic.normalizationSupported,
		normalizationEnabled: audioLogic.normalizationEnabled,
		normalizationGainDb: audioLogic.normalizationGainDb,
		setNormalizationEnabled: audioLogic.setNormalizationEnabled,
		setNormalizationGainDb: audioLogic.setNormalizationGainDb,

		muted,
		toggleMuted,

		repeated,
		toggleRepeated,

		random,
		toggleRandom,

		isPaused: audioLogic.isPaused,
		isWaiting: audioLogic.isWaiting,
		canPlay: audioLogic.canPlay,

		currentAudioId,
		togglePlay,
		goNext,
		goPrevious,

		play,

		toPlayQueue,
		playToPlayQueueItem,
	}
}
