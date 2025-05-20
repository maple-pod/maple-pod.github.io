import type { SavedUserData } from '@/types'
import { exportToJSONFile } from '@/utils/common'
import { array, boolean, literal, maxValue, minValue, number, object, pipe, safeParse, startsWith, string, union } from 'valibot'

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

const schemaSavedUserData = object({
	preferences: object({
		theme: union([
			literal('light'),
			literal('dark'),
			literal('auto'),
		]),
		volume: pipe(
			number(),
			minValue(0),
			maxValue(1),
		),
		muted: boolean(),
		random: boolean(),
		repeated: union([
			literal('off'),
			literal('repeat'),
			literal('repeat-1'),
		]),
	}),
	liked: object({
		id: literal('liked'),
		title: literal('Liked'),
		list: array(string()),
	}),
	playlists: array(object({
		id: pipe(
			string(),
			startsWith('custom:'),
		),
		title: string(),
		list: array(string()),
	})),
})

function parseSavedUserData(data: unknown): SavedUserData | null {
	if (typeof data !== 'object' || data === null) {
		return null
	}

	const result = safeParse(schemaSavedUserData, data)
	if (result.success === false) {
		console.error('Failed to parse saved user data:', result.issues)
		return null
	}

	return result.output as SavedUserData
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

	function exportSavedUserData() {
		const timeStr = new Date().toISOString()
		exportToJSONFile(savedUserData.value, `maple-pod.${timeStr}.json`)
	}

	async function importSavedUserData(file: File) {
		const text = await file.text()
		const data = JSON.parse(text)
		const parsedData = parseSavedUserData(data)
		if (parsedData == null) {
			return
		}
		savedUserData.value = parsedData
		window.location.reload()
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
		exportSavedUserData,
		importSavedUserData,
	}
})
