<script setup lang="ts">
const { isReady } = storeToRefs(useAppStore())
const { UiConfirmDialog } = useUiConfirmDialog()
const { UiToast } = useUiToast()

const firstVisit = useLocalStorage('firstVisit', true)
</script>

<template>
	<div
		:class="pika('theme', {
			position: 'relative',
			width: '100%',
			height: '100dvh',
			minHeight: '100vh',
		})"
	>
		<RouterView v-if="isReady" />
		<AppLoading v-else />

		<UiConfirmDialog />
		<UiToast />

		<AboutDialog
			v-if="firstVisit"
			@close="firstVisit = false"
		/>
	</div>
</template>
