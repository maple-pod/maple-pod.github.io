<script setup lang="ts">
const props = defineProps<{
	muted: boolean
}>()

defineEmits<{
	toggleMuted: []
}>()

const volume = defineModel<number>('volume', { required: true })
const muted = toRef(props, 'muted')

const volumeLevel = computed(() => {
	switch (true) {
		case muted.value:
		case volume.value === 0:
			return 'mute'
		case volume.value <= 0.2:
			return 'low'
		case volume.value <= 0.4:
			return 'medium'
		case volume.value <= 0.8:
			return 'high'
		default:
			return 'max'
	}
})
</script>

<template>
	<div
		:class="pika('card-border', {
			padding: '8px 4px 4px 4px',
			borderRadius: '9999px',
		})"
	>
		<div
			:class="pika({
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: '4px',
				height: '100%',
			})"
		>
			<div
				:class="pika({
					flex: '1 1 0',
					minHeight: '0',
				})"
			>
				<UiSlider
					v-model="volume"
					orientation="vertical"
					:max="1"
					:step="0.01"
					aria-label="Volume"
				/>
			</div>
			<button
				:data-volume="volumeLevel"
				:data-toggle="muted"
				:class="pika('icon-btn-toggle')"
				@click="$emit('toggleMuted')"
			>
				<div
					:class="pika({
						'[data-volume=mute] > $': ['i-f7:speaker-slash'],
						'[data-volume=low] > $': ['i-f7:speaker'],
						'[data-volume=medium] > $': ['i-f7:speaker-1'],
						'[data-volume=high] > $': ['i-f7:speaker-2'],
						'[data-volume=max] > $': ['i-f7:speaker-3'],
					})"
				/>
			</button>
		</div>
	</div>
</template>
