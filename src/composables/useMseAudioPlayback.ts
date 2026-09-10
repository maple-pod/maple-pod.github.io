import type { Ref } from 'vue'

export interface MseAudioSource {
	src: string
	normalizationGainDb?: number
	release?: () => void
}

interface MseTimelineEntry {
	sequence: number
	id: string
	start: number
	end: number
	normalizationGainDb: number
}

interface MseWindowRequest {
	previousIds: string[]
	currentId: string
	futureIds: string[]
	seekToCurrent?: boolean
}

interface UseMseAudioPlaybackOptions {
	audio: Ref<HTMLAudioElement>
	loadSource: (src: string) => void
	getAudioSource: (id: string) => Promise<MseAudioSource | null>
	getMimeType: (id: string) => string | null
	previousCount?: number
	futureCount?: number
	onCurrentEntryChange?: (id: string, normalizationGainDb: number) => void
}

const BUFFER_EPSILON_SECONDS = 0.001

function waitForEvent(target: EventTarget, successEvent: string, errorEvent = 'error') {
	return new Promise<void>((resolve, reject) => {
		function cleanup() {
			target.removeEventListener(successEvent, handleSuccess)
			target.removeEventListener(errorEvent, handleError)
		}
		function handleSuccess() {
			cleanup()
			resolve()
		}
		function handleError() {
			cleanup()
			reject(new Error(`${target.constructor.name} emitted ${errorEvent}.`))
		}
		target.addEventListener(successEvent, handleSuccess, { once: true })
		target.addEventListener(errorEvent, handleError, { once: true })
	})
}

