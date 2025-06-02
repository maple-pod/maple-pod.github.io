import { array, literal, object, pipe, startsWith, string, union } from 'valibot'

export const SaveablePlaylistSchema = object({
	id: union([
		literal('liked'),
		pipe(
			string(),
			startsWith('custom:'),
		),
	]),
	title: string(),
	list: array(string()),
})
