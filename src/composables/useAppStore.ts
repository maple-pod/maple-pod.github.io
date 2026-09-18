import type { PlaylistId, SavedUserData } from '@/types'
import { useHead } from '@unhead/vue'
import { ofetch } from 'ofetch'

export const useAppStore = defineStore('app', () => {
	const { theme, bgImage: savedBgImage } = useSavedUserData()

	const { state: bgData } = useAsyncState(
		async () => {
			const { list, preview } = await ofetch<{ list: string[], preview: Record<string, string> }>('/resources/bg.json')
			const result = {
				list,
				preview: {} as Record<string, string>,
			}
			await Promise.all(
				list.map(async (bg) => {
					result.preview[bg] = await decodeImageFromBinary(preview[bg]!)
				}),
			)
			return result
		},
		null,
	)
	const autoBgImageList = computed(() => {
		if (bgData.value == null) {
			return []
		}
		return [...bgData.value.list].sort(() => Math.random() - 0.5)
	})
	const currentAutoBgImageIndex = ref(0)
	function nextAutoBgImage() {
		if (bgData.value == null || bgData.value.list.length === 0) {
			return
		}
		currentAutoBgImageIndex.value = (currentAutoBgImageIndex.value + 1) % bgData.value.list.length
	}
	useIntervalFn(nextAutoBgImage, 5 * 60 * 1000)
	const currentAutoBgPreview = computed(() => {
		if (bgData.value == null) {
			return null
		}
		return bgData.value.preview[autoBgImageList.value[currentAutoBgImageIndex.value]!] || null
	})
	const currentBgImage = computed(() => {
		if (savedBgImage.value === 'none' || bgData.value == null)
			return null
		if (savedBgImage.value === 'auto')
			return autoBgImageList.value[currentAutoBgImageIndex.value] ?? null
		if (bgData.value.list.includes(savedBgImage.value) === false)
			return null
		return savedBgImage.value
	})

	const systemPrefersDark = usePreferredDark()
	const isDark = computed(() => theme.value === 'dark' || (theme.value === 'auto' && systemPrefersDark.value))
	watch(
		isDark,
		(dark) => {
			document.body.setAttribute('color-scheme', dark ? 'dark' : 'light')
		},
		{ immediate: true },
	)
	function setTheme(nextTheme: SavedUserData['preferences']['theme']) {
		theme.value = nextTheme
	}

	const title = ref('Maple Pod')

	useHead({
		title,
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
		},
	)

	interface PlaylistRevealRequest {
		id: number
		playlistId: PlaylistId
		musicId: string
	}

	let nextPlaylistRevealRequestId = 0
	let playlistRevealCompletion: { id: number, resolve: () => void } | null = null
	const playlistRevealRequest = shallowRef<PlaylistRevealRequest | null>(null)
	const isHandlingShowMusicInPlaylist = ref(false)
	const router = useRouter()

	function completePlaylistReveal(request: PlaylistRevealRequest) {
		if (playlistRevealRequest.value?.id === request.id)
			playlistRevealRequest.value = null
		if (playlistRevealCompletion?.id === request.id) {
			playlistRevealCompletion.resolve()
			playlistRevealCompletion = null
		}
	}

	async function handleShowMusicInPlaylist(musicId?: string, playlistId?: PlaylistId) {
		const theMusicId = musicId || musicStore.currentMusic?.id
		const thePlaylistId = playlistId || musicStore.currentPlaylist?.id

		if (isHandlingShowMusicInPlaylist.value || thePlaylistId == null || theMusicId == null)
			return

		const thePlaylist = musicStore.getPlaylist(thePlaylistId)
		if (thePlaylist == null || thePlaylist.list.includes(theMusicId) === false)
			return

		const request: PlaylistRevealRequest = {
			id: ++nextPlaylistRevealRequestId,
			playlistId: thePlaylistId,
			musicId: theMusicId,
		}
		const completion = new Promise<void>((resolve) => {
			playlistRevealCompletion = { id: request.id, resolve }
		})
		playlistRevealRequest.value = request
		isHandlingShowMusicInPlaylist.value = true
		try {
			await router.push({
				name: Routes.Playlist,
				params: { playlistId: thePlaylistId },
			})
			if (
				router.currentRoute.value.name !== Routes.Playlist
				|| router.currentRoute.value.params.playlistId !== thePlaylistId
			) {
				completePlaylistReveal(request)
				return
			}
			await completion
		}
		catch (cause) {
			completePlaylistReveal(request)
			throw cause
		}
		finally {
			isHandlingShowMusicInPlaylist.value = false
		}
	}

	const isReady = ref(false)
	const ready = Promise.all([
		musicStore.ready,
	])
		.then(() => {
			isReady.value = true
		})

	return {
		isDark,
		theme,
		setTheme,
		bgData,
		savedBgImage,
		currentBgImage,
		currentAutoBgPreview,
		playlistRevealRequest,
		completePlaylistReveal,
		handleShowMusicInPlaylist,
		ready,
		isReady,
	}
})

if (import.meta.hot)
	import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot))
