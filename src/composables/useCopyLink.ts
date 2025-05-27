export function useCopyLink() {
	const { copy } = useClipboard({ legacy: true })
	const { toast } = useUiToast()
	async function copyLink({
		link,
		title = 'Link Copied!',
		duration = 2000,
	}: {
		link: string
		title?: string
		duration?: number
	}) {
		copy(link)
		toast({ title, duration })
	}

	return {
		copyLink,
	}
}
