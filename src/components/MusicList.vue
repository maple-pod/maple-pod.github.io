<script setup lang="ts">
import type { Playlist } from '@/types/Playlist'

const props = defineProps<Playlist>()

const list = toRef(props, 'list')

const appStore = useAppStore()
const { getMusicData } = appStore
const musicPlayerStore = useMusicPlayerStore()
const { currentMusic, isPaused } = storeToRefs(musicPlayerStore)
const { pressMusicItem, isMusicLiked, toggleMusicLike } = musicPlayerStore

const items = computed(() => list.value.map(getMusicData).filter(data => data != null))

const uiVerticalListRef = useTemplateRef('uiVerticalListRef')
</script>

<template>
	<div
		:class="pika({
			display: 'flex',
			flexDirection: 'column',
			width: '100%',
			height: '100%',
		})"
	>
		<div
			:data-arrived-top="uiVerticalListRef?.scrollingArrivedTop"
			:class="pika({
				'margin': '-16px -16px 0 -16px',
				'padding': '16px 32px',
				'border': '1px solid transparent',
				'borderRadius': '16px 16px 0 0',
				'fontSize': '48px',
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
			{{ title }}
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
			>
				<template #default="{ item, index }">
					<div
						:key="index"
						:data-is-current-music="item.source === currentMusic?.source"
						:data-is-paused="isPaused"
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
							'$[data-is-current-music=true]': {
								color: 'var(--color-primary-1)',
							},
						})"
						@click="pressMusicItem({
							source: item.source,
							playlistId: id,
						})"
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
									'fontSize': '12px',
									'color': 'var(--color-gray-5)',
									'opacity': '0.5',
									'@dark': {
										color: 'var(--color-gray-1)',
									},
								})"
							>
								#{{ index + 1 }}
							</div>
							<div
								:class="pika({
									display: 'flex',
									alignItems: 'center',
									gap: '16px',
								})"
							>
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
								<div>
									<div>{{ item.title }}</div>
								</div>
							</div>
						</div>

						<button
							:data-liked="isMusicLiked(item.source)"
							:style="{
								'--size': '36px',
							}"
							:class="pika('icon-btn', {
								'opacity': '0',
								'transition': 'opacity 0.1s',

								':hover > $': {
									opacity: '1',
								},
							})"
							@click.stop="toggleMusicLike(item.source)"
						>
							<div
								:class="pika({
									'[data-liked=true] $': ['i-f7:heart-fill', { color: 'var(--color-primary-1)' }],
									'[data-liked=false] $': ['i-f7:heart'],
								})"
							/>
						</button>
						<div
							:class="pika({
								'width': '24px',
								'height': '24px',
								'fontSize': '24px',
								'transition': 'opacity 0.1s',
								'[data-is-current-music=true][data-is-paused=false] > $': ['i-svg-spinners:bars-scale-middle', { opacity: '1' }],
								'[data-is-current-music=true][data-is-paused=true] > $, [data-is-current-music=false]:hover > $': ['i-f7:play-fill', { opacity: '1', color: 'var(--color-primary-1)' }],
							})"
						/>
					</div>
				</template>
			</UiVerticalList>
		</div>
	</div>
</template>
