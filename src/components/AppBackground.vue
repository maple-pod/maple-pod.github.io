<script setup lang="ts">
const { currentBgImage } = storeToRefs(useAppStore())
const bg = computed(() => currentBgImage.value == null
	? 'transparent'
	: `url(/resources/bg/${currentBgImage.value}.jpg)`)
</script>

<template>
	<div
		:style="{
			'--bg': bg,
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
				backdropFilter: 'blur(2px)',
				zIndex: 0,
			},
		})"
	/>
</template>
