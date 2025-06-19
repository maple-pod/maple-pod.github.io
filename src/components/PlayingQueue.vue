<script setup lang="ts">
const musicStore = useMusicStore()
const { currentMusic, toPlayQueue } = storeToRefs(musicStore)
const { playToPlayQueueItem, isMusicDisabled } = musicStore

const displayList = computed(() => {
	return [
		...currentMusic.value == null
			? []
			: ['Now Playing', currentMusic.value],

		...toPlayQueue.value.length === 0
			? []
			: ['Next To Play', ...toPlayQueue.value.filter(id => !isMusicDisabled(id)).map(id => musicStore.getMusicData(id)!)],
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
					<TempVar
						v-else
						v-slot="{ isDisabled }"
						:define="{
							isDisabled: isMusicDisabled(item.id),
						}"
					>
						<div
							:data-is-playing="currentMusic?.id === item.id"
							:class="pika('hover-mask', {
								'width': '100%',
								'height': '48px',
								'display': 'flex',
								'alignItems': 'center',
								'gap': '8px',
								'padding': '0 24px',
								'fontWeight': '300',
								'color': 'var(--color-secondary-text)',
								'cursor': 'pointer',
								'$[data-is-playing=true]': {
									color: 'var(--color-primary-1)',
								},
								'$[data-disabled]': {
									opacity: '0.5',
									cursor: 'not-allowed',
								},
							})"
							:data-disabled="isDisabled || void 0"
							role="button"
							@click="isDisabled || playToPlayQueueItem(item.id)"
						>
							<MusicPlayerThumbnail
								:music="item"
								:class="pika({
									width: '24px',
								})"
							/>
							<UiMarquee
								:key="item.title"
								:title="item.title"
							>
								{{ item.title }}
							</UiMarquee>
						</div>
					</TempVar>
				</template>
			</UiVerticalList>
		</div>
	</div>
</template>
