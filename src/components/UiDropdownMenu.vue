<script setup lang="ts">
import {
	DropdownMenuArrow,
	DropdownMenuContent,
	DropdownMenuPortal,
	DropdownMenuRoot,
	DropdownMenuTrigger,
} from 'reka-ui'

const open = defineModel<boolean>('open')
</script>

<template>
	<DropdownMenuRoot v-model:open="open">
		<DropdownMenuTrigger
			asChild
		>
			<slot name="trigger" />
		</DropdownMenuTrigger>

		<DropdownMenuPortal>
			<DropdownMenuContent
				:class="pika('theme', 'card', {
					padding: '8px',
					minWidth: '200px',
					borderRadius: '4px',
					zIndex: 2,
				})"
			>
				<slot />
				<!-- <DropdownMenuLabel />
				<DropdownMenuItem />

				<DropdownMenuGroup>
					<DropdownMenuItem />
				</DropdownMenuGroup>

				<DropdownMenuCheckboxItem>
					<DropdownMenuItemIndicator />
				</DropdownMenuCheckboxItem>

				<DropdownMenuRadioGroup>
					<DropdownMenuRadioItem>
						<DropdownMenuItemIndicator />
					</DropdownMenuRadioItem>
				</DropdownMenuRadioGroup>

				<DropdownMenuSub>
					<DropdownMenuSubTrigger />
					<DropdownMenuPortal>
						<DropdownMenuSubContent />
					</DropdownMenuPortal>
				</DropdownMenuSub>

				<DropdownMenuSeparator /> -->
				<DropdownMenuArrow
					:class="pika({
						'fill': 'var(--color-gray-1)',
						'@dark': {
							fill: 'var(--color-gray-4)',
						},
					})"
				/>
			</DropdownMenuContent>
		</DropdownMenuPortal>
	</DropdownMenuRoot>
</template>
