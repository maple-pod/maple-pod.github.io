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

const props = defineProps<{
	marks: string[]
	modelValue: string[]
}>()

const emit = defineEmits<{
	'update:modelValue': [value: string[]]
}>()

const open = ref(false)

const hasActiveFilters = computed(() => props.modelValue.length > 0)

function toggleMark(mark: string, checked: boolean) {
	const newValue = checked
		? [...props.modelValue, mark]
		: props.modelValue.filter(m => m !== mark)
	emit('update:modelValue', newValue)
}

function selectAll() {
	emit('update:modelValue', [...props.marks])
}

function deselectAll() {
	emit('update:modelValue', [])
}

const clearAll = deselectAll
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
					padding: '8px',
					minWidth: '200px',
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

				<!-- Checkbox items -->
				<DropdownMenuCheckboxItem
					v-for="mark in marks"
					:key="mark"
					:checked="modelValue.includes(mark)"
					:class="pika('hover-mask', {
						'display': 'flex',
						'alignItems': 'center',
						'gap': '8px',
						'padding': '12px',
						'cursor': 'pointer',

						'$[data-disabled]': {
							opacity: '0.5',
							cursor: 'not-allowed',
						},
					})"
					@click.prevent="() => toggleMark(mark, !modelValue.includes(mark))"
					@select.prevent
				>
					<DropdownMenuItemIndicator>
						<div :class="pika('i-f7:checkmark')" />
					</DropdownMenuItemIndicator>
					<span :class="pika({ fontSize: '14px' })">{{ mark }}</span>
				</DropdownMenuCheckboxItem>
			</DropdownMenuContent>
		</DropdownMenuPortal>
	</DropdownMenuRoot>
</template>
