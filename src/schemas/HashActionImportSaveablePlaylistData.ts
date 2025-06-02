import { literal, object } from 'valibot'
import { SaveablePlaylistSchema } from './SaveablePlaylist'

export const HashActionImportSaveablePlaylistSchema = object({
	type: literal('import-saveable-playlist'),
	data: SaveablePlaylistSchema,
})
