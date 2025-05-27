<script setup lang="ts">
import type { MusicData } from '@/types'

defineProps<{
	currentMusic: MusicData | null
	isPipSupported: boolean
	isPipActive: boolean
}>()

defineEmits<{
	copyMusicLink: []
	showMusicInPlaylist: []
	startPip: []
}>()
</script>

<template>
	<div :class="pika({ display: 'flex', alignItems: 'center', gap: '0px', flexShrink: '0' })">
		<UiTooltip
			v-if="currentMusic != null"
		>
			<template #trigger>
				<button
					:class="pika('icon-btn')"
					@click="$emit('copyMusicLink')"
				>
					<div
						:class="pika('i-f7:link')"
					/>
				</button>
			</template>
			<template #content>
				Copy Music Link
			</template>
		</UiTooltip>
		<UiTooltip
			v-if="(currentMusic != null) && (isPipActive === false)"
		>
			<template #trigger>
				<button
					:class="pika('icon-btn')"
					@click="$emit('showMusicInPlaylist')"
				>
					<div
						:class="pika('i-f7:compass')"
					/>
				</button>
			</template>

			<template #content>
				Show in Playlist
			</template>
		</UiTooltip>
		<UiTooltip
			v-if="isPipSupported && (isPipActive === false)"
		>
			<template #trigger>
				<button
					:class="pika('icon-btn')"
					@click="$emit('startPip')"
				>
					<div
						:class="pika('i-f7:rectangle-on-rectangle')"
					/>
				</button>
			</template>

			<template #content>
				Open in Picture-in-Picture
			</template>
		</UiTooltip>
	</div>
</template>
