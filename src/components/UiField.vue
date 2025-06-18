<script setup lang="ts">
import { mergeClasses } from '@/utils/common'

defineProps<{
	label?: string
	inputClass?: any
	error?: string
}>()
</script>

<template>
	<label
		:class="mergeClasses(
			pika({
				display: 'flex',
				flexDirection: 'column',
				fontSize: '14px',
				color: 'var(--color-secondary-text)',
			}),
			$attrs.class,
		)"
	>
		<span
			v-if="label"
			:class="pika({
				marginBottom: '4px',
				fontSize: '16px',
				color: 'var(--color-secondary-text)',
			})"
		>
			{{ label }}
		</span>

		<slot v-bind="{ ...$attrs, class: inputClass }" />

		<span
			v-if="error"
			:class="pika({
				marginTop: '4px',
				fontSize: '12px',
				color: 'var(--color-danger-1)',
			})"
		>
			{{ error }}
		</span>
	</label>
</template>
