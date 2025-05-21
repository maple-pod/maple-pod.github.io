<script setup lang="ts">
import type { PlaylistId } from '@/types'
import {
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from 'reka-ui'

defineProps<{
	playlistId: PlaylistId
	musicSrc: string
}>()

const musicStore = useMusicStore()
const { savedPlaylists } = storeToRefs(musicStore)
const { toggleMusicInPlaylist, isAddedInPlaylist } = musicStore

const CreatePlaylistDialogPromise = createTemplatePromise<void>()

const { handleShowMusicInPlaylist } = useAppStore()
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

			<CreatePlaylistDialogPromise v-slot="{ resolve }">
				<CreatePlaylistDialog
					:defaultOpen="true"
					@close="resolve()"
				/>
			</CreatePlaylistDialogPromise>
		</template>

		<DropdownMenuSub>
			<DropdownMenuSubTrigger
				:class="pika('hover-mask', {
					'display': 'flex',
					'alignItems': 'center',
					'justifyContent': 'space-between',
					'gap': '32px',
					'padding': '8px',
					'cursor': 'pointer',

					'$::before': {
						borderRadius: '4px',
					},

					'$[id^=reka-menu-sub-trigger][data-state=open]::before': {
						opacity: '0.1',
					},
				})"
			>
				<span :class="pika({ fontSize: '14px' })">Add to / Remove from Playlist</span>

				<div :class="pika('i-f7:chevron-right')" />
			</DropdownMenuSubTrigger>
			<DropdownMenuPortal>
				<DropdownMenuSubContent
					:class="pika('theme', 'card', {
						padding: '8px',
						minWidth: '200px',
						borderRadius: '4px',
						zIndex: 2,
					})"
				>
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
						@click="CreatePlaylistDialogPromise.start()"
					>
						<div :class="pika('i-f7:plus')" />
						<span :class="pika({ fontSize: '14px' })">Create Playlist</span>
					</DropdownMenuItem>

					<DropdownMenuSeparator
						:class="pika({
							margin: '4px',
							borderBottom: '1px solid var(--color-gray-3)',
						})"
					/>

					<DropdownMenuItem
						v-for="playlist in savedPlaylists"
						:key="playlist.id"
						:class="pika('hover-mask', {
							'display': 'flex',
							'alignItems': 'center',
							'justifyContent': 'space-between',
							'gap': '32px',
							'padding': '8px',
							'cursor': 'pointer',

							'$::before': {
								borderRadius: '4px',
							},
						})"
						@click="toggleMusicInPlaylist(playlist.id, musicSrc)"
						@select.prevent
					>
						<span :class="pika({ fontSize: '14px' })">{{ playlist.title }}</span>
						<div
							v-if="isAddedInPlaylist(playlist.id, musicSrc)"
							:class="pika('i-f7:checkmark', { color: 'var(--color-primary-1)' })"
						/>
					</DropdownMenuItem>
				</DropdownMenuSubContent>
			</DropdownMenuPortal>
		</DropdownMenuSub>

		<DropdownMenuItem
			v-if="playlistId !== 'all'"
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
			@select="handleShowMusicInPlaylist(musicSrc, 'all')"
		>
			Show in Playlist "All"
		</DropdownMenuItem>
	</UiDropdownMenu>
</template>
