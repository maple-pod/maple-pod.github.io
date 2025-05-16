export interface UseAudioQueueOptions {
	random?: boolean
}
export interface AudioQueueItem {
	type: 'regular' | 'temporary'
	audioSrc: string
}

function makeAudioQueueItem(type: 'regular' | 'temporary', audioSrc: string): AudioQueueItem {
	return {
		type,
		audioSrc,
	}
}

function shuffle<T>(array: T[]): T[] {
	return [...array].sort(() => Math.random() - 0.5)
}

export function useAudioQueue(options: UseAudioQueueOptions = {}) {
	const currentAudioSrcList = ref<string[]>([])
	const playedQueue = ref<AudioQueueItem[]>([])
	const current = ref<AudioQueueItem | null>(null)
	const tempQueue = ref<AudioQueueItem[]>([])
	const toPlayQueue = ref<AudioQueueItem[]>([])
	const [random, toggleRandom] = useToggle(options.random ?? false)

	const currentAudioSrc = computed(() => current.value?.audioSrc ?? null)
	const displayQueue = computed(() => ({
		current: currentAudioSrc,
		tempQueue: tempQueue.value.map(item => item.audioSrc),
		toPlayQueue: toPlayQueue.value.map(item => item.audioSrc),
	}))

	function initQueue(audioSrcList: string[], audioSrc?: string | null | undefined) {
		if (
			(audioSrcList.length === 0)
			|| (audioSrcList.includes(audioSrc!) === false)
		) {
			return
		}

		currentAudioSrcList.value = audioSrcList
		let list = [...audioSrcList]
		if (random.value === false && audioSrc != null) {
			current.value = makeAudioQueueItem('regular', audioSrc)
			const index = list.indexOf(audioSrc)
			playedQueue.value = list.slice(0, index).map(src => makeAudioQueueItem('regular', src))
			toPlayQueue.value = list.slice(index + 1).map(src => makeAudioQueueItem('regular', src))
		}
		else if (random.value === false && audioSrc == null) {
			current.value = makeAudioQueueItem('regular', list.shift()!)
			playedQueue.value = []
			toPlayQueue.value = list.map(src => makeAudioQueueItem('regular', src))
		}
		else if (random.value === true && audioSrc != null) {
			current.value = makeAudioQueueItem('regular', list.splice(list.indexOf(audioSrc), 1)[0]!)
			playedQueue.value = []
			toPlayQueue.value = shuffle(list).map(src => makeAudioQueueItem('regular', src))
		}
		else {
			list = shuffle(list)
			current.value = makeAudioQueueItem('regular', list.shift()!)
			playedQueue.value = []
			toPlayQueue.value = list.map(src => makeAudioQueueItem('regular', src))
		}
	}

	watch(
		random,
		() => initQueue(currentAudioSrcList.value, currentAudioSrc.value),
		{ flush: 'sync' },
	)

	function goNext() {
		if (current.value != null && current.value.type === 'regular')
			playedQueue.value.push(current.value)

		if (tempQueue.value.length > 0) {
			current.value = tempQueue.value.shift()!
		}
		else if (toPlayQueue.value.length > 0) {
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
		if (current.value != null && current.value.type === 'regular') {
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

	function addToTemporaryQueue(audioSrc: string) {
		tempQueue.value.push(makeAudioQueueItem('temporary', audioSrc))
	}

	function removeFromTemporaryQueue(index: number) {
		if (index >= 0 && index < tempQueue.value.length) {
			tempQueue.value.splice(index, 1)
		}
	}

	function clearTemporaryQueue() {
		tempQueue.value = []
	}

	function playTempQueueItem(index: number) {
		if (index >= 0 && index < tempQueue.value.length) {
			const item = tempQueue.value.splice(index, 1)[0]!

			if (current.value != null && current.value.type === 'regular')
				playedQueue.value.push(current.value)

			current.value = item
		}
	}

	function playToPlayQueueItem(index: number) {
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
		currentAudioSrc,
		displayQueue,
		initQueue,
		goNext,
		goPrevious,
		addToTemporaryQueue,
		removeFromTemporaryQueue,
		clearTemporaryQueue,
		playTempQueueItem,
		playToPlayQueueItem,
	}
}
