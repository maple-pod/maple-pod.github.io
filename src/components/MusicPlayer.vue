<script setup lang="ts">
import { useDocumentPictureInPicture } from '@/composables/useDocumentPictureInPicture'

const musicStore = useMusicStore()
const {
	currentMusic,
	canPlay,
	duration,
	currentTime,
	isPaused,
	random,
	repeated,
	volume,
	muted,
} = storeToRefs(musicStore)
const {
	isMusicLiked,
	toggleMusicLike,
	togglePlay,
	goPrevious,
	goNext,
	toggleRandom,
	toggleRepeated,
	toggleMuted,
} = musicStore

function formatTime(time: number) {
	const minutes = String(Math.floor(time / 60))
	const seconds = String(Math.floor(time % 60)).padStart(2, '0')
	return `${minutes}:${seconds}`
}

const volumeLevel = computed(() => {
	switch (true) {
		case muted.value:
		case volume.value === 0:
			return 'mute'
		case volume.value <= 0.2:
			return 'low'
		case volume.value <= 0.4:
			return 'medium'
		case volume.value <= 0.8:
			return 'high'
		default:
			return 'max'
	}
})

const [DefineControlButtons, ControlButtons] = createReusableTemplate()
const [DefinePlayingProgress, PlayingProgress] = createReusableTemplate()
const [DefineVolumeControl, VolumeControl] = createReusableTemplate()

const {
	isSupported,
	PipBody,
	start: startPip,
	stop: stopPip,
} = useDocumentPictureInPicture()

const { handleShowMusicInPlaylist } = useAppStore()

const { copy } = useClipboard({ legacy: true })
const { toast } = useUiToast()
async function handleCopyMusicLink() {
	if (currentMusic.value) {
		const link = await makeHashActionLink({
			type: 'play-music',
			data: {
				musicSrc: currentMusic.value.src,
			},
		})
		if (link == null) {
			toast({
				title: 'Failed to create link',
				duration: 2000,
			})
			return
		}
		copy(link)
		toast({
			title: 'Link Copied!',
			duration: 2000,
		})
	}
}
</script>

