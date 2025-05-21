<script setup lang="ts">
const el = useTemplateRef('el')

const SPEED = 8
const ANIMATION_DELAY = 2000
const isOverflow = ref(false)
const marqueeDistance = ref(0)
const marqueeDuration = computed(() => Math.abs(marqueeDistance.value) / SPEED)
function checkOverflow() {
	const { scrollWidth, clientWidth } = el.value!
	isOverflow.value = scrollWidth > clientWidth
	marqueeDistance.value = clientWidth - scrollWidth
}
onMounted(checkOverflow)
useResizeObserver(el, checkOverflow, { box: 'border-box' })

const [marqueeDirection, toggleMarqueeDirection] = useToggle<'forward', 'backward'>('forward', { truthyValue: 'forward', falsyValue: 'backward' })
const resetDuration = computed(() => ANIMATION_DELAY + marqueeDuration.value * 1000)
const animating = autoResetRef(false, resetDuration)
whenever(
	() => isOverflow.value === true && animating.value === false,
	() => {
		toggleMarqueeDirection()
		animating.value = true
	},
	{ immediate: true },
)
</script>

<template>
	<span
		ref="el"
		:class="pika({
			display: 'inline-block',
			overflow: 'hidden',
			whiteSpace: 'nowrap',
			textOverflow: 'ellipsis',
		})"
		v-bind="$attrs"
	>
		<span
			:data-marquee-direction="marqueeDirection"
			:style="{
				'--marquee-distance': isOverflow ? `${marqueeDistance}px` : '0',
				'--marquee-duration': isOverflow ? `${marqueeDuration}s` : '0',
			}"
			:class="[
				isOverflow ? pika({
					'display': 'inline-block',
					'transition': 'transform var(--marquee-duration) linear',

					'$[data-marquee-direction=forward]': {
						transform: 'translate3d(0, 0, 0)',
					},
					'$[data-marquee-direction=backward]': {
						transform: 'translate3d(var(--marquee-distance), 0, 0)',
					},
				}) : undefined,
			]
			"
		>
			<slot />
		</span>
	</span>
</template>
