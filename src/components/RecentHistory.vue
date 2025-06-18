<script setup lang="ts">
const musicStore = useMusicStore()
const { history } = storeToRefs(musicStore)
const { getMusicData, play, isMusicDisabled } = musicStore

const displayList = computed(() => {
	return history.value.map(id => getMusicData(id)!)
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
					<TempVar
						v-slot="{ isDisabled }"
						:define="{
							isDisabled: isMusicDisabled(item.id),
						}"
					>
						<div
							:data-disabled="isDisabled || void 0"
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
								'$[data-disabled]': {
									opacity: '0.5',
									cursor: 'not-allowed',
								},
							})"
							role="button"
							@click="isDisabled || play('all', item.id)"
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
					</TempVar>
				</template>
			</UiVerticalList>
		</div>
	</div>
</template>
