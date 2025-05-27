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
	getPlayMusicLink,
} = musicStore

const {
	isSupported: isPipSupported,
	isActive: isPipActive,
	PipBody,
	start: startPip,
	stop: stopPip,
} = useDocumentPictureInPicture()

const { handleShowMusicInPlaylist } = useAppStore()

const { copyLink } = useCopyLink()
function handleCopyMusicLink() {
	if (currentMusic.value) {
		copyLink({
			link: getPlayMusicLink(currentMusic.value.src),
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
					data-toggle="true"
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
			<div
				:data-music-loaded="currentMusic != null"
				:class="pika({
					'display': 'contents',

					'@docpip': ['card', {
						display: 'block',
						transform: 'scale(0.8)',
						width: '450px',
					}],
				})"
			>
				<div
					:class="pika({
						display: 'flex',
						gap: '16px',
						width: '100%',
						height: '120px',
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
									>
										Music Player
									</UiMarquee>
									<UiMarquee
										v-else
										:title="currentMusic.title"
									>
										{{ currentMusic.title }}
									</UiMarquee>
								</div>
							</div>
							<MusicPlayerActionButtons
								:currentMusic="currentMusic"
								:isPipSupported="isPipSupported"
								:isPipActive="isPipActive"
								@copyMusicLink="handleCopyMusicLink()"
								@showMusicInPlaylist="handleShowMusicInPlaylist()"
								@startPip="startPip({ width: 480, height: 180 })"
							/>
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
							<MusicPlayerThumbnail
								:currentMusic="currentMusic"
							/>
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
								<MusicPlayerControlButtons
									:currentMusic="currentMusic"
									:isPaused="isPaused"
									:random="random"
									:repeated="repeated"
									@togglePlay="togglePlay"
									@goPrevious="goPrevious"
									@goNext="goNext"
									@toggleRandom="toggleRandom"
									@toggleRepeated="toggleRepeated"
								/>
								<MusicPlayerProgress
									v-model:currentTime="currentTime"
									:duration
									:canPlay
								/>
							</div>
						</div>
					</div>
					<!-- Volume Control -->
					<MusicPlayerVolume
						v-model:volume="volume"
						:muted
						@toggleMuted="toggleMuted"
					/>
				</div>
			</div>
		</div>
	</PipBody>
</template>
