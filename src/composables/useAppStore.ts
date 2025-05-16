export const useAppStore = defineStore('app', () => {
	const isDark = useDark({
		selector: 'body',
		attribute: 'color-scheme',
		valueDark: 'dark',
		valueLight: 'light',
	})
	const toggleDark = useToggle(isDark)

	const isReady = ref(false)
	const ready = Promise.all([
		useMusicStore().ready,
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
