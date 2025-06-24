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
					:class="pika('card', {
						padding: '4px 8px',
						fontSize: '14px',
						zIndex: 2,
					})"
					:sideOffset="8"
				>
					<span :class="pika({ opacity: 0.7 })">
						<slot name="content" />
					</span>
					<TooltipArrow
						:class="pika({
							fill: 'var(--color-border)',
						})"
					/>
				</TooltipContent>
			</TooltipPortal>
		</TooltipRoot>
	</TooltipProvider>
</template>
