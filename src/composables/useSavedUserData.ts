import type { SavedUserData } from '@/types'

function toSavedPreferenceRef<P extends keyof SavedUserData['preferences']>(
	savedUserData: Ref<SavedUserData>,
	preference: P,
) {
	return computed<SavedUserData['preferences'][P]>({
		get: () => savedUserData.value.preferences[preference],
		set: value => savedUserData.value.preferences[preference] = value,
	})
}

function createInitialSavedUserData(): SavedUserData {
	return {
		preferences: {
			theme: 'auto',
			volume: 1,
			muted: false,
			random: false,
			repeated: 'off',
		},
		liked: {
			id: 'liked',
			title: 'Liked',
			list: [],
		},
		playlists: [],
	}
}

export const useSavedUserData = createSharedComposable(() => {
	const savedUserData = useLocalStorage<SavedUserData>('maple-pod', createInitialSavedUserData)

	const theme = toSavedPreferenceRef(savedUserData, 'theme')
	const volume = toSavedPreferenceRef(savedUserData, 'volume')
	const muted = toSavedPreferenceRef(savedUserData, 'muted')
	const random = toSavedPreferenceRef(savedUserData, 'random')
	const repeated = toSavedPreferenceRef(savedUserData, 'repeated')
	const likedPlaylist = computed({
		get: () => savedUserData.value.liked,
		set: value => savedUserData.value.liked = value,
	})
	const savedPlaylists = computed({
		get: () => savedUserData.value.playlists,
		set: value => savedUserData.value.playlists = value,
	})

	return {
		savedUserData,
		theme,
		volume,
		muted,
		random,
		repeated,
		likedPlaylist,
		savedPlaylists,
	}
})
