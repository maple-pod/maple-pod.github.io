<script setup lang="ts">
import type { PlaylistId } from '@/types'
import CreatePlaylistDialog from '@/components/CreatePlaylistDialog.vue'
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
const { likedPlaylist, savedPlaylists } = storeToRefs(musicStore)
const { toggleMusicInPlaylist, isAddedInPlaylist, getPlayMusicLink } = musicStore

const { dialog } = useAppDialog()
function handleStartCreatePlaylist() {
	return dialog(CreatePlaylistDialog, {})
}

const { handleShowMusicInPlaylist } = useAppStore()

const { copy } = useClipboard({ legacy: true })
const { toast } = useUiToast()
async function handleCopyMusicLink(musicSrc: string) {
	const link = getPlayMusicLink(musicSrc)
	copy(link)
	toast({
		title: 'Link Copied!',
		duration: 2000,
	})
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
		</template>

		<DropdownMenuSub>
			<DropdownMenuSubTrigger
				:class="pika('hover-mask', {
					'display': 'flex',
					'alignItems': 'center',
					'gap': '8px',
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
				<div :class="pika('i-f7:music-note-list')" />
				<span :class="pika({ fontSize: '14px' })">Playlists</span>

				<div :class="pika('i-f7:chevron-right', { marginLeft: 'auto' })" />
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
						@click="handleStartCreatePlaylist()"
					>
						<div :class="pika('i-f7:plus')" />
						<span :class="pika({ fontSize: '14px' })">New Playlist</span>
					</DropdownMenuItem>

					<DropdownMenuSeparator
						:class="pika({
							margin: '4px',
							borderBottom: '1px solid var(--color-gray-3)',
						})"
					/>

					<DropdownMenuItem
						v-for="playlist in [likedPlaylist, ...savedPlaylists]"
						:key="playlist.id"
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
						@click="toggleMusicInPlaylist(playlist.id, musicSrc)"
						@select.prevent
					>
						<div
							:is-liked-playlist="playlist.id === 'liked'"
							:data-added="isAddedInPlaylist(playlist.id, musicSrc)"
							:class="pika({
								'$[data-added=true]': ['i-f7:bookmark-fill'],
								'$[data-added=false]': ['i-f7:bookmark'],
								'$[is-liked-playlist=true][data-added=true]': ['i-f7:heart-fill'],
								'$[is-liked-playlist=true][data-added=false]': ['i-f7:heart'],
							})"
						/>
						<span :class="pika({ fontSize: '14px' })">{{ playlist.title }}</span>
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
			<div :class="pika('i-f7:compass')" />
			<span :class="pika({ fontSize: '14px' })">Show in "All"</span>
		</DropdownMenuItem>

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
			@select="handleCopyMusicLink(musicSrc)"
		>
			<div
				:class="pika('i-f7:link')"
			/>
			<span :class="pika({ fontSize: '14px' })">Copy Link</span>
		</DropdownMenuItem>
	</UiDropdownMenu>
</template>
