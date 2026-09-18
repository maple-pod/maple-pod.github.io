import { isFactoryResetting } from '@/utils/factoryReset'

let resetting = false
let generation = 0
const operations = new Set<Promise<unknown>>()

export function isWorldMapStorageResetting(): boolean {
	return resetting || isFactoryResetting()
}

export function getWorldMapStorageGeneration(): number {
	return generation
}

export function isWorldMapStorageGenerationCurrent(expectedGeneration: number): boolean {
	return generation === expectedGeneration && !isWorldMapStorageResetting()
}

export async function waitForWorldMapStorageOperations(): Promise<void> {
	await Promise.allSettled([...operations])
}

export async function runWorldMapStorageOperation<T>(
	operation: () => Promise<T>,
	expectedGeneration = generation,
): Promise<T | undefined> {
	if (!isWorldMapStorageGenerationCurrent(expectedGeneration))
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
	generation++
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
