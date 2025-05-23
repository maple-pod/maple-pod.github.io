<script setup lang="ts">
defineProps<{
	defaultOpen?: boolean
	contentClass?: any
	title: string
	description: string
	confirmText?: string
	cancelText?: string
}>()

const emit = defineEmits<{
	resolve: [boolean]
}>()

const open = defineModel<boolean>('open')

function handleResolve(value: boolean) {
	open.value = false
	emit('resolve', value)
}
</script>

<template>
	<UiDialog
		v-model:open="open"
		:defaultOpen
		:contentClass
		@close="emit('resolve', false)"
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
					@click="handleResolve(false)"
				>
					{{ cancelText || 'No' }}
				</button>
				<button
					:class="pika('primary-btn')"
					@click="handleResolve(true)"
				>
					{{ confirmText || 'Yes' }}
				</button>
			</div>
		</template>
	</UiDialog>
</template>
