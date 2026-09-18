import { array, boolean, check, literal, maxValue, minValue, nullable, number, object, optional, pipe, startsWith, string, union } from 'valibot'
import { WorldMapSnapshotIdSchema } from './WorldMaps'

const ThemeSchema = union([
	literal('light'),
	literal('dark'),
	literal('auto'),
])

const RepeatedSchema = union([
	literal('off'),
	literal('repeat'),
	literal('repeat-1'),
])

const VolumeSchema = pipe(
	number(),
	minValue(0),
	maxValue(1),
)

const LikedPlaylistSchema = object({
	id: literal('liked'),
	title: literal('Liked'),
	list: array(string()),
})

const CustomPlaylistSchema = object({
	id: pipe(
		string(),
		startsWith('custom:'),
	),
	title: pipe(
		string(),
		check((value) => {
			const trimmed = value.trim()
			return trimmed.length > 0 && trimmed.length <= 50
		}, 'playlist title must contain 1 to 50 characters after trimming'),
	),
	list: array(string()),
})

const CustomPlaylistsSchema = pipe(
	array(CustomPlaylistSchema),
	check(
		playlists => new Set(playlists.map(playlist => playlist.id)).size === playlists.length,
		'custom playlist IDs must be unique',
	),
)

export const SavedUserDataSchema = object({
	preferences: object({
		theme: ThemeSchema,
		bgImage: string(),
		volume: VolumeSchema,
		muted: boolean(),
		random: boolean(),
		repeated: RepeatedSchema,
	}),
	liked: LikedPlaylistSchema,
	playlists: CustomPlaylistsSchema,
	history: array(string()),
})

export const PortableSavedUserDataSchema = object({
	preferences: optional(object({
		theme: optional(ThemeSchema),
		bgImage: optional(string()),
		volume: optional(VolumeSchema),
		muted: optional(boolean()),
		random: optional(boolean()),
		repeated: optional(RepeatedSchema),
	})),
	liked: optional(LikedPlaylistSchema),
	playlists: optional(CustomPlaylistsSchema),
	worldMap: optional(object({
		lastSelectedSnapshot: optional(nullable(WorldMapSnapshotIdSchema)),
	})),
})
