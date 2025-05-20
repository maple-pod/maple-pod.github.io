<script setup lang="ts">
const { isReady } = storeToRefs(useAppStore())
const { UiConfirmDialog } = useUiConfirmDialog()
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
	</div>
</template>
