/* eslint-disable test/no-import-node-test -- This targeted suite uses Node's built-in runner without adding a test dependency. */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
	getCompatibleLoudnessMeasurements,
	getResourceBgmId,
	getResourceBgmMarkBinary,
	getResourceBgmSrc,
	hasValidAudioRepresentation,
	normalizeResourceCatalog,
} from '../src/utils/resourceCatalog.ts'

function bgm(overrides = {}) {
	return {
		description: 'A MapleStory background track',
		filename: 'old-login',
		audio: { file: 'old-login.mp3', codec: 'mp3', container: 'mp3' },
		mark: 'Event',
		duration: 120,
		metadata: { albumArtist: '', artist: '', title: 'Old Login', year: '' },
		...overrides,
	}
}

function loudnessTrack(track) {
	return {
		filename: track.filename,
		file: track.audio.file,
		codec: track.audio.codec,
		container: track.audio.container,
		duration: track.duration,
		year: null,
		integratedLufs: -16,
		truePeakDbtp: -1,
		loudnessRangeLu: 2,
		thresholdLufs: -26,
	}
}

function reportFor(bgms, overrides = {}) {
	return {
		resourceBuiltAt: 123,
		trackCount: bgms.length,
		successCount: bgms.length,
		failureCount: 0,
		tracks: bgms.map(loudnessTrack),
		...overrides,
	}
}

test('legacy cached catalogs keep their one-time MP3 normalization', () => {
	const legacy = bgm()
	delete legacy.audio

	const normalized = normalizeResourceCatalog({ bgms: [legacy], marks: {} })
	assert.deepEqual(normalized.bgms[0].audio, {
		file: 'old-login.mp3',
		codec: 'mp3',
		container: 'mp3',
	})
	assert.equal(getResourceBgmId(normalized.bgms[0]), 'old-login')
	assert.equal(getResourceBgmSrc(normalized.bgms[0]), '/resources/bgm/old-login.mp3')
})

test('supplemental tracks use stable IDs, explicit local audio, optional credits, and declared fallback marks', () => {
	const supplemental = bgm({
		id: 'supplemental:dimension-tower:old-login',
		filename: 'dimension-tower-old-login',
		audio: { file: 'dimension-tower-old-login.mp3', codec: 'mp3', container: 'mp3' },
		catalog: { membership: 'supplemental', status: 'pending-upstream', tracking: 'maplebgm-db#18' },
		source: { client: 'GMS' },
		youtube: '',
		mark: undefined,
	})
	const normalized = normalizeResourceCatalog({ bgms: [supplemental], marks: { '/logo.png': 'logo-bytes' } })

	assert.equal(getResourceBgmId(normalized.bgms[0]), 'supplemental:dimension-tower:old-login')
	assert.equal(getResourceBgmSrc(normalized.bgms[0]), '/resources/bgm/dimension-tower-old-login.mp3')
	assert.equal(getResourceBgmMarkBinary(normalized.bgms[0], { '/logo.png': 'logo-bytes' }), 'logo-bytes')
	assert.equal(normalized.bgms.length, 1)
})

test('filename remains the identity when id is absent and promotion retains its stable ID in one catalog entry', () => {
	const upstream = bgm({ id: undefined })
	assert.equal(getResourceBgmId(upstream), 'old-login')

	const promoted = bgm({
		id: 'supplemental:dimension-tower:old-login',
		filename: 'upstream-old-login',
		catalog: { membership: 'supplemental', status: 'curated' },
		audio: { file: 'old-login.mp3', codec: 'mp3', container: 'mp3' },
	})
	const normalized = normalizeResourceCatalog({ bgms: [promoted], marks: {} })
	assert.equal(normalized.bgms.length, 1)
	assert.equal(getResourceBgmId(normalized.bgms[0]), 'supplemental:dimension-tower:old-login')
	assert.equal(normalized.bgms[0].catalog.status, 'curated')
})

