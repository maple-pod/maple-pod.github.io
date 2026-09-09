import type { InferOutput } from 'valibot'
import { array, check, finite, integer, literal, nullable, number, pipe, record, safeParse, strictObject, string, union } from 'valibot'

const NullableStringSchema = nullable(string())
const FiniteNumberSchema = pipe(number(), finite())
const IntegerNumberSchema = pipe(number(), finite(), integer())

const GameDataSourceSchema = strictObject({
	provider: literal('maplestory-io'),
	region: string(),
	version: nullable(number()),
	apiBase: string(),
})

const LocalizedNameSchema = strictObject({
	name: NullableStringSchema,
	source: GameDataSourceSchema,
	status: union([literal('available'), literal('unavailable')]),
	join: nullable(union([literal('mapId'), literal('worldMapId')])),
})

const OriginSchema = strictObject({
	x: FiniteNumberSchema,
	y: FiniteNumberSchema,
})

const NormalizedRectSchema = strictObject({
	left: FiniteNumberSchema,
	top: FiniteNumberSchema,
	width: FiniteNumberSchema,
	height: FiniteNumberSchema,
})

const AssetPathSchema = pipe(
	string(),
	check(
		file => file.startsWith('world-map/') && file.startsWith('/') === false && file.includes('://') === false,
		'world-map asset path must be relative to the resources root',
	),
)

const WorldMapAssetSchema = strictObject({
	file: AssetPathSchema,
	width: pipe(IntegerNumberSchema, check(value => value > 0, 'image width must be positive')),
	height: pipe(IntegerNumberSchema, check(value => value > 0, 'image height must be positive')),
	sha1: pipe(string(), check(value => /^[0-9a-f]{40}$/i.test(value), 'image sha1 must be 40 hex characters')),
	origin: OriginSchema,
})

const GameBgmSchema = strictObject({
	path: string(),
	structure: NullableStringSchema,
	filename: NullableStringSchema,
	trackId: NullableStringSchema,
})

const GraphSelectionSchema = pipe(
	strictObject({
		trackId: NullableStringSchema,
		source: nullable(literal('gms-map-bgm')),
	}),
	check(
		selection => (selection.trackId == null) === (selection.source == null),
		'selection.trackId and selection.source must be both null or both present',
	),
)

const WorldMapGraphMapSchema = strictObject({
	mapId: pipe(string(), check(value => /^\d+$/.test(value), 'mapId must be numeric')),
	name: NullableStringSchema,
	streetName: NullableStringSchema,
	mapMark: NullableStringSchema,
	localizedNames: record(string(), LocalizedNameSchema),
	gameBgm: nullable(GameBgmSchema),
	selection: GraphSelectionSchema,
})

const WorldMapGraphSpotSchema = strictObject({
	id: string(),
	spot: OriginSchema,
	type: nullable(union([number(), string()])),
	mapNumbers: array(pipe(string(), check(value => /^\d+$/.test(value), 'mapNumbers must contain numeric map IDs'))),
	point: strictObject({
		x: FiniteNumberSchema,
		y: FiniteNumberSchema,
		normalizedX: FiniteNumberSchema,
		normalizedY: FiniteNumberSchema,
	}),
	hitRect: nullable(NormalizedRectSchema),
	maps: array(WorldMapGraphMapSchema),
})

const WorldMapGraphLinkSchema = strictObject({
	id: string(),
	canonicalLabel: NullableStringSchema,
	localizedNames: record(string(), LocalizedNameSchema),
	targetWorldMapId: string(),
	linkImage: nullable(WorldMapAssetSchema),
	screenOrigin: OriginSchema,
	hitRect: nullable(NormalizedRectSchema),
})

const WorldMapNodeSchema = strictObject({
	worldMapId: string(),
	worldMapName: string(),
	canonicalLabel: NullableStringSchema,
	localizedNames: record(string(), LocalizedNameSchema),
	parentWorldMapId: NullableStringSchema,
	baseImages: array(WorldMapAssetSchema),
	links: array(WorldMapGraphLinkSchema),
	spots: array(WorldMapGraphSpotSchema),
	provenance: GameDataSourceSchema,
})

const WorldMapManifestNodeSchema = strictObject({
	worldMapId: string(),
	chunk: pipe(string(), check(value => /^nodes\/[^/]+\.json$/.test(value), 'chunk must be a node JSON path')),
	worldMapName: string(),
	canonicalLabel: NullableStringSchema,
	parentWorldMapId: NullableStringSchema,
	missingParentWorldMapId: NullableStringSchema,
	childWorldMapIds: array(string()),
	linkTargetWorldMapIds: array(string()),
	missingLinkTargetWorldMapIds: array(string()),
})

const RuntimeSourceSchema = strictObject({
	provider: literal('maplestory-io'),
	region: string(),
	version: pipe(IntegerNumberSchema, check(value => value > 0, 'runtime source version must be positive')),
	apiBase: string(),
})

const RuntimeAssetsSchema = strictObject({
	root: literal('world-map'),
	canonicalImagePath: literal('world-map/images'),
	nativeWz: strictObject({
		region: string(),
		version: pipe(IntegerNumberSchema, check(value => value > 0, 'native WZ version must be positive')),
		pathPrefix: string(),
	}),
})

