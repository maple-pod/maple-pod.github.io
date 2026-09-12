<script setup lang="ts">
const props = withDefaults(defineProps<{
	label: string
	disabled?: boolean
}>(), {
	disabled: false,
})

const canShowTooltip = useMediaQuery('(hover: hover) and (pointer: fine)')
const tooltipOpen = ref(false)
</script>

<template>
	<span
		:class="pika({
			position: 'relative',
			display: 'inline-flex',
		})"
		@pointerenter="tooltipOpen = true"
		@pointerleave="tooltipOpen = false"
		@focusin="tooltipOpen = true"
		@focusout="tooltipOpen = false"
	>
		<slot />

		<span
			v-if="canShowTooltip && tooltipOpen && props.disabled === false"
			aria-hidden="true"
			:class="pika('card', {
				position: 'absolute',
				top: 'calc(100% + 8px)',
				left: '50%',
				transform: 'translateX(-50%)',
				padding: '4px 8px',
				fontSize: '14px',
				whiteSpace: 'nowrap',
				pointerEvents: 'none',
				zIndex: '30',
			})"
		>
			{{ props.label }}
		</span>
	</span>
</template>
