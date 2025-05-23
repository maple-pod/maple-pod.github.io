import type { ComponentProps } from 'vue-component-type-helpers'

interface DialogQueueItem {
	id: number
	component: any
}

type DialogProps<D> = ComponentProps<D> & Record<string, any>
type DialogResolved<D> = ComponentProps<D> extends infer P extends { onResolve?: any }
	? Parameters<NonNullable<P['onResolve']>>[0]
	: void

export const useAppDialog = createSharedComposable(() => {
	let idCounter = 0
	const queue = ref<DialogQueueItem[]>([])
	const current = computed<DialogQueueItem | null>(() => queue.value[0] ?? null)

	function dialog<D, Props extends DialogProps<D>, Resolved extends DialogResolved<D>>(DialogComponent: D, props: MaybeRefOrGetter<Props>): Promise<Resolved> {
		return new Promise<Resolved>((_resolve) => {
			const id = idCounter++
			const DialogPromise = createTemplatePromise<Resolved>()

			queue.value.push({
				id,
				component: markRaw(defineComponent({
					name: 'UseUiDialog',
					setup: () => {
						onMounted(async () => {
							const v = await DialogPromise.start()
							queue.value.shift()
							_resolve(v)
						})
						return () => h(DialogPromise, null, {
							default: ({
								resolve,
							}: {
								resolve: (value: Resolved) => void
							}) => h(
								DialogComponent as any,
								{
									...toValue(props),
									onResolve: (value: Resolved) => resolve(value),
								},
							),
						})
					},
				})),
			})
		})
	}

	const AppDialog = defineComponent({
		name: 'AppDialog',
		setup: () => {
			return () => current.value == null
				? null
				: h(current.value.component)
		},
	})

	return {
		dialog,
		AppDialog,
	}
})
