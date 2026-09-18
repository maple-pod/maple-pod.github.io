export interface UseAudioQueueOptions {
	isMusicDisabled: (id: string | null) => boolean
	random?: boolean
}

interface AudioQueueState {
	originalAudioIdList: string[]
	playedQueue: string[]
	cursor: string
	toPlayQueue: string[]
}

export interface AudioQueueCandidate {
	audioId: string
	state: AudioQueueState
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

	function committedState(): AudioQueueState | null {
		if (cursor.value == null)
			return null
		return {
			originalAudioIdList: [...originalAudioIdList.value],
			playedQueue: [...playedQueue.value],
			cursor: cursor.value,
			toPlayQueue: [...toPlayQueue.value],
		}
	}

	function candidate(state: AudioQueueState): AudioQueueCandidate {
		return { audioId: state.cursor, state }
	}

	function commit(next: AudioQueueCandidate) {
		originalAudioIdList.value = [...next.state.originalAudioIdList]
		playedQueue.value = [...next.state.playedQueue]
		cursor.value = next.state.cursor
		toPlayQueue.value = [...next.state.toPlayQueue]
	}

	function initQueue(audioIdList: string[], audioId?: string | null | undefined): AudioQueueCandidate | null {
		if (
			(audioIdList.length === 0)
			|| (audioId != null && audioIdList.includes(audioId) === false)
			|| (audioId == null && audioIdList.every(options.isMusicDisabled))
		) {
			return null
		}

		const list = random.value
			? shuffle(audioIdList)
			: [...audioIdList]
		const index = audioId == null || options.isMusicDisabled(audioId)
			? findFirstPlayableIndex(list)
			: list.indexOf(audioId)

		if (index < 0)
			return null

		return candidate({
			originalAudioIdList: [...audioIdList],
			playedQueue: list.slice(0, index),
			cursor: list[index]!,
			toPlayQueue: list.slice(index + 1),
		})
	}

	watch(
		random,
		() => {
			const state = committedState()
			if (state == null)
				return

			const list = random.value
				? shuffle(state.originalAudioIdList)
				: [...state.originalAudioIdList]
			const index = list.indexOf(state.cursor)
			if (index < 0)
				return

			commit(candidate({
				originalAudioIdList: [...state.originalAudioIdList],
				playedQueue: list.slice(0, index),
				cursor: state.cursor,
				toPlayQueue: list.slice(index + 1),
			}))
		},
		{ flush: 'sync' },
	)

	const hasReachedEnd = computed(() => findFirstPlayableIndex(toPlayQueue.value) < 0)

	function stateFor(base?: AudioQueueCandidate | null): AudioQueueState | null {
		return base?.state ?? committedState()
	}

	function goNext(base?: AudioQueueCandidate | null, wrap = true): AudioQueueCandidate | null {
		const state = stateFor(base)
		if (state == null)
			return null

		const nextIndex = findFirstPlayableIndex(state.toPlayQueue)
		if (nextIndex >= 0) {
			const nextAudioId = state.toPlayQueue[nextIndex]!
			return candidate({
				originalAudioIdList: [...state.originalAudioIdList],
				playedQueue: [...state.playedQueue, state.cursor, ...state.toPlayQueue.slice(0, nextIndex)],
				cursor: nextAudioId,
				toPlayQueue: state.toPlayQueue.slice(nextIndex + 1),
			})
		}

		if (!wrap)
			return null

		const wrappedIndex = findFirstPlayableIndex(state.playedQueue)
		if (wrappedIndex < 0)
			return null

		const nextAudioId = state.playedQueue[wrappedIndex]!
		return candidate({
			originalAudioIdList: [...state.originalAudioIdList],
			playedQueue: state.playedQueue.slice(0, wrappedIndex),
			cursor: nextAudioId,
			toPlayQueue: [...state.playedQueue.slice(wrappedIndex + 1), state.cursor, ...state.toPlayQueue],
		})
	}

	function goPrevious(base?: AudioQueueCandidate | null): AudioQueueCandidate | null {
		const state = stateFor(base)
		if (state == null)
			return null

		const previousIndex = findLastPlayableIndex(state.playedQueue)
		if (previousIndex >= 0) {
			const previousAudioId = state.playedQueue[previousIndex]!
			return candidate({
				originalAudioIdList: [...state.originalAudioIdList],
				playedQueue: state.playedQueue.slice(0, previousIndex),
				cursor: previousAudioId,
				toPlayQueue: [...state.playedQueue.slice(previousIndex + 1), state.cursor, ...state.toPlayQueue],
			})
		}

		const wrappedIndex = findLastPlayableIndex(state.toPlayQueue)
		if (wrappedIndex < 0)
			return null

		const previousAudioId = state.toPlayQueue[wrappedIndex]!
		return candidate({
			originalAudioIdList: [...state.originalAudioIdList],
			playedQueue: [...state.playedQueue, state.cursor, ...state.toPlayQueue.slice(0, wrappedIndex)],
			cursor: previousAudioId,
			toPlayQueue: state.toPlayQueue.slice(wrappedIndex + 1),
		})
	}

	function playToPlayQueueItem(audioId: string): AudioQueueCandidate | null {
		const state = committedState()
		if (state == null || options.isMusicDisabled(audioId))
			return null

		const index = state.toPlayQueue.indexOf(audioId)
		if (index < 0)
			return null

		return candidate({
			originalAudioIdList: [...state.originalAudioIdList],
			playedQueue: [...state.playedQueue, state.cursor, ...state.toPlayQueue.slice(0, index)],
			cursor: audioId,
			toPlayQueue: state.toPlayQueue.slice(index + 1),
		})
	}

	return {
		random,
		toggleRandom,
		toPlayQueue,
		hasReachedEnd,
		initQueue,
		commit,
		goNext,
		goPrevious,
		playToPlayQueueItem,
	}
}
