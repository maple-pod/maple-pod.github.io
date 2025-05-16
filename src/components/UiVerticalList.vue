<script setup lang="ts" generic="T">
import type { ScrollToIndexOpts } from 'virtua'
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'reka-ui'
import { Virtualizer } from 'virtua/vue'

defineProps<{
	items: T[]
}>()

const virtualizerRef = useTemplateRef('virtualizerRef')
function scrollToIndex(index: number, options?: ScrollToIndexOpts) {
	if (!virtualizerRef.value)
		return

	virtualizerRef.value.scrollToIndex(index, options)
}

defineExpose({
	scrollToIndex,
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
			asChild
			:class="pika({
				width: '100%',
				height: '100%',
			})"
		>
			<Virtualizer
				ref="virtualizerRef"
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
