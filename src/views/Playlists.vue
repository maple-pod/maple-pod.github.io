<script setup lang="ts">
const uiVerticalListRef = useTemplateRef('uiVerticalListRef')

const musicStore = useMusicStore()
const { playlistList, currentPlaylist } = storeToRefs(musicStore)

const router = useRouter()
function goToPlaylist(playlistId: string) {
	return router.push({ name: Routes.Playlist, params: { playlistId } })
}
</script>

<template>
	<div
		:class="pika('card', {
			display: 'flex',
			flexDirection: 'column',
			width: '100%',
			height: '100%',
		})"
	>
		<div
			:data-arrived-top="uiVerticalListRef?.scrollingArrivedTop"
			:class="pika({
				'display': 'flex',
				'alignItems': 'center',
				'margin': '-16px -16px 0 -16px',
				'padding': '16px',
				'border': '1px solid transparent',
				'fontWeight': '100',
				'transition': 'border-color 0.2s',

				'$[data-arrived-top=false]': {
					borderBottomColor: 'var(--color-gray-2)',
				},

				'@dark': {
					'&$[data-arrived-top=false]': {
						borderBottomColor: 'var(--color-gray-3)',
					},
				},
			})"
		>
			<div
				:class="pika({
					fontSize: '48px',
					fontWeight: '100',
				})"
			>
				Playlists
			</div>
		</div>

		<div
			:class="pika({
				flex: '1 0 0',
				minHeight: '0',
			})"
		>
			<UiVerticalList
				ref="uiVerticalListRef"
				:items="playlistList"
			>
				<template #default="{ item: playlist, index }">
					<div
						:key="index"
						:data-is-current-playlist="playlist.id === currentPlaylist?.id"
						:class="pika({
							'position': 'relative',
							'width': '100%',
							'display': 'flex',
							'alignItems': 'center',
							'gap': '16px',
							'padding': '16px',
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
									alignItems: 'center',
									gap: '16px',
								})"
							>
								<div>{{ playlist.title }}</div>
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
