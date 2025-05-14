<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'

defineProps<{
	orientation?: 'horizontal' | 'vertical'
	max?: number
	step?: number
	disabled?: boolean
	ariaLabel?: string
}>()

const modelValue = defineModel<number, 'modelValue'>({ required: true })
const _modelValue = computed<[number]>({
	get: () => [modelValue.value] as [number],
	set: ([value]: [number]) => modelValue.value = value,
})
</script>

<template>
	<SliderRoot
		v-model="_modelValue"
		:class="pika({
			'position': 'relative',
			'display': 'flex',
			'alignItems': 'center',
			'width': '100%',
			'height': '6px',
			'cursor': 'pointer',

			'$[data-orientation=vertical]': {
				flexDirection: 'column',
				width: '6px',
				height: '100%',
			},

			'$[data-disabled]': {
				opacity: 0.5,
				cursor: 'not-allowed',
			},
		})"
		:orientation
		:max
		:step
		:disabled
	>
		<SliderTrack
			:class="pika({
				'position': 'relative',
				'width': '100%',
				'height': '100%',
				'display': 'inline-block',
				'backgroundColor': 'var(--color-gray-3)',
				'borderRadius': '6px',

				'@dark': {
					color: 'var(--color-gray-5)',
				},
			})"
		>
			<SliderRange
				:class="pika({
					'position': 'absolute',
					'display': 'inline-block',
					'backgroundColor': 'var(--color-primary-1)',
					'borderRadius': '6px',

					'$[data-orientation=horizontal]': {
						height: '100%',
					},

					'$[data-orientation=vertical]': {
						width: '100%',
					},
				})"
			/>
		</SliderTrack>
		<SliderThumb
			:class="pika({
				width: '16px',
				height: '16px',
				backgroundColor: 'var(--color-gray-1)',
				borderRadius: '50%',
				boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
			})"
			:aria-label="ariaLabel"
		/>
	</SliderRoot>
</template>
