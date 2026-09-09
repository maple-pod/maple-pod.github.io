<script setup lang="ts">
import type {
	WorldMapAsset,
	WorldMapGraphLink,
	WorldMapGraphMap,
	WorldMapGraphSpot,
	WorldMapNodeSummary,
} from '@/schemas'
import {
	getWorldMapBreadcrumb,
	getWorldMapNameRows,
	getWorldMapNodeById,
	getWorldMapNodeLabel,
	getWorldMapSpotRepresentative,
} from '@/composables/useWorldMaps'
import { getWorldMapAssetPath } from '@/schemas'

interface ActiveLinkTarget {
	kind: 'link'
	id: string
}

interface ActiveSpotTarget {
	kind: 'spot'
	id: string
}

type ActiveTarget = ActiveLinkTarget | ActiveSpotTarget

const musicStore = useMusicStore()
const { currentMusic } = storeToRefs(musicStore)
const {
	manifest,
	loadedNodes,
	loading,
	error,
	reload,
	loadNode,
	retryNode,
	getNodeState,
} = useWorldMaps()
const {
	status: worldMapOfflineStatus,
	progress: worldMapOfflineProgress,
	setManifest: setWorldMapOfflineManifest,
	downloadAll: downloadWorldMapsForOffline,
	cancel: cancelWorldMapDownload,
	remove: removeWorldMapsOffline,
	isReady: worldMapOfflineReady,
} = useWorldMapOffline()
const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')
const isOnline = useOnline()

const selectedRootId = ref<string>('WorldMap')
const currentNodeId = ref<string>('WorldMap')
const activeTarget = shallowRef<ActiveTarget | null>(null)

const nodeById = computed(() => new Map((manifest.value?.nodes ?? []).map(node => [node.worldMapId, node])))
const rootIds = computed(() => manifest.value?.roots.length
	? manifest.value.roots
	: (manifest.value?.nodes ?? [])
			.filter(node => node.parentWorldMapId == null)
			.map(node => node.worldMapId))
const selectableRoots = computed(() => rootIds.value
	.map(worldMapId => getWorldMapNodeById(manifest.value?.nodes ?? null, worldMapId))
	.filter((node): node is NonNullable<typeof node> => node != null))
const currentNode = computed(() => loadedNodes.value.get(currentNodeId.value) ?? null)
const displayNodeById = computed(() => {
	const nodes = new Map<string, WorldMapNodeSummary>(nodeById.value)
	for (const node of loadedNodes.value.values())
		nodes.set(node.worldMapId, node)
	return nodes
})
const currentNodeSummary = computed(() => displayNodeById.value.get(currentNodeId.value) ?? null)
const currentNodeState = computed(() => getNodeState(currentNodeId.value))
const currentNodeLoading = computed(() => currentNodeState.value.status === 'loading')
const referenceImage = computed(() => currentNode.value?.baseImages[0] ?? null)
const breadcrumb = computed(() => {
	const nodes = manifest.value?.nodes ?? []
	const trail = getWorldMapBreadcrumb(nodes.map(node => displayNodeById.value.get(node.worldMapId) ?? node), currentNodeId.value)
	const selectedRoot = displayNodeById.value.get(selectedRootId.value)
	if (selectedRoot == null)
		return trail
	if (trail[0]?.worldMapId === selectedRoot.worldMapId)
		return trail
	return trail.some(node => node.worldMapId === selectedRoot.worldMapId)
		? trail
		: [selectedRoot, ...trail.filter(node => node.worldMapId !== selectedRoot.worldMapId)]
})
const breadcrumbAfterRoot = computed(() => breadcrumb.value.filter(node => node.worldMapId !== selectedRootId.value))

