const DEFAULT_MIME_TYPE = 'audio/webm; codecs="opus"'

function waitForEvent(target, successEvent, errorEvent = 'error') {
	return new Promise((resolve, reject) => {
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

export class MsePlaybackScheduler extends EventTarget {
	constructor({
		audio,
		tracks,
		resourceBase,
		mimeType = DEFAULT_MIME_TYPE,
		previousCount = 1,
		futureCount = 3,
	}) {
		super()
		this.audio = audio
		this.tracks = tracks
		this.resourceBase = resourceBase
		this.mimeType = mimeType
		this.previousCount = previousCount
		this.futureCount = futureCount
		this.mediaSource = null
		this.sourceBuffer = null
		this.objectUrl = null
		this.order = []
		this.currentOrderIndex = 0
		this.entries = []
		this.totalAppendedBytes = 0
		this.totalAppendedTracks = 0
		this.operation = Promise.resolve()
		this.disposed = false
		this.audio.addEventListener('timeupdate', this.handleTimeUpdate)
		this.audio.addEventListener('seeked', this.handleTimeUpdate)
	}

	handleTimeUpdate = () => {
		const entry = this.getEntryAtTime(this.audio.currentTime)
		if (entry == null)
			return
		const orderIndex = this.order.indexOf(entry.id)
		if (orderIndex < 0 || orderIndex === this.currentOrderIndex)
			return
		this.currentOrderIndex = orderIndex
		this.emitState()
		void this.enqueue(() => this.maintainWindow())
	}

	async initialize(order, startId = order[0]) {
		if (!('MediaSource' in window) || !MediaSource.isTypeSupported(this.mimeType))
			throw new Error(`MSE ${this.mimeType} is not supported by this browser.`)
		if (order.length === 0)
			throw new Error('The queue must contain at least one track.')

		const startIndex = order.indexOf(startId)
		if (startIndex < 0)
			throw new Error(`Start track ${startId} is not in the queue.`)

		this.order = [...order]
		this.currentOrderIndex = startIndex
		this.mediaSource = new MediaSource()
		this.objectUrl = URL.createObjectURL(this.mediaSource)
		this.audio.src = this.objectUrl
		await waitForEvent(this.mediaSource, 'sourceopen')
		this.sourceBuffer = this.mediaSource.addSourceBuffer(this.mimeType)
		this.sourceBuffer.mode = 'sequence'
		await this.maintainWindow({ rebuild: true })
		this.emitState()
	}

	enqueue(operation) {
		const next = this.operation.then(() => {
			if (this.disposed)
				return undefined
			return operation()
		})
		this.operation = next.catch(() => {})
		return next
	}

	async fetchTrack(id) {
		const track = this.tracks[id]
		if (track == null)
			throw new Error(`Unknown track ${id}.`)
		const response = await fetch(this.resourceBase + encodeURIComponent(track.file))
		if (!response.ok)
			throw new Error(`Failed to fetch ${track.file} (${response.status}).`)
		return response.arrayBuffer()
	}

	bufferedEnd() {
		const buffered = this.sourceBuffer.buffered
		return buffered.length === 0 ? 0 : buffered.end(buffered.length - 1)
	}

	async appendTrack(id) {
		const data = await this.fetchTrack(id)
		const start = this.bufferedEnd()
		const updateFinished = waitForEvent(this.sourceBuffer, 'updateend')
		this.sourceBuffer.appendBuffer(data)
		await updateFinished
		const entry = {
			id,
			start,
			end: this.bufferedEnd(),
			bytes: data.byteLength,
		}
		this.totalAppendedBytes += data.byteLength
		this.totalAppendedTracks++
		this.entries.push(entry)
		this.emitState()
		return entry
	}

	getEntryAtTime(time) {
		return this.entries.find(entry => time >= entry.start && time < entry.end)
			?? this.entries.findLast(entry => time >= entry.start)
			?? null
	}

	getCurrentEntry() {
		const currentId = this.order[this.currentOrderIndex]
		return this.entries.find(entry => entry.id === currentId) ?? null
	}

	getWindowOrder() {
		const start = Math.max(0, this.currentOrderIndex - this.previousCount)
		const end = Math.min(this.order.length, this.currentOrderIndex + this.futureCount + 1)
		return this.order.slice(start, end)
	}

	async removeRange(start, end) {
		if (end <= start)
			return
		const updateFinished = waitForEvent(this.sourceBuffer, 'updateend')
		this.sourceBuffer.remove(start, end)
		await updateFinished
	}

	async maintainWindow({ rebuild = false } = {}) {
		const wanted = this.getWindowOrder()
		const currentEntry = this.getCurrentEntry()

		if (rebuild || currentEntry == null) {
			if (this.entries.length > 0)
				await this.removeRange(this.entries[0].start, this.bufferedEnd() + 0.001)
			this.entries = []
			this.sourceBuffer.timestampOffset = this.bufferedEnd()
			for (const id of wanted)
				await this.appendTrack(id)
			return
		}

		const firstWantedId = wanted[0]
		const firstWantedIndex = this.entries.findIndex(entry => entry.id === firstWantedId)
		if (firstWantedIndex > 0) {
			const removeEnd = this.entries[firstWantedIndex].start
			await this.removeRange(this.entries[0].start, removeEnd)
			this.entries = this.entries.slice(firstWantedIndex)
		}

		const currentIndexInEntries = this.entries.findIndex(entry => entry.id === currentEntry.id)
		if (currentIndexInEntries < 0)
			throw new Error('Current entry disappeared while maintaining the buffer window.')

		const existingFuture = this.entries.slice(currentIndexInEntries + 1)
			.map(entry => entry.id)
		const wantedFuture = wanted.slice(wanted.indexOf(currentEntry.id) + 1)
		const commonPrefixLength = existingFuture.findIndex((id, index) => id !== wantedFuture[index])
		const keptFutureCount = commonPrefixLength === -1
			? Math.min(existingFuture.length, wantedFuture.length)
			: commonPrefixLength

		if (keptFutureCount < existingFuture.length) {
			const firstRemoved = this.entries[currentIndexInEntries + 1 + keptFutureCount]
			await this.removeRange(firstRemoved.start, this.bufferedEnd() + 0.001)
			this.entries = this.entries.slice(0, currentIndexInEntries + 1 + keptFutureCount)
			this.sourceBuffer.timestampOffset = this.entries.at(-1).end
		}

		for (const id of wantedFuture.slice(keptFutureCount))
			await this.appendTrack(id)
	}

	async replaceFuture(nextIds) {
		return this.enqueue(async () => {
			const currentId = this.order[this.currentOrderIndex]
			this.order = [
				...this.order.slice(0, this.currentOrderIndex + 1),
				...nextIds.filter(id => id !== currentId),
			]
			await this.maintainWindow()
			this.emitState()
		})
	}

	async goNext() {
		return this.enqueue(async () => {
			if (this.currentOrderIndex >= this.order.length - 1)
				return
			this.currentOrderIndex++
			await this.maintainWindow()
			const entry = this.getCurrentEntry()
			if (entry != null)
				this.audio.currentTime = entry.start
			this.emitState()
		})
	}

	async goPrevious() {
		return this.enqueue(async () => {
			const current = this.getCurrentEntry()
			if (current != null && this.audio.currentTime - current.start > 3) {
				this.audio.currentTime = current.start
				return
			}
			if (this.currentOrderIndex === 0)
				return
			this.currentOrderIndex--
			await this.maintainWindow()
			const entry = this.getCurrentEntry()
			if (entry != null)
				this.audio.currentTime = entry.start
			this.emitState()
		})
	}

	async playTrack(id) {
		return this.enqueue(async () => {
			const index = this.order.indexOf(id)
			if (index < 0)
				throw new Error(`Track ${id} is not in the queue.`)
			this.currentOrderIndex = index
			await this.maintainWindow({ rebuild: this.getCurrentEntry() == null })
			const entry = this.getCurrentEntry()
			if (entry != null)
				this.audio.currentTime = entry.start
			this.emitState()
		})
	}

	getState() {
		const currentId = this.order[this.currentOrderIndex] ?? null
		const buffered = []
		if (this.sourceBuffer != null) {
			for (let index = 0; index < this.sourceBuffer.buffered.length; index++) {
				buffered.push([
					this.sourceBuffer.buffered.start(index),
					this.sourceBuffer.buffered.end(index),
				])
			}
		}
		return {
			currentId,
			currentOrderIndex: this.currentOrderIndex,
			order: [...this.order],
			window: this.entries.map(entry => ({ ...entry })),
			buffered,
			totalAppendedBytes: this.totalAppendedBytes,
			totalAppendedTracks: this.totalAppendedTracks,
			srcStable: this.objectUrl != null && this.audio.src === this.objectUrl,
		}
	}

	emitState() {
		this.dispatchEvent(new CustomEvent('statechange', { detail: this.getState() }))
	}

	dispose() {
		this.disposed = true
		this.audio.removeEventListener('timeupdate', this.handleTimeUpdate)
		this.audio.removeEventListener('seeked', this.handleTimeUpdate)
		if (this.objectUrl != null)
			URL.revokeObjectURL(this.objectUrl)
	}
}
