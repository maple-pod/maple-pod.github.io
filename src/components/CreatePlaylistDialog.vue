<script setup lang="ts">
defineProps<{
	defaultOpen?: boolean
}>()

defineEmits<{
	close: []
}>()

const validating = ref(false)
const title = ref('')
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

const open = ref(false)

function reset() {
	title.value = ''
	validating.value = false
}

whenever(() => open.value === false, reset)

function handleCreate() {
	if (error.value)
		return

	createPlaylist(title.value)
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
