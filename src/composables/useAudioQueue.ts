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
	const current = ref<string | null>(null)
	const toPlayQueue = ref<string[]>([])
	const [random, toggleRandom] = useToggle(options.random ?? false)

	function findFirstPlayableIndex(list: string[]): number {
		return list.findIndex(id => !options.isMusicDisabled(id))
	}

	function findLastPlayableIndex(list: string[]): number {
		return list.findLastIndex(id => !options.isMusicDisabled(id))
	}

	function initQueue(audioIdList: string[], audioId?: string | null | undefined) {
		if (
			(audioIdList.length === 0)
			|| (audioId != null && (audioIdList.includes(audioId!) === false))
			|| (audioId == null && audioIdList.every(options.isMusicDisabled))
		) {
			return
		}

		const list = random.value
			? shuffle(audioIdList)
			: [...audioIdList]
		const index = audioId == null ? findFirstPlayableIndex(list) : list.indexOf(audioId)

		if (index < 0)
			return

		originalAudioIdList.value = audioIdList
		playedQueue.value = list.slice(0, index)
		toPlayQueue.value = list.slice(index + 1)
		current.value = list[index]!
	}

	watch(
		random,
		() => initQueue(originalAudioIdList.value, current.value),
		{ flush: 'sync' },
	)

	const hasReachedEnd = computed(() => toPlayQueue.value.length === 0)

	function goNext() {
		if (current.value == null)
			return

		const nextIndex = findFirstPlayableIndex(toPlayQueue.value)
		if (nextIndex >= 0) {
			const nextAudioId = toPlayQueue.value[nextIndex]!
			const newPlayedQueue = [...playedQueue.value, current.value, ...toPlayQueue.value.slice(0, nextIndex)]
			const newToPlayQueue = toPlayQueue.value.slice(nextIndex + 1)
			playedQueue.value = newPlayedQueue
			toPlayQueue.value = newToPlayQueue
			current.value = nextAudioId
		}
		else {
			const nextIndex = findFirstPlayableIndex(playedQueue.value)
			if (nextIndex >= 0) {
				const nextAudioId = playedQueue.value[nextIndex]!
				const newPlayedQueue = playedQueue.value.slice(0, nextIndex)
				const newToPlayQueue = [...playedQueue.value.slice(nextIndex + 1), current.value, ...toPlayQueue.value]
				playedQueue.value = newPlayedQueue
				toPlayQueue.value = newToPlayQueue
				current.value = nextAudioId
			}
		}
	}

	function goPrevious() {
		if (current.value == null)
			return

		const previousIndex = findLastPlayableIndex(playedQueue.value)
		if (previousIndex >= 0) {
			const previousAudioId = playedQueue.value[previousIndex]!
			const newPlayedQueue = playedQueue.value.slice(0, previousIndex)
			const newToPlayQueue = [...playedQueue.value.slice(previousIndex + 1), current.value, ...toPlayQueue.value]
			playedQueue.value = newPlayedQueue
			toPlayQueue.value = newToPlayQueue
			current.value = previousAudioId
		}
		else {
			const previousIndex = findLastPlayableIndex(toPlayQueue.value)
			if (previousIndex >= 0) {
				const previousAudioId = toPlayQueue.value[previousIndex]!
				const newPlayedQueue = [...playedQueue.value, current.value, ...toPlayQueue.value.slice(0, previousIndex)]
				const newToPlayQueue = toPlayQueue.value.slice(previousIndex + 1)
				toPlayQueue.value = newToPlayQueue
				playedQueue.value = newPlayedQueue
				current.value = previousAudioId
			}
		}
	}

	function playToPlayQueueItem(audioId: string) {
		if (options.isMusicDisabled(audioId))
			return

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
