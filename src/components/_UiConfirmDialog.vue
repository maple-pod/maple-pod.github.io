<script setup lang="ts">
const props = defineProps<{
	defaultOpen?: boolean
	contentClass?: any
	title: string
	description: string
	confirmText?: string
	cancelText?: string
}>()

const emit = defineEmits<{
	confirm: [boolean]
	close: []
}>()

const open = defineModel<boolean>('open')

if (props.defaultOpen != null)
	open.value = props.defaultOpen

whenever(
	() => open.value === false,
	() => emit('close'),
)
</script>

<template>
	<UiDialog
		v-model:open="open"
		:defaultOpen
		:contentClass
		@close="emit('close')"
	>
		<template #title>
			{{ title }}
		</template>
		<template #description>
			{{ description }}
		</template>
		<template #actions>
			<div
				:class="pika({
					display: 'flex',
					justifyContent: 'end',
					gap: '16px',
				})"
			>
				<button
					:class="pika('primary-plain-btn')"
					@click="emit('confirm', false)"
				>
					{{ cancelText || 'No' }}
				</button>
				<button
					:class="pika('primary-btn')"
					@click="emit('confirm', true)"
				>
					{{ confirmText || 'Yes' }}
				</button>
			</div>
		</template>
	</UiDialog>
</template>
