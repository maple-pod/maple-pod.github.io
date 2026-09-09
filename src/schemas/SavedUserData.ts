import { array, boolean, literal, maxValue, minValue, number, object, pipe, startsWith, string, union } from 'valibot'

export const SavedUserDataSchema = object({
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
