<script setup lang="ts">
import type { CustomPlaylistId, PlaylistId } from '@/types'
import type { UiDropdownMenuItem } from './UiDropdownMenu.vue'
import EditPlaylistDialog from './EditPlaylistDialog.vue'

const props = defineProps<{
	playlistId: PlaylistId
}>()

const musicStore = useMusicStore()
const { getPlaylist, deletePlaylist, isCustomPlaylist, play } = musicStore

const { dialog } = useAppDialog()
function handleStartEditPlaylist(playlistId: CustomPlaylistId) {
	const playlist = getPlaylist(playlistId)
	if (playlist == null)
		return
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

const menuItems = computed<UiDropdownMenuItem[]>(() => [
	{
		icon: pika('i-f7:play'),
		label: 'Play',
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
])
</script>

<template>
	<UiDropdownMenu
		:items="menuItems"
	>
		<template #trigger>
			<button
				:class="pika('icon-btn', {
					'@screen 769 to *': {
						':not(:has([id^=reka-dropdown-menu-trigger-][data-state=open])):not(:hover) $': { visibility: 'hidden' },
					},
				})"
				@click.stop
			>
				<div
					:class="pika({
						'$': ['i-f7:ellipsis-vertical'],
						'@screen 769 to *': ['i-f7:ellipsis'],
					})"
				/>
			</button>
		</template>
	</UiDropdownMenu>
</template>
