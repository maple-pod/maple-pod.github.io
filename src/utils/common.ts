import { mergeProps } from 'vue'

export function mergeClasses(...classes: any[]) {
	return mergeProps(...classes.map(cls => ({ class: cls }))).class as any
}

export function dataToUrlHash(data: any) {
	const hash = btoa(encodeURIComponent(JSON.stringify(data)))
	return `#${hash}`
}

export function urlHashToData<T = any>(hash: string): T | null {
	if (hash.startsWith('#') === false) {
		return null
	}
	try {
		const data = JSON.parse(decodeURIComponent(atob(hash.slice(1))))
		return data as T
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
