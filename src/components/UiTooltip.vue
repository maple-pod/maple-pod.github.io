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
						padding: '8px 16px',
						fontSize: '14px',
						zIndex: 2,
					})"
				>
					<span :class="pika({ opacity: 0.7 })">
						<slot name="content" />
					</span>
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
