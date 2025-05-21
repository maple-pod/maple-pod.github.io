<script setup lang="ts">
import { Routes } from '@/router'
import { Teleport } from 'vue'
</script>

<script lang="ts">
export const DefaultLayoutHeaderSlot = defineComponent({
	name: 'DefaultLayoutHeaderSlot',
	setup: (_, { slots }) => () => h(
		Teleport,
		{ to: '#default-layout-header-slot', defer: true },
		[slots.default?.()],
	),
})
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
					flexDirection: 'column',
					gap: '16px',
					padding: '0 16px 16px 16px',
					borderRadius: '0 0 16px 16px',
				})"
			>
				<div
					:class="pika({
						'display': 'flex',
						'alignItems': 'center',
						'padding': '32px 0',

						'$:not(:last-child)': {
							borderBottom: '1px solid var(--color-gray-3)',
						},
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
							:class="pika('font-comfortaa-700', {
								fontSize: '32px',
								marginLeft: '8px',
							})"
						>
							Maple Pod
						</div>
					</RouterLink>

					<SettingsDropdownMenu />
				</div>

				<div
					id="default-layout-header-slot"
					:class="pika({ display: 'contents' })"
				/>
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
