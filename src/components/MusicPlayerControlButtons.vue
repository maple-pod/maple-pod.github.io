<script setup lang="ts">
import type { MusicData } from '@/types'

defineProps<{
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
</script>

<template>
	<div
		:class="pika({
			'display': 'flex',
			'alignItems': 'center',
			'justifyContent': 'center',
			'gap': '16px',
			'width': '100%',

			'@screen * to 500': {
				gap: '8px',
			},
		})"
	>
		<UiTooltip>
			<template #trigger>
				<button
					:data-toggle="random"
					:class="pika('icon-btn-toggle')"
					@click="$emit('toggleRandom')"
				>
					<div
						:class="pika('i-f7:shuffle')"
					/>
				</button>
			</template>

			<template #content>
				{{ random === true ? 'Disable Random' : 'Enable Random' }}
			</template>
		</UiTooltip>
		<UiTooltip>
			<template #trigger>
				<button
					:class="pika('icon-btn')"
					:disabled="currentMusic == null"
					@click="$emit('goPrevious')"
				>
					<div
						:class="pika('i-f7:backward-end-fill')"
					/>
				</button>
			</template>

			<template #content>
				Previous
			</template>
		</UiTooltip>
		<UiTooltip>
			<template #trigger>
				<button
					:class="pika('icon-btn')"
					:disabled="currentMusic == null"
					@click="$emit('togglePlay')"
				>
					<div
						:data-is-paused="isPaused"
						:class="pika({
							'$[data-is-paused=true]': ['i-f7:play-fill', { transform: 'translateX(2px)' }],
							'$[data-is-paused=false]': ['i-f7:pause-fill'],
						})"
					/>
				</button>
			</template>

			<template #content>
				{{ isPaused === true ? 'Play' : 'Pause' }}
			</template>
		</UiTooltip>
		<UiTooltip>
			<template #trigger>
				<button
					:class="pika('icon-btn')"
					:disabled="currentMusic == null"
					@click="$emit('goNext')"
				>
					<div
						:class="pika('i-f7:forward-end-fill')"
					/>
				</button>
			</template>

			<template #content>
				Next
			</template>
		</UiTooltip>
		<UiTooltip>
			<template #trigger>
				<button
					:data-state="repeated"
					:data-toggle="repeated !== 'off'"
					:class="pika('icon-btn-toggle')"
					@click="$emit('toggleRepeated')"
				>
					<div
						:class="pika({
							'[data-state=repeat] > $': ['i-f7:repeat'],
							'[data-state=repeat-1] > $': ['i-f7:repeat-1'],
							'[data-state=off] > $': ['i-f7:repeat'],
						})"
					/>
				</button>
			</template>

			<template #content>
				{{ repeated === 'off' ? 'Enable Repeat All' : repeated === 'repeat' ? 'Enable Repeat One' : 'Disable Repeat' }}
			</template>
		</UiTooltip>
	</div>
</template>
