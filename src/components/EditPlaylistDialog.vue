<script setup lang="ts">
import type { CustomPlaylistId } from '@/types'

const props = defineProps<{
	playlistId: CustomPlaylistId
	defaultOpen?: boolean
}>()

defineEmits<{
	close: []
}>()

const musicStore = useMusicStore()
const { validatePlaylistTitle, getPlaylist } = musicStore

const playlist = computed(() => getPlaylist(props.playlistId)!)

const validating = ref(false)
const title = ref(playlist.value.title)
const stop = watch(
	title,
	() => {
		validating.value = true
		stop()
	},
)

const error = computed(() => {
	if (!validating.value)
		return undefined

	return validatePlaylistTitle(title.value)
})

const open = ref(false)

function reset() {
	title.value = ''
	validating.value = false
}

whenever(() => open.value === false, reset)

function handleSave() {
	if (error.value)
		return

	playlist.value.title = title.value
	open.value = false
}
</script>

<template>
	<UiDialog
		v-model:open="open"
		:defaultOpen
		:contentClass="pika({ width: '500px' })"
		@close="$emit('close')"
	>
		<template #trigger>
			<slot name="trigger" />
		</template>

		<template #title>
			Edit Playlist
		</template>

		<template #description>
			Please enter a new title for your playlist.
		</template>

		<template #content>
			<UiInputField
				v-model="title"
				label="Title"
				:error
			/>
		</template>

		<template #actions>
			<div
				:class="pika({
					display: 'flex',
					justifyContent: 'end',
				})"
			>
				<button
					:class="pika('primary-btn')"
					:disabled="!!(validating && error) || validating === false"
					@click="handleSave()"
				>
					Save
				</button>
			</div>
		</template>
	</UiDialog>
</template>
