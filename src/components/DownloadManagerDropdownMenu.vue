<script setup lang="ts">
import type { MusicData } from '@/types'

const musicStore = useMusicStore()
const { getMusicData, removeSavedOfflineMusic, cancelOfflineMusicDownload } = musicStore
const { offlineReadyMusics, offlineMusicDownloadingProgress } = storeToRefs(musicStore)
const {
	manifest: worldMapManifest,
	status: worldMapOfflineStatus,
	progress: worldMapOfflineProgress,
	downloadAll: downloadWorldMapsForOffline,
	cancel: cancelWorldMapDownload,
	remove: removeWorldMapsOffline,
} = useWorldMapOffline()
const isOnline = useOnline()

interface MusicDownloadItem {
	kind: 'music'
	music: MusicData
	progress: number | 'idle' | 'pending' | 'done' | 'error'
}

interface WorldMapDownloadItem {
	kind: 'world-map'
	progress: number | 'idle' | 'pending' | 'done' | 'error'
}

type DownloadItem = MusicDownloadItem | WorldMapDownloadItem

const worldMapDownloadProgress = computed<WorldMapDownloadItem['progress']>(() => {
	if (worldMapOfflineStatus.value === 'ready')
		return 'done'
	if (worldMapOfflineStatus.value === 'error')
		return 'error'
	if (worldMapOfflineStatus.value === 'idle')
		return 'idle'
	if (worldMapOfflineProgress.value == null || worldMapOfflineProgress.value.total === 0)
		return 'pending'
	return Math.round((worldMapOfflineProgress.value.completed / worldMapOfflineProgress.value.total) * 100)
})

const items = computed<DownloadItem[]>(() => {
	return [
		...(worldMapManifest.value == null
			? []
			: [{
					kind: 'world-map' as const,
					progress: worldMapDownloadProgress.value,
				}]),
		...Array.from(offlineMusicDownloadingProgress.value.entries(), ([id, progress]) => ({
			kind: 'music' as const,
			music: getMusicData(id)!,
			progress,
		})),
		...Array.from(offlineReadyMusics.value.values(), id => ({
			kind: 'music' as const,
			music: getMusicData(id)!,
			progress: 'done' as const,
		})),
	] satisfies DownloadItem[]
})
</script>

<template>
	<UiDropdownMenu
		v-if="items.length > 0"
		triggerTooltip="Downloads"
	>
		<template #trigger>
			<button
				:class="pika('icon-btn')"
				aria-label="Downloads"
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
							<div
								v-if="item.kind === 'world-map'"
								:class="pika({ display: 'grid', placeItems: 'center', flex: '0 0 auto', width: '56px', height: '56px', borderRadius: '12px', backgroundColor: 'var(--color-secondary-1)', color: 'var(--color-text-primary)' })"
								aria-hidden="true"
							>
								<div :class="pika('i-f7:map', { fontSize: '24px' })" />
							</div>
							<MusicPlayerThumbnail
								v-else
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
								<UiMarquee v-if="item.kind === 'music'">
									{{ item.music.title }}
								</UiMarquee>
								<div v-else>
									World Map
								</div>
								<div
									:class="pika({
										display: 'flex',
										alignItems: 'center',
										gap: '4px',
										width: '100%',
									})"
								>
									<div
										v-if="typeof item.progress === 'number'"
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
										{{ item.progress === 'done' ? 'Done' : item.progress === 'pending' ? 'Pending' : item.progress === 'error' ? 'Error' : item.progress === 'idle' ? 'Download' : `${item.progress}%` }}
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
									v-if="item.kind === 'world-map' && worldMapOfflineStatus === 'ready'"
									:class="pika('icon-btn')"
									aria-label="Remove World Map offline download"
									@click.stop="removeWorldMapsOffline"
								>
									<div :class="pika('i-f7:trash')" />
								</button>
								<button
									v-else-if="item.kind === 'world-map' && worldMapOfflineStatus === 'downloading'"
									:class="pika('icon-btn')"
									aria-label="Cancel World Map offline download"
									@click.stop="cancelWorldMapDownload"
								>
									<div :class="pika('i-f7:xmark')" />
								</button>
								<button
									v-else-if="item.kind === 'world-map'"
									:class="pika('icon-btn')"
									aria-label="Download World Map for offline"
									:disabled="isOnline === false"
									@click.stop="downloadWorldMapsForOffline"
								>
									<div :class="pika('i-f7:cloud-download')" />
								</button>
								<template v-else>
									<button
										v-if="offlineReadyMusics.has(item.music.id)"
										:class="pika('icon-btn')"
										:aria-label="`Remove ${item.music.title} offline download`"
										@click.stop="removeSavedOfflineMusic(item.music.id)"
									>
										<div
											:class="pika('i-f7:trash')"
										/>
									</button>
									<button
										v-else-if="offlineMusicDownloadingProgress.has(item.music.id)"
										:class="pika('icon-btn')"
										:aria-label="`Cancel ${item.music.title} offline download`"
										@click.stop="cancelOfflineMusicDownload(item.music.id)"
									>
										<div
											:class="pika('i-f7:trash')"
										/>
									</button>
								</template>
							</div>
						</div>
					</template>
				</UiVerticalList>
			</div>
		</template>
	</UiDropdownMenu>
</template>
