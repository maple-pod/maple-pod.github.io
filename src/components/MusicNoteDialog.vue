<script setup lang="ts">
const props = defineProps<{
	musicId: string
}>()

const emit = defineEmits<{
	resolve: []
}>()

const musicStore = useMusicStore()
const { getMusicNote, setMusicNote, deleteMusicNote } = musicStore

const musicData = computed(() => musicStore.getMusicData(props.musicId))
const existingNote = computed(() => getMusicNote(props.musicId))
const hasNote = computed(() => existingNote.value !== '')

const note = ref(existingNote.value)
const MAX_LENGTH = 500

function handleSave() {
	setMusicNote(props.musicId, note.value)
	emit('resolve')
}

function handleDeleteNote() {
	deleteMusicNote(props.musicId)
	emit('resolve')
}
</script>

<template>
	<UiDialog
		defaultOpen
		:contentClass="pika({ width: '500px' })"
		@close="$emit('resolve')"
	>
		<template #title>
			{{ hasNote ? 'Edit Note' : 'Add Note' }}
		</template>

		<template #content>
			<div
				:class="pika({
					display: 'flex',
					flexDirection: 'column',
					gap: '16px',
				})"
			>
				<div
					:class="pika({
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
					})"
				>
					<img
						v-if="musicData"
						:src="musicData.cover"
						:alt="musicData.title"
						:class="pika({
							width: '48px',
							height: '48px',
							borderRadius: '4px',
							objectFit: 'cover',
							flexShrink: '0',
						})"
					>
					<div
						:class="pika({
							display: 'flex',
							flexDirection: 'column',
							gap: '2px',
							minWidth: '0',
						})"
					>
						<span
							:class="pika({
								fontSize: '16px',
								fontWeight: '500',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							})"
						>
							{{ musicData?.title ?? musicId }}
						</span>
					</div>
				</div>

				<div
					:class="pika({
						display: 'flex',
						flexDirection: 'column',
						gap: '4px',
					})"
				>
					<textarea
						v-model="note"
						:maxlength="MAX_LENGTH"
						placeholder="Write a personal note for this track..."
						:class="pika({
							backgroundColor: 'transparent',
							color: 'var(--color-primary-text)',
							border: '1px solid var(--color-border)',
							borderRadius: '4px',
							padding: '8px 12px',
							fontSize: '14px',
							width: '100%',
							boxSizing: 'border-box',
							resize: 'vertical',
							minHeight: '120px',
							fontFamily: 'inherit',
							lineHeight: '1.6',
						})"
					/>
					<div
						:class="pika({
							fontSize: '12px',
							textAlign: 'right',
							opacity: '0.5',
						})"
					>
						{{ note.length }} / {{ MAX_LENGTH }}
					</div>
				</div>
			</div>
		</template>

		<template #actions>
			<div
				:class="pika({
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					gap: '8px',
				})"
			>
				<button
					v-if="hasNote"
					:class="pika('primary-plain-btn', {
						color: 'var(--color-danger-1)',
					})"
					@click="handleDeleteNote"
				>
					Delete Note
				</button>
				<div
					v-else
					:class="pika({ flex: '1' })"
				/>

				<div
					:class="pika({
						display: 'flex',
						gap: '8px',
					})"
				>
					<button
						:class="pika('primary-plain-btn')"
						@click="$emit('resolve')"
					>
						Cancel
					</button>
					<button
						:class="pika('primary-btn')"
						@click="handleSave"
					>
						Save
					</button>
				</div>
			</div>
		</template>
	</UiDialog>
</template>
