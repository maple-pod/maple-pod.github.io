import { useHead } from '@unhead/vue'

export const useAppStore = defineStore('app', () => {
	const isDark = useDark({
		selector: 'body',
		attribute: 'color-scheme',
		valueDark: 'dark',
		valueLight: 'light',
	})
	const toggleDark = useToggle(isDark)

	const title = ref('Maple Pod')
	const icon = ref('/logo.png')

	useHead({
		title,
		link: [
			{ rel: 'icon', href: icon },
		],
	})

	const musicStore = useMusicStore()
	watch(
		() => musicStore.currentMusic,
		(currentMusic) => {
			if (currentMusic == null) {
				title.value = 'Maple Pod'
				return
			}

			title.value = `♪ ${currentMusic.title} | Maple Pod`
			icon.value = currentMusic.cover
		},
	)

	const isReady = ref(false)
	const ready = Promise.all([
		musicStore.ready,
	]).then(() => {
		isReady.value = true
	})

	return {
		isDark,
		toggleDark,
		ready,
		isReady,
	}
})

if (import.meta.hot)
	import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot))
