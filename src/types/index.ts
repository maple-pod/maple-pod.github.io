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
}

export interface MusicData {
	title: string
	cover: string
	src: string
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
