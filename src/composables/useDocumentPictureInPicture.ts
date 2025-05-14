import { Teleport } from 'vue'

export function useDocumentPictureInPicture() {
	const isSupported = useSupported(() => 'documentPictureInPicture' in window)
	const pipWindow = shallowRef<Window | null>(null)
	const pipBody = computed<HTMLBodyElement | null>(() => (pipWindow.value?.document.body ?? null) as HTMLBodyElement | null)
	let start: (options?: { width?: number, height?: number }) => Promise<void> = () => Promise.resolve()
	let stop: () => void = () => {}

	const PipBody = defineComponent({
		name: 'PipBody',
		setup: (_, { slots }) => {
			return () => [
				h(
					Teleport,
					{
						to: pipBody.value,
						disabled: pipBody.value == null,
						defer: true,
					},
					[slots.default?.()],
				),
				...(pipBody.value != null && slots.placeholder)
					? [slots.placeholder()]
					: [],
			]
		},
	})

	if (isSupported.value) {
		const { isDark } = storeToRefs(useAppStore())

		watch(
			[pipBody, isDark],
			([pipBody, isDark]) => {
				if (pipBody) {
					pipBody.setAttribute('color-scheme', isDark ? 'dark' : 'light')
				}
			},
			{ immediate: true },
		)

		function cloneStyleSheets() {
			const elList = [...document.styleSheets].map((styleSheet) => {
				try {
					const cssRules = [...styleSheet.cssRules].map(rule => rule.cssText).join('')
					const style = document.createElement('style')

					style.textContent = cssRules
					return style
				}
				catch {
					const link = document.createElement('link')

					link.rel = 'stylesheet'
					link.type = styleSheet.type
					link.media = styleSheet.media as any
					link.href = styleSheet.href as any
					return link
				}
			})
			return elList
		}

		start = async (options) => {
			if (isSupported.value) {
				const _pipWindow = await (window as any).documentPictureInPicture.requestWindow(options)
				// Copy style sheets over from the initial document
				// so that the player looks the same.
				cloneStyleSheets().forEach((style) => {
					_pipWindow.document.head.appendChild(style)
				})

				_pipWindow.addEventListener('pagehide', () => {
					(window as any).documentPictureInPicture.window.close()
					pipWindow.value = null
				})
				pipWindow.value = _pipWindow
			}
		}

		stop = () => {
			if (pipWindow.value) {
				pipWindow.value.close()
				pipWindow.value = null
			}
		}
	}

	return {
		isSupported,
		pipWindow,
		pipBody,
		start,
		stop,
		PipBody,
	}
}
