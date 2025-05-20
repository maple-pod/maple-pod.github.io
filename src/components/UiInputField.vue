<script setup lang="ts">
defineProps<{
	label?: string
	inputClass?: any
	error?: string
}>()

const modelValue = defineModel<string>({ required: true })
</script>

<template>
	<UiField
		v-bind="$attrs"
		:label
		:inputClass
		:error
	>
		<template #default="slotProps">
			<UiInput
				v-model="modelValue"
				v-bind="slotProps"
			/>
		</template>
	</UiField>
</template>
