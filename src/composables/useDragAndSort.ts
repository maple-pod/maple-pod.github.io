// interface UseDragAndSortOptions<T> {
// 	items: MaybeRefOrGetter<T[]>
// 	onUpdate: (items: T[]) => void
// }

// export function useDragAndSort<T>(options: UseDragAndSortOptions<T>) {
// 	const items = toRef(() => toValue(options.items))
// 	const previewItems = ref<T[]>([...items.value])
// 	watch(
// 		items,
// 		() => {
// 			previewItems.value = [...items.value]
// 		},
// 		{ deep: true },
// 	)
// 	const draggingIndex = ref<number | null>(null)
// 	useDragAndDrop({
// 		onDragStart(_, { draggableElement, ghostElement }) {
// 			if (draggableElement == null || ghostElement == null)
// 				return
// 			const index = Number(draggableElement.dataset.index ?? -1)
// 			if (index < 0 || index >= previewItems.value.length)
// 				return
// 			draggingIndex.value = index
// 			ghostElement.classList.add(...pika.arr({
// 				'backgroundColor': 'var(--color-gray-1)',
// 				'@dark': {
// 					backgroundColor: 'var(--color-gray-4)',
// 				},
// 				'borderRadius': '8px',
// 			}))
// 		},
// 		onDragMove(event) {
// 			if (draggingIndex.value == null)
// 				return
// 			const targetElement = event.target instanceof HTMLElement ? event.target.closest('[data-index]') : null
// 			if (!(targetElement instanceof HTMLElement))
// 				return

// 			const targetRect = targetElement.getBoundingClientRect()
// 			const slot: 'before' | 'after' = event.clientY < targetRect.top + targetRect.height / 2 ? 'before' : 'after'

// 			let targetIndex = Number(targetElement.dataset.index)
// 			if (Number.isNaN(targetIndex) || draggingIndex.value === targetIndex || targetIndex < 0 || targetIndex >= indexList.value.length)
// 				return
// 			console.log({
// 				draggingItemIndex: draggingIndex.value,
// 				targetIndex,
// 				slot,
// 			})
// 			targetIndex = slot === 'before' ? targetIndex - 1 : targetIndex

// 			const newIndexList: number[] = [...previewIndexList.value]
// 			newIndexList[draggingIndex.value] = Number.NaN
// 			if (targetIndex < 0)
// 				newIndexList.unshift(item)
// 			else
// 				newIndexList.splice(targetIndex, 0, item)
// 			localItems.value = newIndexList.filter(Number.isInteger)
// 		},
// 		onDragEnd() {
// 			draggingIndex.value = null
// 			playlist.value.list = localItems.value.map(item => item.id)
// 		},
// 	})
// }