export function useMseAudioPlayback({
	audio,
	loadSource,
	getAudioSource,
	getMimeType,
	previousCount = 1,
	futureCount = 3,
	onCurrentEntryChange,
}: UseMseAudioPlaybackOptions) {
	const active = ref(false)
	const localCurrentTime = ref(0)
	const localDuration = ref(0)
	const currentEntryId = ref<string | null>(null)
	const currentNormalizationGainDb = ref(0)

	let mediaSource: MediaSource | null = null
	let sourceBuffer: SourceBuffer | null = null
	let objectUrl: string | null = null
	let mimeType: string | null = null
	let entries: MseTimelineEntry[] = []
	let currentEntry: MseTimelineEntry | null = null
	let sequence = 0
	let disposed = false
	let operation = Promise.resolve<unknown>(undefined)
	let reconcileRevision = 0

	function canUse(id: string | null) {
		if (id == null || typeof MediaSource === 'undefined')
			return false
		const type = getMimeType(id)
		return type != null && MediaSource.isTypeSupported(type)
	}

	function getBufferedEnd() {
		const buffer = sourceBuffer?.buffered
		return buffer == null || buffer.length === 0 ? 0 : buffer.end(buffer.length - 1)
	}

	function findEntryAtTime(time: number) {
		const containing = entries.find(entry => time >= entry.start && time < entry.end)
		if (containing != null)
			return containing
		for (let index = entries.length - 1; index >= 0; index--) {
			const entry = entries[index]!
			if (time >= entry.start)
				return entry
		}
		return null
	}

	function updateCurrentEntryFromTime(notify = true) {
		if (!active.value)
			return
		const next = findEntryAtTime(audio.value.currentTime)
		if (next == null)
			return

		localCurrentTime.value = Math.max(0, Math.min(next.end - next.start, audio.value.currentTime - next.start))
		localDuration.value = next.end - next.start
		if (next.sequence === currentEntry?.sequence)
			return

		currentEntry = next
		currentEntryId.value = next.id
		currentNormalizationGainDb.value = next.normalizationGainDb
		if (notify)
			onCurrentEntryChange?.(next.id, next.normalizationGainDb)
	}

	function handleTimeUpdate() {
		updateCurrentEntryFromTime(true)
	}

	useEventListener(audio, 'timeupdate', handleTimeUpdate)
	useEventListener(audio, 'seeked', handleTimeUpdate)

	function enqueue<T>(task: () => Promise<T>) {
		const next = operation.then(async () => {
			if (disposed)
				throw new Error('MSE playback controller is disposed.')
			return task()
		})
		operation = next.catch(() => undefined)
		return next
	}

	function compatiblePreviousIds(ids: string[], type: string) {
		const compatible: string[] = []
		for (let index = ids.length - 1; index >= 0 && compatible.length < previousCount; index--) {
			const id = ids[index]!
			if (getMimeType(id) !== type)
				break
			compatible.unshift(id)
		}
		return compatible
	}

	function compatibleFutureIds(ids: string[], type: string) {
		const compatible: string[] = []
		for (const id of ids) {
			if (compatible.length >= futureCount || getMimeType(id) !== type)
				break
			compatible.push(id)
		}
		return compatible
	}

	function shouldEndRun(futureIds: string[], compatibleFuture: string[]) {
		if (compatibleFuture.length >= futureCount)
			return false
		if (compatibleFuture.length === futureIds.length)
			return true
		return getMimeType(futureIds[compatibleFuture.length]!) !== mimeType
	}

	async function openSession(type: string) {
		const previousObjectUrl = objectUrl
		const nextMediaSource = new MediaSource()
		const nextObjectUrl = URL.createObjectURL(nextMediaSource)

		mediaSource = nextMediaSource
		objectUrl = nextObjectUrl
		mimeType = type
		entries = []
		currentEntry = null
		currentEntryId.value = null
		localCurrentTime.value = 0
		localDuration.value = 0
		active.value = true
		loadSource(nextObjectUrl)
		if (previousObjectUrl != null)
			URL.revokeObjectURL(previousObjectUrl)

		await waitForEvent(nextMediaSource, 'sourceopen')
		sourceBuffer = nextMediaSource.addSourceBuffer(type)
		sourceBuffer.mode = 'sequence'
	}

	async function resolveTrack(id: string) {
		const source = await getAudioSource(id)
		if (source == null)
			throw new Error(`Could not resolve audio source for ${id}.`)

		try {
			const response = await fetch(source.src)
			if (!response.ok)
				throw new Error(`Could not fetch audio source for ${id} (${response.status}).`)
			return {
				data: await response.arrayBuffer(),
				normalizationGainDb: source.normalizationGainDb ?? 0,
			}
		}
		finally {
			source.release?.()
		}
	}

	async function appendTrack(id: string, revision: number) {
		const buffer = sourceBuffer
		if (buffer == null)
			throw new Error('MSE SourceBuffer is unavailable.')

		const { data, normalizationGainDb } = await resolveTrack(id)
		if (revision !== reconcileRevision)
			return null

		const start = getBufferedEnd()
		const updateFinished = waitForEvent(buffer, 'updateend')
		buffer.appendBuffer(data)
		await updateFinished
		const entry: MseTimelineEntry = {
			sequence: ++sequence,
			id,
			start,
			end: getBufferedEnd(),
			normalizationGainDb,
		}
		entries.push(entry)
		return entry
	}

	async function removeRange(start: number, end: number) {
		const buffer = sourceBuffer
		if (buffer == null || end <= start)
			return
		const updateFinished = waitForEvent(buffer, 'updateend')
		buffer.remove(start, end)
		await updateFinished
	}

	async function appendIds(ids: string[], revision: number) {
		for (const id of ids) {
			if (revision !== reconcileRevision)
				return
			const appended = await appendTrack(id, revision)
			if (appended == null)
				return
		}
	}

	async function endRunIfNeeded(shouldEnd: boolean) {
		if (!shouldEnd || mediaSource?.readyState !== 'open' || sourceBuffer?.updating)
			return
		mediaSource.endOfStream()
	}

	function findBufferedEntry(id: string) {
		if (currentEntry?.id === id)
			return currentEntry
		const time = audio.value.currentTime
		return entries
			.filter(entry => entry.id === id)
			.sort((left, right) => Math.abs(left.start - time) - Math.abs(right.start - time))[0]
			?? null
	}

	async function rebuildAround(
		previousIds: string[],
		currentId: string,
		futureIds: string[],
		type: string,
		revision: number,
	) {
		const compatiblePrevious = compatiblePreviousIds(previousIds, type)
		const compatibleFuture = compatibleFutureIds(futureIds, type)
		const oldCurrent = findEntryAtTime(audio.value.currentTime)
		if (oldCurrent != null) {
			const firstFuture = entries.find(entry => entry.start >= oldCurrent.end - BUFFER_EPSILON_SECONDS)
			if (firstFuture != null) {
				await removeRange(firstFuture.start, getBufferedEnd() + BUFFER_EPSILON_SECONDS)
				entries = entries.filter(entry => entry.start < firstFuture.start)
			}
		}

		const appendStart = getBufferedEnd()
		if (sourceBuffer != null)
			sourceBuffer.timestampOffset = appendStart
		const beforeCount = entries.length
		await appendIds([...compatiblePrevious, currentId, ...compatibleFuture], revision)
		if (revision !== reconcileRevision)
			return null

		const appendedEntries = entries.slice(beforeCount)
		const target = appendedEntries.find(entry => entry.id === currentId) ?? null
		if (target == null)
			throw new Error(`MSE rebuild did not append current track ${currentId}.`)
		return {
			target,
			shouldEnd: shouldEndRun(futureIds, compatibleFuture),
		}
	}

	async function maintainAround(
		target: MseTimelineEntry,
		futureIds: string[],
		type: string,
		revision: number,
	) {
		const compatibleFuture = compatibleFutureIds(futureIds, type)
		const targetIndex = entries.findIndex(entry => entry.sequence === target.sequence)
		if (targetIndex < 0)
			throw new Error('Current MSE timeline entry disappeared.')

		const existingFuture = entries.slice(targetIndex + 1)
		const wantedFuture = compatibleFuture
		let common = 0
		while (
			common < existingFuture.length
			&& common < wantedFuture.length
			&& existingFuture[common]!.id === wantedFuture[common]
		) {
			common++
		}

		if (common < existingFuture.length) {
			const firstRemoved = existingFuture[common]!
			await removeRange(firstRemoved.start, getBufferedEnd() + BUFFER_EPSILON_SECONDS)
			entries = entries.filter(entry => entry.start < firstRemoved.start)
		}

		if (sourceBuffer != null)
			sourceBuffer.timestampOffset = getBufferedEnd()
		await appendIds(wantedFuture.slice(common), revision)
		if (revision !== reconcileRevision)
			return

		const refreshedTargetIndex = entries.findIndex(entry => entry.sequence === target.sequence)
		const earliestKeptIndex = Math.max(0, refreshedTargetIndex - previousCount)
		if (earliestKeptIndex > 0) {
			const removeEnd = entries[earliestKeptIndex]!.start
			await removeRange(entries[0]!.start, removeEnd)
			entries = entries.slice(earliestKeptIndex)
		}

		await endRunIfNeeded(shouldEndRun(futureIds, compatibleFuture))
	}

	async function reconcile({ previousIds, currentId, futureIds, seekToCurrent = false }: MseWindowRequest) {
		const revision = ++reconcileRevision
		return enqueue(async () => {
			if (revision !== reconcileRevision)
				return false
			const type = getMimeType(currentId)
			if (type == null || typeof MediaSource === 'undefined' || !MediaSource.isTypeSupported(type))
				return false

			if (!active.value || mediaSource == null || sourceBuffer == null || mimeType !== type)
				await openSession(type)
			if (revision !== reconcileRevision)
				return false

			let target = findBufferedEntry(currentId)
			let shouldEndAfterRebuild = false
			if (target == null) {
				const rebuilt = await rebuildAround(previousIds, currentId, futureIds, type, revision)
				if (rebuilt == null)
					return false
				target = rebuilt.target
				shouldEndAfterRebuild = rebuilt.shouldEnd
			}

			if (seekToCurrent || currentEntry == null || currentEntry.id !== currentId) {
				audio.value.currentTime = target.start
				currentEntry = target
				currentEntryId.value = target.id
				currentNormalizationGainDb.value = target.normalizationGainDb
				localCurrentTime.value = 0
				localDuration.value = target.end - target.start
			}

			await maintainAround(target, futureIds, type, revision)
			if (revision !== reconcileRevision)
				return false
			if (shouldEndAfterRebuild)
				await endRunIfNeeded(true)
			updateCurrentEntryFromTime(false)
			return true
		})
	}

	function seekLocal(value: number) {
		if (!active.value || currentEntry == null)
			return false
		const duration = currentEntry.end - currentEntry.start
		audio.value.currentTime = currentEntry.start + Math.min(duration, Math.max(0, value))
		localCurrentTime.value = Math.min(duration, Math.max(0, value))
		return true
	}

	function deactivate() {
		reconcileRevision++
		active.value = false
		currentEntry = null
		currentEntryId.value = null
		localCurrentTime.value = 0
		localDuration.value = 0
		currentNormalizationGainDb.value = 0
		mediaSource = null
		sourceBuffer = null
		mimeType = null
		entries = []
		if (objectUrl != null)
			URL.revokeObjectURL(objectUrl)
		objectUrl = null
	}

	function dispose() {
		disposed = true
		reconcileRevision++
		deactivate()
	}

	tryOnScopeDispose(dispose)

	return {
		active: computed(() => active.value),
		currentEntryId: computed(() => currentEntryId.value),
		currentTime: computed(() => localCurrentTime.value),
		duration: computed(() => localDuration.value),
		normalizationGainDb: computed(() => currentNormalizationGainDb.value),
		canUse,
		reconcile,
		seekLocal,
		deactivate,
		dispose,
	}
}
