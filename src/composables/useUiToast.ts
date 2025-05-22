import _UiToast from '@/components/_UiToast.vue'

interface ToastOptions {
	title?: string
	description?: string
	duration?: number
}

export const useUiToast = createSharedComposable(() => {
	const UiToastPromise = createTemplatePromise<void, [ToastOptions & { id: number }]>()
	const toastId = ref(0)
	const toasts = ref<Record<number, boolean>>({})

	async function toast(options: ToastOptions) {
		const id = toastId.value++
		toasts.value[id] = true
		await UiToastPromise.start({ ...options, id })
		delete toasts.value[id]
	}

	const UiToast = defineComponent({
		name: 'UiToast',
		setup: () => {
			return () => h(
				UiToastPromise,
				null,
				{
					default: ({
						resolve,
						args,
					}: {
						resolve: () => void
						args: [ToastOptions & { id: number }]
					}) => {
						return h(
							_UiToast,
							{
								'open': toasts.value[args[0].id],
								'onUpdate:open': (open: boolean) => {
									if (open === false) {
										resolve()
									}
								},
								...args[0],
							},
						)
					},
				},
			)
		},
	})

	return {
		toast,
		UiToast,
	}
})
