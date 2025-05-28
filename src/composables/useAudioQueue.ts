export interface UseAudioQueueOptions {
	random?: boolean
}

function shuffle<T>(array: T[]): T[] {
	return [...array].sort(() => Math.random() - 0.5)
}

export function useAudioQueue(options: UseAudioQueueOptions = {}) {
	const originalAudioSrcList = ref<string[]>([])
	const playedQueue = ref<string[]>([])
	const current = ref<string | null>(null)
	const toPlayQueue = ref<string[]>([])
	const [random, toggleRandom] = useToggle(options.random ?? false)

	function initQueue(audioSrcList: string[], audioSrc?: string | null | undefined) {
		if (
			(audioSrcList.length === 0)
			|| (audioSrc != null && (audioSrcList.includes(audioSrc!) === false))
		) {
			return
		}

		originalAudioSrcList.value = audioSrcList
		let list = [...audioSrcList]
		if (random.value === false && audioSrc != null) {
			current.value = audioSrc
			const index = list.indexOf(audioSrc)
			playedQueue.value = list.slice(0, index).map(src => src)
			toPlayQueue.value = list.slice(index + 1).map(src => src)
		}
		else if (random.value === false && audioSrc == null) {
			current.value = list.shift()!
			playedQueue.value = []
			toPlayQueue.value = list.map(src => src)
		}
		else if (random.value === true && audioSrc != null) {
			current.value = list.splice(list.indexOf(audioSrc), 1)[0]!
			playedQueue.value = []
			toPlayQueue.value = shuffle(list).map(src => src)
		}
		else {
			list = shuffle(list)
			current.value = list.shift()!
			playedQueue.value = []
			toPlayQueue.value = list.map(src => src)
		}
	}

	watch(
		random,
		() => initQueue(originalAudioSrcList.value, current.value),
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

	function playToPlayQueueItem(audioSrc: string) {
		const index = toPlayQueue.value.indexOf(audioSrc)
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
