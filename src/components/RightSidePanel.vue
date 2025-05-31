<script setup lang="ts">
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from 'reka-ui'
import PlayingQueue from './PlayingQueue.vue'
import RecentHistory from './RecentHistory.vue'

const tabs = [
	{
		value: 'queue',
		label: 'Playing Queue',
		component: PlayingQueue,
	},
	{
		value: 'history',
		label: 'Recent History',
		component: RecentHistory,
	},
]
</script>

<template>
	<TabsRoot
		defaultValue="queue"
		:class="pika({
			display: 'flex',
			flexDirection: 'column',
			gap: '16px',
			width: '100%',
			height: '100%',
		})"
	>
		<TabsList
			:class="pika({
				position: 'relative',
				width: '100%',
				display: 'flex',
				alignItems: 'center',
				gap: '16px',
			})"
		>
			<TabsIndicator
				:class="pika({
					position: 'absolute',
					bottom: '0',
					left: '0',
					width: 'var(--reka-tabs-indicator-size)',
					height: '2px',
					backgroundColor: 'var(--color-primary-1)',
					borderRadius: '9999px',
					transform: 'translate(var(--reka-tabs-indicator-position), 1px)',
					transition: 'transform 0.1s',
				})"
			/>
			<TabsTrigger
				v-for="tab in tabs"
				:key="tab.value"
				:value="tab.value"
				:class="pika('font-comfortaa', {
					'backgroundColor': 'transparent',
					'color': 'var(--color-gray-3)',
					'padding': '12px 4px',
					'cursor': 'pointer',

					'$[data-state=active]': {
						color: 'var(--color-primary-1)',
					},
				})"
			>
				{{ tab.label }}
			</TabsTrigger>
		</TabsList>

		<TabsContent
			v-for="tab in tabs"
			:key="tab.value"
			:value="tab.value"
			:class="pika({
				'display': 'none',
				'flexDirection': 'column',
				'width': '100%',
				'height': '100%',

				'$[data-state=active]': {
					display: 'flex',
				},
			})"
		>
			<component :is="tab.component" />
		</TabsContent>
	</TabsRoot>
</template>
