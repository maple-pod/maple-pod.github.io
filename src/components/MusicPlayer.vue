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
					:style="{
						'--size': '48px',
					}"
					:class="pika('icon-btn-toggle', {
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
					<button
						:data-state="random"
						:data-toggle="random"
						:class="pika('icon-btn-toggle', {
							'--size': '32px',

							'@screen * to 500': {
								'--size': '24px',
							},
						})"
						:disabled="currentMusic == null"
						@click="toggleRandom()"
					>
						<div
							:class="pika('i-f7:shuffle')"
						/>
					</button>
					<button
						:class="pika('icon-btn', {
							'--size': '32px',

							'@screen * to 500': {
								'--size': '24px',
							},
						})"
						:disabled="currentMusic == null"
						@click="goPrevious()"
					>
						<div
							:class="pika('i-f7:backward-end-fill')"
						/>
					</button>
					<button
						:style="{
							'--size': '48px',
						}"
						:class="pika('circle-icon-btn')"
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
					<button
						:style="{
							'--size': '32px',
						}"
						:class="pika('icon-btn')"
						:disabled="currentMusic == null"
						@click="goNext()"
					>
						<div
							:class="pika('i-f7:forward-end-fill')"
						/>
					</button>
					<button
						:data-state="repeated"
						:data-toggle="repeated !== 'off'"
						:style="{
							'--size': '32px',
						}"
						:class="pika('icon-btn-toggle')"
						:disabled="currentMusic == null"
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
						:style="{
							'--visibility': canPlay ? 'visible' : 'hidden',
						}"
						:class="pika({
							display: 'flex',
							justifyContent: 'space-between',
							width: '100%',
							visibility: 'var(--visibility)',
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
						:style="{
							'--size': '32px',
						}"
						:class="pika('icon-btn-toggle')"
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
						'maxWidth': '600px',
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
							gap: '4px',
							flex: '1 1 0',
							minWidth: '0',
						})"
					>
						<!-- Header -->
						<div
							:class="pika({
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								width: '100%',
							})"
						>
							<button
								v-if="isSupported"
								:style="{
									'--size': '36px',
								}"
								:class="pika('icon-btn', {
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
							<div
								:class="pika({
									display: 'flex',
									alignItems: 'center',
									gap: '4px',
									maxWidth: '250px',
									fontSize: '24px',
									fontWeight: '200',
									whiteSpace: 'nowrap',
									textOverflow: 'ellipsis',
									overflow: 'hidden',
								})"
								:title="currentMusic?.title"
							>
								<span :class="pika({ '[data-music-loaded=true] $': { display: 'none' } })">Music Player</span>
								<span :class="pika({ '[data-music-loaded=false] $': { display: 'none' } })">{{ currentMusic?.title }}</span>
							</div>
							<button
								:data-liked="isMusicLiked(currentMusic?.source || '')"
								:style="{
									'--size': '36px',
								}"
								:class="pika('icon-btn', { '[data-music-loaded=false] $': { visibility: 'hidden' } })"
								@click="toggleMusicLike(currentMusic?.source || '')"
							>
								<div
									:class="pika({
										'[data-liked=true] $': ['i-f7:heart-fill', { color: 'var(--color-primary-1)' }],
										'[data-liked=false] $': ['i-f7:heart'],
									})"
								/>
							</button>
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
