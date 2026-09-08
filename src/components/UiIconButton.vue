<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const { label, tooltip, toggle, pressed, disabled, target = 'touch' } = defineProps<{
	label: string
	tooltip?: string
	toggle?: boolean
	pressed?: boolean
	disabled?: boolean
	target?: 'touch' | 'compact'
}>()
</script>

<template>
	<UiTooltip>
		<template #trigger>
			<button
				v-bind="$attrs"
				type="button"
				:aria-label="label"
				:aria-pressed="pressed"
				:disabled="disabled"
				:class="[
					toggle === true ? pika('icon-btn-toggle') : pika('icon-btn'),
					target === 'touch' ? pika({ minWidth: 'var(--size-touch-target)', minHeight: 'var(--size-touch-target)' }) : undefined,
				]"
			>
				<slot />
			</button>
		</template>

		<template #content>
			{{ tooltip ?? label }}
		</template>
	</UiTooltip>
</template>
