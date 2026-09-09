export interface UseAudioOptions {
	autoplay?: boolean
	loop?: boolean
	muted?: boolean
	volume?: number
}

function clampUnitInterval(value: number) {
	return Math.min(1, Math.max(0, value))
}

function createAudioRef(options: UseAudioOptions = {}) {
	const { autoplay = true, loop = false, muted = false, volume = 1 } = options
	const audio = ref<HTMLAudioElement>(new Audio())
	audio.value.autoplay = autoplay
	audio.value.loop = loop
	audio.value.muted = muted
	audio.value.volume = volume
	audio.value.preload = 'auto'

	// Custom event to notify when the audio.loop property is updated
	Object.defineProperty(audio, 'loop', {
		set(value) {
			// emit an event 'loopupdate' to notify the change
			audio.value.dispatchEvent(new Event('loopupdate'))
			// @ts-expect-error expect HTMLMediaElement.prototype.__lookupSetter__ to exist
			// eslint-disable-next-line no-restricted-properties
			HTMLMediaElement.prototype.__lookupSetter__('loop')
				.call(this, value)
		},
		get() {
			// @ts-expect-error expect HTMLMediaElement.prototype.__lookupGetter__ to exist
			// eslint-disable-next-line no-restricted-properties
			return HTMLMediaElement.prototype.__lookupGetter__('loop')
				.call(this)
		},
	})
	return audio
}

export function useAudio(options: UseAudioOptions = {}) {
	const audio = createAudioRef(options)
	const audioStatus = ref({
		duration: 0,
		currentTime: 0,
		volume: audio.value.volume,
		muted: audio.value.muted,
		loop: audio.value.loop,
		isPaused: audio.value.paused,
		isWaiting: false,
		canPlay: false,
		hasError: false,
	})

	const audioOutput = useAudioOutput({
		audio,
		getVolume: () => audioStatus.value.volume,
		getMuted: () => audioStatus.value.muted,
	})
	const {
		normalizationSupported,
		normalizationEnabled,
		normalizationGainDb,
		preparePlayback,
		setNormalizationEnabled,
		setNormalizationGainDb,
		fadeOutputTo,
	} = audioOutput

	const duration = computed(() => audioStatus.value.duration)
	const currentTime = computed({
		get: () => audioStatus.value.currentTime,
		set: value => audio.value.currentTime = value,
	})
	const volume = computed({
		get: () => audioStatus.value.volume,
		set: (value) => {
			audioStatus.value.volume = clampUnitInterval(value)
			audioOutput.syncOutputVolume()
		},
	})
	const muted = computed({
		get: () => audioStatus.value.muted,
		set: (value) => {
			audioStatus.value.muted = value
			audio.value.muted = value
			audioOutput.syncOutputVolume()
		},
	})
	const loop = computed({
		get: () => audioStatus.value.loop,
		set: value => audio.value.loop = value,
	})
	const isPaused = computed(() => audioStatus.value.isPaused)
	const isWaiting = computed(() => audioStatus.value.isWaiting)
	const canPlay = computed(() => audioStatus.value.canPlay)
	const hasError = computed(() => audioStatus.value.hasError)

	function load(src: string) {
		audioStatus.value.canPlay = false
		audioStatus.value.hasError = false
		audioStatus.value.isWaiting = true
		audio.value.src = src
	}

	function unload() {
		audioOutput.cancelFade()
		audio.value.pause()
		audio.value.removeAttribute('src')
		audio.value.load()
		audioStatus.value.duration = 0
		audioStatus.value.currentTime = 0
		audioStatus.value.isWaiting = false
		audioStatus.value.canPlay = false
		audioStatus.value.hasError = false
	}

	async function play() {
		preparePlayback()
		try {
			await audio.value.play()
			return true
		}
		catch (error) {
			console.warn('[audio] Playback request was rejected.', error)
			return false
		}
	}
	function pause() {
		audio.value.pause()
	}

	useEventListener(audio, 'durationchange', () => {
		audioStatus.value.duration = audio.value.duration
	})
	useEventListener(audio, 'timeupdate', () => {
		audioStatus.value.currentTime = audio.value.currentTime
	})
	useEventListener(audio, 'volumechange', () => {
		audioStatus.value.muted = audio.value.muted
	})
	useEventListener(audio, 'pause', () => {
		audioStatus.value.isPaused = audio.value.paused
	})
	useEventListener(audio, 'play', () => {
		audioStatus.value.isPaused = audio.value.paused
		preparePlayback()
	})
	useEventListener(audio, 'ended', () => {
		audioStatus.value.isPaused = audio.value.paused
	})
	useEventListener(audio, 'waiting', () => {
		audioStatus.value.isWaiting = true
	})
	useEventListener(audio, 'playing', () => {
		audioStatus.value.isWaiting = false
	})
	useEventListener(audio, 'canplay', () => {
		audioStatus.value.canPlay = true
		audioStatus.value.hasError = false
	})
	useEventListener(audio, 'error', () => {
		audioStatus.value.isWaiting = false
		audioStatus.value.canPlay = false
		audioStatus.value.hasError = true
	})
	useEventListener(audio, 'loadstart', () => {
		audioStatus.value.canPlay = false
	})
	useEventListener(audio, 'loopupdate', () => {
		audioStatus.value.loop = audio.value.loop
	})

	tryOnScopeDispose(() => {
		audio.value.autoplay = false
		unload()
		audioOutput.dispose()
	})

	return {
		audio,
		duration,
		currentTime,
		volume,
		muted,
		loop,
		isPaused,
		isWaiting,
		canPlay,
		hasError,
		normalizationSupported,
		normalizationEnabled,
		normalizationGainDb,
		load,
		unload,
		play,
		pause,
		preparePlayback,
		setNormalizationEnabled,
		setNormalizationGainDb,
		fadeOutputTo,
	}
}
