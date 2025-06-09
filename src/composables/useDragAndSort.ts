interface UseDragAndSortOptions<T> {
	draggableElementSelector?: string
	draggableElementHandlerSelector?: string
	items: Ref<T[]>
}

export function useDragAndSort<T>(options: UseDragAndSortOptions<T>) {
	const { items } = options
	const originalItems = ref<T[]>([])
	const draggingIndex = ref<number | null>(null)
	const targetIndex = ref<number | null>(null)
	const {
		pointerPosition,
		isDragging,
	} = useDragAndDrop({
		draggableElementSelector: options.draggableElementSelector,
		draggableElementHandlerSelector: options.draggableElementHandlerSelector,
		onDragStart(_, { draggableElement, ghostElement }) {
			if (draggableElement == null || ghostElement == null)
				return
			const index = Number(draggableElement.dataset.index ?? -1)
			if (index < 0 || index >= items.value.length)
				return
			originalItems.value = [...items.value]
			draggingIndex.value = index
			targetIndex.value = null
		},
		onDragMove(event) {
			if (draggingIndex.value == null)
				return
			const targetElement = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-index]')
			if (!(targetElement instanceof HTMLElement))
				return

			let _targetIndex = Number(targetElement.dataset.index)
			if (
				Number.isSafeInteger(_targetIndex) === false
				|| _targetIndex < 0
				|| _targetIndex >= items.value.length
			) {
				return
			}
			_targetIndex = draggingIndex.value < _targetIndex
				? _targetIndex + 1
				: _targetIndex
			if (targetIndex.value === _targetIndex)
				return
			targetIndex.value = _targetIndex
			const item = originalItems.value[draggingIndex.value]!
			let newItems = [...originalItems.value]
			newItems[draggingIndex.value] = null!
			newItems = [
				...newItems.slice(0, targetIndex.value),
				item,
				...newItems.slice(targetIndex.value),
			].filter(item => item != null)
			items.value = newItems as T[]
			event.preventDefault()
		},
		onDragEnd() {
			draggingIndex.value = null
			targetIndex.value = null
		},
	})

	return {
		pointerPosition,
		isDragging,
		items,
	}
}
