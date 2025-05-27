<script setup lang="ts">
import type { MusicData } from '@/types'

defineProps<{
	currentMusic: MusicData | null
}>()
</script>

<template>
	<div
		:class="pika({
			'aspectRatio': '1 / 1',
			'height': '100%',
			'overflow': 'hidden',
			'borderRadius': '4px',
			'backgroundColor': 'var(--color-gray-2)',
			'@dark': {
				backgroundColor: 'var(--color-gray-5)',
			},
		})"
	>
		<div
			:class="pika({
				'display': 'flex',
				'alignItems': 'center',
				'justifyContent': 'center',
				'width': '100%',
				'height': '100%',
				'[data-music-loaded=true] $': { display: 'none' },
			})"
		>
			<div :class="pika('i-f7:music-note', { fontSize: '56px', color: 'var(--color-gray-3)' })" />
		</div>
		<img
			:src="currentMusic?.cover"
			:alt="currentMusic?.title"
			:title="currentMusic?.title"
			:class="pika({
				'width': '100%',
				'height': '100%',
				'[data-music-loaded=false] $': { display: 'none' },
			})"
		>
	</div>
</template>
