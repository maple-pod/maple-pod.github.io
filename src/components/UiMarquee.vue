<script setup lang="ts">
const el = useTemplateRef('el')

const SPEED = 8

const isOverflow = ref(false)
const marqueeDistance = ref(0)
function checkOverflow() {
	const { scrollWidth, clientWidth } = el.value!
	isOverflow.value = scrollWidth > clientWidth
	marqueeDistance.value = scrollWidth - clientWidth
}
onMounted(checkOverflow)
useResizeObserver(el, checkOverflow, { box: 'border-box' })
</script>

<template>
	<span
		ref="el"
		:class="pika({
			display: 'inline-block',
			overflow: 'hidden',
			whiteSpace: 'nowrap',
		})"
		v-bind="$attrs"
	>
		<span
			:style="{
				'--marquee-distance': isOverflow ? `${marqueeDistance}px` : '0',
				'--marquee-duration': isOverflow ? `${(marqueeDistance / SPEED)}s` : '0',
			}"
			:class="{
				[pika({
					display: 'inline-block',
					animation: `var(--marquee-duration) marquee linear infinite alternate`,
				})]: isOverflow,
			}"
		>
			<slot />
		</span>
	</span>
</template>
