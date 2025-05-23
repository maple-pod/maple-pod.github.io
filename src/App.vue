<script setup lang="ts">
import AboutDialog from '@/components/AboutDialog.vue'

const { isReady } = storeToRefs(useAppStore())
const { AppDialog, dialog } = useAppDialog()
const { UiToast } = useUiToast()

const firstVisit = useLocalStorage('firstVisit', true)
if (firstVisit.value) {
	dialog(AboutDialog, {}).then(() => firstVisit.value = false)
}
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

		<AppDialog />
		<UiToast />
	</div>
</template>