/** Runtime manifest contains navigation metadata only; localization and visual/BGM details stay in chunks. */
export const WorldMapManifestSchema = strictObject({
	schemaVersion: literal(1),
	canonicalSchemaVersion: literal(6),
	generatedAt: string(),
	cacheKey: pipe(string(), check(value => /^[0-9a-f]{64}$/i.test(value), 'cacheKey must be a SHA-256')),
	roots: array(string()),
	nodeCount: pipe(IntegerNumberSchema, check(value => value >= 0, 'nodeCount must not be negative')),
	nodes: array(WorldMapManifestNodeSchema),
	unresolved: strictObject({
		missingParentWorldMapIds: array(string()),
		missingLinkTargetWorldMapIds: array(string()),
	}),
	source: RuntimeSourceSchema,
	assets: RuntimeAssetsSchema,
})

const WorldMapNodeChunkSchema = strictObject({
	schemaVersion: literal(1),
	canonicalSchemaVersion: literal(6),
	worldMapId: string(),
	node: WorldMapNodeSchema,
})

export interface LocalizedWorldMapName {
	name: string | null
	source: {
		provider: 'maplestory-io'
		region: string
		version: number | null
		apiBase: string
	}
	status: 'available' | 'unavailable'
	join: 'mapId' | 'worldMapId' | null
}

export interface WorldMapNodeSummary {
	worldMapId: string
	worldMapName: string
	canonicalLabel: string | null
	localizedNames?: Record<string, LocalizedWorldMapName>
	parentWorldMapId: string | null
}

export interface WorldMapManifestNode extends WorldMapNodeSummary {
	chunk: string
	missingParentWorldMapId: string | null
	childWorldMapIds: string[]
	linkTargetWorldMapIds: string[]
	missingLinkTargetWorldMapIds: string[]
}

export interface WorldMapRuntimeSource {
	provider: 'maplestory-io'
	region: string
	version: number
	apiBase: string
}

export interface WorldMapRuntimeAssets {
	root: 'world-map'
	canonicalImagePath: 'world-map/images'
	nativeWz: {
		region: string
		version: number
		pathPrefix: string
	}
}

export interface WorldMapManifest {
	schemaVersion: 1
	canonicalSchemaVersion: 6
	generatedAt: string
	cacheKey: string
	roots: string[]
	nodeCount: number
	nodes: WorldMapManifestNode[]
	unresolved: {
		missingParentWorldMapIds: string[]
		missingLinkTargetWorldMapIds: string[]
	}
	source: WorldMapRuntimeSource
	assets: WorldMapRuntimeAssets
}

export interface WorldMapAsset {
	file: string
	width: number
	height: number
	sha1: string
	origin: { x: number, y: number }
}

export interface WorldMapGraphMap {
	mapId: string
	name: string | null
	streetName: string | null
	mapMark: string | null
	localizedNames: Record<string, LocalizedWorldMapName>
	gameBgm: {
		path: string
		structure: string | null
		filename: string | null
		trackId: string | null
	} | null
	selection: {
		trackId: string | null
		source: 'gms-map-bgm' | null
	}
}

export interface WorldMapGraphSpot {
	id: string
	spot: { x: number, y: number }
	type: number | string | null
	mapNumbers: string[]
	point: {
		x: number
		y: number
		normalizedX: number
		normalizedY: number
	}
	hitRect: { left: number, top: number, width: number, height: number } | null
	maps: WorldMapGraphMap[]
}

export interface WorldMapGraphLink {
	id: string
	canonicalLabel: string | null
	localizedNames: Record<string, LocalizedWorldMapName>
	targetWorldMapId: string
	linkImage: WorldMapAsset | null
	screenOrigin: { x: number, y: number }
	hitRect: { left: number, top: number, width: number, height: number } | null
}

export interface WorldMapNode extends WorldMapNodeSummary {
	localizedNames: Record<string, LocalizedWorldMapName>
	baseImages: WorldMapAsset[]
	links: WorldMapGraphLink[]
	spots: WorldMapGraphSpot[]
	provenance: {
		provider: 'maplestory-io'
		region: string
		version: number | null
		apiBase: string
	}
}

type ParsedWorldMapManifest = InferOutput<typeof WorldMapManifestSchema>

export function parseWorldMapManifest(input: unknown): WorldMapManifest {
	const result = safeParse(WorldMapManifestSchema, input)
	if (!result.success)
		throw new Error('World map manifest is not a valid runtime schema v1 resource.')

	const value = result.output as ParsedWorldMapManifest
	return value
}

export function parseWorldMapNodeChunk(input: unknown): WorldMapNode {
	const result = safeParse(WorldMapNodeChunkSchema, input)
	if (!result.success)
		throw new Error('World map node is not a valid runtime schema v1 chunk.')
	if (result.output.worldMapId !== result.output.node.worldMapId)
		throw new Error('World map node chunk ID does not match its node.')

	return result.output.node
}

export function getWorldMapAssetPath(file: string) {
	return `/resources/${file}`
}
