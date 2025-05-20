<script setup lang="ts">
import type { CustomPlaylistId, PlaylistId } from '@/composables/useMusicStore'
import {
	DropdownMenuItem,
} from 'reka-ui'

defineProps<{
	playlistId: PlaylistId
}>()

const musicStore = useMusicStore()
const { getPlaylist, deletePlaylist, isCustomPlaylist, play } = musicStore

const EditPlaylistDialogPromise = createTemplatePromise<void, [CustomPlaylistId]>()
function handleEditPlaylist(playlistId: CustomPlaylistId) {
	const playlist = getPlaylist(playlistId)
	if (playlist == null)
		return
	return EditPlaylistDialogPromise.start(playlistId)
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
</script>

<template>
	<UiDropdownMenu>
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

			<EditPlaylistDialogPromise
				v-if="isCustomPlaylist(playlistId)"
				v-slot="{ resolve }"
			>
				<EditPlaylistDialog
					:playlistId
					:defaultOpen="true"
					@close="resolve()"
				/>
			</EditPlaylistDialogPromise>
		</template>

		<DropdownMenuItem
			:class="pika('hover-mask', {
				'display': 'flex',
				'alignItems': 'center',
				'gap': '8px',
				'padding': '8px',
				'cursor': 'pointer',
				'$::before': {
					borderRadius: '4px',
				},
			})"
			@click="play(playlistId)"
		>
			<div :class="pika('i-f7:play')" />
			<span :class="pika({ fontSize: '14px' })">Play</span>
		</DropdownMenuItem>

		<DropdownMenuItem
			v-if="isCustomPlaylist(playlistId)"
			:class="pika('hover-mask', {
				'display': 'flex',
				'alignItems': 'center',
				'gap': '8px',
				'padding': '8px',
				'cursor': 'pointer',
				'$::before': {
					borderRadius: '4px',
				},
			})"
			@click="handleEditPlaylist(playlistId)"
		>
			<div :class="pika('i-f7:pencil')" />
			<span :class="pika({ fontSize: '14px' })">Edit Playlist</span>
		</DropdownMenuItem>

		<DropdownMenuItem
			v-if="isCustomPlaylist(playlistId)"
			:class="pika('hover-mask', {
				'display': 'flex',
				'alignItems': 'center',
				'gap': '8px',
				'padding': '8px',
				'cursor': 'pointer',
				'$::before': {
					borderRadius: '4px',
				},
			})"
			@click="handleDeletePlaylist(playlistId)"
		>
			<div :class="pika('i-f7:trash')" />
			<span :class="pika({ fontSize: '14px' })">Delete Playlist</span>
		</DropdownMenuItem>
	</UiDropdownMenu>
</template>
