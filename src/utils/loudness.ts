import type { LoudnessAnalysisTrack } from '@/types'

export const LOUDNESS_TARGET_LUFS = -16
export const LOUDNESS_TRUE_PEAK_CEILING_DBTP = -1

export function calculateNormalizationGainDb(
	measurement: Pick<LoudnessAnalysisTrack, 'integratedLufs' | 'truePeakDbtp'>,
): number {
	const loudnessGain = LOUDNESS_TARGET_LUFS - measurement.integratedLufs
	const peakSafeGain = LOUDNESS_TRUE_PEAK_CEILING_DBTP - measurement.truePeakDbtp
	return Math.min(loudnessGain, peakSafeGain)
}

export function decibelsToLinearGain(decibels: number): number {
	return 10 ** (decibels / 20)
}
