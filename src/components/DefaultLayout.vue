<script setup lang="ts">
import { Routes } from '@/router'

const appStore = useAppStore()
const { toggleDark } = appStore
// const { getPlaylist } = useMusicStore()
</script>

<template>
	<div
		:class="pika('theme', {
			display: 'flex',
			justifyContent: 'center',
			gap: '16px',
			width: '100%',
			height: '100%',
			minHeight: '100%',
			padding: '0 16px',
		})"
	>
		<div
			:class="pika({
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
				maxWidth: '768px',
				height: '100%',
				gap: '16px',
			})"
		>
			<div
				:class="pika('card', {
					display: 'flex',
					alignItems: 'center',
					borderRadius: '0 0 16px 16px',
				})"
			>
				<RouterLink
					:to="{ name: Routes.Root }"
					:class="pika({
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						marginRight: 'auto',
					})"
				>
					<img
						src="/logo.png"
						alt="Logo"
						:class="pika({
							display: 'inline-block',
							width: 'auto',
							height: '32px',
						})"
					>

					<div
						:class="pika({
							fontSize: '32px',
							fontWeight: '100',
							marginLeft: '8px',
						})"
					>
						Maple Pod
					</div>
				</RouterLink>

				<button
					:class="pika('icon-btn', { '--size': '36px' })"
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

			<div :class="pika({ flex: '1 1 0', minHeight: '0' })">
				<RouterView />
			</div>

			<div :class="pika('card', { borderRadius: '16px 16px 0 0' })">
				<MusicPlayer />
			</div>
		</div>
	</div>
</template>
