<script setup lang="ts">
import AboutDialog from '@/components/AboutDialog.vue'

const { isReady, currentBgImage } = storeToRefs(useAppStore())
const { AppDialog, dialog } = useAppDialog()
const { UiToast } = useUiToast()

const firstVisit = useLocalStorage('firstVisit', true)
if (firstVisit.value) {
	dialog(AboutDialog, {}).then(() => firstVisit.value = false)
}

const bg = computed(() => currentBgImage.value == null
	? 'var(--color-primary-bg)'
	: `url(/resources/bg/${currentBgImage.value}.jpg)`)

const backdropFilterBlur = ref(1)
const intervalTime = ref(1000)
useIntervalFn(() => {
	backdropFilterBlur.value = (1 + Math.ceil(Math.random() * 15))
	intervalTime.value = 3000 + Math.ceil(Math.random() * 3000)
}, intervalTime)
</script>

<template>
	<div
		:style="{
			'--bg': bg,
			'--backdrop-filter-blur': `${backdropFilterBlur}px`,
			'--backdrop-filter-transition-duration': `${intervalTime}ms`,
		}"
		:class="pika('theme', 'theme-vars', {
			'--bg-mask': 'linear-gradient(transparent, transparent)',
			'position': 'relative',
			'width': '100%',
			'height': '100dvh',
			'minHeight': '100vh',
			'background': 'var(--bg-mask), var(--bg) no-repeat center center fixed',
			'backgroundSize': 'cover',

			'@dark': {
				'--bg-mask': 'linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3))',
			},

			'$::after': {
				content: '\'\'',
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				backdropFilter: 'blur(var(--backdrop-filter-blur))',
				zIndex: 0,
				transition: 'backdrop-filter var(--backdrop-filter-transition-duration)',
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
