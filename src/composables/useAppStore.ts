import type { PlaylistId } from '@/types'
import { useHead } from '@unhead/vue'

export const useAppStore = defineStore('app', () => {
	const { theme } = useSavedUserData()

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
		scrollPlaylistToIndex,
		handleShowMusicInPlaylist,
		ready,
		isReady,
	}
})

if (import.meta.hot)
	import.meta.hot.accept(acceptHMRUpdate(useAppStore, import.meta.hot))
