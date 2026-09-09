import type { Ref } from 'vue'
import { decibelsToLinearGain } from '@/utils/loudness'

interface AudioGraph {
	context: AudioContext
	source: MediaElementAudioSourceNode
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
	const normalizationSupported = computed(() => typeof AudioContext !== 'undefined' && audioGraphFailed.value === false)
	let audioGraph: AudioGraph | null = null
	let resumeAudioGraphPromise: Promise<void> | null = null
	let outputGain = 1
	let fadeRevision = 0

	function syncOutputVolume() {
		if (audioGraph != null) {
			if (audio.value.volume !== 1)
				audio.value.volume = 1
			audioGraph.transition.gain.value = outputGain
			audioGraph.userVolume.gain.value = getMuted() ? 0 : getVolume()
			return
		}

		const effectiveVolume = clampUnitInterval(getVolume() * outputGain)
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
			const createdContext = new AudioContext({ latencyHint: 'playback' })
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
			syncOutputVolume()
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
		syncOutputVolume()
	}

	async function fadeOutputTo(value: number, durationMs: number) {
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
		if (document.visibilityState === 'visible' && !audio.value.paused)
			void resumeAudioGraph()
	})
	useEventListener(window, 'pageshow', () => {
		if (!audio.value.paused)
			void resumeAudioGraph()
	})

	function cancelFade() {
		fadeRevision++
	}

	function dispose() {
		cancelFade()
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
