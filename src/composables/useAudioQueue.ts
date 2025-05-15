import type { Playlist } from '@/types/Playlist'

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

export function useAudioQueue() {
	const playedQueue = ref<AudioQueueItem[]>([])
	const current = ref<AudioQueueItem | null>(null)
	const tempQueue = ref<AudioQueueItem[]>([])
	const toPlayQueue = ref<AudioQueueItem[]>([])

	const currentAudioSrc = computed(() => current.value?.audioSrc ?? null)
	const displayQueue = computed(() => ({
		current: currentAudioSrc,
		tempQueue: tempQueue.value.map(item => item.audioSrc),
		toPlayQueue: toPlayQueue.value.map(item => item.audioSrc),
	}))

	function initQueue(playlist: Playlist, audioSrc?: string | null | undefined) {
		if (
			(playlist.list.length === 0)
			|| (playlist.list.includes(audioSrc!) === false)
		) {
			return
		}

		const list = [...playlist.list]
		if (audioSrc) {
			current.value = makeAudioQueueItem('regular', audioSrc)
			const index = list.indexOf(audioSrc)
			playedQueue.value = list.slice(0, index).map(src => makeAudioQueueItem('regular', src))
			toPlayQueue.value = list.slice(index + 1).map(src => makeAudioQueueItem('regular', src))
		}
		else {
			current.value = makeAudioQueueItem('regular', list.shift()!)
			playedQueue.value = []
			toPlayQueue.value = list.map(src => makeAudioQueueItem('regular', src))
		}
	}

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