test('new-format entries never guess MP3 when declared audio is missing or unsafe', () => {
	const supplemental = bgm({ id: 'supplemental:dimension-tower:old-login', catalog: { membership: 'supplemental', status: 'pending-upstream', tracking: 'issue' } })
	delete supplemental.audio
	assert.throws(() => normalizeResourceCatalog({ bgms: [supplemental], marks: {} }), /no valid declared audio representation/)

	assert.equal(hasValidAudioRepresentation({ file: '../outside.mp3', codec: 'mp3', container: 'mp3' }), false)
	assert.equal(hasValidAudioRepresentation({ file: 'https://example.test/track.mp3', codec: 'mp3', container: 'mp3' }), false)
	assert.equal(hasValidAudioRepresentation({ file: 'safe-name.mp3', codec: '', container: 'mp3' }), false)
	assert.throws(() => getResourceBgmSrc(bgm({ audio: { file: '/outside.mp3', codec: 'mp3', container: 'mp3' } })), /no valid declared audio representation/)
})

test('real legacy filenames with URL punctuation remain valid and are encoded as one path segment', () => {
	for (const file of ['What is Love?.webm', '50% Love #1.webm', 'colon:name.mp3', '繁體中文.mp3']) {
		const track = bgm({ audio: { file, codec: 'mp3', container: 'mp3' } })
		const [normalized] = normalizeResourceCatalog({ bgms: [track], marks: {} }).bgms
		assert.equal(getResourceBgmSrc(normalized), `/resources/bgm/${encodeURIComponent(file)}`)
	}
	assert.equal(getResourceBgmSrc(bgm({ audio: { file: 'What is Love?.webm', codec: 'opus', container: 'webm' } })), '/resources/bgm/What%20is%20Love%3F.webm')
})

test('declared marks resolve only from the marks catalog', () => {
	assert.equal(getResourceBgmMarkBinary(bgm(), { Event: 'event-bytes' }), 'event-bytes')
	assert.throws(() => getResourceBgmMarkBinary(bgm({ mark: 'Missing' }), { '/logo.png': 'logo-bytes' }), /undeclared mark/)
	assert.throws(() => getResourceBgmMarkBinary(bgm({ mark: 'toString' }), {}), /undeclared mark/)
})

test('loudness measurements map filename rows to stable IDs only for a fully compatible catalog', () => {
	const supplemental = bgm({
		id: 'supplemental:dimension-tower:old-login',
		filename: 'dimension-tower-old-login',
		audio: { file: 'dimension-tower-old-login.mp3', codec: 'mp3', container: 'mp3' },
	})
	const report = reportFor([supplemental])
	const measurements = getCompatibleLoudnessMeasurements(report, [supplemental], 123)
	assert.equal(measurements?.get('supplemental:dimension-tower:old-login')?.filename, 'dimension-tower-old-login')

	const upstream = bgm({ id: undefined })
	const staleReport = reportFor([upstream])
	assert.equal(getCompatibleLoudnessMeasurements(staleReport, [upstream, supplemental], 123), null)
	assert.equal(getCompatibleLoudnessMeasurements(report, [supplemental], 124), null)

	const wrongAudio = reportFor([supplemental])
	wrongAudio.tracks[0].file = 'different.mp3'
	assert.equal(getCompatibleLoudnessMeasurements(wrongAudio, [supplemental], 123), null)
})

test('duplicate stable IDs and invalid supplemental catalog metadata fail closed', () => {
	const duplicateA = bgm({ id: 'stable-track' })
	const duplicateB = bgm({ filename: 'another-file', id: 'stable-track' })
	assert.throws(() => normalizeResourceCatalog({ bgms: [duplicateA, duplicateB], marks: {} }), /duplicate stable ID/)

	const invalid = bgm({ id: 'supplemental:missing-tracking', catalog: { membership: 'supplemental', status: 'pending-upstream', tracking: '' } })
	assert.throws(() => normalizeResourceCatalog({ bgms: [invalid], marks: {} }), /invalid catalog metadata/)
})
