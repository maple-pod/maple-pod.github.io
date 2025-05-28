<script setup lang="ts">
import type { PlaylistId } from '@/types'
import type { UiDropdownMenuItem } from './UiDropdownMenu.vue'
import CreatePlaylistDialog from '@/components/CreatePlaylistDialog.vue'

const props = defineProps<{
	playlistId: PlaylistId
	musicSrc: string
}>()

const musicStore = useMusicStore()
const { likedPlaylist, savedPlaylists } = storeToRefs(musicStore)
const { toggleMusicInPlaylist, isAddedInPlaylist, getPlayMusicLink } = musicStore

const { dialog } = useAppDialog()
function handleStartCreatePlaylist() {
	return dialog(CreatePlaylistDialog, {})
}

const { handleShowMusicInPlaylist } = useAppStore()

const { copyLink } = useCopyLink()
function handleCopyMusicLink(musicSrc: string) {
	copyLink({
		link: getPlayMusicLink(musicSrc),
	})
}

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
					toggleMusicInPlaylist('liked', props.musicSrc)
				},
			},
			...savedPlaylists.value.map(playlist => ({
				icon: isAddedInPlaylist(playlist.id, props.musicSrc)
					? pika('i-f7:bookmark-fill')
					: pika('i-f7:bookmark'),
				label: playlist.title,
				onSelect: (event: Event) => {
					event.preventDefault()
					toggleMusicInPlaylist(playlist.id, props.musicSrc)
				},
			})),
		],
	},
	{
		icon: pika('i-f7:compass'),
		label: 'Show in "All"',
		onSelect: () => handleShowMusicInPlaylist(props.musicSrc, 'all'),
	},
	{
		icon: pika('i-f7:link'),
		label: 'Copy Link',
		onSelect: () => handleCopyMusicLink(props.musicSrc),
	},
])
</script>

<template>
	<UiDropdownMenu
		:items="menuItems"
	>
		<template #trigger>
			<button
				:class="pika('icon-btn', {
					'@screen-md-and-up': {
						':not(:has([id^=reka-dropdown-menu-trigger-][data-state=open])):not(:hover) $': { visibility: 'hidden' },
					},
				})"
				@click.stop
			>
				<div
					:class="pika('i-f7:ellipsis-vertical', { '@screen-md-and-up': ['i-f7:ellipsis'] })"
				/>
			</button>
		</template>
	</UiDropdownMenu>
</template>
