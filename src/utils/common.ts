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
