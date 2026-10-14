<script setup lang="ts">
const musicStore = useMusicStore()
const { history } = storeToRefs(musicStore)
const { getMusicData, play, isMusicDisabled } = musicStore

const displayList = computed(() => {
	return history.value.map(id => ({
		id,
		music: getMusicData(id) ?? null,
	}))
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
							isDisabled: item.music == null || isMusicDisabled(item.id),
						}"
					>
						<div
							:data-disabled="isDisabled || void 0"
							:aria-disabled="isDisabled"
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
							<MusicPlayerThumbnail
								:music="item.music"
								:class="pika({
									width: '24px',
								})"
							/>
							<UiMarquee
								v-if="item.music != null"
								:key="item.music.title"
								:title="item.music.title"
							>
								{{ item.music.title }}
							</UiMarquee>
							<span
								v-else
								:title="item.id"
							>
								Unavailable track: {{ item.id }}
							</span>
						</div>
					</TempVar>
				</template>
			</UiVerticalList>
		</div>
	</div>
</template>
