export interface SavedUserData {
	preferences: {
		theme: 'light' | 'dark' | 'auto'
		volume: number
		muted: boolean
		random: boolean
		repeated: 'off' | 'repeat' | 'repeat-1'
	}
	liked: Playlist<'liked'>
	playlists: Playlist<CustomPlaylistId>[]
	history: string[]
}

export interface ResourceBgm {
	description: string
	filename: string
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
}

export interface MusicData {
	id: string
	title: string
	cover: string
	src: string
	duration: number

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
