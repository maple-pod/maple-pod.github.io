import type { Ref } from 'vue'

export interface AudioPlaybackBackendOptions {
	autoplay?: boolean
	loop?: boolean
	muted?: boolean
	volume?: number
}

export interface AudioPlaybackBackend {
	currentTime: Ref<number>
	duration: Readonly<Ref<number>>
	volume: Ref<number>
	muted: Ref<boolean>
	loop: Ref<boolean>
	isPaused: Readonly<Ref<boolean>>
	isWaiting: Readonly<Ref<boolean>>
	canPlay: Readonly<Ref<boolean>>
	hasError: Readonly<Ref<boolean>>
	normalizationSupported: Readonly<Ref<boolean>>
	normalizationEnabled: Readonly<Ref<boolean>>
	normalizationGainDb: Readonly<Ref<number>>
	load: (src: string) => void
	unload: () => void
	play: () => Promise<boolean>
	pause: () => void
	preparePlayback: () => void
	setNormalizationEnabled: (enabled: boolean) => void
	setNormalizationGainDb: (gainDb: number) => void
	fadeOutputTo: (value: number, durationMs: number) => Promise<void>
	waitUntilReady: () => Promise<void>
	onEnded: (listener: () => void) => () => void
	onSeeked: (listener: () => void) => () => void
}

export type AudioPlaybackBackendFactory = (options: AudioPlaybackBackendOptions) => AudioPlaybackBackend

function clampUnitInterval(value: number) {
	return Math.min(1, Math.max(0, value))
}

export function useHtmlAudioPlaybackBackend(options: AudioPlaybackBackendOptions = {}): AudioPlaybackBackend {
	const { autoplay = true, loop: initialLoop = false, muted: initialMuted = false, volume: initialVolume = 1 } = options
	const audio = ref<HTMLAudioElement>(new Audio())
	audio.value.autoplay = autoplay
	audio.value.loop = initialLoop
	audio.value.muted = initialMuted
	audio.value.volume = initialVolume
	audio.value.preload = 'auto'
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
		set: (value) => {
			audioStatus.value.loop = value
			audio.value.loop = value
		},
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

	async function waitUntilReady() {
		if (canPlay.value || hasError.value)
			return

		await until(computed(() => canPlay.value || hasError.value))
			.toBe(true)
	}

	function onMediaEvent(type: 'ended' | 'seeked', listener: () => void) {
		const handler = () => listener()
		audio.value.addEventListener(type, handler)
		return () => audio.value.removeEventListener(type, handler)
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

	tryOnScopeDispose(() => {
		audio.value.autoplay = false
		unload()
		audioOutput.dispose()
	})

	return {
		currentTime,
		duration,
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
		waitUntilReady,
		onEnded: listener => onMediaEvent('ended', listener),
		onSeeked: listener => onMediaEvent('seeked', listener),
	}
}
