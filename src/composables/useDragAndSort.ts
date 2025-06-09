interface UseDragAndSortOptions<T> {
	draggableElementSelector?: string
	draggableElementHandlerSelector?: string
	items: Ref<T[]>
}

export function useDragAndSort<T>(options: UseDragAndSortOptions<T>) {
	const { items } = options
	const preview = {
		items: ref<T[]>([]),
		draggingIndex: ref<number | null>(null),
		targetIndex: ref<number | null>(null),
	}
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
			preview.items.value = [...items.value]
			preview.draggingIndex.value = index
			preview.targetIndex.value = null
		},
		onDragMove(event) {
			if (preview.draggingIndex.value == null)
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
			_targetIndex = preview.draggingIndex.value < _targetIndex
				? _targetIndex + 1
				: _targetIndex
			if (preview.targetIndex.value === _targetIndex)
				return
			preview.targetIndex.value = _targetIndex
			const item = preview.items.value[preview.draggingIndex.value]!
			let newItems = [...preview.items.value]
			newItems[preview.draggingIndex.value] = null!
			newItems = [
				...newItems.slice(0, preview.targetIndex.value),
				item,
				...newItems.slice(preview.targetIndex.value),
			].filter(item => item != null)
			items.value = newItems as T[]
			event.preventDefault()
		},
		onDragEnd() {
			preview.draggingIndex.value = null
			preview.targetIndex.value = null
		},
	})

	return {
		pointerPosition,
		isDragging,
		items,
	}
}
