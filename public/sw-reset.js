(() => {
	const QUIESCE_MESSAGE = 'MAPLE_POD_FACTORY_RESET_QUIESCE'
	const QUIESCED_MESSAGE = 'MAPLE_POD_FACTORY_RESET_QUIESCED'
	const QUIESCE_FAILED_MESSAGE = 'MAPLE_POD_FACTORY_RESET_QUIESCE_FAILED'
	const ABORT_MESSAGE = 'MAPLE_POD_FACTORY_RESET_ABORT'
	const ABORTED_MESSAGE = 'MAPLE_POD_FACTORY_RESET_ABORTED'
	const FINALIZE_MESSAGE = 'MAPLE_POD_FACTORY_RESET_FINALIZE'
	const FINALIZED_MESSAGE = 'MAPLE_POD_FACTORY_RESET_FINALIZED'
	const PAGE_QUIESCE_MESSAGE = 'MAPLE_POD_FACTORY_RESET_PAGE_QUIESCE'
	const PAGE_QUIESCED_MESSAGE = 'MAPLE_POD_FACTORY_RESET_PAGE_QUIESCED'
	const PAGE_QUIESCE_FAILED_MESSAGE = 'MAPLE_POD_FACTORY_RESET_PAGE_QUIESCE_FAILED'
	const PAGE_ABORT_MESSAGE = 'MAPLE_POD_FACTORY_RESET_PAGE_ABORT'
	const PAGE_QUIESCE_TIMEOUT_MS = 15_000

	const pendingOperations = new Set()
	let cacheWritesBlocked = false
	let activeResetId = null

	function track(promise) {
		const tracked = Promise.resolve(promise)
			.finally(() => pendingOperations.delete(tracked))
		pendingOperations.add(tracked)
		return tracked
	}

	const nativeWaitUntil = globalThis.ExtendableEvent.prototype.waitUntil
	globalThis.ExtendableEvent.prototype.waitUntil = function (promise) {
		return nativeWaitUntil.call(this, track(promise))
	}

	const nativeCachePut = Cache.prototype.put
	Cache.prototype.put = function (request, response) {
		if (cacheWritesBlocked)
			return Promise.resolve()
		return track(nativeCachePut.call(this, request, response))
	}

	globalThis.addEventListener('fetch', (event) => {
		if (!cacheWritesBlocked)
			return

		event.stopImmediatePropagation()
	})

	async function scopedWindowClients() {
		const clients = await globalThis.clients.matchAll({
			type: 'window',
			includeUncontrolled: true,
		})
		return clients.filter(client => client.url.startsWith(globalThis.registration.scope))
	}

	async function quiescePage(client, resetId) {
		await new Promise((resolve, reject) => {
			const channel = new MessageChannel()
			const timeout = setTimeout(() => {
				channel.port1.close()
				reject(new Error(`Timed out while waiting for Maple Pod page ${client.id} to quiesce.`))
			}, PAGE_QUIESCE_TIMEOUT_MS)
			const finish = (callback) => {
				clearTimeout(timeout)
				channel.port1.close()
				callback()
			}
			channel.port1.onmessage = (event) => {
				if (event.data?.resetId !== resetId) {
					finish(() => reject(new Error(`Maple Pod page ${client.id} returned a mismatched Factory Reset response.`)))
					return
				}
				if (event.data?.type === PAGE_QUIESCED_MESSAGE) {
					finish(resolve)
					return
				}
				if (event.data?.type === PAGE_QUIESCE_FAILED_MESSAGE) {
					finish(() => reject(new Error(event.data?.message || `Maple Pod page ${client.id} failed to quiesce.`)))
					return
				}
				finish(() => reject(new Error(`Maple Pod page ${client.id} returned an unexpected Factory Reset response.`)))
			}
			channel.port1.onmessageerror = () => {
				finish(() => reject(new Error(`Failed to decode the Factory Reset response from Maple Pod page ${client.id}.`)))
			}
			client.postMessage({
				type: PAGE_QUIESCE_MESSAGE,
				resetId,
			}, [channel.port2])
		})
	}

	async function quiescePages(resetId) {
		const clients = await scopedWindowClients()
		await Promise.all(clients.map(client => quiescePage(client, resetId)))
	}

	async function abortPages(resetId) {
		const clients = await scopedWindowClients()
		for (const client of clients) {
			client.postMessage({
				type: PAGE_ABORT_MESSAGE,
				resetId,
			})
		}
	}

	async function drainPendingOperations() {
		while (pendingOperations.size > 0)
			await Promise.allSettled([...pendingOperations])

		// Let continuations from the just-settled operations enqueue their
		// event.waitUntil() work before deciding that the worker is quiescent.
		await Promise.resolve()
		if (pendingOperations.size > 0)
			await drainPendingOperations()
	}

	function reply(port, data) {
		port.postMessage(data)
		port.close()
	}

	globalThis.addEventListener('message', (event) => {
		const type = event.data?.type
		const resetId = event.data?.resetId
		if (
			typeof resetId !== 'string'
			|| event.ports == null
			|| event.ports.length === 0
		) {
			return
		}

		if (type !== QUIESCE_MESSAGE && type !== ABORT_MESSAGE && type !== FINALIZE_MESSAGE)
			return

		event.stopImmediatePropagation()
		const port = event.ports[0]
		const completion = (async () => {
			if (type === QUIESCE_MESSAGE) {
				if (activeResetId != null && activeResetId !== resetId)
					throw new Error('Another Factory Reset is already in progress in the Maple Pod service worker.')

				activeResetId = resetId
				cacheWritesBlocked = true
				await quiescePages(resetId)
				await drainPendingOperations()
				reply(port, { type: QUIESCED_MESSAGE, resetId })
				return
			}

			if (activeResetId !== resetId)
				throw new Error('Factory Reset service-worker state does not match the requesting page.')

			if (type === ABORT_MESSAGE) {
				cacheWritesBlocked = false
				activeResetId = null
				await abortPages(resetId)
				reply(port, { type: ABORTED_MESSAGE, resetId })
				return
			}

			const sourceId = event.source?.id
			const clients = await scopedWindowClients()
			const unregistered = await globalThis.registration.unregister()
			if (!unregistered)
				throw new Error('Failed to unregister the Maple Pod service worker.')

			await Promise.allSettled(clients
				.filter(client => client.id !== sourceId)
				.map(client => client.navigate(client.url)))
			reply(port, { type: FINALIZED_MESSAGE, resetId })
		})()
			.catch(async (error) => {
				if (type === QUIESCE_MESSAGE && activeResetId === resetId) {
					cacheWritesBlocked = false
					activeResetId = null
					await abortPages(resetId)
				}
				reply(port, {
					type: QUIESCE_FAILED_MESSAGE,
					resetId,
					message: error instanceof Error ? error.message : String(error),
				})
			})

		// Deliberately bypass the patched waitUntil(): Factory Reset coordination
		// itself must not become part of the set it is waiting to drain.
		nativeWaitUntil.call(event, completion)
	})
})()