<template>
	<PipBody>
		<template #placeholder>
			<div
				:class="pika({
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					width: '100%',
					height: '150px',
				})"
			>
				<button
					v-if="isSupported"
					data-toggle="true"
					:class="pika('icon-btn-toggle', {
						'--size': '48px',
						'@docpip': {
							display: 'none',
						},
					})"
					@click="stopPip()"
				>
					<div
						:class="pika('i-f7:rectangle-on-rectangle')"
					/>
				</button>
			</div>
		</template>

		<div
			:class="pika({
				'display': 'contents',

				'@docpip': ['theme', {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					width: '100%',
					height: '100dvh',
					padding: '16px',
				}],
			})"
		>
			<!-- #region Components -->
			<DefineControlButtons>
				<div
					:class="pika({
						'display': 'flex',
						'alignItems': 'center',
						'justifyContent': 'center',
						'gap': '16px',
						'width': '100%',

						'@screen * to 500': {
							gap: '8px',
						},
					})"
				>
					<UiTooltip>
						<template #trigger>
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
						</template>

						<template #content>
							{{ random === true ? 'Disable Random' : 'Enable Random' }}
						</template>
					</UiTooltip>
					<UiTooltip>
						<template #trigger>
							<button
								:class="pika('icon-btn', {
									'--size': '32px',
									'@screen * to 500': {
										'--size': '28px',
									},
								})"
								:disabled="currentMusic == null"
								@click="goPrevious()"
							>
								<div
									:class="pika('i-f7:backward-end-fill')"
								/>
							</button>
						</template>

						<template #content>
							Previous
						</template>
					</UiTooltip>
					<UiTooltip>
						<template #trigger>
							<button
								:class="pika('circle-icon-btn', {
									'--size': '48px',
									'@screen * to 500': {
										'--size': '32px',
									},
								})"
								:disabled="currentMusic == null"
								@click="togglePlay()"
							>
								<div
									:data-is-paused="isPaused"
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
					<UiTooltip>
						<template #trigger>
							<button
								:class="pika('icon-btn', {
									'--size': '32px',
									'@screen * to 500': {
										'--size': '28px',
									},
								})"
								:disabled="currentMusic == null"
								@click="goNext()"
							>
								<div
									:class="pika('i-f7:forward-end-fill')"
								/>
							</button>
						</template>

						<template #content>
							Next
						</template>
					</UiTooltip>
					<UiTooltip>
						<template #trigger>
							<button
								:data-state="repeated"
								:data-toggle="repeated !== 'off'"
								:class="pika('icon-btn-toggle', {
									'--size': '32px',
									'@screen * to 500': {
										'--size': '28px',
									},
								})"
								@click="toggleRepeated()"
							>
								<div
									:class="pika({
										'[data-state=repeat] > $': ['i-f7:repeat'],
										'[data-state=repeat-1] > $': ['i-f7:repeat-1'],
										'[data-state=off] > $': ['i-f7:repeat'],
									})"
								/>
							</button>
						</template>

						<template #content>
							{{ repeated === 'off' ? 'Enable Repeat All' : repeated === 'repeat' ? 'Enable Repeat One' : 'Disable Repeat' }}
						</template>
					</UiTooltip>
				</div>
			</DefineControlButtons>
			<DefinePlayingProgress>
				<div
					:class="pika({
						display: 'flex',
						flexDirection: 'column',
						gap: '4px',
						width: '100%',
						userSelect: 'none',
						touchAction: 'none',
					})"
				>
					<div
						:data-can-play="canPlay"
						:class="pika({
							'display': 'flex',
							'justifyContent': 'space-between',
							'width': '100%',

							'$[data-can-play=false]': {
								visibility: 'hidden',
							},
						})"
					>
						<div
							:class="pika({
								'fontSize': '12px',
								'color': 'var(--color-gray-5)',
								'@dark': {
									color: 'var(--color-gray-1)',
								},
							})"
						>
							{{ formatTime(currentTime) }}
						</div>
						<div
							:class="pika({
								'fontSize': '12px',
								'color': 'var(--color-gray-5)',
								'@dark': {
									color: 'var(--color-gray-1)',
								},
							})"
						>
							{{ formatTime(duration) }}
						</div>
					</div>
					<UiSlider
						v-model="currentTime"
						:max="duration"
						:step="0.1"
						:disabled="canPlay === false"
						aria-label="Playing Progress"
					/>
				</div>
			</DefinePlayingProgress>
			<DefineVolumeControl>
				<div
					:class="pika({
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						gap: '4px',
						height: '100%',
					})"
				>
					<div
						:class="pika({
							flex: '1 1 0',
							minHeight: '0',
						})"
					>
						<UiSlider
							v-model="volume"
							orientation="vertical"
							:max="1"
							:step="0.01"
							aria-label="Volume"
						/>
					</div>
					<button
						:data-volume="volumeLevel"
						:data-toggle="muted"
						:class="pika('icon-btn-toggle', { '--size': '32px' })"
						@click="toggleMuted()"
					>
						<div
							:class="pika({
								'[data-volume=mute] > $': ['i-f7:speaker-slash'],
								'[data-volume=low] > $': ['i-f7:speaker'],
								'[data-volume=medium] > $': ['i-f7:speaker-1'],
								'[data-volume=high] > $': ['i-f7:speaker-2'],
								'[data-volume=max] > $': ['i-f7:speaker-3'],
							})"
						/>
					</button>
				</div>
			</DefineVolumeControl>
			<!-- #endregion Components -->

			<div
				:data-music-loaded="currentMusic != null"
				:class="pika({
					'display': 'contents',

					'@docpip': ['card', {
						display: 'block',
						transform: 'scale(0.8)',
					}],
				})"
			>
				<div
					:class="pika({
						'display': 'flex',
						'gap': '16px',
						'width': '100%',
						'height': '150px',

						'@docpip': {
							minWidth: '450px',
						},

						'@screen * to 500': {
							height: '120px',
						},
					})"
				>
					<div
						:class="pika({
							display: 'flex',
							flexDirection: 'column',
							gap: '16px',
							flex: '1 1 0',
							minWidth: '0',
						})"
					>
						<!-- Header -->
						<div
							:class="pika({
								display: 'flex',
								alignItems: 'center',
								gap: '32px',
								width: '100%',
							})"
						>
							<div
								:class="pika({
									flex: '1 1 0',
									minWidth: '0',
									display: 'flex',
									alignItems: 'center',
									gap: '8px',
								})"
							>
								<button
									:data-liked="isMusicLiked(currentMusic?.src || '')"
									:class="pika('icon-btn', {
										'--size': '36px',
										'[data-music-loaded=false] $': { display: 'none' },
									})"
									@click="toggleMusicLike(currentMusic?.src || '')"
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
										flex: '1 1 0',
										minWidth: '0',
										display: 'flex',
										alignItems: 'center',
										fontSize: '24px',
										fontWeight: '200',
									})"
								>
									<UiMarquee
										v-if="currentMusic == null"
										:class="pika({ '[data-music-loaded=true] $': { display: 'none' } })"
									>
										Music Player
									</UiMarquee>
									<UiTooltip
										v-else
										:key="currentMusic?.title"
									>
										<template #trigger>
											<UiMarquee
												:class="pika({
													'cursor': 'pointer',
													'[data-music-loaded=false] $': { display: 'none' },
												})"
												:title="currentMusic?.title"
												role="button"
												@click="handleCopyMusicLink()"
											>
												{{ currentMusic?.title }}
											</UiMarquee>
										</template>
										<template #content>
											Copy Music Link
										</template>
									</UiTooltip>
								</div>
							</div>
							<div :class="pika({ display: 'flex', alignItems: 'center', gap: '0px', flexShrink: '0' })">
								<UiTooltip>
									<template #trigger>
										<button
											:class="pika('icon-btn', {
												'--size': '36px',
												'[data-music-loaded=false] $': { visibility: 'hidden' },
											})"
											@click="handleShowMusicInPlaylist()"
										>
											<div
												:class="pika('i-f7:compass')"
											/>
										</button>
									</template>

									<template #content>
										Show in Playlist
									</template>
								</UiTooltip>
								<UiTooltip>
									<template #trigger>
										<button
											v-if="isSupported"
											:class="pika('icon-btn', {
												'--size': '36px',
												'@docpip': {
													display: 'none',
												},
											})"
											@click="startPip({
												width: 480,
												height: 180,
											})"
										>
											<div
												:class="pika('i-f7:rectangle-on-rectangle')"
											/>
										</button>
									</template>

									<template #content>
										Open in Picture-in-Picture
									</template>
								</UiTooltip>
							</div>
						</div>
						<!-- Cover & Controls -->
						<div
							:class="pika({
								display: 'flex',
								gap: '16px',
								width: '100%',
								flex: '1 1 0',
								minHeight: '0',
							})"
						>
							<div
								:class="pika({
									'aspectRatio': '1 / 1',
									'height': '100%',
									'overflow': 'hidden',
									'borderRadius': '4px',
									'backgroundColor': 'var(--color-gray-2)',
									'@dark': {
										backgroundColor: 'var(--color-gray-5)',
									},
								})"
							>
								<div
									:class="pika({
										'display': 'flex',
										'alignItems': 'center',
										'justifyContent': 'center',
										'width': '100%',
										'height': '100%',
										'[data-music-loaded=true] $': { display: 'none' },
									})"
								>
									<div :class="pika('i-f7:music-note', { fontSize: '56px', color: 'var(--color-gray-3)' })" />
								</div>
								<img
									:src="currentMusic?.cover"
									:alt="currentMusic?.title"
									:title="currentMusic?.title"
									:class="pika({
										'width': '100%',
										'height': '100%',
										'[data-music-loaded=false] $': { display: 'none' },
									})"
								>
							</div>
							<div
								:class="pika({
									display: 'flex',
									flexDirection: 'column',
									justifyContent: 'center',
									alignItems: 'center',
									gap: '8px',
									flex: '1 1 0',
									minWidth: '0',
								})"
							>
								<ControlButtons />
								<PlayingProgress />
							</div>
						</div>
					</div>
					<!-- Volume Control -->
					<div
						:class="pika({
							'padding': '12px 2px',
							'borderRadius': '9999px',
							'backgroundColor': 'var(--color-gray-2)',
							'@dark': {
								backgroundColor: 'var(--color-gray-5)',
							},
						})"
					>
						<VolumeControl />
					</div>
				</div>
			</div>
		</div>
	</PipBody>
</template>
