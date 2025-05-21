import type { HashActionImportSavedUserData, SavedUserData } from '@/types'
import { SavedUserDataSchema } from '@/schemas'
import { exportToJSONFile } from '@/utils/common'
import { safeParse } from 'valibot'

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
	const savedUserData = useLocalStorage<SavedUserData>('maple-pod', createInitialSavedUserData())

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

	function resetSavedUserData() {
		savedUserData.value = createInitialSavedUserData()
		window.location.reload()
	}

	function exportSavedUserDataFile() {
		const timeStr = new Date().toISOString()
		exportToJSONFile(savedUserData.value, `maple-pod.${timeStr}.json`)
	}

	async function importSavedUserDataFile(file: File) {
		const text = await file.text()
		const data = JSON.parse(text)
		const result = safeParse(SavedUserDataSchema, data)

		if (result.success === false) {
			console.error('Failed to parse saved user data:', result.issues)
			return
		}

		savedUserData.value = result.output as SavedUserData
		window.location.reload()
	}

	const router = useRouter()
	function getImportSavedUserDataUrl() {
		const data: HashActionImportSavedUserData = {
			type: 'import-saved-user-data',
			data: savedUserData.value,
		}
		const url = router.resolve({
			name: Routes.Root,
			hash: dataToUrlHash(data),
		})
		return `${window.location.origin}${url.href}`
	}

	return {
		savedUserData,
		theme,
		volume,
		muted,
		random,
		repeated,
		likedPlaylist,
		savedPlaylists,
		resetSavedUserData,
		exportSavedUserDataFile,
		importSavedUserDataFile,
		getImportSavedUserDataUrl,
	}
})