const activeLink = computed(() => {
	if (activeTarget.value?.kind !== 'link')
		return null
	return currentNode.value?.links.find(link => link.id === activeTarget.value?.id) ?? null
})
const activeSpot = computed(() => {
	if (activeTarget.value?.kind !== 'spot')
		return null
	return currentNode.value?.spots.find(spot => spot.id === activeTarget.value?.id) ?? null
})
const activeMap = computed(() => activeSpot.value == null ? null : getWorldMapSpotRepresentative(activeSpot.value))
const activeTrack = computed(() => {
	const trackId = activeMap.value?.selection.trackId
	return trackId == null ? null : musicStore.getMusicData(trackId) ?? null
})
const activeTrackDisabled = computed(() => {
	const trackId = activeMap.value?.selection.trackId
	return trackId == null || activeTrack.value == null || musicStore.isMusicDisabled(trackId)
})
const activeRows = computed(() => {
	if (activeLink.value != null)
		return getWorldMapNameRows(activeLink.value.canonicalLabel, activeLink.value.localizedNames)
	if (activeMap.value != null)
		return getWorldMapNameRows(activeMap.value.name, activeMap.value.localizedNames)
	return []
})
const activeTitle = computed(() => {
	if (activeLink.value != null)
		return activeRows.value[0]?.name ?? activeLink.value.canonicalLabel ?? activeLink.value.targetWorldMapId
	if (activeMap.value != null)
		return activeRows.value[0]?.name ?? activeMap.value.name ?? activeMap.value.mapId
	return null
})
const activeLinkTargetNode = computed(() => activeLink.value == null ? null : nodeById.value.get(activeLink.value.targetWorldMapId) ?? null)
const worldMapOfflinePercent = computed(() => {
	const currentProgress = worldMapOfflineProgress.value
	if (currentProgress == null || currentProgress.total === 0)
		return 0
	return Math.round((currentProgress.completed / currentProgress.total) * 100)
})
const worldMapOfflineDownloadDisabled = computed(() => isOnline.value === false || manifest.value == null || worldMapOfflineStatus.value === 'downloading' || worldMapOfflineReady.value)

watch(manifest, (currentManifest) => {
	if (currentManifest == null)
		return
	setWorldMapOfflineManifest(currentManifest)
	const firstSelectable = rootIds.value.find(worldMapId => nodeById.value.has(worldMapId))
	if (firstSelectable == null)
		return
	if (nodeById.value.has(selectedRootId.value) === false || rootIds.value.includes(selectedRootId.value) === false)
		selectedRootId.value = firstSelectable
	if (nodeById.value.has(currentNodeId.value) === false)
		currentNodeId.value = selectedRootId.value
}, { immediate: true })

watch([manifest, currentNodeId], ([currentManifest, worldMapId]) => {
	if (currentManifest == null || nodeById.value.has(worldMapId) === false)
		return
	void loadNode(worldMapId)
		.catch(() => null)
}, { immediate: true })

watch(currentNodeId, () => {
	activeTarget.value = null
})

function selectRoot(worldMapId: string) {
	if (selectableRoots.value.some(root => root.worldMapId === worldMapId) === false)
		return
	selectedRootId.value = worldMapId
	currentNodeId.value = worldMapId
}

function navigateToNode(worldMapId: string) {
	if (nodeById.value.has(worldMapId) === false)
		return
	currentNodeId.value = worldMapId
}

function activateLink(link: WorldMapGraphLink) {
	activeTarget.value = { kind: 'link', id: link.id }
}

function activateSpot(spot: WorldMapGraphSpot) {
	activeTarget.value = { kind: 'spot', id: spot.id }
}

function openLink(link: WorldMapGraphLink | null = activeLink.value) {
	if (link == null || nodeById.value.has(link.targetWorldMapId) === false)
		return
	navigateToNode(link.targetWorldMapId)
}

function playMap(map: WorldMapGraphMap | null = activeMap.value) {
	const trackId = map?.selection.trackId
	if (trackId == null || musicStore.getMusicData(trackId) == null || musicStore.isMusicDisabled(trackId))
		return
	musicStore.play('all', trackId)
}

function onLinkClick(link: WorldMapGraphLink, event: MouseEvent) {
	activateLink(link)
	if (event.detail === 0 || canHover.value)
		openLink(link)
}

function onSpotClick(spot: WorldMapGraphSpot, event: MouseEvent) {
	activateSpot(spot)
	if (event.detail === 0 || canHover.value)
		playMap(getWorldMapSpotRepresentative(spot))
}

function baseLayerStyle(asset: WorldMapAsset) {
	const reference = referenceImage.value
	if (reference == null)
		return {}
	return {
		left: `${((reference.origin.x - asset.origin.x) / reference.width) * 100}%`,
		top: `${((reference.origin.y - asset.origin.y) / reference.height) * 100}%`,
		width: `${(asset.width / reference.width) * 100}%`,
		height: `${(asset.height / reference.height) * 100}%`,
	}
}

