<script setup lang="ts">
import type { CustomPlaylistId, HashActionImportSaveablePlaylist, Playlist, PlaylistId, SaveablePlaylistId } from '@/types'
import type { UiDropdownMenuItem } from './UiDropdownMenu.vue'
import EditPlaylistDialog from './EditPlaylistDialog.vue'

const props = defineProps<{
	playlistId: PlaylistId
}>()

const musicStore = useMusicStore()
const { getPlaylist, deletePlaylist, isCustomPlaylist, play, isMusicDisabled, saveMusicForOffline } = musicStore
const { offlineReadyMusics, offlineMusicDownloadingProgress } = storeToRefs(musicStore)

const playlist = computed(() => getPlaylist(props.playlistId)!)

const { dialog } = useAppDialog()
function handleStartEditPlaylist(playlistId: CustomPlaylistId) {
	dialog(EditPlaylistDialog, { playlistId })
}

const { confirm } = useUiConfirmDialog()

async function handleDeletePlaylist(playlistId: CustomPlaylistId) {
	const playlist = getPlaylist(playlistId)
	if (playlist == null)
		return

	if (await confirm({
		title: 'Delete Playlist',
		description: `Are you sure you want to delete the playlist "${playlist.title}"?`,
	})) {
		deletePlaylist(playlistId)
	}
}

const { copyLink } = useCopyLink()
async function handleCopyPlaylistLink(playlistId: PlaylistId) {
	const playlist = getPlaylist(playlistId)
	if (playlist == null)
		return

	const data: HashActionImportSaveablePlaylist = {
		type: 'import-saveable-playlist',
		data: playlist as Playlist<SaveablePlaylistId>,
	}

	const hash = dataToUrlHash(data)
	const link = `${window.location.origin}${import.meta.env.BASE_URL}import-playlist/${hash}`

	copyLink({
		link,
	})
}

const isReadyForOffline = computed(() => playlist.value.list.every(musicId => offlineReadyMusics.value.has(musicId)))
const isDownloading = computed(() => playlist.value.list.some(musicId => offlineMusicDownloadingProgress.value.has(musicId)))
const numOfDownloading = computed(() => playlist.value.list.filter(musicId => offlineMusicDownloadingProgress.value.has(musicId)).length)
const numOfDownloadable = computed(() => playlist.value.list.filter(musicId => !offlineReadyMusics.value.has(musicId) && !offlineMusicDownloadingProgress.value.has(musicId)).length)
const downloadStatusLabel = computed(() => {
	if (isReadyForOffline.value)
		return 'Ready for Offline'
	if (isDownloading.value) {
		return `Downloading ${numOfDownloading.value} Music${numOfDownloading.value > 1 ? 's' : ''}`
	}
	return `Download for Offline (${numOfDownloadable.value} Music${numOfDownloadable.value > 1 ? 's' : ''})`
})
const isOnline = useOnline()
const menuItems = computed<UiDropdownMenuItem[]>(() => [
	{
		icon: pika('i-f7:play'),
		label: 'Play',
		disabled: playlist.value.list.every(isMusicDisabled),
		onSelect: () => play(props.playlistId),
	},
	...(isCustomPlaylist(props.playlistId)
		? [
				{
					icon: pika('i-f7:pencil'),
					label: 'Edit Playlist',
					onSelect: () => handleStartEditPlaylist(props.playlistId as CustomPlaylistId),
				},
				{
					icon: pika('i-f7:trash'),
					label: 'Delete Playlist',
					onSelect: () => handleDeletePlaylist(props.playlistId as CustomPlaylistId),
				},
			]
		: []),
	...(isCustomPlaylist(props.playlistId) || props.playlistId === 'liked'
		? [

				{
					icon: pika('i-f7:link'),
					label: 'Copy Link',
					onSelect: () => handleCopyPlaylistLink(props.playlistId),
				},
				{
					// download for offline
					icon: isReadyForOffline.value ? pika('i-f7:checkmark-circle') : pika('i-f7:cloud-download'),
					label: downloadStatusLabel.value,
					onSelect: (event: Event) => {
						if (isReadyForOffline.value || isDownloading.value)
							return
						event.preventDefault()
						playlist.value.list.forEach(saveMusicForOffline)
					},
					disabled: isReadyForOffline.value || isDownloading.value || (isOnline.value === false),
				},
			]
		: []),
])
</script>

<template>
	<UiDropdownMenu
		:items="menuItems"
	>
		<template #trigger>
			<button
				:class="pika('icon-btn')"
				v-bind="$attrs"
				@click.stop
			>
				<div
					:class="pika('i-f7:ellipsis-vertical', { '@screen-md-and-up': ['i-f7:ellipsis'] })"
				/>
			</button>
		</template>
	</UiDropdownMenu>
</template>
