import type { InferOutput } from 'valibot'
import { array, check, finite, integer, literal, nullable, number, optional, pipe, record, safeParse, strictObject, string, union } from 'valibot'
import {
	withWorldMapCacheKey,
	WORLD_MAP_CANONICAL_SCHEMA_VERSION,
	WORLD_MAP_RUNTIME_SCHEMA_VERSION,
} from '@/constants/worldMapRuntime'

const NullableStringSchema = nullable(string())
const FiniteNumberSchema = pipe(number(), finite())
const IntegerNumberSchema = pipe(number(), finite(), integer())
const SnapshotRegionSchema = union([literal('GMS'), literal('TWMS')])
const SnapshotIdSchema = pipe(
	string(),
	check(value => /^(?:GMS|TWMS)\/[^/]+$/.test(value), 'snapshot ID must be <region>/<version>'),
)

const ArchivedWzSourceSchema = strictObject({
	providerRegion: string(),
	providerVersion: string(),
	archiveItem: string(),
	archiveFile: string(),
	archiveSha1: string(),
	members: strictObject({
		stringWz: strictObject({
			name: literal('String.wz'),
			sha256: string(),
		}),
		mapWz: strictObject({
			name: literal('Map.wz'),
			sha256: string(),
		}),
	}),
})

const GameDataSourceSchema = strictObject({
	provider: union([literal('maplestory-io'), literal('maplearchive'), literal('archived-wz')]),
	region: string(),
	logicalRegion: optional(SnapshotRegionSchema),
	version: NullableStringSchema,
	apiBase: string(),
	releaseId: optional(string()),
	archivedWz: optional(ArchivedWzSourceSchema),
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
		source: nullable(union([literal('gms-map-bgm'), literal('game-map-bgm')])),
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

const WorldMapHitPathSchema = strictObject({
	d: string(),
	fillRule: literal('evenodd'),
})

const WorldMapGraphLinkSchema = strictObject({
	id: string(),
	canonicalLabel: NullableStringSchema,
	localizedNames: record(string(), LocalizedNameSchema),
	targetWorldMapId: string(),
	linkImage: nullable(WorldMapAssetSchema),
	screenOrigin: OriginSchema,
	hitRect: nullable(NormalizedRectSchema),
	hitPath: nullable(WorldMapHitPathSchema),
})

const WorldMapNodeSchema = strictObject({
	worldMapId: string(),
	worldMapName: string(),
	canonicalLabel: NullableStringSchema,
	canonicalLabelSource: optional(nullable(union([literal('string-wz'), literal('inbound-link-tooltip')]))),
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

const RuntimeAssetsSchema = strictObject({
	root: literal('world-map'),
	canonicalImagePath: literal('world-map/images'),
	nativeWz: strictObject({
		region: string(),
		version: string(),
		pathPrefix: string(),
	}),
})

/** Versioned runtime manifest contains navigation metadata only; visual/BGM details stay in chunks. */
export const WorldMapManifestSchema = strictObject({
	schemaVersion: literal(WORLD_MAP_RUNTIME_SCHEMA_VERSION),
	canonicalSchemaVersion: literal(WORLD_MAP_CANONICAL_SCHEMA_VERSION),
	generatedAt: string(),
	cacheKey: pipe(string(), check(value => /^[0-9a-f]{64}$/i.test(value), 'cacheKey must be a SHA-256')),
	roots: array(string()),
	nodeCount: pipe(IntegerNumberSchema, check(value => value >= 0, 'nodeCount must not be negative')),
	nodes: array(WorldMapManifestNodeSchema),
	unresolved: strictObject({
		missingParentWorldMapIds: array(string()),
		missingLinkTargetWorldMapIds: array(string()),
	}),
	source: GameDataSourceSchema,
	assets: RuntimeAssetsSchema,
})

const WorldMapNodeChunkSchema = strictObject({
	schemaVersion: literal(WORLD_MAP_RUNTIME_SCHEMA_VERSION),
	canonicalSchemaVersion: literal(WORLD_MAP_CANONICAL_SCHEMA_VERSION),
	worldMapId: string(),
	node: WorldMapNodeSchema,
})

const WorldMapSnapshotFingerprintSchema = strictObject({
	topology: string(),
	geometry: string(),
	assets: string(),
	worldMapNames: string(),
	mapDetails: string(),
	combined: string(),
})

const WorldMapSnapshotMapleStoryIoSchema = strictObject({
	provider: literal('maplestory-io'),
	regionCode: string(),
	version: string(),
})

const WorldMapSnapshotMapleArchiveSchema = strictObject({
	provider: literal('maplearchive'),
	regionSlug: string(),
	versionLabel: string(),
})

const WorldMapSnapshotCatalogEntrySchema = strictObject({
	id: SnapshotIdSchema,
	label: string(),
	region: SnapshotRegionSchema,
	version: string(),
	recommended: union([literal(true), literal(false)]),
	selectable: union([literal(true), literal(false)]),
	historicallyImportant: union([literal(true), literal(false)]),
	worldMapDataDistinct: nullable(union([literal(true), literal(false)])),
	worldMapComparedTo: NullableStringSchema,
	mapleStoryIo: nullable(WorldMapSnapshotMapleStoryIoSchema),
	mapleArchive: nullable(WorldMapSnapshotMapleArchiveSchema),
	fingerprint: nullable(WorldMapSnapshotFingerprintSchema),
	dataRef: NullableStringSchema,
	notes: array(string()),
})

export const WorldMapSnapshotCatalogSchema = strictObject({
	schemaVersion: literal(1),
	generatedAt: string(),
	defaultSnapshot: SnapshotIdSchema,
	entries: array(WorldMapSnapshotCatalogEntrySchema),
})

export type WorldMapSnapshotId = `${'GMS' | 'TWMS'}/${string}`
export type GameDataSource = InferOutput<typeof GameDataSourceSchema>
export type WorldMapSnapshotCatalogEntry = InferOutput<typeof WorldMapSnapshotCatalogEntrySchema> & { id: WorldMapSnapshotId }
export type WorldMapSnapshotCatalog = Omit<InferOutput<typeof WorldMapSnapshotCatalogSchema>, 'defaultSnapshot' | 'entries'> & {
	defaultSnapshot: WorldMapSnapshotId
	entries: WorldMapSnapshotCatalogEntry[]
}

export interface LocalizedWorldMapName {
	name: string | null
	source: GameDataSource
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

export interface WorldMapRuntimeAssets {
	root: 'world-map'
	canonicalImagePath: 'world-map/images'
	nativeWz: {
		region: string
		version: string
		pathPrefix: string
	}
}

export interface WorldMapManifest {
	schemaVersion: 3
	canonicalSchemaVersion: 8
	generatedAt: string
	cacheKey: string
	roots: string[]
	nodeCount: number
	nodes: WorldMapManifestNode[]
	unresolved: {
		missingParentWorldMapIds: string[]
		missingLinkTargetWorldMapIds: string[]
	}
	source: GameDataSource
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
		source: 'gms-map-bgm' | 'game-map-bgm' | null
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

export interface WorldMapHitPath {
	d: string
	fillRule: 'evenodd'
}

export interface WorldMapGraphLink {
	id: string
	canonicalLabel: string | null
	localizedNames: Record<string, LocalizedWorldMapName>
	targetWorldMapId: string
	linkImage: WorldMapAsset | null
	screenOrigin: { x: number, y: number }
	hitRect: { left: number, top: number, width: number, height: number } | null
	hitPath: WorldMapHitPath | null
}

export interface WorldMapNode extends WorldMapNodeSummary {
	canonicalLabelSource?: 'string-wz' | 'inbound-link-tooltip' | null
	localizedNames: Record<string, LocalizedWorldMapName>
	baseImages: WorldMapAsset[]
	links: WorldMapGraphLink[]
	spots: WorldMapGraphSpot[]
	provenance: GameDataSource
}

type ParsedWorldMapManifest = InferOutput<typeof WorldMapManifestSchema>

export function parseWorldMapSnapshotCatalog(input: unknown): WorldMapSnapshotCatalog {
	const result = safeParse(WorldMapSnapshotCatalogSchema, input)
	if (!result.success)
		throw new Error('World map snapshot catalog is not a valid schema v1 resource.')

	const catalog = result.output as WorldMapSnapshotCatalog
	const entriesById = new Map(catalog.entries.map(entry => [entry.id, entry]))
	const defaultEntry = entriesById.get(catalog.defaultSnapshot)
	if (defaultEntry?.selectable !== true)
		throw new Error('World map snapshot catalog defaultSnapshot must reference a selectable entry.')
	for (const entry of catalog.entries) {
		if (entry.id !== `${entry.region}/${entry.version}`)
			throw new Error(`World map snapshot catalog entry ${entry.id} does not match its region/version.`)
	}
	return catalog
}

export function parseWorldMapManifest(input: unknown): WorldMapManifest {
	const result = safeParse(WorldMapManifestSchema, input)
	if (!result.success)
		throw new Error('World map manifest is not a valid runtime schema v3 / canonical schema v8 resource.')

	const value = result.output as ParsedWorldMapManifest
	return value
}

export function parseWorldMapNodeChunk(input: unknown): WorldMapNode {
	const result = safeParse(WorldMapNodeChunkSchema, input)
	if (!result.success)
		throw new Error('World map node is not a valid runtime schema v3 / canonical schema v8 chunk.')
	if (result.output.worldMapId !== result.output.node.worldMapId)
		throw new Error('World map node chunk ID does not match its node.')

	return result.output.node as WorldMapNode
}

export function getWorldMapAssetPath(file: string, cacheKey?: string | null) {
	const url = `/resources/${file}`
	return cacheKey == null ? url : withWorldMapCacheKey(url, cacheKey)
}
