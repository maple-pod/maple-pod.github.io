<script setup lang="ts">
import type { MusicData } from '@/types'

defineProps<{
	music: MusicData | null
}>()
</script>

<template>
	<div
		:class="pika('card-border', {
			aspectRatio: '1 / 1',
			overflow: 'hidden',
		})"
	>
		<div
			v-if="music == null"
			:class="pika({
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				width: '100%',
				height: '100%',
			})"
		>
			<div
				:class="pika('i-f7:music-note', {
					'fontSize': '24px',
					'color': 'var(--color-secondary-text)',

					'@container music-player 420 to *': {
						fontSize: '36px',
					},
				})"
			/>
		</div>
		<img
			v-else
			:src="music.cover"
			:alt="music.title"
			:title="music.title"
			:class="pika({
				width: '100%',
				height: '100%',
				transform: 'scale(1.1)',
			})"
		>
	</div>
</template>
