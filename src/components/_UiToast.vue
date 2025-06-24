<script setup lang="ts">
import { ToastDescription, ToastProvider, ToastRoot, ToastTitle, ToastViewport } from 'reka-ui'

defineProps<{
	title?: string
	description?: string
	duration?: number
}>()

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
	<ToastProvider
		:duration="duration"
	>
		<ToastRoot
			v-model:open="open"
			:class="pika('card', {
				padding: '12px',
			})"
		>
			<template #default="slotProps">
				<slot
					name="content"
					v-bind="slotProps"
				>
					<ToastTitle
						v-if="title"
						:class="pika({ fontSize: '14px' })"
					>
						{{ title }}
					</ToastTitle>
					<ToastDescription
						v-if="description"
						:class="pika({ fontSize: '14px' })"
					>
						{{ description }}
					</ToastDescription>
				</slot>
			</template>
		</ToastRoot>
		<ToastViewport
			:class="pika({
				position: 'fixed',
				left: '50%',
				top: '0',
				padding: '25px',
				maxWidth: '100vw',
				transform: 'translateX(-50%)',
				zIndex: '1000',
				listStyleType: 'none',
			})"
		/>
	</ToastProvider>
</template>
