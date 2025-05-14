<script setup lang="ts">
const appStore = useAppStore()
const { toggleDark } = appStore
const { getPlaylist } = useMusicPlayerStore()
</script>

<template>
	<div
		:class="pika('theme', {
			position: 'relative',
			display: 'flex',
			justifyContent: 'center',
			gap: '16px',
			width: '100%',
			height: '100dvh',
			minHeight: '100vh',
			padding: '16px',
		})"
	>
		<div
			:class="pika('card', {
				'position': 'absolute',
				'top': '16px',
				'right': '0',
				'zIndex': '10',
				'padding': '8px',
				'display': 'flex',
				'alignItems': 'center',
				'justifyContent': 'center',
				'borderRadius': '16px 0 0 16px',
				'backgroundColor': 'var(--color-gray-1)',
				'transition': 'opacity 0.2s',

				'@dark': {
					backgroundColor: 'var(--color-gray-4)',
				},
			})"
		>
			<button
				:style="{
					'--size': '36px',
				}"
				:class="pika('icon-btn')"
				@click="toggleDark()"
			>
				<div
					:class="pika({
						'$': ['i-f7:sun-max'],
						'@dark': ['i-f7:moon'],
					})"
				/>
			</button>
		</div>

		<div
			:class="pika({
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
				maxWidth: '500px',
				height: '100%',
				gap: '16px',
			})"
		>
			<div :class="pika('card', { flex: '1 1 0', minHeight: '0' })">
				<MusicList v-bind="getPlaylist('all')!" />
			</div>

			<div :class="pika('card')">
				<MusicPlayer />
			</div>
		</div>
	</div>
</template>
