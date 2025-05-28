<script setup lang="ts">
const musicStore = useMusicStore()
const { history } = storeToRefs(musicStore)
const { getMusicData, play } = musicStore

const displayList = computed(() => {
	return history.value.map(src => getMusicData(src)!)
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
				:itemHeight="48"
			>
				<template #item="{ item }">
					<div
						:class="pika('hover-mask', {
							width: '100%',
							height: '48px',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							padding: '0 24px',
							fontWeight: '300',
							color: 'var(--color-gray-3)',
							cursor: 'pointer',
						})"
						role="button"
						@click="play('all', item.src)"
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
