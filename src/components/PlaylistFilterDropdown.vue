<script setup lang="ts">
import {
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItemIndicator,
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
const marksInRows = computed(() => {
	const rows: MarkItem[][] = []
	for (let i = 0; i < props.marks.length; i += 3) {
		rows.push(props.marks.slice(i, i + 3))
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
					minWidth: '400px',
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
						Clear all
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
				<UiVerticalList
					v-else
					:items="marksInRows"
					:itemHeight="80"
					:class="pika({
						maxHeight: '400px',
					})"
				>
					<template #item="{ item: row }">
						<div
							:class="pika({
								display: 'grid',
								gridTemplateColumns: 'repeat(3, 1fr)',
								gap: '8px',
								marginBottom: '8px',
							})"
						>
							<DropdownMenuCheckboxItem
								v-for="mark in row"
								:key="mark.name"
								:checked="modelValue.includes(mark.name)"
								:class="pika('hover-mask card-border', {
									'display': 'flex',
									'flexDirection': 'column',
									'alignItems': 'center',
									'gap': '8px',
									'padding': '8px',
									'cursor': 'pointer',
									'position': 'relative',

									'$[data-disabled]': {
										opacity: '0.5',
										cursor: 'not-allowed',
									},
								})"
								@click.prevent="() => toggleMark(mark.name, !modelValue.includes(mark.name))"
								@select.prevent
							>
								<DropdownMenuItemIndicator
									:class="pika({
										position: 'absolute',
										top: '4px',
										left: '4px',
									})"
								>
									<div
										:class="pika('i-f7:checkmark-circle-fill', {
											fontSize: '20px',
											color: 'var(--color-primary-1)',
										})"
									/>
								</DropdownMenuItemIndicator>

								<!-- Mark image -->
								<div
									:class="pika('card-border', {
										width: '60px',
										height: '60px',
										overflow: 'hidden',
									})"
								>
									<img
										:src="mark.image"
										:alt="mark.name"
										:class="pika({
											width: '100%',
											height: '100%',
											objectFit: 'cover',
											transform: 'scale(1.1)',
										})"
									>
								</div>

								<!-- Badge count -->
								<span
									:class="pika({
										fontSize: '14px',
										fontWeight: '600',
										color: 'var(--color-primary-text)',
									})"
								>
									{{ mark.count }}
								</span>
							</DropdownMenuCheckboxItem>
						</div>
					</template>
				</UiVerticalList>
			</DropdownMenuContent>
		</DropdownMenuPortal>
	</DropdownMenuRoot>
</template>
