export const FACTORY_RESET_PAGE_QUIESCE_MESSAGE = 'MAPLE_POD_FACTORY_RESET_PAGE_QUIESCE'
export const FACTORY_RESET_PAGE_QUIESCED_MESSAGE = 'MAPLE_POD_FACTORY_RESET_PAGE_QUIESCED'
export const FACTORY_RESET_PAGE_QUIESCE_FAILED_MESSAGE = 'MAPLE_POD_FACTORY_RESET_PAGE_QUIESCE_FAILED'
export const FACTORY_RESET_PAGE_ABORT_MESSAGE = 'MAPLE_POD_FACTORY_RESET_PAGE_ABORT'

type FactoryResetQuiesceHandler = () => Promise<void> | void

let factoryResetting = false
let activeResetId: string | null = null
const quiesceHandlers = new Set<FactoryResetQuiesceHandler>()

export function isFactoryResetting(): boolean {
	return factoryResetting
}

function enterFactoryReset(resetId: string): void {
	if (factoryResetting && activeResetId !== resetId)
		throw new Error('Another Factory Reset is already in progress.')

	factoryResetting = true
	activeResetId = resetId
}

function leaveFactoryReset(resetId: string): void {
	if (activeResetId !== resetId)
		return
	activeResetId = null
	factoryResetting = false
}

export function registerFactoryResetQuiesceHandler(handler: FactoryResetQuiesceHandler): () => void {
	quiesceHandlers.add(handler)
	return () => quiesceHandlers.delete(handler)
}

async function quiesceCurrentPage(): Promise<void> {
	const results = await Promise.allSettled([...quiesceHandlers].map(handler => handler()))
	const failures = results
		.filter((result): result is PromiseRejectedResult => result.status === 'rejected')
		.map(result => result.reason)
	if (failures.length > 0)
		throw new AggregateError(failures, 'Factory Reset page quiescence was incomplete.')
}

export function beginFactoryReset() {
	const resetId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
		? crypto.randomUUID()
		: `${Date.now()}-${Math.random()
			.toString(36)
			.slice(2)}`
	enterFactoryReset(resetId)

	let ended = false
	return {
		resetId,
		end(): void {
			if (ended)
				return
			ended = true
			leaveFactoryReset(resetId)
		},
	}
}

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
	navigator.serviceWorker.addEventListener('message', (event) => {
		const type = event.data?.type
		const resetId = event.data?.resetId
		if (typeof resetId !== 'string')
			return

		if (type === FACTORY_RESET_PAGE_ABORT_MESSAGE) {
			leaveFactoryReset(resetId)
			return
		}

		if (type !== FACTORY_RESET_PAGE_QUIESCE_MESSAGE || event.ports.length === 0)
			return

		const port = event.ports[0]!
		void (async () => {
			try {
				enterFactoryReset(resetId)
				await quiesceCurrentPage()
				port.postMessage({
					type: FACTORY_RESET_PAGE_QUIESCED_MESSAGE,
					resetId,
				})
			}
			catch (error) {
				port.postMessage({
					type: FACTORY_RESET_PAGE_QUIESCE_FAILED_MESSAGE,
					resetId,
					message: error instanceof Error ? error.message : String(error),
				})
			}
			finally {
				port.close()
			}
		})()
	})
}
