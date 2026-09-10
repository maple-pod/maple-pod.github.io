import type { Ref } from 'vue'
import type { UseAudioOptions } from './useAudio'

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

export type AudioPlaybackBackendFactory = (options: UseAudioOptions) => AudioPlaybackBackend

export function useHtmlAudioPlaybackBackend(options: UseAudioOptions = {}): AudioPlaybackBackend {
	const audioLogic = useAudio(options)

	async function waitUntilReady() {
		if (audioLogic.canPlay.value || audioLogic.hasError.value)
			return

		await until(computed(() => audioLogic.canPlay.value || audioLogic.hasError.value))
			.toBe(true)
	}

	function onMediaEvent(type: 'ended' | 'seeked', listener: () => void) {
		const element = audioLogic.audio.value
		const handler = () => listener()
		element.addEventListener(type, handler)
		return () => element.removeEventListener(type, handler)
	}

	return {
		currentTime: audioLogic.currentTime,
		duration: audioLogic.duration,
		volume: audioLogic.volume,
		muted: audioLogic.muted,
		loop: audioLogic.loop,
		isPaused: audioLogic.isPaused,
		isWaiting: audioLogic.isWaiting,
		canPlay: audioLogic.canPlay,
		hasError: audioLogic.hasError,
		normalizationSupported: audioLogic.normalizationSupported,
		normalizationEnabled: audioLogic.normalizationEnabled,
		normalizationGainDb: audioLogic.normalizationGainDb,
		load: audioLogic.load,
		unload: audioLogic.unload,
		play: audioLogic.play,
		pause: audioLogic.pause,
		preparePlayback: audioLogic.preparePlayback,
		setNormalizationEnabled: audioLogic.setNormalizationEnabled,
		setNormalizationGainDb: audioLogic.setNormalizationGainDb,
		fadeOutputTo: audioLogic.fadeOutputTo,
		waitUntilReady,
		onEnded: listener => onMediaEvent('ended', listener),
		onSeeked: listener => onMediaEvent('seeked', listener),
	}
}

export function useAudioPlaybackBackend(options: UseAudioOptions = {}) {
	return useHtmlAudioPlaybackBackend(options)
}
