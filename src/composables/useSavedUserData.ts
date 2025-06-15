import type { SavedUserData } from '@/types'

function toSavedPreferenceRef<P extends keyof SavedUserData['preferences']>(
	savedUserData: Ref<SavedUserData>,
	preference: P,
	defaultValue?: SavedUserData['preferences'][P],
) {
	return computed<SavedUserData['preferences'][P]>({
		get: () => savedUserData.value.preferences[preference] ?? defaultValue,
		set: value => savedUserData.value.preferences[preference] = value,
	})
}

function createInitialSavedUserData(): SavedUserData {
	return {
		preferences: {
			theme: 'auto',
			bgImage: 'none',
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
		history: [],
	}
}

export const useSavedUserData = createSharedComposable(() => {
	const savedUserData = useLocalStorage<SavedUserData>(
		'maple-pod',
		createInitialSavedUserData,
		{
			mergeDefaults: true,
		},
	)

	const theme = toSavedPreferenceRef(savedUserData, 'theme')
	const bgImage = toSavedPreferenceRef(savedUserData, 'bgImage', 'none')
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
	const history = computed({
		get: () => savedUserData.value.history,
		set: value => savedUserData.value.history = value,
	})

	return {
		savedUserData,
		theme,
		bgImage,
		volume,
		muted,
		random,
		repeated,
		likedPlaylist,
		savedPlaylists,
		history,
	}
})
