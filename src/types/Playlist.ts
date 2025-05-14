export type PlaylistId = 'all' | 'liked' | `custom:${string}`

export type SaveablePlaylistId = Exclude<PlaylistId, 'all'>

export interface Playlist {
	id: PlaylistId
	title: string
	list: string[]
}
