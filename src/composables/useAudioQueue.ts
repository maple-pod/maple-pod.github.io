export interface UseAudioQueueOptions {
	isMusicDisabled: (id: string | null) => boolean
	random?: boolean
}

function shuffle<T>(array: T[]): T[] {
	return [...array].sort(() => Math.random() - 0.5)
}

export function useAudioQueue(options: UseAudioQueueOptions) {
	const originalAudioIdList = ref<string[]>([])
	const playedQueue = ref<string[]>([])
	const cursor = ref<string | null>(null)
	const toPlayQueue = ref<string[]>([])
	const [random, toggleRandom] = useToggle(options.random ?? false)

	function findFirstPlayableIndex(list: string[]): number {
		return list.findIndex(id => !options.isMusicDisabled(id))
	}

	function findLastPlayableIndex(list: string[]): number {
		for (let i = list.length - 1; i >= 0; i--) {
			const id: string = list[i]!
			if (!options.isMusicDisabled(id))
				return i
		}
		return -1
	}

	function initQueue(audioIdList: string[], audioId?: string | null | undefined) {
		if (
			(audioIdList.length === 0)
			|| (audioId != null && (audioIdList.includes(audioId!) === false))
			|| (audioId == null && audioIdList.every(options.isMusicDisabled))
		) {
			return null
		}

		const list = random.value
			? shuffle(audioIdList)
			: [...audioIdList]
		const index = audioId == null ? findFirstPlayableIndex(list) : list.indexOf(audioId)

		if (index < 0)
			return null

		originalAudioIdList.value = audioIdList
		playedQueue.value = list.slice(0, index)
		toPlayQueue.value = list.slice(index + 1)
		cursor.value = list[index]!
		return cursor.value
	}

	watch(
		random,
		() => initQueue(originalAudioIdList.value, cursor.value),
		{ flush: 'sync' },
	)

	const hasReachedEnd = computed(() => toPlayQueue.value.length === 0)

	function goNext() {
		if (cursor.value == null)
			return null

		const nextIndex = findFirstPlayableIndex(toPlayQueue.value)
		if (nextIndex >= 0) {
			const nextAudioId = toPlayQueue.value[nextIndex]!
			const newPlayedQueue = [...playedQueue.value, cursor.value, ...toPlayQueue.value.slice(0, nextIndex)]
			const newToPlayQueue = toPlayQueue.value.slice(nextIndex + 1)
			playedQueue.value = newPlayedQueue
			toPlayQueue.value = newToPlayQueue
			cursor.value = nextAudioId
			return nextAudioId
		}
		else {
			const nextIndex = findFirstPlayableIndex(playedQueue.value)
			if (nextIndex >= 0) {
				const nextAudioId = playedQueue.value[nextIndex]!
				const newPlayedQueue = playedQueue.value.slice(0, nextIndex)
				const newToPlayQueue = [...playedQueue.value.slice(nextIndex + 1), cursor.value, ...toPlayQueue.value]
				playedQueue.value = newPlayedQueue
				toPlayQueue.value = newToPlayQueue
				cursor.value = nextAudioId
				return nextAudioId
			}
		}

		return null
	}

	function goPrevious() {
		if (cursor.value == null)
			return null

		const previousIndex = findLastPlayableIndex(playedQueue.value)
		if (previousIndex >= 0) {
			const previousAudioId = playedQueue.value[previousIndex]!
			const newPlayedQueue = playedQueue.value.slice(0, previousIndex)
			const newToPlayQueue = [...playedQueue.value.slice(previousIndex + 1), cursor.value, ...toPlayQueue.value]
			playedQueue.value = newPlayedQueue
			toPlayQueue.value = newToPlayQueue
			cursor.value = previousAudioId
			return previousAudioId
		}
		else {
			const previousIndex = findLastPlayableIndex(toPlayQueue.value)
			if (previousIndex >= 0) {
				const previousAudioId = toPlayQueue.value[previousIndex]!
				const newPlayedQueue = [...playedQueue.value, cursor.value, ...toPlayQueue.value.slice(0, previousIndex)]
				const newToPlayQueue = toPlayQueue.value.slice(previousIndex + 1)
				toPlayQueue.value = newToPlayQueue
				playedQueue.value = newPlayedQueue
				cursor.value = previousAudioId
				return previousAudioId
			}
		}

		return null
	}

	function playToPlayQueueItem(audioId: string) {
		if (options.isMusicDisabled(audioId) || cursor.value == null)
			return null

		const index = toPlayQueue.value.indexOf(audioId)
		if (index >= 0 && index < toPlayQueue.value.length) {
			playedQueue.value.push(cursor.value, ...toPlayQueue.value.slice(0, index))
			const list = toPlayQueue.value.slice(index)
			cursor.value = list.shift()!
			toPlayQueue.value = list
			return cursor.value
		}

		return null
	}

	return {
		random,
		toggleRandom,
		toPlayQueue,
		hasReachedEnd,
		initQueue,
		goNext,
		goPrevious,
		playToPlayQueueItem,
	}
}
