export interface UseAudioOptions {
	autoplay?: boolean
	loop?: boolean
	muted?: boolean
	volume?: number
}

interface AudioGraph {
	context: AudioContext
	source: MediaElementAudioSourceNode
	normalization: GainNode
	transition: GainNode
	userVolume: GainNode
}

const AUDIO_TRANSITION_STEP_MS = 5
const NORMALIZATION_RAMP_SECONDS = 0.025

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

	const normalizationEnabled = ref(false)
	const normalizationGainDb = ref(0)
	const audioGraphFailed = ref(false)
	const normalizationSupported = computed(() => typeof AudioContext !== 'undefined' && audioGraphFailed.value === false)
	let audioGraph: AudioGraph | null = null
	let resumeAudioGraphPromise: Promise<void> | null = null
	let outputGain = 1
	let fadeRevision = 0

	function applyOutputVolume() {
		if (audioGraph != null) {
			if (audio.value.volume !== 1)
				audio.value.volume = 1
			audioGraph.transition.gain.value = outputGain
			audioGraph.userVolume.gain.value = audioStatus.value.muted ? 0 : audioStatus.value.volume
			return
		}

		const effectiveVolume = clampUnitInterval(audioStatus.value.volume * outputGain)
		if (audio.value.volume !== effectiveVolume)
			audio.value.volume = effectiveVolume
	}

	function getNormalizationLinearGain() {
		return normalizationEnabled.value
			? decibelsToLinearGain(normalizationGainDb.value)
			: 1
	}

	function applyNormalizationGain(smooth: boolean) {
		if (audioGraph == null)
			return

		const gain = getNormalizationLinearGain()
		const param = audioGraph.normalization.gain
		if (!smooth || audioGraph.context.state === 'closed') {
			param.value = gain
			return
		}

		const now = audioGraph.context.currentTime
		param.cancelScheduledValues(now)
		param.setValueAtTime(param.value, now)
		param.linearRampToValueAtTime(gain, now + NORMALIZATION_RAMP_SECONDS)
	}

	function ensureAudioGraph(): AudioGraph | null {
		if (audioGraph != null)
			return audioGraph
		if (!normalizationSupported.value)
			return null

		let context: AudioContext | null = null
		try {
			const createdContext = new AudioContext()
			context = createdContext
			const source = createdContext.createMediaElementSource(audio.value)
			const normalization = createdContext.createGain()
			const transition = createdContext.createGain()
			const userVolume = createdContext.createGain()
			source.connect(normalization)
			normalization.connect(transition)
			transition.connect(userVolume)
			userVolume.connect(createdContext.destination)
			audioGraph = { context: createdContext, source, normalization, transition, userVolume }
			createdContext.addEventListener('statechange', () => {
				if (
					createdContext.state !== 'running'
					&& createdContext.state !== 'closed'
					&& !audio.value.paused
					&& !audio.value.ended
				) {
					void resumeAudioGraph()
				}
			})
			applyOutputVolume()
			applyNormalizationGain(false)
			return audioGraph
		}
		catch (error) {
			console.warn('[audio] Could not create Web Audio graph; normalization remains bypassed.', error)
			audioGraphFailed.value = true
			if (context != null && context.state !== 'closed')
				void context.close()
			return null
		}
	}

	async function resumeAudioGraph() {
		const context = audioGraph?.context
		if (context == null || context.state === 'running' || context.state === 'closed')
			return
		if (resumeAudioGraphPromise != null)
			return resumeAudioGraphPromise

		resumeAudioGraphPromise = (async () => {
			try {
				await context.resume()
			}
			catch (error) {
				console.warn('[audio] Could not resume AudioContext.', error)
			}
			finally {
				resumeAudioGraphPromise = null
			}
		})()
		return resumeAudioGraphPromise
	}

	function preparePlayback() {
		if (audioGraph == null)
			ensureAudioGraph()
		void resumeAudioGraph()
	}

	function setNormalizationEnabled(value: boolean) {
		normalizationEnabled.value = value
		if (!value) {
			applyNormalizationGain(true)
			return true
		}

		// Defer graph creation until playback when the media element is paused so
		// browser user-activation policies cannot turn a valid track silent.
		if (audio.value.paused)
			return normalizationSupported.value

		if (ensureAudioGraph() == null) {
			normalizationEnabled.value = false
			return false
		}
		applyNormalizationGain(true)
		void resumeAudioGraph()
		return true
	}

	function setNormalizationGainDb(value: number) {
		normalizationGainDb.value = Number.isFinite(value) ? value : 0
		applyNormalizationGain(true)
	}

	function setOutputGain(value: number) {
		outputGain = clampUnitInterval(value)
		applyOutputVolume()
	}

	async function fadeOutputTo(value: number, durationMs: number) {
		const targetGain = clampUnitInterval(value)
		const initialGain = outputGain
		const revision = ++fadeRevision

		if (
			durationMs <= 0
			|| initialGain === targetGain
			|| (targetGain === 0 && audio.value.paused)
			|| audioStatus.value.muted
			|| audioStatus.value.volume === 0
		) {
			setOutputGain(targetGain)
			return
		}

		const startedAt = performance.now()
		await new Promise<void>((resolve) => {
			const step = () => {
				if (revision !== fadeRevision) {
					resolve()
					return
				}

				const progress = Math.min(1, (performance.now() - startedAt) / durationMs)
				setOutputGain(initialGain + ((targetGain - initialGain) * progress))
				if (progress >= 1) {
					resolve()
					return
				}

				window.setTimeout(step, AUDIO_TRANSITION_STEP_MS)
			}
			step()
		})
	}

	const duration = computed(() => audioStatus.value.duration)
	const currentTime = computed({
		get: () => audioStatus.value.currentTime,
		set: value => audio.value.currentTime = value,
	})
	const volume = computed({
		get: () => audioStatus.value.volume,
		set: (value) => {
			audioStatus.value.volume = clampUnitInterval(value)
			applyOutputVolume()
		},
	})
	const muted = computed({
		get: () => audioStatus.value.muted,
		set: (value) => {
			audioStatus.value.muted = value
			audio.value.muted = value
			applyOutputVolume()
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
		fadeRevision++
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

	useEventListener(document, 'visibilitychange', () => {
		if (document.visibilityState === 'visible' && !audio.value.paused)
			void resumeAudioGraph()
	})
	useEventListener(window, 'pageshow', () => {
		if (!audio.value.paused)
			void resumeAudioGraph()
	})

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
		const context = audioGraph?.context
		if (context != null && context.state !== 'closed')
			void context.close()
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
