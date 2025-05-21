<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot, TooltipTrigger } from 'reka-ui'
</script>

<template>
	<TooltipProvider>
		<TooltipRoot>
			<TooltipTrigger
				asChild
			>
				<slot name="trigger" />
			</TooltipTrigger>
			<TooltipPortal>
				<TooltipContent
					:class="pika('theme', 'card', {
						fontSize: '14px',
						borderRadius: '4px',
						zIndex: 2,
					})"
				>
					<slot name="content" />
					<TooltipArrow
						:class="pika({
							'fill': 'var(--color-gray-1)',
							'@dark': {
								fill: 'var(--color-gray-4)',
							},
						})"
					/>
				</TooltipContent>
			</TooltipPortal>
		</TooltipRoot>
	</TooltipProvider>
</template>
