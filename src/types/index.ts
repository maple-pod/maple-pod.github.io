export interface SavedUserData {
	preferences: {
		theme: 'light' | 'dark' | 'auto'
		bgImage: 'none' | 'auto' | (string & {})
		volume: number
		muted: boolean
		random: boolean
		repeated: 'off' | 'repeat' | 'repeat-1'
		experimentalLoudnessNormalization: boolean
	}
	liked: Playlist<'liked'>
	playlists: Playlist<CustomPlaylistId>[]
	history: string[]
}

export interface ResourceBgm {
	description: string
	filename: string
	audio?: {
		file: string
		codec: string
		container: string
	}
	mark: string
	duration: number
	metadata: {
		albumArtist: string
		artist: string
		title: string
		year: string
	}
	source: {
		client: string
		date: string
		structure: string
		version: string
	}
	youtube: string
}

export interface Resources {
	bgms: ResourceBgm[]
	marks: Record<string, string>
	builtAt?: number
}

export interface LoudnessAnalysisTrack {
	filename: string
	file: string
	codec: string
	container: string
	duration: number
	year: string | null
	integratedLufs: number
	truePeakDbtp: number
	loudnessRangeLu: number
	thresholdLufs: number
}

export interface LoudnessAnalysisReport {
	resourceBuiltAt: number
	trackCount: number
	successCount: number
	failureCount: number
	tracks: LoudnessAnalysisTrack[]
}

export interface MusicData {
	id: string
	title: string
	cover: string
	src: string
	duration: number
	loudness?: LoudnessAnalysisTrack

	data: ResourceBgm
}

export type LikedPlaylistId = 'liked'
export type CustomPlaylistId = `custom:${string}`
export type SaveablePlaylistId = CustomPlaylistId | LikedPlaylistId
export type PlaylistId = 'all' | SaveablePlaylistId

export interface Playlist<Id extends PlaylistId = PlaylistId> {
	id: Id
	title: string
	list: string[]
}

export interface HashActionImportSavedUserData {
	type: 'import-saved-user-data'
	data: SavedUserData
}

export interface HashActionImportSaveablePlaylist {
	type: 'import-saveable-playlist'
	data: Playlist<SaveablePlaylistId>
}
