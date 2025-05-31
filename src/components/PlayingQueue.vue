<script setup lang="ts">
const musicStore = useMusicStore()
const { currentMusic, toPlayQueue } = storeToRefs(musicStore)
const { playToPlayQueueItem } = musicStore

const displayList = computed(() => {
	return [
		...currentMusic.value == null
			? []
			: ['Now Playing', currentMusic.value],

		...toPlayQueue.value.length === 0
			? []
			: ['Next To Play', ...toPlayQueue.value.map(src => musicStore.getMusicData(src)!)],
	]
})
</script>

<template>
	<div
		:class="pika({
			display: 'flex',
			flexDirection: 'column',
			gap: '16px',
			width: '100%',
			height: '100%',
		})"
	>
		<div
			:class="pika({
				flex: '1 0 0',
				minHeight: '0',
				userSelect: 'none',
			})"
		>
			<UiVerticalList
				:items="displayList"
				:itemHeight="(item) => {
					if (typeof item === 'string') return 24
					return 48
				}"
			>
				<template #item="{ item }">
					<div
						v-if="typeof item === 'string'"
						:class="pika('font-comfortaa-500', {
							width: '100%',
							height: '24px',
							display: 'flex',
							alignItems: 'center',
							fontSize: '12px',
							padding: '0 16px',
						})"
					>
						{{ item }}
					</div>
					<div
						v-else
						:data-is-playing="currentMusic?.src === item.src"
						:class="pika('hover-mask', {
							'width': '100%',
							'height': '48px',
							'display': 'flex',
							'alignItems': 'center',
							'gap': '8px',
							'padding': '0 24px',
							'fontWeight': '300',
							'color': 'var(--color-gray-3)',
							'cursor': 'pointer',

							'$[data-is-playing=true]': {
								color: 'var(--color-primary-1)',
							},
						})"
						role="button"
						@click="playToPlayQueueItem(item.src)"
					>
						<img
							:src="item.cover"
							:alt="item.title"
							:title="item.title"
							:class="pika({
								width: '24px',
								height: '24px',
								borderRadius: '4px',
							})"
						>

						<UiMarquee
							:key="item.title"
							:title="item.title"
						>
							{{ item.title }}
						</UiMarquee>
					</div>
				</template>
			</UiVerticalList>
		</div>
	</div>
</template>
