import { createMachine } from '@deviltea/tiny-state-machine'

interface UseDragAndDropOptions {
	threshold?: MaybeRefOrGetter<number>
	isDraggable?: (el: HTMLElement) => boolean
}

export function useDragAndDrop(options: UseDragAndDropOptions = {}) {
	const threshold = computed(() => toValue(options.threshold ?? 10))
	const isDraggable = (el: HTMLElement) => {
		if (options.isDraggable == null)
			return true
		return options.isDraggable(el)
	}

	const machine = createMachine({
		initial: 'idle',
		states: {
			idle: {
				on: {
					POINTER_DOWN: 'pressing',
				},
			},
			pressing: {
				on: {
					POINTER_UP: 'idle',
					START_DRAG: 'dragging',
				},
			},
			dragging: {
				on: {
					POINTER_UP: 'idle',
					MOVE: 'dragging',
				},
			},
		},
	})
	tryOnScopeDispose(() => {
		machine.destroy()
	})

	const dragging = {
		startPos: ref<{ x: number, y: number } | null>(null),
		currentPos: ref<{ x: number, y: number } | null>(null),
		draggingElement: ref<HTMLElement | null>(null),
	}

	const { pressure, x, y } = usePointer()
	machine.onTransition(
		{ target: 'idle' },
		() => {
			dragging.startPos.value = null
			dragging.currentPos.value = null
			dragging.draggingElement.value = null
		},
	)
	machine.onTransition(
		{ source: 'idle', target: 'pressing' },
		() => {
			dragging.startPos.value = { x: x.value, y: y.value }
		},
	)
	machine.onTransition(
		{ source: 'pressing', target: 'dragging' },
		() => {
			dragging.currentPos.value = { x: x.value, y: y.value }
		},
	)
	machine.onTransition(
		{ source: 'dragging', event: 'MOVE', target: 'dragging' },
		() => {
			dragging.currentPos.value = { x: x.value, y: y.value }
		},
	)

	watch(
		pressure,
		(value) => {
			const isPointerDown = value >= 0.5
			const el = document.elementFromPoint(x.value, y.value) as HTMLElement | null
			const isDraggableEl = el != null && isDraggable(el)
			if (machine.currentState === 'idle' && isPointerDown && isDraggableEl) {
				dragging.draggingElement.value = el
				machine.send('POINTER_DOWN')
			}
			else if (
				isPointerDown === false
				&& (
					machine.currentState === 'pressing'
					|| machine.currentState === 'dragging'
				)
			) {
				machine.send('POINTER_UP')
			}
		},
	)
	watch(
		[x, y],
		() => {
			if (dragging.startPos.value == null)
				return

			if (machine.currentState === 'pressing') {
				const dx = x.value - dragging.startPos.value.x
				const dy = y.value - dragging.startPos.value.y
				if (Math.sqrt(dx * dx + dy * dy) > threshold.value) {
					machine.send('START_DRAG')
				}
			}
			else if (machine.currentState === 'dragging') {
				machine.send('MOVE')
			}
		},
	)
}
