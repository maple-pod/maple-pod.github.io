<script setup lang="ts" generic="T">
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'reka-ui'
import { Virtualizer } from 'virtua/vue'

defineProps<{
	items: T[]
}>()

const scrollAreaRef = useTemplateRef('scrollAreaRef')
const { arrivedState } = useScroll(() => unrefElement(scrollAreaRef)?.children[0] as HTMLElement)
const scrollingArrivedTop = toRef(() => arrivedState.top)

defineExpose({
	scrollingArrivedTop,
})
</script>

<template>
	<ScrollAreaRoot
		ref="scrollAreaRef"
		:class="pika({
			width: '100%',
			height: '100%',
		})"
	>
		<ScrollAreaViewport
			asChild
			:class="pika({
				width: '100%',
				height: '100%',
			})"
		>
			<Virtualizer
				v-slot="{ item, index }"
				as="ul"
				item="li"
				:data="items"
				:class="pika({
					padding: '0',
					margin: '0',
					listStyle: 'none',
				})"
			>
				<slot
					v-bind="{
						index,
						item,
					} as {
						index: number
						item: T
					}"
				>
					{{ item }}
				</slot>
			</Virtualizer>
		</ScrollAreaViewport>
		<ScrollAreaScrollbar
			forceMount
			orientation="vertical"
			:class="pika({
				'zIndex': '10',
				'width': '12px',
				'padding': '2px',
				'backgroundColor': 'var(--color-gray-2)',
				'borderRadius': '9999px',
				'opacity': '0.5',
				'transition': 'opacity 0.2s',

				'@dark': {
					backgroundColor: 'var(--color-gray-5)',
				},

				'$:hover': {
					opacity: '1',
				},

				'$[data-state=hidden]': {
					opacity: '0',
				},
			})"
		>
			<ScrollAreaThumb
				:class="pika({
					'borderRadius': '5px',
					'backgroundColor': 'var(--color-gray-1)',

					'@dark': {
						backgroundColor: 'var(--color-gray-3)',
					},
				})"
			/>
		</ScrollAreaScrollbar>
	</ScrollAreaRoot>
</template>
