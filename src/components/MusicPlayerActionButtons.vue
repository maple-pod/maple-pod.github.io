<script setup lang="ts">
import type { MusicData, PlaylistId } from '@/types'

defineProps<{
	currentPlaylistId: PlaylistId | null | undefined
	currentMusic: MusicData | null | undefined
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
		<UiIconButton
			v-if="currentMusic != null"
			label="Copy Music Link"
			target="compact"
			@click="$emit('copyMusicLink')"
		>
			<div :class="pika('i-f7:link')" />
		</UiIconButton>
		<UiIconButton
			v-if="(currentMusic != null) && (isPipActive === false)"
			label="Show in Playlist"
			target="compact"
			@click="$emit('showMusicInPlaylist')"
		>
			<div :class="pika('i-f7:compass')" />
		</UiIconButton>
		<UiIconButton
			v-if="isPipSupported && (isPipActive === false)"
			label="Open in Picture-in-Picture"
			target="compact"
			@click="$emit('startPip')"
		>
			<div :class="pika('i-f7:rectangle-on-rectangle')" />
		</UiIconButton>
		<MusicDropdownMenu
			v-if="(currentMusic != null) && (currentPlaylistId != null) && (isPipActive === false)"
			:playlistId="currentPlaylistId"
			:musicId="currentMusic.id"
		/>
	</div>
</template>
