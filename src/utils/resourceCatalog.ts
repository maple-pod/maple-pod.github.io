import type { LoudnessAnalysisReport, LoudnessAnalysisTrack, ResourceBgm, Resources } from '@/types'

export type ResourceBgmInput = Omit<ResourceBgm, 'audio'> & {
	audio?: ResourceBgm['audio'] | null
}

export type ResourcesInput = Omit<Resources, 'bgms'> & {
	bgms: ResourceBgmInput[]
}

export function isSafeResourceAudioFile(file: unknown): file is string {
	return typeof file === 'string'
		&& file.length > 0
		&& file.trim() === file
		&& file !== '.'
		&& file !== '..'
		&& !file.includes('/')
		&& !file.includes('\\')
		&& !/\p{Cc}/u.test(file)
}

export function hasValidAudioRepresentation(audio: ResourceBgmInput['audio']): audio is ResourceBgm['audio'] {
	return audio != null
		&& isSafeResourceAudioFile(audio.file)
		&& typeof audio.codec === 'string'
		&& audio.codec.length > 0
		&& typeof audio.container === 'string'
		&& audio.container.length > 0
}

function hasValidCatalogMetadata(bgm: ResourceBgmInput): boolean {
	if (bgm.catalog == null)
		return true

	return bgm.catalog.membership === 'supplemental'
		&& bgm.catalog.status === 'pending-upstream'
		&& typeof bgm.catalog.tracking === 'string'
		&& bgm.catalog.tracking.trim().length > 0
}

export function getResourceBgmId(bgm: Pick<ResourceBgm, 'id' | 'filename'>): string {
	const id = bgm.id ?? bgm.filename
	if (typeof id !== 'string' || id.length === 0)
		throw new Error('Music resource has no valid stable ID or filename.')
	return id
}

export function normalizeResourceCatalog(input: ResourcesInput): Resources {
	const missingAudioCount = input.bgms.filter(bgm => bgm.audio == null).length
	const legacyCatalog = input.bgms.length > 0
		&& missingAudioCount === input.bgms.length
		&& input.bgms.every(bgm => bgm.id == null && bgm.catalog == null)

	const seenIds = new Set<string>()
	const bgms = input.bgms.map((bgm) => {
		if (typeof bgm.filename !== 'string' || bgm.filename.length === 0)
			throw new Error('Music resource has no valid filename.')
		if (bgm.id != null && (typeof bgm.id !== 'string' || bgm.id.length === 0))
			throw new Error(`Music resource "${bgm.filename}" has no valid stable ID.`)
		if (bgm.youtube != null && typeof bgm.youtube !== 'string')
			throw new Error(`Music resource "${bgm.filename}" has an invalid YouTube reference.`)
		if (!hasValidCatalogMetadata(bgm))
			throw new Error(`Music resource "${bgm.filename}" has invalid catalog metadata.`)

		let normalized: ResourceBgm
		if (legacyCatalog) {
			// Cached catalogs from older installed PWAs omit explicit audio metadata.
			// New-format entries (including identified supplemental tracks) must declare it.
			normalized = {
				...bgm,
				audio: {
					file: `${bgm.filename}.mp3`,
					codec: 'mp3',
					container: 'mp3',
				},
			}
		}
		else {
			if (!hasValidAudioRepresentation(bgm.audio))
				throw new Error(`Music resource "${bgm.filename}" has no valid declared audio representation.`)
			normalized = { ...bgm, audio: bgm.audio }
		}

		const id = getResourceBgmId(normalized)
		if (seenIds.has(id))
			throw new Error(`Music catalog contains duplicate stable ID "${id}".`)
		seenIds.add(id)
		return normalized
	})

	return { ...input, bgms }
}

export function getResourceBgmSrc(bgm: ResourceBgm): string {
	if (!hasValidAudioRepresentation(bgm.audio))
		throw new Error(`Music resource "${bgm.filename}" has no valid declared audio representation.`)
	return `/resources/bgm/${encodeURIComponent(bgm.audio.file)}`
}

export function getResourceBgmMarkBinary(bgm: ResourceBgm, marks: Resources['marks']): string {
	const mark = bgm.mark ?? '/logo.png'
	if (!Object.hasOwn(marks, mark) || typeof marks[mark] !== 'string' || marks[mark]!.length === 0)
		throw new Error(`Music resource "${bgm.filename}" references an undeclared mark "${mark}".`)
	return marks[mark]!
}

export function getCompatibleLoudnessMeasurements(
	report: LoudnessAnalysisReport,
	bgms: ResourceBgm[],
	resourceBuiltAt: number | undefined,
): Map<string, LoudnessAnalysisTrack> | null {
	if (
		resourceBuiltAt == null
		|| report == null
		|| report.failureCount !== 0
		|| report.successCount !== bgms.length
		|| report.trackCount !== bgms.length
		|| report.resourceBuiltAt !== resourceBuiltAt
		|| !Array.isArray(report.tracks)
		|| report.tracks.length !== bgms.length
	) {
		return null
	}

	const musicByFilename = new Map<string, ResourceBgm>()
	for (const bgm of bgms) {
		if (musicByFilename.has(bgm.filename))
			return null
		musicByFilename.set(bgm.filename, bgm)
	}

	const measurementByFilename = new Map<string, LoudnessAnalysisTrack>()
	for (const track of report.tracks) {
		if (typeof track.filename !== 'string' || measurementByFilename.has(track.filename))
			return null
		measurementByFilename.set(track.filename, track)
	}

	const result = new Map<string, LoudnessAnalysisTrack>()
	for (const bgm of bgms) {
		const measurement = measurementByFilename.get(bgm.filename)
		if (
			measurement == null
			|| measurement.file !== bgm.audio.file
			|| measurement.codec !== bgm.audio.codec
			|| measurement.container !== bgm.audio.container
		) {
			return null
		}
		result.set(getResourceBgmId(bgm), measurement)
	}

	return result
}
