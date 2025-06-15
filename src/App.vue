<script setup lang="ts">
import AboutDialog from '@/components/AboutDialog.vue'

const { isReady, bgImage } = storeToRefs(useAppStore())
const { AppDialog, dialog } = useAppDialog()
const { UiToast } = useUiToast()

const firstVisit = useLocalStorage('firstVisit', true)
if (firstVisit.value) {
	dialog(AboutDialog, {}).then(() => firstVisit.value = false)
}

const bg = computed(() => bgImage.value === 'none'
	? 'transparent'
	// ? `url(/resources/bg/bg-1.jpg)`
	: `url(/resources/bg/${bgImage.value}.jpg)`)
</script>

<template>
	<div
		:style="{
			'--bg': bg,
		}"
		:class="pika('theme', {
			'--bg-mask': 'linear-gradient(transparent, transparent)',
			'position': 'relative',
			'width': '100%',
			'height': '100dvh',
			'minHeight': '100vh',
			'background': 'var(--bg-mask), var(--bg) no-repeat center center fixed',

			'@dark': {
				'--bg-mask': 'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5))',
			},

			'$::after': {
				content: '\'\'',
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				backdropFilter: 'blur(4px)',
				zIndex: 0,
			},
		})"
	>
		<RouterView v-if="isReady" />
		<AppLoading v-else />

		<AppDialog />
		<UiToast />
		<PwaReloadPrompt />
	</div>
</template>
