export function useAudioPlayer() {
	const audioLogic = useAudio()

	const audio = audioLogic.audio
	const currentTime = audioLogic.currentTime
	const duration = audioLogic.duration
	const volume = audioLogic.volume

	const muted = audioLogic.muted
	function toggleMuted(bool?: boolean) {
		muted.value = bool ?? !muted.value
	}

	const { state: repeated, next: nextRepeated } = useCycleList(['off', 'repeat', 'repeat-1'] as const)
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

	const audioQueueLogic = useAudioQueue()

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

	const displayQueue = audioQueueLogic.displayQueue
	const addToTemporaryQueue = audioQueueLogic.addToTemporaryQueue
	const removeFromTemporaryQueue = audioQueueLogic.removeFromTemporaryQueue
	const clearTemporaryQueue = audioQueueLogic.clearTemporaryQueue
	const playTempQueueItem = audioQueueLogic.playTempQueueItem
	const playToPlayQueueItem = audioQueueLogic.playToPlayQueueItem

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

		isPaused,
		isWaiting,
		canPlay,

		currentAudioSrc,
		togglePlay,
		goNext,
		goPrevious,

		displayQueue,
		addToTemporaryQueue,
		removeFromTemporaryQueue,
		clearTemporaryQueue,
		playTempQueueItem,
		playToPlayQueueItem,
	}
}
