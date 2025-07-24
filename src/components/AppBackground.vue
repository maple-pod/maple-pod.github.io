<script setup lang="ts">
const { currentBgImage } = storeToRefs(useAppStore())
const bg = computed(() => currentBgImage.value == null
	? 'transparent'
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
		:class="pika({
			'--bg-mask': 'linear-gradient(transparent, transparent)',
			'position': 'absolute',
			'width': '100%',
			'height': '100%',
			'background': 'var(--bg-mask), var(--bg) no-repeat center center fixed',
			'backgroundSize': 'cover',

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
				backdropFilter: 'blur(var(--backdrop-filter-blur))',
				zIndex: 0,
				transition: 'backdrop-filter var(--backdrop-filter-transition-duration)',
			},
		})"
	/>
</template>
