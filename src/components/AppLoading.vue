<script setup lang="ts">
const images = (import.meta.glob('../assets/images/pieces/*.png', { eager: true }))
const groups = {} as Record<string, string[]>
Object.entries(images)
	.forEach(([path, module]) => {
		const match = path.match(/\/pieces\/([a-zA-Z]+)_\d+\.png$/)
		if (match) {
			const group = match[1]!
			if (!groups[group])
				groups[group] = []
			groups[group].push((module as { default: string }).default)
		}
	})
const PICKED_GROUPS = 3
const pickedGroups = Object.values(groups)
	.sort(() => 0.5 - Math.random())
	.slice(0, PICKED_GROUPS)

const now = useNow()
const emphasizedIndex = computed(() => Math.floor(now.value.getTime() / 500) % PICKED_GROUPS)
const FRAME_DURATION = 300 // ms
const frameCounter = computed(() => Math.floor(now.value.getTime() / FRAME_DURATION) % 10)
</script>

<template>
	<div
		:class="pika('font-comfortaa-300', {
			position: 'fixed',
			top: '0',
			left: '0',
			width: '100%',
			height: '100%',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			gap: '32px',
			fontSize: '56px',
			fontWeight: '100',
		})"
	>
		<img
			v-for="(group, index) in pickedGroups"
			:key="index"
			:src="group[frameCounter % group.length]"
			:style="{
				transition: 'all 0.3s ease',
				width: '36px',
				height: '36px',
				objectFit: 'contain',
				imageRendering: 'pixelated',
				transform: emphasizedIndex === index ? 'translateY(-20%)' : 'translateY(0)',
			}"
			alt="Animated Piece"
		>
	</div>
</template>
