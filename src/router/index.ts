import type { HashActionImportSavedUserData, PlaylistId } from '@/types'
import { HashActionImportSavedUserDataSchema } from '@/schemas'
import { getRecord } from '@/utils/cfWorker'
import { handleMiddlewares, type Middleware } from '@deviltea/vue-router-middleware'
import { safeParse } from 'valibot'
import { createRouter, createWebHistory, RouterView } from 'vue-router'

export const Routes = {
	Root: 'Root',
	Link: 'Link',
	Setup: 'Setup',
	DirectlyPlay: 'DirectlyPlay',
	Playlists: 'Playlists',
	Playlist: 'Playlist',
} as const

const middlewares = {
	waitUntilReady: async () => {
		const appStore = useAppStore()
		await appStore.ready
	},
	resolveRecord: async (to) => {
		const { recordId, ...restQuery } = to.query as { recordId: string | undefined }
		if (recordId == null) {
			return true
		}

		const hash = await getRecord(recordId)
		if (hash == null) {
			// Invalid recordId, redirect to root
			return { name: Routes.Root }
		}

		return {
			...to,
			query: restQuery,
			hash,
		}
	},
	importSavedUserData: async (to) => {
		const data = urlHashToData(to.hash)
		if (data == null)
			return true

		const result = safeParse(HashActionImportSavedUserDataSchema, data)
		if (result.success) {
			const { confirm } = useUiConfirmDialog()

			const agreed = await confirm({
				title: 'Import Saved User Data',
				description: 'Are you sure you want to import this saved user data?',
			})

			if (agreed) {
				const { savedUserData } = useSavedUserData()
				savedUserData.value = (result.output as HashActionImportSavedUserData).data
			}
		}

		return true
	},
	validatePlaylistId: (to) => {
		const playlistId = to.params.playlistId as PlaylistId
		const musicStore = useMusicStore()
		if (musicStore.getPlaylist(playlistId) == null) {
			return { name: Routes.Playlists }
		}
		return true
	},
	directlyPlay: async (to) => {
		const { musicId } = to.query as { musicId: string | undefined }
		const { confirm } = useUiConfirmDialog()
		const musicStore = useMusicStore()
		const musicData = musicStore.getMusicData(musicId!)

		if (musicData == null) {
			return { name: Routes.Root }
		}

		const agreed = await confirm({
			title: 'Play Music From Link',
			description: `Are you sure you want to play "${musicData.title}" from link?`,
		})

		if (agreed) {
			const musicStore = useMusicStore()
			musicStore.play('all', musicId)
		}

		return { name: Routes.Root }
	},
} satisfies Record<string, Middleware>

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			name: Routes.Setup,
			path: '/setup',
			component: RouterView,
			meta: {
				middleware: [
					middlewares.waitUntilReady,
					middlewares.resolveRecord,
					middlewares.importSavedUserData,
					() => ({ name: Routes.Root }),
				],
			},
		},
		{
			name: Routes.DirectlyPlay,
			path: '/play',
			component: RouterView,
			meta: {
				middleware: [
					middlewares.waitUntilReady,
					middlewares.directlyPlay,
				],
			},
		},
		{
			name: Routes.Root,
			path: '/',
			redirect: { name: Routes.Playlists },
			meta: {
				middleware: [
					middlewares.waitUntilReady,
				],
			},
			component: () => import('@/components/DefaultLayout.vue'),
			children: [
				{
					name: Routes.Playlists,
					path: 'playlists',
					component: () => import('@/views/Playlists.vue'),
				},
				{
					name: Routes.Playlist,
					path: 'playlists/:playlistId',
					meta: {
						middleware: middlewares.validatePlaylistId,
					},
					component: () => import('@/views/Playlist.vue'),
					props: to => ({ playlistId: to.params.playlistId as PlaylistId }),
				},
			],
		},
		// Fallback route for unmatched paths
		{
			path: '/:pathMatch(.*)*',
			redirect: { name: Routes.Root },
		},
	],
})

router.beforeEach(handleMiddlewares)

export default router
