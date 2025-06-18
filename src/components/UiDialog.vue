<script setup lang="ts">
import { mergeClasses } from '@/utils/common'
import {
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogOverlay,
	DialogPortal,
	DialogRoot,
	DialogTitle,
	DialogTrigger,
} from 'reka-ui'

const props = defineProps<{
	defaultOpen?: boolean
	contentClass?: any
}>()

const emit = defineEmits<{
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
	<DialogRoot
		v-model:open="open"
		:defaultOpen
	>
		<DialogTrigger
			v-if="$slots.trigger"
			asChild
		>
			<slot name="trigger" />
		</DialogTrigger>
		<DialogPortal>
			<DialogOverlay
				:class="pika({
					position: 'fixed',
					inset: '0',
					backdropFilter: 'blur(8px)',
					zIndex: '10',
				})"
			/>
			<DialogContent
				:class="mergeClasses(
					pika('theme-vars', 'theme-color', 'card', {
						position: 'fixed',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						zIndex: '11',
						display: 'flex',
						flexDirection: 'column',
						maxWidth: 'calc(100vw - 32px)',
					}),
					contentClass,
				)"
			>
				<DialogClose
					asChild
				>
					<button
						:class="pika('icon-btn', {
							position: 'absolute',
							top: '16px',
							right: '16px',
						})"
						aria-label="Close"
					>
						<div :class="pika('i-f7:xmark')" />
					</button>
				</DialogClose>
				<DialogTitle
					v-if="$slots.title"
					asChild
				>
					<h2
						:class="pika('font-comfortaa', {
							fontSize: '24px',
							fontWeight: '300',
							margin: '0 0 32px 0',
							padding: '0 32px 0 0',
						})"
					>
						<slot name="title" />
					</h2>
				</DialogTitle>
				<DialogDescription
					v-if="$slots.description"
					asChild
				>
					<p
						:class="pika({
							fontSize: '14px',
							margin: '0 0 32px 0',
							padding: '0 32px 0 0',
						})"
					>
						<slot name="description" />
					</p>
				</DialogDescription>

				<div
					v-if="$slots.content"
					:class="pika({ margin: '0 0 56px 0' })"
				>
					<slot name="content" />
				</div>

				<div>
					<slot name="actions" />
				</div>
			</DialogContent>
		</DialogPortal>
	</DialogRoot>
</template>
