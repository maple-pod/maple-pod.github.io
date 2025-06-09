<script setup lang="ts">
import type { MusicData, PlaylistId } from '@/types'
import { formatTime } from '@/utils/common'

const props = defineProps<{
	playlistId: PlaylistId
}>()

const musicStore = useMusicStore()

const { currentPlaylist, currentMusic, isPaused, random } = storeToRefs(musicStore)
const { getPlaylist, getMusicData, play, togglePlay, isMusicLiked, toggleMusicLike, toggleRandom } = musicStore
const playlist = computed(() => getPlaylist(props.playlistId)!)
const title = computed(() => playlist.value.title)
const uiVerticalListRef = useTemplateRef('uiVerticalListRef')

useAppStore().scrollPlaylistToIndex = (index: number) => uiVerticalListRef.value?.scrollToIndex(index)

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

const canDragAndSort = computed(() => playlist.value.id !== 'all')
const { pointerPosition, isDragging, items } = useDragAndSort({
	draggableElementHandlerSelector: '[data-draggable-handler]',
	draggableElementSelector: '[data-draggable=true]',
	items: computed({
		get: () => playlist.value.list
			.map(id => getMusicData(id))
			.filter<MusicData>(item => item != null),
		set: (newItems) => {
			playlist.value.list = newItems.map(item => item.id)
		},
	}),
})
function calcScrollSpeed(pointerY: number, scrollZoneTop: number, scrollZoneBottom: number): number {
	if (pointerY < scrollZoneTop) {
		return -(scrollZoneTop - pointerY) / 5
	}
	else if (pointerY > scrollZoneBottom) {
		return (pointerY - scrollZoneBottom) / 5
	}
	return 0
}
useRafFn(() => {
	if (isDragging.value === false || uiVerticalListRef.value == null)
		return

	const rect = useElementBounding(uiVerticalListRef as any)
	const scrollUpZoneTop = rect.top.value
	const scrollDownZoneBottom = rect.bottom.value
	const pointerY = pointerPosition.value.y

	const scrollSpeed = calcScrollSpeed(pointerY, scrollUpZoneTop, scrollDownZoneBottom)
	if (scrollSpeed !== 0) {
		uiVerticalListRef.value.scrollBy(scrollSpeed)
	}
}, { immediate: true })
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
		<div
			:class="pika({
				display: 'flex',
				alignItems: 'center',
				gap: '16px',
				fontWeight: '100',
				height: '60px',
			})"
		>
			<UiTooltip>
				<template #trigger>
					<button
						:class="pika('icon-btn')"
						@click="goBackToPlaylists()"
					>
						<div :class="pika('i-f7:chevron-left')" />
					</button>
				</template>

				<template #content>
					Back to playlists
				</template>
			</UiTooltip>
			<UiMarquee
				:class="pika({
					maxWidth: '250px',
					fontSize: '24px',
					fontWeight: '100',
				})"
			>
				{{ title }}
			</UiMarquee>
			<div
				:class="pika({
					'display': 'flex',
					'alignItems': 'center',
					'gap': '4px',
					'marginRight': 'auto',
					'padding': '8px 12px',
					'borderRadius': '9999px',
					'backgroundColor': 'var(--color-gray-2)',
					'@dark': {
						backgroundColor: 'var(--color-gray-5)',
					},

				})"
			>
				<UiTooltip>
					<template #trigger>
						<button
							:data-state="random"
							:data-toggle="random"
							:class="pika('icon-btn-toggle')"
							@click="toggleRandom()"
						>
							<div
								:class="pika('i-f7:shuffle')"
							/>
						</button>
					</template>
					<template #content>
						{{ random === true ? 'Disable Random' : 'Enable Random' }}
					</template>
				</UiTooltip>
				<UiTooltip>
					<template #trigger>
						<button
							:class="pika('icon-btn')"
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
					</template>
					<template #content>
						{{ isPaused === true ? 'Play' : 'Pause' }}
					</template>
				</UiTooltip>
			</div>
			<PlaylistDropdownMenu
				:playlistId="playlist.id"
			/>
		</div>

		<div
			:class="pika({
				flex: '1 0 0',
				minHeight: '0',
			})"
		>
			<UiVerticalList
				ref="uiVerticalListRef"
				:items
				:itemHeight="72"
			>
				<template #item="{ item, index }">
					<div
						:key="item.id"
						:data-is-current-music="item.id === currentMusic?.id && playlist.id === currentPlaylist?.id"
						:data-is-paused="isPaused"
						:data-music-src="item.src"
						:data-index="index"
						:data-draggable="canDragAndSort"
						:class="pika('hover-mask', {
							'width': '100%',
							'height': '64px',
							'display': 'flex',
							'alignItems': 'center',
							'padding': '0 16px 0 4px',
							'marginBottom': '8px',
							'borderRadius': '8px',
							'backgroundColor': 'var(--color-gray-1)',
							'cursor': 'pointer',
							'userSelect': 'none',

							'@dark': {
								backgroundColor: 'var(--color-gray-4)',
							},

							'$:has([id^=reka-dropdown-menu-trigger-][data-state=open])::before': {
								opacity: '0.1',
							},
							'$[data-is-current-music=true]': {
								color: 'var(--color-primary-1)',
							},
						})"
						@click="play(playlist, item.id)"
					>
						<div
							v-if="canDragAndSort"
							data-draggable-handler
							:class="pika({
								display: 'flex',
								alignItems: 'center',
								height: '100%',
								padding: '8px',
								color: 'var(--color-gray-3)',
							})"
							@click.capture.stop
						>
							<div
								:class="pika('i-f7:equal')"
							/>
						</div>
						<div
							:class="pika({
								flex: '1 1 0',
								minWidth: '0',
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								marginRight: '16px',
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
							<button
								:data-liked="isMusicLiked(item.id)"
								:class="pika('icon-btn', {
									'@screen-md-and-up': {
										'[data-music-src]:not(:hover) [data-liked=false]$': { visibility: 'hidden' },
									},
								})"
								@click.stop="toggleMusicLike(item.id)"
							>
								<div
									:class="pika({
										'[data-liked=true] $': ['i-f7:heart-fill', { color: 'var(--color-primary-1)' }],
										'[data-liked=false] $': ['i-f7:heart'],
									})"
								/>
							</button>
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
									display: 'flex',
									flexDirection: 'column',
									gap: '2px',
									flex: '1 2 0',
									minWidth: '0',
								})"
							>
								<UiMarquee
									:key="item.title"
									:title="item.title"
									:class="pika({ width: '100%' })"
								>
									{{ item.title }}
								</UiMarquee>
								<div
									:class="pika({
										'fontSize': '12px',
										'color': 'var(--color-gray-5)',
										'opacity': '0.5',
										'@dark': {
											color: 'var(--color-gray-1)',
										},
									})"
								>
									{{ formatTime(item.duration) }}
								</div>
							</div>
						</div>
						<PlaylistMusicDropdownMenu
							:playlistId
							:musicId="item.id"
						/>
					</div>
				</template>
			</UiVerticalList>
		</div>
	</div>
</template>
