<script setup lang="ts">
import { useDocumentPictureInPicture } from '@/composables/useDocumentPictureInPicture'

const musicStore = useMusicStore()
const {
	currentPlaylist,
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

const shortcutBlockingSelector = [
	'a[href]',
	'button',
	'input',
	'select',
	'summary',
	'textarea',
	'[contenteditable]:not([contenteditable=\"false\"])',
	'[role=\"button\"]',
	'[role=\"checkbox\"]',
	'[role=\"combobox\"]',
	'[role=\"menuitem\"]',
	'[role=\"option\"]',
	'[role=\"radio\"]',
	'[role=\"slider\"]',
	'[role=\"switch\"]',
	'[role=\"tab\"]',
	'[tabindex]:not([tabindex=\"-1\"])',
].join(',')

function shouldHandlePlaybackShortcut(event: KeyboardEvent) {
	if (
		event.defaultPrevented
		|| event.repeat
		|| event.altKey
		|| event.ctrlKey
		|| event.metaKey
		|| event.shiftKey
	) {
		return false
	}

	const target = event.target
	if (!(target instanceof HTMLElement))
		return true
	if (target.isContentEditable)
		return false

	return target.closest(shortcutBlockingSelector) == null
}

useEventListener(
	'keydown',
	(event) => {
		if (event.key !== ' ' || canPlay.value === false || shouldHandlePlaybackShortcut(event) === false)
			return

		event.preventDefault()
		togglePlay()
	},
)

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
			link: getPlayMusicLink(currentMusic.value.id),
		})
	}
}

const currentMusicLiked = computed(() => currentMusic.value != null && isMusicLiked(currentMusic.value.id))
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
					height: '120px',
				})"
			>
				<UiIconButton
					label="Close Picture-in-Picture"
					data-toggle="true"
					:class="pika({ '--size': '64px' })"
					target="compact"
					toggle
					@click="stopPip()"
				>
					<div :class="pika('i-f7:rectangle-on-rectangle')" />
				</UiIconButton>
			</div>
		</template>

		<div
			:class="pika({
				'display': 'contents',

				'@docpip': {
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					width: '100%',
					height: '100dvh',
					padding: '16px',
				},
			})"
		>
			<div
				:data-music-loaded="currentMusic != null"
				:class="pika({
					'display': 'contents',

					'@docpip': ['card', {
						display: 'block',
						transform: 'scale(0.8)',
						width: '100%',
						minWidth: '400px',
						maxWidth: '640px',
					}],
				})"
			>
				<div
					:class="pika({
						width: '100%',
						height: '150px',
						container: 'music-player / inline-size',
					})"
				>
					<div
						:class="pika({
							'display': 'grid',
							'gridTemplateColumns': '42px 1fr 42px',
							'gridTemplateRows': 'auto auto',
							'gap': '12px',
							'width': '100%',
							'height': '100%',

							'@container music-player 420 to *': {
								gridTemplateColumns: '56px 1fr 56px',
							},

							'@container music-player 640 to *': {
								gridTemplateColumns: '72px 1fr 72px',
							},
						})"
					>
						<!-- Header -->
						<div
							:class="pika({
								'gridColumn': '2 / 4',
								'gridRow': '1 / 2',
								'display': 'flex',
								'alignItems': 'center',
								'gap': '32px',
								'width': '100%',
								'paddingRight': '52px',
								'@container music-player 420 to *': {
									gridColumn: '1 / 4',
								},
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
								<UiIconButton
									label="Like Current Track"
									:tooltip="currentMusicLiked ? 'Unlike Current Track' : 'Like Current Track'"
									:pressed="currentMusicLiked"
									:data-liked="currentMusicLiked"
									:class="pika({ '[data-music-loaded=false] $': { display: 'none' } })"
									target="compact"
									@click="toggleMusicLike(currentMusic?.id || '')"
								>
									<div
										:class="pika({
											'[data-liked=true] $': ['i-f7:heart-fill', { color: 'var(--color-action-primary)' }],
											'[data-liked=false] $': ['i-f7:heart'],
										})"
									/>
								</UiIconButton>
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
										:key="currentMusic.title"
										:title="currentMusic.title"
									>
										{{ currentMusic.title }}
									</UiMarquee>
								</div>
							</div>
							<MusicPlayerActionButtons
								:currentPlaylistId="currentPlaylist?.id"
								:currentMusic="currentMusic"
								:isPipSupported="isPipSupported"
								:isPipActive="isPipActive"
								@copyMusicLink="handleCopyMusicLink()"
								@showMusicInPlaylist="handleShowMusicInPlaylist()"
								@startPip="startPip({ width: 480, height: 180 })"
							/>
						</div>
						<div
							:class="pika({
								'gridColumn': '1 / 2',
								'gridRow': '1 / 2',
								'display': 'flex',
								'alignItems': 'center',

								'@container music-player 420 to *': {
									gridRow: '2 / 3',
								},
							})"
						>
							<MusicPlayerThumbnail
								:class="pika({
									width: '100%',
								})"
								:music="currentMusic"
							/>
						</div>
						<div
							:class="pika({
								'gridColumn': '1 / 3',
								'gridRow': '2 / 3',
								'display': 'flex',
								'justifyContent': 'center',
								'@container music-player 420 to *': {
									gridColumn: '2 / 3',
								},
							})"
						>
							<div
								:class="pika({
									'display': 'flex',
									'flexDirection': 'column',
									'justifyContent': 'center',
									'alignItems': 'center',
									'width': '100%',
									'gap': '8px',

									'@container music-player 420 to *': {
										gap: '4px',
										maxWidth: '480px',
									},

									'@container music-player 640 to *': {
										gap: '8px',
									},
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
						<!-- Volume Control -->
						<div
							:class="pika({
								gridColumn: '3 / 4',
								gridRow: '1 / 3',
								display: 'flex',
								justifyContent: 'end',
							})"
						>
							<MusicPlayerVolume
								v-model:volume="volume"
								:muted
								@toggleMuted="toggleMuted"
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	</PipBody>
</template>
