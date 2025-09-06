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
			flexDirection: 'column',
			gap: '8px',
			width: '100%',
			userSelect: 'none',
			touchAction: 'none',
		})"
	>
		<div
			:data-can-play="canPlay"
			:class="pika({
				'display': 'flex',
				'justifyContent': 'space-between',
				'width': '100%',

				'$[data-can-play=false]': {
					visibility: 'hidden',
				},
			})"
		>
			<div
				:class="pika({
					fontSize: '12px',
					color: 'var(--color-secondary-text)',
				})"
			>
				{{ formatTime(currentTime) }}
			</div>
			<div
				:class="pika({
					fontSize: '12px',
					color: 'var(--color-secondary-text)',
				})"
			>
				{{ formatTime(duration) }}
			</div>
		</div>
		<UiSlider
			v-model="currentTime"
			:max="duration"
			:step="0.1"
			:disabled="canPlay === false"
			aria-label="Playing Progress"
		/>
	</div>
</template>
