let resetting = false
const operations = new Set<Promise<unknown>>()

export function isWorldMapStorageResetting(): boolean {
	return resetting
}

export async function runWorldMapStorageOperation<T>(operation: () => Promise<T>): Promise<T | undefined> {
	if (resetting)
		return undefined

	const request = operation()
	operations.add(request)
	try {
		return await request
	}
	finally {
		operations.delete(request)
	}
}

export function beginWorldMapStorageReset() {
	if (resetting)
		throw new Error('World Map storage reset is already in progress.')

	resetting = true
	let ended = false
	return {
		async waitForOperations(): Promise<void> {
			await Promise.allSettled([...operations])
		},
		end(): void {
			if (ended)
				return
			ended = true
			resetting = false
		},
	}
}
