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

const isOnline = useOnline()
const route = useRoute()
const isWorldMapRoute = computed(() => route.name === Routes.WorldMap)
</script>

<template>
	<div
		:class="pika({
			'position': 'relative',
			'display': 'grid',
			'gridTemplateRows': 'minmax(0, auto) 1fr minmax(0, auto)',
			'rowGap': '4px',
			'width': '100%',
			'maxWidth': '500px',
			'height': '100%',
			'minHeight': '100%',
			'padding': '4px',
			'margin': '0 auto',
			'zIndex': '1',

			'@screen-md-and-up': {
				maxWidth: '1024px',
			},
		})"
	>
		<header
			:class="pika('card', {
				position: 'relative',
				zIndex: '3',
				display: 'flex',
				flexDirection: 'column',
				gap: '16px',
				padding: '16px',
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
						gap: '4px',
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

					<UiTooltip v-if="isOnline === false">
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
								Offline
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
								You are currently offline. Some features may not be available.
							</span>
						</template>
					</UiTooltip>
				</RouterLink>

				<UiTriggerTooltip
					v-if="isWorldMapRoute === false"
					label="World Map"
				>
					<RouterLink
						:to="{ name: Routes.WorldMap }"
						aria-label="World Map"
						:class="pika('icon-btn')"
					>
						<span
							:class="pika('i-f7:map')"
							aria-hidden="true"
						/>
					</RouterLink>
				</UiTriggerTooltip>

				<DownloadManagerDropdownMenu />
				<SettingsDropdownMenu />
			</div>
		</header>

		<div
			:class="[
				pika({
					'display': 'grid',
					'gridTemplateColumns': '1fr',
					'columnGap': '4px',
					'height': '100%',
					'minHeight': '0',

					'@screen-md-and-up': {
						gridTemplateColumns: 'minmax(400px, 1fr) minmax(300px, 400px)',
					},
				}),
				isWorldMapRoute
					? pika({ '@screen-md-and-up': { gridTemplateColumns: 'minmax(0, 1fr)' } })
					: '',
			]"
		>
			<div
				:class="[
					pika('card', {
						minWidth: '0',
						position: 'relative',
					}),
					isWorldMapRoute === false && isRightSidePanelContainerVisible === false ? pika({ paddingBottom: '38px' }) : '',
					isWorldMapRoute ? pika({ height: '100%', minHeight: '0', overflow: 'hidden' }) : '',
				]"
			>
				<div
					v-if="isWorldMapRoute === false && isRightSidePanelContainerVisible === false"
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
						isWorldMapRoute === false
							&& (isRightSidePanelContainerVisible === false)
							&& (rightSidePanelOpen === true)
					"
				/>
				<RouterView v-else />
			</div>

			<div
				v-if="isWorldMapRoute === false"
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

		<div :class="pika('card')">
			<MusicPlayer />
		</div>
	</div>
</template>
