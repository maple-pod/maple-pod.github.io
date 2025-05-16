<script setup lang="ts">
import type { PlaylistId } from '@/types/Playlist'
import { DefaultLayoutHeaderSlot } from '@/components/DefaultLayout.vue'

const props = defineProps<{
	playlistId: PlaylistId
	scrollToIndex?: number
}>()

const musicStore = useMusicStore()

const { currentPlaylist, currentMusic, isPaused, random } = storeToRefs(musicStore)
const { getPlaylist, getMusicData, play, togglePlay, isMusicLiked, toggleMusicLike, toggleRandom } = musicStore
const playlist = computed(() => getPlaylist(props.playlistId)!)
const title = computed(() => playlist.value.title)
const list = toRef(() => playlist.value.list)
const items = computed(() => list.value.map(getMusicData).filter(data => data != null))
const uiVerticalListRef = useTemplateRef('uiVerticalListRef')

function handlePlayPlaylist() {
	if (playlist.value.list.length === 0)
		return

	if (playlist.value.id !== currentPlaylist.value?.id) {
		play(playlist.value)
		return
	}

	togglePlay()
}

const router = useRouter()
function goBackToPlaylists() {
	return router.push({ name: Routes.Playlists })
}

whenever(
	() => props.scrollToIndex != null && uiVerticalListRef.value != null,
	async () => {
		await nextTick()
		uiVerticalListRef.value!.scrollToIndex(props.scrollToIndex!)
		router.replace({
			...router.currentRoute.value,
			query: {
				...router.currentRoute.value.query,
				scrollToIndex: undefined,
			},
		})
	},
)
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
				<button
					:class="pika('icon-btn', { '--size': '36px' })"
					@click="goBackToPlaylists()"
				>
					<div :class="pika('i-f7:chevron-left')" />
				</button>
				<div
					:class="pika({
						fontSize: '24px',
						fontWeight: '100',
						marginRight: 'auto',
					})"
				>
					{{ title }}
				</div>
				<button
					:data-state="random"
					:data-toggle="random"
					:class="pika('icon-btn-toggle', {
						'--size': '32px',
						'@screen * to 500': {
							'--size': '28px',
						},
					})"
					@click="toggleRandom()"
				>
					<div
						:class="pika('i-f7:shuffle')"
					/>
				</button>
				<button
					:class="pika('circle-icon-btn', {
						'--size': '36px',
						'@screen * to 500': {
							'--size': '32px',
						},
					})"
					:disabled="playlist.list.length === 0"
					@click="handlePlayPlaylist()"
				>
					<div
						:data-is-paused="isPaused || playlist.id !== currentPlaylist?.id"
						:class="pika({
							'$[data-is-paused=true]': ['i-f7:play-fill', { transform: 'translateX(2px)' }],
							'$[data-is-paused=false]': ['i-f7:pause-fill'],
						})"
					/>
				</button>
			</div>
		</DefaultLayoutHeaderSlot>

		<div
			:class="pika('card', {
				flex: '1 0 0',
				minHeight: '0',
			})"
		>
			<UiVerticalList
				ref="uiVerticalListRef"
				:items
			>
				<template #default="{ item, index }">
					<div
						:key="index"
						:data-is-current-music="item.source === currentMusic?.source && playlist.id === currentPlaylist?.id"
						:data-is-paused="isPaused"
						:data-music-source="item.source"
						:class="pika({
							'position': 'relative',
							'width': '100%',
							'display': 'flex',
							'alignItems': 'center',
							'gap': '16px',
							'padding': '16px 16px 16px 4px',
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
							'$[data-is-current-music=true]': {
								color: 'var(--color-primary-1)',
							},
						})"
						@click="play(playlist, item.source)"
					>
						<div
							:class="pika({
								flex: '1 1 0',
								minWidth: '0',
								display: 'flex',
								alignItems: 'center',
								gap: '16px',
							})"
						>
							<div
								:class="pika({
									display: 'flex',
									justifyContent: 'end',
									width: '40px',
								})"
							>
								<span
									:class="pika({
										'fontSize': '12px',
										'color': 'var(--color-gray-5)',
										'opacity': '0.5',
										'@dark': {
											color: 'var(--color-gray-1)',
										},

										'[data-is-current-music=true][data-is-paused=false] $': { display: 'none' },
										'[data-is-current-music=true][data-is-paused=true] $, [data-is-current-music=false]:hover $': { display: 'none' },
									})"
								>
									#{{ index + 1 }}
								</span>

								<div
									:class="pika({
										'fontSize': '24px',
										'transition': 'opacity 0.1s',
										'[data-is-current-music=true][data-is-paused=false] $': ['i-svg-spinners:bars-scale-middle', { opacity: '1' }],
										'[data-is-current-music=true][data-is-paused=true] $, [data-is-current-music=false]:hover $': ['i-f7:play-fill', { opacity: '1', color: 'var(--color-primary-1)' }],
									})"
								/>
							</div>
							<img
								:src="item.cover"
								:alt="item.title"
								:title="item.title"
								:class="pika({
									width: '50px',
									height: '50px',
								})"
								loading="lazy"
							>

							<div
								:class="pika({
									flex: '1 1 0',
									minWidth: '0',
									display: 'flex',
									whiteSpace: 'nowrap',
									textOverflow: 'ellipsis',
									overflow: 'hidden',
								})"
								:title="currentMusic?.title"
							>
								<UiMarquee>{{ item.title }}</UiMarquee>
							</div>
						</div>

						<button
							:data-liked="isMusicLiked(item.source)"
							:class="pika('icon-btn', { '--size': '36px' })"
							@click.stop="toggleMusicLike(item.source)"
						>
							<div
								:class="pika({
									'[data-liked=true] $': ['i-f7:heart-fill', { color: 'var(--color-primary-1)' }],
									'[data-liked=false] $': ['i-f7:heart'],
								})"
							/>
						</button>
					</div>
				</template>
			</UiVerticalList>
		</div>
	</div>
</template>