function linkImageStyle(link: WorldMapGraphLink) {
	const reference = referenceImage.value
	const image = link.linkImage
	if (reference == null || image == null)
		return {}
	return {
		left: `${(link.screenOrigin.x / reference.width) * 100}%`,
		top: `${(link.screenOrigin.y / reference.height) * 100}%`,
		width: `${(image.width / reference.width) * 100}%`,
		height: `${(image.height / reference.height) * 100}%`,
	}
}

function linkHitStyle(link: WorldMapGraphLink) {
	const reference = referenceImage.value
	if (reference == null)
		return {}
	if (link.hitRect != null) {
		const { left, top, width, height } = link.hitRect
		return {
			'--hotspot-left': `${(left + width / 2) * 100}%`,
			'--hotspot-top': `${(top + height / 2) * 100}%`,
			'--hotspot-width': `${width * 100}%`,
			'--hotspot-height': `${height * 100}%`,
		}
	}
	const image = link.linkImage
	const width = image?.width ?? 0
	const height = image?.height ?? 0
	return {
		'--hotspot-left': `${((link.screenOrigin.x + width / 2) / reference.width) * 100}%`,
		'--hotspot-top': `${((link.screenOrigin.y + height / 2) / reference.height) * 100}%`,
		'--hotspot-width': `${(width / reference.width) * 100}%`,
		'--hotspot-height': `${(height / reference.height) * 100}%`,
	}
}

function spotHitStyle(spot: WorldMapGraphSpot) {
	if (spot.hitRect != null) {
		const { left, top, width, height } = spot.hitRect
		return {
			'--hotspot-left': `${(left + width / 2) * 100}%`,
			'--hotspot-top': `${(top + height / 2) * 100}%`,
			'--hotspot-width': `${width * 100}%`,
			'--hotspot-height': `${height * 100}%`,
		}
	}
	return {
		'--hotspot-left': `${spot.point.normalizedX * 100}%`,
		'--hotspot-top': `${spot.point.normalizedY * 100}%`,
		'--hotspot-width': '0%',
		'--hotspot-height': '0%',
	}
}

function activeNormalizedPoint(): { x: number, y: number } | null {
	if (activeSpot.value != null)
		return { x: activeSpot.value.point.normalizedX, y: activeSpot.value.point.normalizedY }
	const link = activeLink.value
	const reference = referenceImage.value
	if (link == null || reference == null)
		return null
	if (link.hitRect != null) {
		return {
			x: link.hitRect.left + link.hitRect.width / 2,
			y: link.hitRect.top + link.hitRect.height / 2,
		}
	}
	return {
		x: (link.screenOrigin.x + (link.linkImage?.width ?? 0) / 2) / reference.width,
		y: (link.screenOrigin.y + (link.linkImage?.height ?? 0) / 2) / reference.height,
	}
}

const tooltipStyle = computed(() => {
	const point = activeNormalizedPoint()
	if (point == null)
		return {}
	const x = Math.min(0.78, Math.max(0.22, point.x))
	const showBelow = point.y < 0.32
	return {
		left: `${x * 100}%`,
		top: `${Math.min(0.94, Math.max(0.06, point.y)) * 100}%`,
		transform: showBelow ? 'translate(-50%, 16px)' : 'translate(-50%, calc(-100% - 16px))',
	}
})

function linkAccessibleName(link: WorldMapGraphLink) {
	const rows = getWorldMapNameRows(link.canonicalLabel, link.localizedNames)
	const name = rows[0]?.name ?? link.canonicalLabel ?? link.targetWorldMapId
	return nodeById.value.has(link.targetWorldMapId) ? `${name}, open area` : `${name}, area unavailable in this preview`
}

function spotAccessibleName(spot: WorldMapGraphSpot) {
	const map = getWorldMapSpotRepresentative(spot)
	const rows = map == null ? [] : getWorldMapNameRows(map.name, map.localizedNames)
	const name = rows[0]?.name ?? map?.name ?? map?.mapId ?? 'Map location'
	const trackId = map?.selection.trackId
	if (trackId == null)
		return `${name}, music unavailable`
	const track = musicStore.getMusicData(trackId)
	return track == null ? `${name}, music unavailable` : `${name}, play ${track.title}`
}
</script>

