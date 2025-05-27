<script setup lang="ts">
import { Routes } from '@/router'
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
						<span
							:class="pika('font-comfortaa-700', {
								fontSize: '32px',
							})"
						>
							Maple Pod
						</span>

						<UiTooltip>
							<template #trigger>
								<span
									:class="pika('font-comfortaa-700', {
										display: 'inline-block',
										padding: '4px',
										borderRadius: '4px',
										fontSize: '14px',
										backgroundColor: 'var(--color-secondary-1)',
									})"
								>
									DEV
								</span>
							</template>

							<template #content>
								<span
									:class="pika({
										display: 'inline-block',
										width: '250px',
										maxWidth: '100vw',
										fontSize: '16px',
										lineHeight: '2',
									})"
								>
									Work in progress, some features may not work as expected and breaking changes may occur.
								</span>
							</template>
						</UiTooltip>
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
