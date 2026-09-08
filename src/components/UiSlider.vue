<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'

const props = defineProps<{
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
	<div
		:data-orientation="props.orientation ?? 'horizontal'"
		:class="pika({
			'position': 'relative',
			'width': '100%',
			'height': '6px',

			'$[data-orientation=vertical]': {
				width: '6px',
				height: '100%',
			},
		})"
	>
		<SliderRoot
			v-model="_modelValue"
			:class="pika({
				'position': 'absolute',
				'top': '50%',
				'left': '0',
				'display': 'flex',
				'alignItems': 'center',
				'width': '100%',
				'height': 'var(--size-touch-target)',
				'transform': 'translateY(-50%)',
				'cursor': 'pointer',
				'touchAction': 'none',

				'$[data-orientation=vertical]': {
					top: '0',
					left: '50%',
					flexDirection: 'column',
					width: 'var(--size-touch-target)',
					height: '100%',
					transform: 'translateX(-50%)',
				},

				'$[data-disabled]': {
					opacity: '0.5',
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
					'height': '6px',
					'display': 'inline-block',
					'backgroundColor': 'var(--color-secondary-bg)',
					'borderRadius': '6px',

					'$[data-orientation=vertical]': {
						width: '6px',
						height: '100%',
					},
				})"
			>
				<SliderRange
					:class="pika({
						'position': 'absolute',
						'display': 'inline-block',
						'backgroundColor': 'var(--color-action-primary)',
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
					'position': 'relative',
					'width': '16px',
					'height': '16px',
					'borderRadius': '50%',
					'backgroundColor': 'var(--color-surface-solid)',
					'boxShadow': '0 2px 6px rgba(0, 0, 0, 0.2)',

					'$::before': {
						content: '\'\'',
						position: 'absolute',
						top: '50%',
						left: '50%',
						width: 'var(--size-touch-target)',
						height: 'var(--size-touch-target)',
						borderRadius: '50%',
						backgroundColor: 'transparent',
						transform: 'translate(-50%, -50%)',
						pointerEvents: 'auto',
					},

					'$:focus-visible': {
						outline: '2px solid var(--color-focus-ring)',
						outlineOffset: '2px',
					},
				})"
				:aria-label="ariaLabel"
			/>
		</SliderRoot>
	</div>
</template>
