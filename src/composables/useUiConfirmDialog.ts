import UiDialog from '@/components/UiDialog.vue'

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
							UiDialog,
							{
								defaultOpen: true,
								contentClass: pika({ width: '500px' }),
								onClose: () => resolve(false),
							},
							{
								title: () => args[0].title,
								description: () => args[0].description,
								actions: () => h(
									'div',
									{
										class: pika({
											display: 'flex',
											justifyContent: 'end',
											gap: '16px',
										}),
									},
									[
										h('button', { class: pika('primary-plain-btn'), onClick: () => resolve(false) }, args[0].cancelText || 'No'),
										h('button', { class: pika('primary-btn'), onClick: () => resolve(true) }, args[0].confirmText || 'Yes'),
									],
								),
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
