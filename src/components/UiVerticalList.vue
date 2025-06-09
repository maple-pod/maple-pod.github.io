<script setup lang="ts" generic="T">
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'reka-ui'

const props = defineProps<{
	items: T[]
	itemHeight: number | ((item: T, index: number) => number)
}>()

function itemHeight(index: number): number {
	if (typeof props.itemHeight === 'number') {
		return props.itemHeight
	}
	return props.itemHeight(props.items[index]!, index)
}

const {
	list,
	containerProps,
	wrapperProps,
	scrollTo: scrollToIndex,
} = useVirtualList(toRef(() => props.items), { itemHeight })

const scrollAreaViewportRef = useTemplateRef('scrollAreaViewportRef')
const scrollAreaViewportEl = computed<HTMLElement | null>(() => (unrefElement(scrollAreaViewportRef)?.parentElement ?? null))
watch(
	scrollAreaViewportEl,
	el => containerProps.ref.value = el as any,
	{ immediate: true },
)
useEventListener(
	scrollAreaViewportEl,
	'scroll',
	containerProps.onScroll,
	{ passive: true },
)

function scrollBy(y: number): void {
	scrollAreaViewportEl.value?.scrollBy({ top: y })
}

defineExpose({
	scrollToIndex,
	scrollBy,
})
</script>

<template>
	<ScrollAreaRoot
		:class="pika({
			width: '100%',
			height: '100%',
		})"
	>
		<ScrollAreaViewport
			ref="scrollAreaViewportRef"
			:class="pika({
				width: '100%',
				height: '100%',
			})"
		>
			<div
				v-bind="wrapperProps"
			>
				<div
					v-for="({ data: item, index }) in list"
					:key="index"
					:class="pika({ margin: '0', padding: '0' })"
				>
					<slot
						name="item"
						:item
						:index
					/>
				</div>
			</div>
		</ScrollAreaViewport>
		<ScrollAreaScrollbar
			forceMount
			orientation="vertical"
			:class="pika({
				'zIndex': '2',
				'width': '8px',
				'padding': '2px',
				'backgroundColor': 'var(--color-gray-2)',
				'borderRadius': '9999px',
				'opacity': '0.4',
				'transition': 'all 0.2s',

				'@dark': {
					backgroundColor: 'var(--color-gray-5)',
				},

				'$:hover': {
					width: '16px',
					opacity: '1',
				},

				'$[data-state=hidden]': {
					opacity: '0',
				},
			})"
		>
			<ScrollAreaThumb
				:class="pika({
					'borderRadius': '9999px',
					'backgroundColor': 'var(--color-gray-1)',

					'@dark': {
						backgroundColor: 'var(--color-gray-3)',
					},
				})"
			/>
		</ScrollAreaScrollbar>
	</ScrollAreaRoot>
</template>
