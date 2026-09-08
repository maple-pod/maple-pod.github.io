<script setup lang="ts">
import type { MusicData } from '@/types'

const props = defineProps<{
	currentMusic: MusicData | null
	random: boolean
	repeated: 'off' | 'repeat' | 'repeat-1'
	isPaused: boolean
}>()

defineEmits<{
	toggleRandom: []
	toggleRepeated: []
	goPrevious: []
	goNext: []
	togglePlay: []
}>()

const randomActionLabel = computed(() => props.random ? 'Disable Random' : 'Enable Random')
const playActionLabel = computed(() => props.isPaused ? 'Play' : 'Pause')
const repeatActionLabels = {
	'off': 'Enable Repeat All',
	'repeat': 'Enable Repeat One',
	'repeat-1': 'Disable Repeat',
} as const satisfies Record<typeof props.repeated, string>
const repeatActionLabel = computed(() => repeatActionLabels[props.repeated])
</script>

<template>
	<div
		:class="pika({
			'display': 'flex',
			'alignItems': 'center',
			'justifyContent': 'space-between',
			'width': '100%',

			'@container music-player 420 to *': {
				justifyContent: 'center',
				gap: '24px',
			},
		})"
	>
		<UiIconButton
			label="Random"
			:tooltip="randomActionLabel"
			:pressed="random"
			:data-toggle="random"
			toggle
			@click="$emit('toggleRandom')"
		>
			<div :class="pika('i-f7:shuffle')" />
		</UiIconButton>

		<UiIconButton
			label="Previous"
			:disabled="currentMusic == null"
			@click="$emit('goPrevious')"
		>
			<div :class="pika('i-f7:backward-end-fill')" />
		</UiIconButton>

		<UiIconButton
			:label="playActionLabel"
			:disabled="currentMusic == null"
			@click="$emit('togglePlay')"
		>
			<div
				:data-is-paused="isPaused"
				:class="pika({
					'$[data-is-paused=true]': ['i-f7:play-fill', { transform: 'translateX(calc(var(--size) / 20))' }],
					'$[data-is-paused=false]': ['i-f7:pause-fill'],
				})"
			/>
		</UiIconButton>

		<UiIconButton
			label="Next"
			:disabled="currentMusic == null"
			@click="$emit('goNext')"
		>
			<div :class="pika('i-f7:forward-end-fill')" />
		</UiIconButton>

		<UiIconButton
			:label="repeatActionLabel"
			:data-state="repeated"
			:data-toggle="repeated !== 'off'"
			toggle
			@click="$emit('toggleRepeated')"
		>
			<div
				:class="pika({
					'[data-state=repeat] > $': ['i-f7:repeat'],
					'[data-state=repeat-1] > $': ['i-f7:repeat-1'],
					'[data-state=off] > $': ['i-f7:repeat'],
				})"
			/>
		</UiIconButton>
	</div>
</template>
