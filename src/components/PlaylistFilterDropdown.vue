<script setup lang="ts">
import {
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuPortal,
	DropdownMenuRoot,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from 'reka-ui'

interface MarkItem {
	name: string
	image: string
	count: number
}

const props = defineProps<{
	marks: MarkItem[]
	modelValue: string[]
}>()

const emit = defineEmits<{
	'update:modelValue': [value: string[]]
}>()

const open = ref(false)

const hasActiveFilters = computed(() => props.modelValue.length > 0)

function toggleMark(markName: string, checked: boolean) {
	const newValue = checked
		? [...props.modelValue, markName]
		: props.modelValue.filter(m => m !== markName)
	emit('update:modelValue', newValue)
}

function selectAll() {
	emit('update:modelValue', props.marks.map(m => m.name))
}

function deselectAll() {
	emit('update:modelValue', [])
}

const clearAll = deselectAll

// Group marks into rows of 3 for grid layout
const CHUNK_SIZE = 4
const marksInRows = computed(() => {
	const rows: MarkItem[][] = []
	for (let i = 0; i < props.marks.length; i += CHUNK_SIZE) {
		rows.push(props.marks.slice(i, i + CHUNK_SIZE))
	}
	return rows
})
</script>

<template>
	<DropdownMenuRoot v-model:open="open">
		<DropdownMenuTrigger asChild>
			<button
				:class="pika('icon-btn-toggle')"
				:data-toggle="hasActiveFilters"
				aria-label="Filter by marks"
			>
				<div :class="pika('i-f7:line-horizontal-3-decrease')" />
			</button>
		</DropdownMenuTrigger>

		<DropdownMenuPortal>
			<DropdownMenuContent
				:class="pika('card', {
					padding: '12px',
					minWidth: '200px',
					maxWidth: '500px',
					zIndex: 2,
				})"
			>
				<!-- Control buttons -->
				<div
					:class="pika({
						display: 'flex',
						gap: '4px',
						marginBottom: '8px',
					})"
				>
					<button
						:class="pika('primary-plain-btn', {
							fontSize: '12px',
							padding: '4px 8px',
						})"
						@click="selectAll"
					>
						Select all
					</button>
					<button
						:class="pika('primary-plain-btn', {
							fontSize: '12px',
							padding: '4px 8px',
						})"
						@click="clearAll"
					>
						Clear all{{ hasActiveFilters ? ` (${props.modelValue.length})` : '' }}
					</button>
				</div>

				<DropdownMenuSeparator
					:class="pika({
						margin: '8px 0',
						borderBottom: '1px solid var(--color-border)',
					})"
				/>

				<!-- Empty state -->
				<div
					v-if="marks.length === 0"
					:class="pika({
						padding: '12px',
						fontSize: '14px',
						color: 'var(--color-secondary-text)',
						textAlign: 'center',
					})"
				>
					No marks available
				</div>

				<!-- Mark grid with virtual scrolling -->
				<div
					v-else
					:class="pika({
						maxHeight: '400px',
					})"
				>
					<UiVerticalList
						:items="marksInRows"
						:itemHeight="60"
					>
						<template #item="{ item: row }">
							<div
								:style="{
									'--chunk-size': CHUNK_SIZE,
								}"
								:class="pika({
									display: 'grid',
									gridTemplateColumns: 'repeat(var(--chunk-size), 1fr)',
									gap: '8px',
								})"
							>
								<DropdownMenuCheckboxItem
									v-for="mark in row"
									:key="mark.name"
									:modelValue="modelValue.includes(mark.name)"
									:class="pika('hover-mask', {
										'cursor': 'pointer',
										'position': 'relative',
										'width': '60px',
										'height': '60px',
										'padding': '2px',
										'$[data-disabled]': {
											opacity: '0.5',
											cursor: 'not-allowed',
										},
									})"
									@click.prevent="() => toggleMark(mark.name, !modelValue.includes(mark.name))"
									@select.prevent
								>
									<!-- Mark image -->
									<img
										:src="mark.image"
										:alt="mark.name"
										:class="pika('card-border', {
											'width': '100%',
											'height': '100%',
											'objectFit': 'cover',
											'opacity': '0.5',
											'[data-state=checked] $': {
												opacity: '1',
											},
										})"
									>
									<!-- Badge count -->
									<span
										:class="pika({
											position: 'absolute',
											bottom: '4px',
											right: '4px',
											display: 'inline-block',
											padding: '2px 6px',
											borderRadius: '12px',
											fontSize: '12px',
											fontWeight: '300',
											color: 'var(--color-primary-text)',
											backgroundColor: 'var(--color-primary-bg)',
										})"
									>
										{{ mark.count }}
									</span>
								</DropdownMenuCheckboxItem>
							</div>
						</template>
					</UiVerticalList>
				</div>
			</DropdownMenuContent>
		</DropdownMenuPortal>
	</DropdownMenuRoot>
</template>
