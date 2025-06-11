<script setup lang="ts">
import type { CustomPlaylistId, HashActionImportSaveablePlaylist, Playlist, PlaylistId, SaveablePlaylistId } from '@/types'
import type { UiDropdownMenuItem } from './UiDropdownMenu.vue'
import EditPlaylistDialog from './EditPlaylistDialog.vue'

const props = defineProps<{
	playlistId: PlaylistId
}>()

const musicStore = useMusicStore()
const { getPlaylist, deletePlaylist, isCustomPlaylist, play, isMusicDisabled } = musicStore

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
	let link = `${window.location.origin}${import.meta.env.BASE_URL}import-playlist/${hash}`

	const recordId = await createRecord(hash)
	if (recordId != null) {
		link = `${window.location.origin}${import.meta.env.BASE_URL}import-playlist/?recordId=${recordId}`
	}

	copyLink({
		link,
	})
}

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
