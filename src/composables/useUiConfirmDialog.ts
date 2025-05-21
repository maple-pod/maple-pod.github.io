import _UiConfirmDialog from '@/components/_UiConfirmDialog.vue'

interface ConfirmDialogOptions {
	title: string
	description: string
	confirmText?: string
	cancelText?: string
}

export const useUiConfirmDialog = createSharedComposable(() => {
	const UiConfirmDialogPromise = createTemplatePromise<boolean, [ConfirmDialogOptions]>()

	function confirm(options: ConfirmDialogOptions) {
		return UiConfirmDialogPromise.start(options)
	}

	const UiConfirmDialog = defineComponent({
		name: 'UiConfirmDialog',
		setup: () => {
			return () => h(
				UiConfirmDialogPromise,
				null,
				{
					default: ({
						resolve,
						args,
					}: {
						resolve: (value: boolean) => void
						args: [ConfirmDialogOptions]
					}) => {
						return h(
							_UiConfirmDialog,
							{
								defaultOpen: true,
								contentClass: pika({ width: '500px' }),
								...args[0],
								onConfirm: bool => resolve(bool),
								onClose: () => resolve(false),
							},
						)
					},
				},
			)
		},
	})

	return {
		confirm,
		UiConfirmDialog,
	}
})
