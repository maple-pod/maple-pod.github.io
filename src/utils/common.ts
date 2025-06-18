import { decompressSync, deflateSync, strFromU8, strToU8 } from 'fflate'
import { mergeProps } from 'vue'

export function mergeClasses(...classes: any[]) {
	return mergeProps(...classes.map(cls => ({ class: cls }))).class as any
}

export function dataToUrlHash(data: any) {
	const json = JSON.stringify(data)
	const compressed = deflateSync(strToU8(json))
	return `#${btoa(String.fromCharCode(...compressed))}`
}

export function urlHashToData<T = any>(hash: string): T | null {
	if (hash.startsWith('#') === false) {
		return null
	}
	try {
		const binary = atob(hash.slice(1))
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
): Promise<Blob> {
	const response = await fetch(url)
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

export type Task<T> = () => Promise<T>

export class PromiseQueue {
	private concurrency: number
	private runningCount = 0
	private queue: Task<any>[] = []

	constructor(concurrency: number) {
		this.concurrency = concurrency
	}

	add<T>(task: Task<T>): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const wrappedTask = () => {
				this.runningCount++
				return task()
					.then(resolve)
					.catch(reject)
					.finally(() => {
						this.runningCount--
						this.runNext() // 嘗試執行下一個
					})
			}

			if (this.runningCount < this.concurrency) {
				wrappedTask()
			}
			else {
				this.queue.push(wrappedTask)
			}
		})
	}

	private runNext() {
		if (this.queue.length > 0 && this.runningCount < this.concurrency) {
			const nextTask = this.queue.shift()
			nextTask?.()
		}
	}
}
