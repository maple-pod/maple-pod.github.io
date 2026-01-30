<script setup lang="ts">
import AboutDialog from '@/components/AboutDialog.vue'

const { isReady } = storeToRefs(useAppStore())
const { isPaused } = storeToRefs(useMusicStore())
const { AppDialog, dialog } = useAppDialog()
const { UiToast } = useUiToast()

const firstVisit = useLocalStorage('firstVisit', true)
if (firstVisit.value) {
	dialog(AboutDialog, {})
		.then(() => firstVisit.value = false)
}

useEventListener('pointerdown', () => {
	document.documentElement.classList.add('pointer-down')
})
useEventListener('pointerup', () => {
	document.documentElement.classList.remove('pointer-down')
})

// Prevent direct close of the app
useEventListener('beforeunload', (event) => {
	if (isPaused.value)
		return
	event.preventDefault()
	event.returnValue = ''
})
</script>

<template>
	<div
		:class="pika({
			position: 'relative',
			width: '100%',
			height: '100dvh',
			minHeight: '100vh',
		})"
	>
		<AppBackground />

		<RouterView v-if="isReady" />
		<AppLoading v-else />

		<AppDialog />
		<UiToast />
		<PwaReloadPrompt />
	</div>
</template>
