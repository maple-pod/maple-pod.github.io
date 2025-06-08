interface DragAndDropContext {
	draggableElement: HTMLElement | null
	ghostElement: HTMLElement | null
}

interface UseDragAndDropOptions {
	onDragStart?: (event: PointerEvent, context: DragAndDropContext) => void
	onDragEnd?: (event: PointerEvent, context: DragAndDropContext) => void
	onDragMove?: (event: PointerEvent, context: DragAndDropContext) => void
}

export function useDragAndDrop({
	onDragStart,
	onDragEnd,
	onDragMove,
}: UseDragAndDropOptions = {}) {
	const isDragging = ref(false)
	const ghostElement = shallowRef<HTMLElement | null>(null)
	let _stopDragging: (() => void) | null = null
	function pointerDown(event: PointerEvent) {
		_stopDragging?.()

		const draggableElement = event.target instanceof HTMLElement
			? event.target.closest('[data-draggable=true]') as HTMLElement | null
			: null
		if (draggableElement == null)
			return

		draggableElement.addEventListener('contextmenu', preventDefault)

		const startX = event.clientX
		const startY = event.clientY

		function getContext(): DragAndDropContext {
			return {
				draggableElement,
				ghostElement: ghostElement.value,
			}
		}

		function pointerMove(moveEvent: PointerEvent) {
			if (ghostElement.value) {
				ghostElement.value.style.setProperty('--translateX', `${moveEvent.clientX - startX}px`)
				ghostElement.value.style.setProperty('--translateY', `${moveEvent.clientY - startY}px`)

				onDragMove?.(moveEvent, getContext())
			}
		}

		function pointerUp(upEvent: PointerEvent) {
			onDragEnd?.(upEvent, getContext())
			stopDragging()
		}

		function stopDragging() {
			document.removeEventListener('pointermove', stopDragging)
			document.removeEventListener('pointermove', pointerMove)
			document.removeEventListener('pointerup', pointerUp)
			draggableElement?.removeEventListener('contextmenu', preventDefault)
			draggableElement?.removeAttribute('data-dragging')
			ghostElement.value?.remove()
			ghostElement.value = null
			isDragging.value = false
		}

		_stopDragging = stopDragging
		document.removeEventListener('pointermove', stopDragging)
		document.addEventListener('pointermove', pointerMove, { capture: true, passive: true })
		document.addEventListener('pointerup', pointerUp, { capture: true, passive: true })
		draggableElement.setAttribute('data-dragging', 'true')
		ghostElement.value = createGhostElement(draggableElement)
		document.body.appendChild(ghostElement.value)
		isDragging.value = true
		onDragStart?.(event, getContext())
	}

	function preventDefault(event: Event) {
		event.preventDefault()
	}

	document.addEventListener('pointerdown', pointerDown, { passive: true })

	tryOnScopeDispose(() => {
		document.removeEventListener('pointerdown', pointerDown)
		_stopDragging?.()
	})

	return {
		isDragging,
	}
}

function createGhostElement(sourceEl: HTMLElement): HTMLElement {
	const clone = sourceEl.cloneNode(true) as HTMLElement
	const sourceRect = sourceEl.getBoundingClientRect()

	copyComputedStyle(sourceEl, clone)
	clone.style.pointerEvents = 'none'

	// Recursively copy computed styles for all child elements
	const sourceChildren = sourceEl.querySelectorAll('*')
	const cloneChildren = clone.querySelectorAll('*')
	for (let i = 0; i < sourceChildren.length; i++) {
		const cloneChild = cloneChildren[i] as HTMLElement
		copyComputedStyle(sourceChildren[i] as HTMLElement, cloneChild)
		cloneChild.style.pointerEvents = 'none'
	}

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
	ghostEl.appendChild(clone)

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
