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
			'overflow': 'hidden',
			'borderRadius': '4px',
			'backgroundColor': 'var(--color-gray-2)',
			'@dark': {
				backgroundColor: 'var(--color-gray-5)',
			},
		})"
	>
		<div
			v-if="currentMusic == null"
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
					'color': 'var(--color-gray-3)',

					'@container music-player 420 to *': {
						fontSize: '36px',
					},
				})"
			/>
		</div>
		<img
			v-else
			:src="currentMusic.cover"
			:alt="currentMusic.title"
			:title="currentMusic.title"
			:class="pika({
				width: '100%',
				height: '100%',
			})"
		>
	</div>
</template>
