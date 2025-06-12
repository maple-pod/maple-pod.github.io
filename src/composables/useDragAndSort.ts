interface UseDragAndSortOptions<T> {
	draggableElementSelector?: string
	draggableElementHandlerSelector?: string
	items: Ref<T[]>
	modifyGhostElement?: (ghostElement: HTMLElement) => void
}

export function useDragAndSort<T>(options: UseDragAndSortOptions<T>) {
	const { items } = options
	const originalItems = ref<T[]>([])
	const draggingIndex = ref<number | null>(null)
	const targetIndex = ref<number | null>(null)
	const placeholderIndex = ref<number | null>(null)
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
			placeholderIndex.value = index
			options.modifyGhostElement?.(ghostElement)
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
			const before = newItems.slice(0, targetIndex.value).filter(item => item != null)
			const after = newItems.slice(targetIndex.value).filter(item => item != null)
			newItems = [...before, item, ...after]
			items.value = newItems as T[]
			placeholderIndex.value = before.length
			event.preventDefault()
		},
		onDragEnd() {
			draggingIndex.value = null
			targetIndex.value = null
			placeholderIndex.value = null
		},
	})

	return {
		pointerPosition,
		placeholderIndex,
		isDragging,
		items,
	}
}
