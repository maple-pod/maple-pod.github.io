<script setup lang="ts">
import { formatTime } from '@/utils/common'

defineProps<{
	duration: number
	canPlay: boolean
}>()

const currentTime = defineModel<number>('currentTime', { required: true })
</script>

<template>
	<div
		:class="pika({
			display: 'flex',
			alignItems: 'center',
			gap: 'var(--spacing-2)',
			width: '100%',
			height: 'var(--size-touch-target)',
			padding: '0 var(--spacing-2)',
			userSelect: 'none',
			touchAction: 'none',
		})"
	>
		<div
			:data-can-play="canPlay"
			:class="pika({
				'flexShrink': '0',
				'fontSize': '12px',
				'color': 'var(--color-text-secondary)',

				'$[data-can-play=false]': { visibility: 'hidden' },
			})"
		>
			{{ formatTime(currentTime) }}
		</div>

		<div
			:class="pika({
				display: 'flex',
				alignItems: 'center',
				flex: '1 1 0',
				minWidth: '0',
				height: 'var(--size-touch-target)',
			})"
		>
			<UiSlider
				v-model="currentTime"
				:max="duration"
				:step="0.1"
				:disabled="canPlay === false"
				aria-label="Playing Progress"
			/>
		</div>

		<div
			:data-can-play="canPlay"
			:class="pika({
				'flexShrink': '0',
				'fontSize': '12px',
				'color': 'var(--color-text-secondary)',

				'$[data-can-play=false]': { visibility: 'hidden' },
			})"
		>
			{{ formatTime(duration) }}
		</div>
	</div>
</template>
