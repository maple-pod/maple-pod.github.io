<script setup lang="ts">
const modelValue = defineModel<string>({ required: true })
</script>

<template>
	<input
		v-model="modelValue"
		:class="pika({
			'border': '1px solid var(--color-gray-3)',
			'borderRadius': '4px',
			'padding': '8px 12px',
			'fontSize': '16px',
			'width': '100%',
			'boxSizing': 'border-box',
			'backgroundColor': 'transparent',

			'@dark': {
				color: 'var(--color-gray-1)',
			},
		})"
		v-bind="$attrs"
	>
</template>
