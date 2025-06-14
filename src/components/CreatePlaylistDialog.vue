<script setup lang="ts">
import type { Playlist, SaveablePlaylistId } from '@/types'

const props = defineProps<{
	importFrom?: Playlist<SaveablePlaylistId>
}>()

const emit = defineEmits<{
	resolve: []
}>()

const validating = ref(props.importFrom != null)
const title = ref(props.importFrom == null ? '' : `(Imported) ${props.importFrom.title}`)
const stop = watch(
	title,
	() => {
		validating.value = true
		stop()
	},
)

const musicStore = useMusicStore()
const { validatePlaylistTitle, createPlaylist } = musicStore

const error = computed(() => {
	if (!validating.value)
		return undefined

	return validatePlaylistTitle(title.value)
})

function handleCreate() {
	if (error.value)
		return

	createPlaylist(title.value, props.importFrom?.list)
	emit('resolve')
}
</script>

<template>
	<UiDialog
		:defaultOpen="true"
		:contentClass="pika({ width: '500px' })"
		@close="$emit('resolve')"
	>
		<template #title>
			Create Playlist
		</template>

		<template #description>
			Please enter a title for your new playlist.
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
					@click="handleCreate()"
				>
					Create
				</button>
			</div>
		</template>
	</UiDialog>
</template>
