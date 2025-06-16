import type { PlaylistId } from '@/types'
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
		return bgData.value.list.toSorted(() => Math.random() - 0.5)
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
		if (savedBgImage.value === 'none' || bgData.value == null) {
			return null
		}
		if (savedBgImage.value === 'auto') {
			return autoBgImageList.value[currentAutoBgImageIndex.value]!
		}
		return savedBgImage.value
	})

	const isDark = useDark({
		selector: 'body',
		attribute: 'color-scheme',
		valueDark: 'dark',
		valueLight: 'light',
		storageRef: theme,
	})
	const toggleDark = useToggle(isDark)

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

	const scrollPlaylistToIndex = shallowRef<((index: number) => void) | null>(null)
	const isHandlingShowMusicInPlaylist = ref(false)
	const router = useRouter()
	async function handleShowMusicInPlaylist(musicId?: string, playlistId?: PlaylistId) {
		const theMusicId = musicId || musicStore.currentMusic?.id
		const thePlaylistId = playlistId || musicStore.currentPlaylist?.id

		if (
			isHandlingShowMusicInPlaylist.value
			|| thePlaylistId == null
			|| theMusicId == null
		) {
			isHandlingShowMusicInPlaylist.value = false
			return
		}

		const thePlaylist = musicStore.getPlaylist(thePlaylistId)
		if (thePlaylist == null) {
			isHandlingShowMusicInPlaylist.value = false
			return
		}

		isHandlingShowMusicInPlaylist.value = true
		const scrollToIndex = thePlaylist.list.indexOf(theMusicId)
		if (scrollToIndex === -1) {
			isHandlingShowMusicInPlaylist.value = false
			return
		}

		await router.push({
			name: Routes.Playlist,
			params: { playlistId: thePlaylistId },
		})
		scrollPlaylistToIndex.value?.(scrollToIndex)

		isHandlingShowMusicInPlaylist.value = false
	}

	const isReady = ref(false)
	const ready = Promise.all([
		musicStore.ready,
	]).then(() => {
		isReady.value = true
	})

	return {
		isDark,
		toggleDark,
		bgData,
		savedBgImage,
		currentBgImage,
		currentAutoBgPreview,
		scrollPlaylistToIndex,
		handleShowMusicInPlaylist,
		ready,
		isReady,
	}
})

if (import.meta.hot)
	import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot))
