<script setup lang="ts">
import { ProgressIndicator, ProgressRoot } from 'reka-ui'

withDefaults(
	defineProps<{
		value?: number
		max?: number
	}>(),
	{
		value: 0,
		max: 100,
	},
)
</script>

<template>
	<ProgressRoot
		:modelValue="value"
		:max
		:class="pika({
			'position': 'relative',
			'overflow': 'hidden',
			'background': 'var(--color-secondary-bg)',
			'border-radius': '9999px',
			'width': 'var(--ui-progress-width, 100%)',
			'height': 'var(--ui-progress-height, 5px)',
			'transform': 'translateZ(0)',
		})"
	>
		<ProgressIndicator
			:class="pika({
				'background-color': 'var(--color-primary-1)',
				'width': '100%',
				'height': '100%',
				'border-radius': '9999px',
				'transition': 'transform 660ms cubic-bezier(0.65, 0, 0.35, 1)',
			})"
			:style="`transform: translateX(-${100 - value}%)`"
		/>
	</ProgressRoot>
</template>