<template>
	<div
		:class="pika({
			'display': 'flex',
			'flexDirection': 'column',
			'gap': '12px',
			'width': '100%',
			'height': '100%',
			'minHeight': '0',
			'padding': '12px',
			'overflow': 'auto',
			'@screen-md-and-up': { padding: '16px' },
		})"
	>
		<div
			v-if="loading"
			role="status"
			:class="pika({ padding: '32px 16px', textAlign: 'center', color: 'var(--color-secondary-text)' })"
		>
			Loading world map…
		</div>

		<div
			v-else-if="error != null"
			role="alert"
			:class="pika({ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '16px' })"
		>
			<span>World map manifest could not be loaded or did not match the progressive resource contract.</span>
			<button
				:class="pika('primary-btn')"
				@click="reload"
			>
				Retry
			</button>
		</div>

		<template v-else-if="manifest != null">
			<nav
				aria-label="World map location"
				:class="pika({
					display: 'flex',
					alignItems: 'center',
					gap: '6px',
					width: '100%',
					maxWidth: '640px',
					margin: '0 auto',
					minHeight: '44px',
					flexWrap: 'wrap',
					whiteSpace: 'normal',
				})"
			>
				<select
					:value="selectedRootId"
					aria-label="World"
					:class="pika({
						'minHeight': '40px',
						'padding': '7px 32px 7px 10px',
						'border': '1px solid var(--color-border-subtle)',
						'borderRadius': '8px',
						'backgroundColor': 'var(--color-surface-solid)',
						'color': 'var(--color-text-primary)',
						'font': 'inherit',
						'cursor': 'pointer',
						'$:focus-visible': { outline: '2px solid var(--color-focus-ring)', outlineOffset: '2px' },
					})"
					@change="selectRoot(($event.target as HTMLSelectElement).value)"
				>
					<option
						v-for="root in selectableRoots"
						:key="root.worldMapId"
						:value="root.worldMapId"
					>
						{{ getWorldMapNodeLabel(displayNodeById.get(root.worldMapId) ?? root) }}
					</option>
				</select>

				<template
					v-for="(node, index) in breadcrumbAfterRoot"
					:key="node.worldMapId"
				>
					<span
						aria-hidden="true"
						:class="pika({ color: 'var(--color-text-secondary)', opacity: '0.45' })"
					>›</span>
					<button
						v-if="index < breadcrumbAfterRoot.length - 1"
						type="button"
						:class="pika({ 'minHeight': '40px', 'padding': '6px 8px', 'borderRadius': 'var(--radius-control)', 'backgroundColor': 'transparent', 'color': 'var(--color-text-secondary)', 'cursor': 'pointer', '$:hover': { backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 6%, transparent)', color: 'var(--color-text-primary)' }, '$:focus-visible': { outline: '2px solid var(--color-focus-ring)', outlineOffset: '1px' } })"
						@click="navigateToNode(node.worldMapId)"
					>
						{{ getWorldMapNodeLabel(node) }}
					</button>
					<span
						v-else
						:class="pika({ padding: '6px 4px', fontWeight: '600', color: 'var(--color-text-primary)' })"
					>
						{{ getWorldMapNodeLabel(node) }}
					</span>
				</template>
			</nav>

			<div
				:class="pika({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', width: '100%', maxWidth: '640px', margin: '0 auto', padding: '8px 10px', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-control)', backgroundColor: 'color-mix(in srgb, var(--color-surface-card) 88%, transparent)' })"
			>
				<div
					role="status"
					aria-live="polite"
					:class="pika({ display: 'flex', alignItems: 'center', gap: '8px', minHeight: '36px', fontSize: '13px', color: 'var(--color-text-secondary)' })"
				>
					<span
						v-if="worldMapOfflineReady"
						aria-hidden="true"
						:class="pika('i-f7:checkmark-circle-fill', { fontSize: '18px', opacity: '0.72' })"
					/>
					<span
						v-else-if="worldMapOfflineStatus === 'downloading'"
						aria-hidden="true"
						:class="pika('i-svg-spinners:3-dots-scale', { fontSize: '18px', opacity: '0.72' })"
					/>
					<span
						v-else
						aria-hidden="true"
						:class="pika('i-f7:cloud-download', { fontSize: '18px', opacity: '0.72' })"
					/>
					<span v-if="worldMapOfflineReady">World map ready for offline use.</span>
					<span v-else-if="worldMapOfflineStatus === 'downloading'">Downloading world map for offline use… {{ worldMapOfflinePercent }}%</span>
					<span v-else-if="isOnline === false">Download unavailable while offline.</span>
					<span v-else>Keep every world map available offline.</span>
				</div>

				<button
					v-if="worldMapOfflineReady"
					type="button"
					:class="pika({ 'minHeight': '36px', 'padding': '6px 12px', 'border': '1px solid var(--color-border-subtle)', 'borderRadius': 'var(--radius-control)', 'backgroundColor': 'var(--color-surface-card)', 'color': 'var(--color-text-primary)', 'cursor': 'pointer', '$:hover': { backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 7%, var(--color-surface-card))' }, '$:focus-visible': { outline: '2px solid var(--color-focus-ring)', outlineOffset: '2px' } })"
					@click="removeWorldMapsOffline"
				>
					Remove offline maps
				</button>
				<button
					v-else-if="worldMapOfflineStatus === 'downloading'"
					type="button"
					:class="pika({ 'minHeight': '36px', 'padding': '6px 12px', 'border': '1px solid var(--color-border-subtle)', 'borderRadius': 'var(--radius-control)', 'backgroundColor': 'var(--color-surface-card)', 'color': 'var(--color-text-primary)', 'cursor': 'pointer', '$:hover': { backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 7%, var(--color-surface-card))' }, '$:focus-visible': { outline: '2px solid var(--color-focus-ring)', outlineOffset: '2px' } })"
					aria-label="Cancel downloading world maps for offline use"
					@click="cancelWorldMapDownload"
				>
					Cancel download
				</button>
				<button
					v-else
					type="button"
					:disabled="worldMapOfflineDownloadDisabled"
					:class="pika({ 'minHeight': '36px', 'padding': '6px 12px', 'border': '1px solid var(--color-border-subtle)', 'borderRadius': 'var(--radius-control)', 'backgroundColor': 'var(--color-surface-card)', 'color': 'var(--color-text-primary)', 'cursor': 'pointer', '$:hover': { backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 7%, var(--color-surface-card))' }, '$:focus-visible': { outline: '2px solid var(--color-focus-ring)', outlineOffset: '2px' }, '$:disabled': { opacity: '0.55', cursor: 'not-allowed' } })"
					aria-label="Download all world maps for offline use"
					@click="downloadWorldMapsForOffline"
				>
					Download for Offline
				</button>
			</div>

			<section
				v-if="currentNode != null && referenceImage != null"
				:aria-label="`${getWorldMapNodeLabel(currentNode)} map`"
				:class="pika({
					display: 'flex',
					alignItems: 'flex-start',
					justifyContent: 'center',
					width: '100%',
					minHeight: '0',
					flex: '1 1 auto',
				})"
			>
				<div
					:style="{ aspectRatio: `${referenceImage.width} / ${referenceImage.height}`, maxWidth: `${referenceImage.width}px` }"
					:class="pika({
						position: 'relative',
						width: '100%',
						margin: '0 auto',
						overflow: 'visible',
						borderRadius: '8px',
						backgroundColor: 'transparent',
						boxShadow: '0 0 0 1px var(--color-border-subtle)',
						touchAction: 'manipulation',
					})"
					@keydown.esc="activeTarget = null"
				>
					<img
						v-for="(asset, index) in currentNode.baseImages"
						:key="asset.file"
						:src="getWorldMapAssetPath(asset.file)"
						:alt="index === 0 ? `${getWorldMapNodeLabel(currentNode)} world map` : ''"
						:width="asset.width"
						:height="asset.height"
						:style="baseLayerStyle(asset)"
						:class="pika({ position: 'absolute', display: 'block', userSelect: 'none', pointerEvents: 'none' })"
						draggable="false"
					>

					<img
						v-for="link in currentNode.links.filter(link => link.linkImage != null)"
						:key="`image:${link.id}`"
						:src="getWorldMapAssetPath(link.linkImage!.file)"
						alt=""
						aria-hidden="true"
						:width="link.linkImage!.width"
						:height="link.linkImage!.height"
						:style="linkImageStyle(link)"
						:class="pika({ position: 'absolute', display: 'block', userSelect: 'none', pointerEvents: 'none', zIndex: '2' })"
						draggable="false"
					>

					<button
						v-for="link in currentNode.links"
						:key="`link:${link.id}`"
						type="button"
						:aria-label="linkAccessibleName(link)"
						:data-active="activeTarget?.kind === 'link' && activeTarget.id === link.id"
						:style="linkHitStyle(link)"
						:class="pika({
							'position': 'absolute',
							'left': 'var(--hotspot-left)',
							'top': 'var(--hotspot-top)',
							'width': 'max(44px, var(--hotspot-width))',
							'height': 'max(44px, var(--hotspot-height))',
							'transform': 'translate(-50%, -50%)',
							'padding': '0',
							'border': '0',
							'borderRadius': '8px',
							'backgroundColor': 'transparent',
							'cursor': 'pointer',
							'zIndex': '5',
							'$:focus-visible': { outline: '2px solid var(--color-focus-ring)', outlineOffset: '2px' },
							'$[data-active=true]': { boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--color-text-primary) 30%, transparent)' },
						})"
						@mouseenter="activateLink(link)"
						@focus="activateLink(link)"
						@click="onLinkClick(link, $event)"
					/>

					<button
						v-for="spot in currentNode.spots"
						:key="`spot:${spot.id}`"
						type="button"
						:aria-label="spotAccessibleName(spot)"
						:data-active="activeTarget?.kind === 'spot' && activeTarget.id === spot.id"
						:data-playable="getWorldMapSpotRepresentative(spot)?.selection.trackId != null"
						:style="spotHitStyle(spot)"
						:class="pika({
							'position': 'absolute',
							'left': 'var(--hotspot-left)',
							'top': 'var(--hotspot-top)',
							'width': 'max(44px, var(--hotspot-width))',
							'height': 'max(44px, var(--hotspot-height))',
							'transform': 'translate(-50%, -50%)',
							'display': 'grid',
							'placeItems': 'center',
							'padding': '0',
							'border': '0',
							'borderRadius': '999px',
							'backgroundColor': 'transparent',
							'cursor': 'pointer',
							'zIndex': '4',
							'$:focus-visible': { outline: '2px solid var(--color-focus-ring)', outlineOffset: '1px' },
							'$[data-active=true]': { outline: '1px solid color-mix(in srgb, var(--color-text-primary) 35%, transparent)', outlineOffset: '-8px' },
						})"
						@mouseenter="activateSpot(spot)"
						@focus="activateSpot(spot)"
						@click="onSpotClick(spot, $event)"
					>
						<span
							aria-hidden="true"
							:data-playable="getWorldMapSpotRepresentative(spot)?.selection.trackId != null"
							:data-active="activeTarget?.kind === 'spot' && activeTarget.id === spot.id"
							:class="pika({
								'width': '8px',
								'height': '8px',
								'border': '1px solid color-mix(in srgb, var(--color-surface-solid) 90%, transparent)',
								'borderRadius': '999px',
								'backgroundColor': 'color-mix(in srgb, var(--color-text-secondary) 60%, transparent)',
								'boxShadow': '0 1px 3px rgba(0, 0, 0, 0.32)',
								'pointerEvents': 'none',
								'$[data-playable=true]': { backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 68%, transparent)' },
								'$[data-active=true]': { backgroundColor: 'var(--color-action-primary)', borderColor: 'var(--color-surface-solid)' },
							})"
						/>
					</button>

					<div
						v-if="activeTitle != null"
						role="dialog"
						aria-live="polite"
						:aria-label="activeTitle"
						:style="tooltipStyle"
						:class="pika({
							position: 'absolute',
							zIndex: '12',
							width: 'min(320px, calc(100% - 16px))',
							padding: '12px 14px',
							border: '1px solid var(--color-border-subtle)',
							borderRadius: 'var(--radius-control)',
							backgroundColor: 'color-mix(in srgb, var(--color-surface-solid) 96%, transparent)',
							color: 'var(--color-text-primary)',
							boxShadow: '0 12px 32px rgba(0, 0, 0, 0.22)',
							backdropFilter: 'blur(12px)',
						})"
					>
						<div :class="pika({ fontSize: '15px', fontWeight: '600', marginBottom: '8px' })">
							{{ activeTitle }}
						</div>
						<div
							v-if="activeRows.length > 0"
							:class="pika({ display: 'grid', gridTemplateColumns: '42px minmax(0, 1fr)', gap: '4px 8px', fontSize: '12px' })"
						>
							<template
								v-for="row in activeRows"
								:key="row.region"
							>
								<span :class="pika({ color: 'var(--color-text-secondary)', fontSize: '10px', fontWeight: '600', letterSpacing: '0.04em', opacity: '0.78' })">{{ row.region }}</span>
								<span>{{ row.name }}</span>
							</template>
						</div>

						<div
							v-if="activeSpot != null && activeSpot.mapNumbers.length > 1"
							:class="pika({ marginTop: '8px', fontSize: '11px', color: 'var(--color-text-secondary)' })"
						>
							{{ activeSpot.mapNumbers.length }} maps share this world-map point
						</div>
						<div
							v-if="activeTrack != null"
							:class="pika({ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-border-subtle)', fontSize: '12px', color: 'var(--color-text-secondary)' })"
						>
							BGM · {{ activeTrack.title }}
						</div>

						<div :class="pika({ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '9px' })">
							<button
								v-if="activeLink != null"
								type="button"
								:disabled="activeLinkTargetNode == null"
								:class="pika({ 'minHeight': '36px', 'padding': '6px 12px', 'border': '1px solid var(--color-border-subtle)', 'borderRadius': 'var(--radius-control)', 'backgroundColor': 'var(--color-surface-card)', 'color': 'var(--color-text-primary)', 'cursor': 'pointer', '$:hover': { backgroundColor: 'color-mix(in srgb, var(--color-text-primary) 7%, var(--color-surface-card))' }, '$:focus-visible': { outline: '2px solid var(--color-focus-ring)', outlineOffset: '2px' }, '$:disabled': { opacity: '0.45', cursor: 'not-allowed' } })"
								@click.stop="openLink()"
							>
								{{ activeLinkTargetNode == null ? 'Unavailable' : 'Open' }}
							</button>
							<button
								v-else-if="activeMap?.selection.trackId != null"
								type="button"
								:disabled="activeTrackDisabled"
								:class="pika('primary-btn', { minHeight: '36px', padding: '6px 12px' })"
								@click.stop="playMap()"
							>
								{{ currentMusic?.id === activeMap.selection.trackId ? 'Replay' : 'Play' }}
							</button>
						</div>
					</div>
				</div>
			</section>

			<div
				v-else-if="currentNodeLoading"
				role="status"
				:aria-label="`Loading ${getWorldMapNodeLabel(currentNodeSummary ?? { worldMapId: currentNodeId, worldMapName: currentNodeId, canonicalLabel: null, localizedNames: {}, parentWorldMapId: null })} map`"
				:class="pika({ display: 'grid', placeItems: 'center', flex: '1 1 auto', minHeight: '240px', padding: '32px 16px', textAlign: 'center', color: 'var(--color-text-secondary)' })"
			>
				<div>
					<span
						aria-hidden="true"
						:class="pika('i-svg-spinners:3-dots-scale', { fontSize: '24px', marginBottom: '8px', opacity: '0.65' })"
					/>
					<div>Loading {{ getWorldMapNodeLabel(currentNodeSummary ?? { worldMapId: currentNodeId, worldMapName: currentNodeId, canonicalLabel: null, localizedNames: {}, parentWorldMapId: null }) }}…</div>
				</div>
			</div>

			<div
				v-else
				role="alert"
				:class="pika({ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', flex: '1 1 auto', minHeight: '240px', padding: '32px 16px', textAlign: 'center' })"
			>
				<div>
					<div :class="pika({ marginBottom: '8px', fontWeight: '600' })">
						This map area could not be loaded.
					</div>
					<div :class="pika({ marginBottom: '16px', color: 'var(--color-text-secondary)', fontSize: '14px' })">
						The rest of the world map is still available.
					</div>
					<button
						type="button"
						:class="pika('primary-btn')"
						@click="retryNode(currentNodeId)"
					>
						Retry area
					</button>
				</div>
			</div>
		</template>
	</div>
</template>
