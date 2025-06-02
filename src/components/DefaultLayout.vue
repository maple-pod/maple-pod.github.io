<script setup lang="ts">
import { Routes } from '@/router'

const staticRightSidePanelContainerRef = useTemplateRef('staticRightSidePanelContainerRef')
const isRightSidePanelContainerVisible = useElementVisibility(staticRightSidePanelContainerRef)
watch(
	() => isRightSidePanelContainerVisible.value,
	() => {},
)

const rightSidePanelOpen = ref(false)
whenever(
	() => isRightSidePanelContainerVisible.value === false,
	() => rightSidePanelOpen.value = false,
)
</script>

<template>
	<div
		:class="pika('theme', {
			'display': 'grid',
			'gridTemplateRows': 'auto 1fr auto',
			'rowGap': '12px',
			'width': '100%',
			'maxWidth': '500px',
			'height': '100%',
			'minHeight': '100%',
			'padding': '0 12px',
			'margin': '0 auto',

			'@screen-md-and-up': {
				maxWidth: '1024px',
			},
		})"
	>
		<div
			:class="pika('card', {
				display: 'flex',
				flexDirection: 'column',
				gap: '16px',
				padding: '16px',
				borderRadius: '0 0 16px 16px',
			})"
		>
			<div
				:class="pika({
					display: 'flex',
					alignItems: 'center',
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
		</div>

		<div
			:class="pika({
				'display': 'grid',
				'gridTemplateColumns': '1fr',
				'columnGap': '12px',
				'height': '100%',

				'@screen-md-and-up': {
					gridTemplateColumns: 'minmax(400px, 1fr) minmax(300px, 400px)',
				},
			})"
		>
			<div
				:class="pika('card', {
					minWidth: '0',
					position: 'relative',
					paddingBottom: '38px',
				})"
			>
				<div
					v-if="isRightSidePanelContainerVisible === false"
					:class="pika({
						position: 'absolute',
						bottom: '4px',
						left: '50%',
						transform: 'translateX(-50%)',
						zIndex: '2',
					})"
				>
					<button
						:data-toggle="rightSidePanelOpen"
						:class="pika('icon-btn-toggle', {
							'--size': '20px',
							'$::after': {
								display: 'none',
							},
						})"
						@click="rightSidePanelOpen = !rightSidePanelOpen"
					>
						<div :class="pika('i-f7:sidebar-right')" />
					</button>
				</div>
				<RightSidePanel
					v-if="
						(isRightSidePanelContainerVisible === false)
							&& (rightSidePanelOpen === true)
					"
				/>
				<RouterView v-else />
			</div>

			<div
				ref="staticRightSidePanelContainerRef"
				:class="pika('card', {
					'minWidth': '0',
					'display': 'none',
					'@screen-md-and-up': {
						display: 'block',
					},
				})"
			>
				<RightSidePanel v-if="isRightSidePanelContainerVisible" />
			</div>
		</div>

		<div :class="pika('card', { borderRadius: '16px 16px 0 0' })">
			<MusicPlayer />
		</div>
	</div>
</template>
