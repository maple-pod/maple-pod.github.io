export interface UseAudioQueueOptions {
	random?: boolean
}

function shuffle<T>(array: T[]): T[] {
	return [...array].sort(() => Math.random() - 0.5)
}

export function useAudioQueue(options: UseAudioQueueOptions = {}) {
	const originalAudioIdList = ref<string[]>([])
	const playedQueue = ref<string[]>([])
	const current = ref<string | null>(null)
	const toPlayQueue = ref<string[]>([])
	const [random, toggleRandom] = useToggle(options.random ?? false)

	function initQueue(audioIdList: string[], audioId?: string | null | undefined) {
		if (
			(audioIdList.length === 0)
			|| (audioId != null && (audioIdList.includes(audioId!) === false))
		) {
			return
		}

		originalAudioIdList.value = audioIdList
		let list = [...audioIdList]
		if (random.value === false && audioId != null) {
			current.value = audioId
			const index = list.indexOf(audioId)
			playedQueue.value = list.slice(0, index)
			toPlayQueue.value = list.slice(index + 1)
		}
		else if (random.value === false && audioId == null) {
			current.value = list.shift()!
			playedQueue.value = []
			toPlayQueue.value = list
		}
		else if (random.value === true && audioId != null) {
			current.value = list.splice(list.indexOf(audioId), 1)[0]!
			playedQueue.value = []
			toPlayQueue.value = shuffle(list)
		}
		else {
			list = shuffle(list)
			current.value = list.shift()!
			playedQueue.value = []
			toPlayQueue.value = list
		}
	}

	watch(
		random,
		() => initQueue(originalAudioIdList.value, current.value),
		{ flush: 'sync' },
	)

	const hasReachedEnd = computed(() => toPlayQueue.value.length === 0)

	function goNext() {
		if (current.value != null)
			playedQueue.value.push(current.value)

		if (toPlayQueue.value.length > 0) {
			current.value = toPlayQueue.value.shift()!
		}
		else if (playedQueue.value.length > 0) {
			const queue = [...playedQueue.value]
			playedQueue.value = []
			current.value = queue.shift()!
			toPlayQueue.value = queue
		}
	}

	function goPrevious() {
		if (current.value != null) {
			toPlayQueue.value.unshift(current.value)
		}

		if (playedQueue.value.length > 0) {
			current.value = playedQueue.value.pop()!
		}
		else {
			const list = [...toPlayQueue.value]
			toPlayQueue.value = []
			current.value = list.pop()!
			playedQueue.value = list
		}
	}

	function playToPlayQueueItem(audioId: string) {
		const index = toPlayQueue.value.indexOf(audioId)
		if (index >= 0 && index < toPlayQueue.value.length) {
			playedQueue.value.push(current.value!, ...toPlayQueue.value.slice(0, index))
			const list = toPlayQueue.value.slice(index)
			current.value = list.shift()!
			toPlayQueue.value = list
		}
	}

	return {
		random,
		toggleRandom,
		current,
		toPlayQueue,
		hasReachedEnd,
		initQueue,
		goNext,
		goPrevious,
		playToPlayQueueItem,
	}
}
