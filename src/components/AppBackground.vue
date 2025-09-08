<script setup lang="ts">
const { currentBgImage, bgData } = storeToRefs(useAppStore())

const loadedBg = ref({
	preview: null as string | null,
	full: null as string | null,
})

watch(
	currentBgImage,
	(theBg) => {
		if (theBg == null) {
			loadedBg.value.preview = null
			loadedBg.value.full = null
			return
		}

		loadedBg.value.preview = bgData.value?.preview[theBg] ?? null
		loadedBg.value.full = null
		fetch(`/resources/bg/${currentBgImage.value}.jpg`)
			.then((res) => {
				if (theBg !== currentBgImage.value)
					return
				if (!res.ok)
					throw new Error('Failed to load background image')
				return res.blob()
			})
			.then((blob) => {
				if (theBg !== currentBgImage.value || blob == null)
					return
				loadedBg.value.full = URL.createObjectURL(blob)
			})
			.catch(() => {
				if (theBg !== currentBgImage.value)
					return
				loadedBg.value.full = null
			})
	},
)

const blur = computed(() => (loadedBg.value.full == null ? 16 : 2))

const bg = computed(() => (loadedBg.value.preview == null && loadedBg.value.full == null)
	? 'transparent'
	: loadedBg.value.full == null
		? `url(${loadedBg.value.preview}) no-repeat center center fixed`
		: `url(${loadedBg.value.full}) no-repeat center center fixed, url(${loadedBg.value.preview}) no-repeat center center fixed`)
</script>

<template>
	<div
		:style="{
			'--bg': bg,
			'--blur': `${blur}px`,
		}"
		:class="pika({
			'--bg-mask': 'linear-gradient(transparent, transparent)',
			'position': 'absolute',
			'width': '100%',
			'height': '100%',
			'background': 'var(--bg-mask), var(--bg)',
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
				backdropFilter: 'blur(var(--blur))',
				zIndex: 0,
				transition: 'backdrop-filter 0.3s ease-in-out',
			},
		})"
	/>
</template>
