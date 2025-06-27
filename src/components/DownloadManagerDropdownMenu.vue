<script setup lang="ts">
import type { MusicData } from '@/types'

const musicStore = useMusicStore()
const { getMusicData, removeSavedOfflineMusic, cancelOfflineMusicDownload } = musicStore
const { offlineReadyMusics, offlineMusicDownloadingProgress } = storeToRefs(musicStore)

interface DownloadItem {
	music: MusicData
	progress: number | 'pending' | 'done'
}

const items = computed<DownloadItem[]>(() => {
	return [
		...Array.from(offlineMusicDownloadingProgress.value.entries(), ([id, progress]) => ({
			music: getMusicData(id)!,
			progress,
		})),
		...Array.from(offlineReadyMusics.value.values(), id => ({
			music: getMusicData(id)!,
			progress: 'done' as const,
		})),
	] satisfies DownloadItem[]
})
</script>

<template>
	<UiDropdownMenu v-if="items.length > 0">
		<template #trigger>
			<button
				:class="pika('icon-btn')"
				v-bind="$attrs"
				@click.stop
			>
				<div
					:class="pika('i-f7:arrow-down-to-line')"
				/>
			</button>
		</template>

		<template #menu>
			<div
				:class="pika({
					maxHeight: '50dvh',
					borderRadius: '16px',
					overflow: 'hidden',
				})"
			>
				<UiVerticalList
					:items="items"
					:itemHeight="72"
				>
					<template #item="{ item }">
						<div
							:class="pika({
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								width: '300px',
								height: '72px',
								paddingRight: '12px',
							})"
						>
							<MusicPlayerThumbnail
								:class="pika({ width: '56px' })"
								:music="item.music"
							/>

							<div
								:class="pika({
									display: 'flex',
									flexDirection: 'column',
									flex: '1 1 0',
									minWidth: '0',
								})"
							>
								<UiMarquee>
									{{ item.music.title }}
								</UiMarquee>
								<div
									:class="pika({
										display: 'flex',
										alignItems: 'center',
										gap: '4px',
										width: '100%',
									})"
								>
									<div
										v-if="item.progress !== 'done' && item.progress !== 'pending'"
										:class="pika({
											flex: '1 1 0',
											minWidth: '0',
										})"
									>
										<UiProgress
											:value="item.progress"
										/>
									</div>

									<span
										:class="pika({
											lineHeight: '16px',
											fontSize: '10px',
											opacity: '0.5',
										})"
									>
										{{ item.progress === 'done' ? 'Done' : item.progress === 'pending' ? 'Pending' : `${item.progress}%` }}
									</span>
								</div>
							</div>

							<div
								:class="pika({
									display: 'flex',
									alignItems: 'center',
								})"
							>
								<button
									v-if="offlineReadyMusics.has(item.music.id)"
									:class="pika('icon-btn')"
									@click.stop="removeSavedOfflineMusic(item.music.id)"
								>
									<div
										:class="pika('i-f7:trash')"
									/>
								</button>
								<button
									v-if="offlineMusicDownloadingProgress.has(item.music.id)"
									:class="pika('icon-btn')"
									@click.stop="cancelOfflineMusicDownload(item.music.id)"
								>
									<div
										:class="pika('i-f7:trash')"
									/>
								</button>
							</div>
						</div>
					</template>
				</UiVerticalList>
			</div>
		</template>
	</UiDropdownMenu>
</template>
