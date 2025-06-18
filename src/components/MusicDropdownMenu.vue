<script setup lang="ts">
import type { PlaylistId } from '@/types'
import type { UiDropdownMenuItem } from './UiDropdownMenu.vue'
import CreatePlaylistDialog from '@/components/CreatePlaylistDialog.vue'

const props = defineProps<{
	playlistId: PlaylistId
	musicId: string
}>()

const musicStore = useMusicStore()
const { likedPlaylist, savedPlaylists, offlineReadyMusics, offlineMusicDownloadingProgress } = storeToRefs(musicStore)
const { toggleMusicInPlaylist, isAddedInPlaylist, getPlayMusicLink, saveMusicForOffline } = musicStore

const { dialog } = useAppDialog()
function handleStartCreatePlaylist() {
	return dialog(CreatePlaylistDialog, {})
}

const { handleShowMusicInPlaylist } = useAppStore()

const { copyLink } = useCopyLink()
function handleCopyMusicLink(musicId: string) {
	copyLink({
		link: getPlayMusicLink(musicId),
	})
}

const isReadyForOffline = computed(() => offlineReadyMusics.value.has(props.musicId))
const isDownloading = computed(() => offlineMusicDownloadingProgress.value.has(props.musicId))
const downloadingProgress = computed(() => offlineMusicDownloadingProgress.value.get(props.musicId) ?? null)
const downloadStatusLabel = computed(() => {
	if (isReadyForOffline.value)
		return 'Ready for Offline'
	if (isDownloading.value) {
		return downloadingProgress.value === 'pending'
			? 'Pending for Download'
			: `Downloading ${downloadingProgress.value}%`
	}
	return 'Download for Offline'
})

const menuItems = computed<UiDropdownMenuItem[]>(() => [
	{
		icon: pika('i-f7:music-note-list'),
		label: 'Playlists',
		items: [
			{
				icon: pika('i-f7:plus'),
				label: 'New Playlist',
				onSelect: handleStartCreatePlaylist,
			},
			'separator',
			{
				icon: pika('i-f7:heart'),
				label: likedPlaylist.value.title,
				onSelect: (event) => {
					event.preventDefault()
					toggleMusicInPlaylist('liked', props.musicId)
				},
			},
			...savedPlaylists.value.map(playlist => ({
				icon: isAddedInPlaylist(playlist.id, props.musicId)
					? pika('i-f7:bookmark-fill')
					: pika('i-f7:bookmark'),
				label: playlist.title,
				onSelect: (event: Event) => {
					event.preventDefault()
					toggleMusicInPlaylist(playlist.id, props.musicId)
				},
			})),
		],
	},
	{
		icon: pika('i-f7:compass'),
		label: 'Show in "All"',
		onSelect: () => handleShowMusicInPlaylist(props.musicId, 'all'),
	},
	{
		icon: pika('i-f7:link'),
		label: 'Copy Link',
		onSelect: () => handleCopyMusicLink(props.musicId),
	},
	{
		// download for offline
		icon: isReadyForOffline.value ? pika('i-f7:checkmark-circle') : pika('i-f7:cloud-download'),
		label: downloadStatusLabel.value,
		onSelect: (event: Event) => {
			if (isReadyForOffline.value || isDownloading.value)
				return
			event.preventDefault()
			saveMusicForOffline(props.musicId)
		},
		disabled: isReadyForOffline.value || isDownloading.value,
	},
])
</script>

<template>
	<UiDropdownMenu
		:items="menuItems"
	>
		<template #trigger>
			<slot name="trigger">
				<button
					:class="pika('icon-btn')"
					@click.stop
				>
					<div
						:class="pika('i-f7:ellipsis-vertical', { '@screen-md-and-up': ['i-f7:ellipsis'] })"
					/>
				</button>
			</slot>
		</template>
	</UiDropdownMenu>
</template>
