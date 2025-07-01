import { decompressSync, deflateSync, strFromU8, strToU8 } from 'fflate'
import { mergeProps } from 'vue'

export function mergeClasses(...classes: any[]) {
	return mergeProps(...classes.map(cls => ({ class: cls }))).class as any
}

export function dataToUrlHash(data: any) {
	const json = JSON.stringify(data)
	const compressed = deflateSync(strToU8(json))
	// eslint-disable-next-line prefer-template
	return '#' + btoa(Array.from(compressed, byte => String.fromCharCode(byte)).join(''))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '')
}

export function urlHashToData<T = any>(hash: string): T | null {
	if (hash.startsWith('#') === false) {
		return null
	}
	try {
		let b64 = hash.slice(1)
			.replace(/-/g, '+')
			.replace(/_/g, '/')
		while (b64.length % 4) b64 += '='

		const binary = atob(b64)
		const compressed = Uint8Array.from(binary, c => c.charCodeAt(0))
		const json = strFromU8(decompressSync(compressed))
		return JSON.parse(json) as T
	}
	catch {
		return null
	}
}

export function exportToJSONFile(data: any, filename: string) {
	const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.style.display = 'none'
	a.href = url
	a.download = filename
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}

export function formatTime(timeInSeconds: number) {
	const minutes = String(Math.floor(timeInSeconds / 60))
	const seconds = String(Math.floor(timeInSeconds % 60)).padStart(2, '0')
	return `${minutes}:${seconds}`
}

export async function decodeImageFromBinary(binStr: string) {
	const compressed = Uint8Array.from(binStr, c => c.charCodeAt(0))
	const decompressed = decompressSync(compressed)
	const blob = new Blob([decompressed])
	const url = URL.createObjectURL(blob)

	return url
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
	const result: T[][] = []
	for (let i = 0; i < array.length; i += chunkSize) {
		result.push(array.slice(i, i + chunkSize))
	}
	return result
}

export async function fetchBlob(
	url: string,
	onProgress?: (loaded: number, total: number) => void,
	signal?: AbortSignal | null,
): Promise<Blob> {
	const response = await fetch(url, { signal })
	const contentEncoding = response.headers.get('content-encoding')
	const contentLength = response.headers.get(contentEncoding ? 'x-file-size' : 'content-length')
	if (contentLength === null) {
		throw new Error('Response size header unavailable')
	}
	const total = Number.parseInt(contentLength, 10)
	let loaded = 0
	const newResponse = new Response(
		new ReadableStream({
			start(controller) {
				const reader = response.body!.getReader()

				read()

				function read() {
					reader.read()
						.then(({ done, value }) => {
							if (done) {
								controller.close()
								return
							}
							loaded += value.byteLength
							onProgress?.(loaded, total)
							controller.enqueue(value)
							read()
						})
						.catch((error) => {
							controller.error(error)
						})
				}
			},
		}),
	)
	return await newResponse.blob()
}

export function createPromise<T = any>() {
	let resolve: (value: T) => void
	let reject: (reason?: any) => void
	const promise = new Promise<T>((res, rej) => {
		resolve = res
		reject = rej
	})
	return {
		promise,
		resolve: resolve!,
		reject: reject!,
	}
}

export type TaskFn = () => Promise<any>
export interface Task {
	run: TaskFn
	cancel: () => void
}
export class CancelledError extends Error {
	constructor(message: string = 'Task was cancelled') {
		super(message)
		this.name = 'CancelledError'
	}
}
export class PromiseQueue {
	private concurrency: number
	private running: number
	private queue: Task[]
	constructor(concurrency: number) {
		this.concurrency = concurrency
		this.running = 0
		this.queue = []
	}

	public add(fn: TaskFn): Task {
		const { promise, resolve, reject } = createPromise()

		const task: Task = {
			run: () => {
				fn()
					.then(resolve)
					.catch(reject)
				return promise
			},
			cancel: () => {
				const index = this.queue.indexOf(task)
				if (index !== -1) {
					this.queue.splice(index, 1)
				}
				reject(new CancelledError())
			},
		}
		this.queue.push(task)
		this.runNext()
		return task
	}

	private runNext() {
		if (this.running >= this.concurrency || this.queue.length === 0) {
			return
		}
		const task = this.queue.shift()!
		this.running++
		task.run()
			.then(() => {
				this.running--
				this.runNext()
			})
			.catch((error) => {
				if (error instanceof CancelledError) {
					this.running--
					this.runNext()
				}
				else {
					console.error('Task failed:', error)
				}
			})
	}
}
