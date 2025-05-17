<script setup lang="ts">
import { DefaultLayoutHeaderSlot } from '@/components/DefaultLayout.vue'

const musicStore = useMusicStore()
const { playlistList, currentPlaylist } = storeToRefs(musicStore)

const router = useRouter()
function goToPlaylist(playlistId: string) {
	return router.push({ name: Routes.Playlist, params: { playlistId } })
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
					})"
				>
					Playlists
				</div>
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
				:itemHeight="80"
			>
				<template #item="{ item: playlist, index }">
					<div
						:key="index"
						:data-is-current-playlist="playlist.id === currentPlaylist?.id"
						:class="pika({
							'position': 'relative',
							'width': '100%',
							'height': '80px',
							'display': 'flex',
							'alignItems': 'center',
							'gap': '16px',
							'padding': '0 16px',
							'cursor': 'pointer',
							'userSelect': 'none',
							'$::before': {
								content: '\'\'',
								zIndex: '1',
								position: 'absolute',
								top: '4px',
								left: '0',
								bottom: '4px',
								width: '100%',
								borderRadius: '8px',
								backgroundColor: 'var(--color-gray-3)',
								opacity: '0',
								transition: 'opacity 0.1s',
								pointerEvents: 'none',
							},
							'$:hover::before': {
								opacity: '0.1',
							},
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
									display: 'flex',
									flexDirection: 'column',
									gap: '4px',
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
						</div>

						<div
							:class="pika({
								'width': '24px',
								'height': '24px',
								'fontSize': '24px',
								'transition': 'opacity 0.1s',
								':hover > $': ['i-f7:chevron-right', { opacity: '1', color: 'var(--color-primary-1)' }],
							})"
						/>
					</div>
				</template>
			</UiVerticalList>
		</div>
	</div>
</template>
