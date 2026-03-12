<script setup lang="ts">
import type { MusicData } from '@/types'
import MusicNoteDialog from '@/components/MusicNoteDialog.vue'
import { formatTime } from '@/utils/common'

const musicStore = useMusicStore()
const { musicNotes } = storeToRefs(musicStore)
const { getMusicData, deleteMusicNote, play } = musicStore

const { dialog } = useAppDialog()
const { confirm } = useUiConfirmDialog()

const searchQuery = ref('')

function fuzzyMatch(query: string, target: string): boolean {
	if (query === '')
		return true
	const q = query.toLowerCase()
	const t = target.toLowerCase()
	let qi = 0
	for (let ti = 0; ti < t.length && qi < q.length; ti++) {
		if (t[ti] === q[qi])
			qi++
	}
	return qi === q.length
}

interface NoteEntry {
	musicId: string
	noteText: string
	musicData: MusicData | undefined
}

const noteEntries = computed<NoteEntry[]>(() =>
	Object.entries(musicNotes.value)
		.map(([musicId, noteText]) => ({
			musicId,
			noteText,
			musicData: getMusicData(musicId),
		})),
)

const filteredEntries = computed<NoteEntry[]>(() => {
	const q = searchQuery.value.trim()
	if (q === '')
		return noteEntries.value

	return noteEntries.value.filter(entry =>
		fuzzyMatch(q, entry.noteText) || fuzzyMatch(q, entry.musicData?.title ?? entry.musicId),
	)
})

function handleEditNote(musicId: string) {
	return dialog(MusicNoteDialog, { musicId })
}

async function handleDeleteNote(entry: NoteEntry) {
	const title = entry.musicData?.title ?? entry.musicId
	const agreed = await confirm({
		title: 'Delete Note',
		description: `Are you sure you want to delete the note for "${title}"?`,
		confirmText: 'Delete',
	})
	if (agreed) {
		deleteMusicNote(entry.musicId)
	}
}

function handlePlayMusic(musicId: string) {
	play('all', musicId)
}
</script>

<template>
	<div
		:class="pika({
			display: 'flex',
			flexDirection: 'column',
			gap: '16px',
			width: '100%',
			height: '100%',
		})"
	>
		<!-- Header -->
		<div
			:class="pika({
				display: 'flex',
				alignItems: 'center',
				gap: '8px',
				fontWeight: '100',
				padding: '0 16px',
				height: '60px',
			})"
		>
			<div
				:class="pika({
					fontSize: '24px',
					fontWeight: '100',
					marginRight: '4px',
				})"
			>
				Notes
			</div>
			<div
				:class="pika({
					fontSize: '14px',
					padding: '2px 8px',
					borderRadius: '9999px',
					border: '1px solid var(--color-border)',
					color: 'var(--color-secondary-text)',
				})"
			>
				{{ noteEntries.length }}
			</div>
		</div>

		<!-- Search -->
		<div
			:class="pika({
				padding: '0 16px',
			})"
		>
			<UiInput
				v-model="searchQuery"
				placeholder="Search by note or title..."
			/>
		</div>

		<!-- Empty state -->
		<div
			v-if="noteEntries.length === 0"
			:class="pika({
				flex: '1 0 0',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: '8px',
				color: 'var(--color-secondary-text)',
				padding: '32px 16px',
			})"
		>
			<div :class="pika('i-f7:doc-text', { fontSize: '48px', opacity: '0.3' })" />
			<p :class="pika({ margin: '0', fontSize: '14px' })">
				No notes yet. Add a note from any track's menu.
			</p>
		</div>

		<!-- No results for search -->
		<div
			v-else-if="filteredEntries.length === 0"
			:class="pika({
				flex: '1 0 0',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: '8px',
				color: 'var(--color-secondary-text)',
				padding: '32px 16px',
			})"
		>
			<div :class="pika('i-f7:search', { fontSize: '48px', opacity: '0.3' })" />
			<p :class="pika({ margin: '0', fontSize: '14px' })">
				No notes match your search.
			</p>
		</div>

		<!-- Notes list -->
		<div
			v-else
			:class="pika({
				flex: '1 0 0',
				minHeight: '0',
			})"
		>
			<UiVerticalList
				:items="filteredEntries"
				:itemHeight="88"
			>
				<template #item="{ item: entry }">
					<div
						:key="entry.musicId"
						:class="pika('hover-mask', {
							'width': '100%',
							'height': '80px',
							'display': 'flex',
							'alignItems': 'center',
							'gap': '12px',
							'padding': '0 16px',
							'marginBottom': '8px',
							'borderRadius': '8px',
							'cursor': 'pointer',
							'userSelect': 'none',
							'$:has([id^=reka-dropdown-menu-trigger-][data-state=open])::before': {
								opacity: '0.1',
							},
						})"
						@click="entry.musicData && handlePlayMusic(entry.musicId)"
					>
						<!-- Thumbnail -->
						<img
							v-if="entry.musicData"
							:src="entry.musicData.cover"
							:alt="entry.musicData.title"
							:class="pika({
								width: '48px',
								height: '48px',
								borderRadius: '4px',
								objectFit: 'cover',
								flexShrink: '0',
							})"
						>
						<div
							v-else
							:class="pika({
								width: '48px',
								height: '48px',
								borderRadius: '4px',
								backgroundColor: 'var(--color-card-bg)',
								border: '1px solid var(--color-border)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexShrink: '0',
							})"
						>
							<div :class="pika('i-f7:music-note', { opacity: '0.4' })" />
						</div>

						<!-- Title + note preview -->
						<div
							:class="pika({
								flex: '1 1 0',
								minWidth: '0',
								display: 'flex',
								flexDirection: 'column',
								gap: '4px',
							})"
						>
							<div
								:class="pika({
									fontSize: '14px',
									fontWeight: '500',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
								})"
							>
								{{ entry.musicData?.title ?? entry.musicId }}
							</div>
							<div
								:class="pika({
									fontSize: '12px',
									color: 'var(--color-secondary-text)',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
								})"
							>
								{{ entry.noteText }}
							</div>
							<div
								v-if="entry.musicData"
								:class="pika({
									fontSize: '11px',
									color: 'var(--color-secondary-text)',
									opacity: '0.6',
								})"
							>
								{{ formatTime(entry.musicData.duration) }}
							</div>
						</div>

						<!-- Action buttons -->
						<div
							:class="pika({
								'display': 'flex',
								'alignItems': 'center',
								'gap': '4px',
								'flexShrink': '0',
								'@screen-md-and-up': {
									':not(:hover) $': { visibility: 'hidden' },
								},
							})"
						>
							<UiTooltip>
								<template #trigger>
									<button
										:class="pika('icon-btn')"
										@click.stop="handleEditNote(entry.musicId)"
									>
										<div :class="pika('i-f7:square-pencil')" />
									</button>
								</template>
								<template #content>
									Edit note
								</template>
							</UiTooltip>
							<UiTooltip>
								<template #trigger>
									<button
										:class="pika('icon-btn')"
										@click.stop="handleDeleteNote(entry)"
									>
										<div :class="pika('i-f7:trash')" />
									</button>
								</template>
								<template #content>
									Delete note
								</template>
							</UiTooltip>
						</div>
					</div>
				</template>
			</UiVerticalList>
		</div>
	</div>
</template>
