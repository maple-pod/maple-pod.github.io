<script setup lang="ts">
const {
	getPlaylist,
} = useMusicPlayerStore()
</script>

<template>
	<main
		:class="pika({
			width: '100%',
			maxWidth: '600px',
			height: '100%',
			padding: '16px',
		})"
	>
		<MusicList v-bind="getPlaylist('all')!" />
	</main>
</template>
