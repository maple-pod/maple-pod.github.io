<script setup lang="ts">
import CreatePlaylistDialog from '@/components/CreatePlaylistDialog.vue'

const musicStore = useMusicStore()
const { playlistList, currentPlaylist } = storeToRefs(musicStore)

const router = useRouter()
function goToPlaylist(playlistId: string) {
	return router.push({ name: Routes.Playlist, params: { playlistId } })
}

const { dialog } = useAppDialog()
function handleStartCreatePlaylist() {
	return dialog(CreatePlaylistDialog, {})
}
</script>

<template>
	<div
		:class="pika({
			display: 'flex',
			flexDirection: 'column',
			gap: '16px',
			width: '100%',
			height: '100%',
		})"
	>
		<DefaultLayoutHeaderSlot>
			<div
				:class="pika({
					display: 'flex',
					alignItems: 'center',
					gap: '16px',
					fontWeight: '100',
				})"
			>
				<div :class="pika({ fontSize: '28px', padding: '4px' })">
					<div :class="pika('i-f7:music-note-list')" />
				</div>
				<div
					:class="pika({
						fontSize: '24px',
						fontWeight: '100',
						marginRight: 'auto',
					})"
				>
					Playlists
				</div>

				<UiTooltip>
					<template #trigger>
						<button
							:class="pika('icon-btn', {
								'--size': '36px',
							})"
							@click="handleStartCreatePlaylist"
						>
							<div :class="pika('i-f7:text-badge-plus')" />
						</button>
					</template>

					<template #content>
						Create new playlist
					</template>
				</UiTooltip>
			</div>
		</DefaultLayoutHeaderSlot>

		<div
			:class="pika('card', {
				flex: '1 0 0',
				minHeight: '0',
			})"
		>
			<UiVerticalList
				:items="playlistList"
				:itemHeight="72"
			>
				<template #item="{ item: playlist, index }">
					<div
						:key="index"
						:data-is-current-playlist="playlist.id === currentPlaylist?.id"
						:class="pika('hover-mask', {
							'width': '100%',
							'height': '64px',
							'display': 'flex',
							'alignItems': 'center',
							'gap': '16px',
							'padding': '0 16px',
							'marginBottom': '8px',
							'cursor': 'pointer',
							'userSelect': 'none',
							'$[data-is-current-playlist=true]': {
								color: 'var(--color-primary-1)',
							},
						})"
						@click="goToPlaylist(playlist.id)"
					>
						<div
							:class="pika({
								display: 'flex',
								flexDirection: 'column',
								gap: '4px',
								marginRight: 'auto',
							})"
						>
							<div
								:class="pika({
									fontSize: '22px',
									fontWeight: '100',
								})"
							>
								{{ playlist.title }}
							</div>
							<div
								:class="pika({
									fontSize: '14px',
									color: 'var(--color-gray-3)',
									opacity: '0.8',
								})"
							>
								{{ playlist.list.length }} music
							</div>
						</div>

						<PlaylistDropdownMenu
							:playlistId="playlist.id"
						/>
					</div>
				</template>
			</UiVerticalList>
		</div>
	</div>
</template>
