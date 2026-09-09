import type { Ref } from 'vue'
import { decibelsToLinearGain } from '@/utils/loudness'

type CapturableAudioElement = HTMLAudioElement & {
	captureStream?: () => MediaStream
}

interface AudioGraph {
	context: AudioContext
	source: MediaStreamAudioSourceNode | null
	normalization: GainNode
	transition: GainNode
	userVolume: GainNode
}

interface UseAudioOutputOptions {
	audio: Ref<HTMLAudioElement>
	getVolume: () => number
	getMuted: () => boolean
}

const AUDIO_TRANSITION_STEP_MS = 5
const NORMALIZATION_RAMP_SECONDS = 0.025

function clampUnitInterval(value: number) {
	return Math.min(1, Math.max(0, value))
}

export function useAudioOutput({ audio, getVolume, getMuted }: UseAudioOutputOptions) {
	const normalizationEnabled = ref(false)
	const normalizationGainDb = ref(0)
	const audioGraphFailed = ref(false)
	const enhancedOutputAllowed = !/Android/i.test(navigator.userAgent)
	const captureStreamSupported = enhancedOutputAllowed
		&& typeof (audio.value as CapturableAudioElement).captureStream === 'function'
	const normalizationSupported = computed(() => (
		captureStreamSupported
		&& typeof AudioContext !== 'undefined'
		&& audioGraphFailed.value === false
	))
	let audioGraph: AudioGraph | null = null
	let capturedStream: MediaStream | null = null
	let boundCapturedTrack: MediaStreamTrack | null = null
	let resumeAudioGraphPromise: Promise<void> | null = null
	let outputMode: 'native' | 'enhanced' = 'native'
	let outputGain = 1
	let fadeRevision = 0

	function switchToNativeOutput() {
		outputMode = 'native'
		if (audioGraph != null) {
			audioGraph.transition.gain.value = outputGain
			audioGraph.userVolume.gain.value = 0
		}

		const effectiveVolume = clampUnitInterval(getVolume() * outputGain)
		if (audio.value.volume !== effectiveVolume)
			audio.value.volume = effectiveVolume
	}

	function canUseEnhancedOutput() {
		return document.visibilityState === 'visible'
			&& audioGraph?.source != null
			&& audioGraph.context.state === 'running'
	}

	function switchToEnhancedOutput() {
		if (!canUseEnhancedOutput())
			return false

		outputMode = 'enhanced'
		audioGraph!.transition.gain.value = outputGain
		audioGraph!.userVolume.gain.value = getMuted() ? 0 : getVolume()
		if (audio.value.volume !== 0)
			audio.value.volume = 0
		return true
	}

	function syncOutputVolume() {
		if (outputMode === 'enhanced' && switchToEnhancedOutput())
			return
		switchToNativeOutput()
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

	function bindCapturedTrack(track: MediaStreamTrack) {
		const graph = audioGraph
		if (graph == null || graph.context.state === 'closed' || boundCapturedTrack?.id === track.id)
			return

		const previousSource = graph.source
		const previousTrack = boundCapturedTrack
		const source = graph.context.createMediaStreamSource(new MediaStream([track]))
		source.connect(graph.normalization)
		graph.source = source
		boundCapturedTrack = track
		previousSource?.disconnect()
		if (previousTrack != null) {
			previousTrack.stop()
			capturedStream?.removeTrack(previousTrack)
		}
		if (!switchToEnhancedOutput())
			switchToNativeOutput()
	}

	function handleCapturedTrack(event: MediaStreamTrackEvent) {
		if (event.track.kind === 'audio')
			bindCapturedTrack(event.track)
	}

	function ensureCapturedStream() {
		if (capturedStream != null)
			return capturedStream

		const captureStream = (audio.value as CapturableAudioElement).captureStream
		if (captureStream == null)
			return null

		const stream = captureStream.call(audio.value)
		stream.addEventListener('addtrack', handleCapturedTrack)
		capturedStream = stream
		return stream
	}

	function ensureAudioGraph(): AudioGraph | null {
		if (audioGraph != null)
			return audioGraph
		if (!normalizationSupported.value)
			return null

		let context: AudioContext | null = null
		try {
			const createdContext = new AudioContext({ latencyHint: 'playback' })
			context = createdContext
			const normalization = createdContext.createGain()
			const transition = createdContext.createGain()
			const userVolume = createdContext.createGain()
			normalization.connect(transition)
			transition.connect(userVolume)
			userVolume.connect(createdContext.destination)
			audioGraph = { context: createdContext, source: null, normalization, transition, userVolume }

			const stream = ensureCapturedStream()
			if (stream == null)
				throw new Error('HTMLMediaElement.captureStream() is unavailable.')
			const latestTrack = stream.getAudioTracks()
				.at(-1)
			if (latestTrack != null)
				bindCapturedTrack(latestTrack)

			createdContext.addEventListener('statechange', () => {
				if (createdContext.state !== 'running') {
					switchToNativeOutput()
					if (
						createdContext.state !== 'closed'
						&& document.visibilityState === 'visible'
						&& !audio.value.paused
						&& !audio.value.ended
					) {
						void resumeAudioGraph()
					}
					return
				}

				if (document.visibilityState === 'visible')
					switchToEnhancedOutput()
			})
			syncOutputVolume()
			applyNormalizationGain(false)
			return audioGraph
		}
		catch (error) {
			console.warn('[audio] Could not create captured Web Audio graph; normalization remains bypassed.', error)
			audioGraphFailed.value = true
			audioGraph = null
			if (context != null && context.state !== 'closed')
				void context.close()
			syncOutputVolume()
			return null
		}
	}

	async function resumeAudioGraph() {
		const context = audioGraph?.context
		if (context == null || context.state === 'closed')
			return
		if (context.state === 'running') {
			if (document.visibilityState === 'visible')
				switchToEnhancedOutput()
			return
		}
		if (resumeAudioGraphPromise != null)
			return resumeAudioGraphPromise

		resumeAudioGraphPromise = (async () => {
			try {
				await context.resume()
				if (context.state === 'running' && document.visibilityState === 'visible')
					switchToEnhancedOutput()
			}
			catch (error) {
				switchToNativeOutput()
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
		if (document.visibilityState !== 'visible') {
			switchToNativeOutput()
			return
		}
		if (!switchToEnhancedOutput())
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
		syncOutputVolume()
	}

	async function fadeOutputTo(value: number, durationMs: number) {
		if (!enhancedOutputAllowed) {
			setOutputGain(1)
			return
		}

		const targetGain = clampUnitInterval(value)
		const initialGain = outputGain
		const revision = ++fadeRevision

		if (
			durationMs <= 0
			|| initialGain === targetGain
			|| (targetGain === 0 && audio.value.paused)
			|| getMuted()
			|| getVolume() === 0
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

	useEventListener(document, 'visibilitychange', () => {
		if (document.visibilityState !== 'visible') {
			switchToNativeOutput()
			return
		}

		if (!audio.value.paused) {
			ensureAudioGraph()
			void resumeAudioGraph()
		}
	})
	useEventListener(window, 'pageshow', () => {
		if (!audio.value.paused && document.visibilityState === 'visible') {
			ensureAudioGraph()
			void resumeAudioGraph()
		}
	})

	function cancelFade() {
		fadeRevision++
	}

	function dispose() {
		cancelFade()
		capturedStream?.removeEventListener('addtrack', handleCapturedTrack)
		capturedStream?.getTracks()
			.forEach(track => track.stop())
		const context = audioGraph?.context
		if (context != null && context.state !== 'closed')
			void context.close()
	}

	return {
		normalizationSupported,
		normalizationEnabled,
		normalizationGainDb,
		syncOutputVolume,
		preparePlayback,
		setNormalizationEnabled,
		setNormalizationGainDb,
		fadeOutputTo,
		cancelFade,
		dispose,
	}
}
