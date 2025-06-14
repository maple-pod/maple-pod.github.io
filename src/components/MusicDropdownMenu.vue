<script setup lang="ts">
import type { PlaylistId } from '@/types'
import type { UiDropdownMenuItem } from './UiDropdownMenu.vue'
import CreatePlaylistDialog from '@/components/CreatePlaylistDialog.vue'

const props = defineProps<{
	playlistId: PlaylistId
	musicId: string
}>()

const musicStore = useMusicStore()
const { likedPlaylist, savedPlaylists, offlineReadyMusics } = storeToRefs(musicStore)
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
		label: isReadyForOffline.value ? 'Downloaded for Offline' : 'Download for Offline',
		onSelect: () => isReadyForOffline.value ? undefined : saveMusicForOffline(props.musicId),
		disabled: isReadyForOffline.value,
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
