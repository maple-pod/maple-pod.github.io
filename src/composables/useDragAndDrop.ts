interface DragAndDropContext {
	draggableElement: HTMLElement | null
	ghostElement: HTMLElement | null
}

interface UseDragAndDropOptions {
	draggableElementSelector?: string
	draggableElementHandlerSelector?: string
	onDragStart?: (event: PointerEvent, context: DragAndDropContext) => void
	onDragEnd?: (event: PointerEvent, context: DragAndDropContext) => void
	onDragMove?: (event: PointerEvent, context: DragAndDropContext) => void
}

export function useDragAndDrop({
	draggableElementSelector = '[data-draggable=true]',
	draggableElementHandlerSelector,
	onDragStart,
	onDragEnd,
	onDragMove,
}: UseDragAndDropOptions = {}) {
	const pointerPosition = ref<{ x: number, y: number }>({ x: 0, y: 0 })
	const isDragging = ref(false)
	const ghostElement = shallowRef<HTMLElement | null>(null)
	let _stopDragging: (() => void) | null = null
	function pointerDown(event: PointerEvent) {
		_stopDragging?.()
		const eventTarget = event.target instanceof HTMLElement ? event.target : null
		if (eventTarget == null)
			return

		eventTarget.setPointerCapture(event.pointerId)

		if (draggableElementHandlerSelector != null && eventTarget.closest(draggableElementHandlerSelector) == null)
			return

		const draggableElement = event.target instanceof HTMLElement
			? event.target.closest(draggableElementSelector) as HTMLElement | null
			: null
		if (draggableElement == null)
			return

		const startX = event.clientX
		const startY = event.clientY

		_stopDragging = stopDragging
		document.removeEventListener('pointermove', stopDragging)
		document.addEventListener('pointermove', pointerMove, { capture: true })
		document.addEventListener('pointerup', pointerUp, { capture: true })
		ghostElement.value = createGhostElement(draggableElement!)
		document.body.appendChild(ghostElement.value)
		isDragging.value = true
		onDragStart?.(event, getContext())

		function getContext(): DragAndDropContext {
			return {
				draggableElement,
				ghostElement: ghostElement.value,
			}
		}

		function pointerMove(moveEvent: PointerEvent) {
			pointerPosition.value.x = moveEvent.clientX
			pointerPosition.value.y = moveEvent.clientY
			onDragMove?.(moveEvent, getContext())
			if (ghostElement.value) {
				ghostElement.value.style.setProperty('--translateX', `${moveEvent.clientX - startX}px`)
				ghostElement.value.style.setProperty('--translateY', `${moveEvent.clientY - startY}px`)
			}
		}

		function pointerUp(upEvent: PointerEvent) {
			if (upEvent.target instanceof HTMLElement) {
				upEvent.target.releasePointerCapture(upEvent.pointerId)
			}
			onDragEnd?.(upEvent, getContext())
			stopDragging()
		}

		function stopDragging() {
			document.removeEventListener('pointermove', stopDragging)
			document.removeEventListener('pointermove', pointerMove)
			document.removeEventListener('pointerup', pointerUp)
			ghostElement.value?.remove()
			ghostElement.value = null
			isDragging.value = false
			pointerPosition.value.x = 0
			pointerPosition.value.y = 0
			_stopDragging = null
		}
	}

	document.addEventListener('pointerdown', pointerDown, { capture: true })

	tryOnScopeDispose(() => {
		document.removeEventListener('pointerdown', pointerDown)
		_stopDragging?.()
	})

	useEventListener('contextmenu', e => isDragging.value && e.preventDefault(), { passive: false })
	useEventListener('touchstart', e => isDragging.value && e.preventDefault(), { passive: false })

	return {
		pointerPosition,
		isDragging,
	}
}

function createGhostElement(sourceEl: HTMLElement): HTMLElement {
	const clonedEl = cloneNodeWithStyles(sourceEl, el => el.style.pointerEvents = 'none')
	const sourceRect = sourceEl.getBoundingClientRect()

	const ghostEl = document.createElement('div')
	Object.assign(ghostEl.style, {
		'--translateX': '0',
		'--translateY': '0',
		'position': 'fixed',
		'top': `${sourceRect.top}px`,
		'left': `${sourceRect.left}px`,
		'width': `${sourceRect.width}px`,
		'height': `${sourceRect.height}px`,
		'margin': '0',
		'pointerEvents': 'none',
		'zIndex': '9999',
		'transform': `translate(var(--translateX, 0), var(--translateY, 0))`,
	})
	ghostEl.dataset.ghost = 'true'
	ghostEl.appendChild(clonedEl)

	return ghostEl
}

function copyComputedStyle(source: HTMLElement, target: HTMLElement) {
	const computed = getComputedStyle(source)
	for (const key of computed) {
		try {
			target.style.setProperty(key, computed.getPropertyValue(key), computed.getPropertyPriority(key))
		}
		catch {
			// Ignore errors when setting styles that are not applicable
		}
	}
}

function cloneNodeWithStyles(sourceEl: HTMLElement, updateNode?: (el: HTMLElement) => void): HTMLElement {
	const clonedEl = sourceEl.cloneNode(true) as HTMLElement
	copyComputedStyle(sourceEl, clonedEl)
	updateNode?.(clonedEl)

	// Recursively copy computed styles for all child elements
	const sourceChildren = sourceEl.querySelectorAll('*')
	const cloneChildren = clonedEl.querySelectorAll('*')
	for (let i = 0; i < sourceChildren.length; i++) {
		const cloneChild = cloneChildren[i] as HTMLElement
		copyComputedStyle(sourceChildren[i] as HTMLElement, cloneChild)
		updateNode?.(cloneChild)
	}
	return clonedEl
}
