<script setup lang="ts">
import {
	SelectContent,
	SelectIcon,
	SelectItem,
	SelectItemIndicator,
	SelectItemText,
	SelectPortal,
	SelectRoot,
	SelectTrigger,
	SelectValue,
	SelectViewport,
} from 'reka-ui'

interface UiSelectOption {
	value: string
	label: string
	disabled?: boolean
}

const props = withDefaults(defineProps<{
	options: UiSelectOption[]
	label: string
	placeholder?: string
	disabled?: boolean
}>(), {
	placeholder: 'Select an option',
	disabled: false,
})

const model = defineModel<string>()
</script>

<template>
	<SelectRoot
		v-model="model"
		:disabled="props.disabled"
	>
		<SelectTrigger
			:aria-label="props.label"
			:class="pika({
				'display': 'inline-flex',
				'alignItems': 'center',
				'gap': '8px',
				'minWidth': '0',
				'minHeight': '40px',
				'padding': '7px 10px 7px 12px',
				'border': '1px solid var(--color-border-subtle)',
				'borderRadius': 'var(--radius-control)',
				'backgroundColor': 'var(--color-surface-card)',
				'color': 'var(--color-text-primary)',
				'font': 'inherit',
				'cursor': 'pointer',
				'$:focus-visible': { outline: '2px solid var(--color-focus-ring)', outlineOffset: '2px' },
				'$[data-disabled]': { opacity: '0.55', cursor: 'not-allowed' },
			})"
		>
			<SelectValue
				:placeholder="props.placeholder"
				:class="pika({ minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })"
			/>
			<SelectIcon :class="pika('i-f7:chevron-down', { flex: '0 0 auto', opacity: '0.65' })" />
		</SelectTrigger>

		<SelectPortal>
			<SelectContent
				position="popper"
				:sideOffset="6"
				:class="pika('card', {
					minWidth: 'var(--reka-select-trigger-width)',
					maxWidth: 'min(360px, calc(100vw - 16px))',
					maxHeight: 'min(360px, var(--reka-select-content-available-height))',
					padding: '6px',
					zIndex: '20',
					overflow: 'hidden',
				})"
			>
				<SelectViewport>
					<SelectItem
						v-for="option in props.options"
						:key="option.value"
						:value="option.value"
						:disabled="option.disabled"
						:class="pika('hover-mask', {
							'display': 'flex',
							'alignItems': 'center',
							'gap': '8px',
							'minHeight': '36px',
							'padding': '7px 10px',
							'borderRadius': 'var(--radius-control)',
							'fontSize': '14px',
							'cursor': 'pointer',
							'outline': 'none',
							'$[data-highlighted]::before': { opacity: '0.08' },
							'$[data-disabled]': { opacity: '0.45', cursor: 'not-allowed' },
						})"
					>
						<SelectItemIndicator :class="pika({ display: 'grid', placeItems: 'center', width: '16px', flex: '0 0 16px' })">
							<span :class="pika('i-f7:checkmark', { fontSize: '14px' })" />
						</SelectItemIndicator>
						<SelectItemText>{{ option.label }}</SelectItemText>
					</SelectItem>
				</SelectViewport>
			</SelectContent>
		</SelectPortal>
	</SelectRoot>
</template>
