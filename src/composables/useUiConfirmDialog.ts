import _UiConfirmDialog from '@/components/_UiConfirmDialog.vue'

interface ConfirmDialogOptions {
	title: string
	description: string
	confirmText?: string
	cancelText?: string
}

export const useUiConfirmDialog = createSharedComposable(() => {
	const { dialog } = useAppDialog()

	function confirm(options: ConfirmDialogOptions) {
		return dialog(_UiConfirmDialog, {
			defaultOpen: true,
			contentClass: pika({ width: '500px' }),
			...options,
		})
	}

	return {
		confirm,
	}
})
