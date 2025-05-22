import type { HashActionImportSavedUserData, PlaylistId } from '@/types'
import { HashActionImportSavedUserDataSchema, HashActionPlayMusicSchema } from '@/schemas'
import { getRecord } from '@/utils/cfWorker'
import { handleMiddlewares, type Middleware } from '@deviltea/vue-router-middleware'
import { type ObjectSchema, safeParse } from 'valibot'
import { createRouter, createWebHistory, RouterView } from 'vue-router'

export const Routes = {
	Root: 'Root',
	Link: 'Link',
	Playlists: 'Playlists',
	Playlist: 'Playlist',
} as const

const middlewares = {
	waitUntilReady: async () => {
		const appStore = useAppStore()
		await appStore.ready
	},
	executeHashAction: async (to) => {
		const data = urlHashToData(to.hash)
		if (data == null)
			return true

		const actions: [schema: ObjectSchema<any, any>, handler: (data: any) => any][] = [
			[
				HashActionImportSavedUserDataSchema,
				async ({ data }: HashActionImportSavedUserData) => {
					const { confirm } = useUiConfirmDialog()

					const agreed = await confirm({
						title: 'Import Saved User Data',
						description: 'Are you sure you want to import this saved user data?',
					})

					if (agreed) {
						const { savedUserData } = useSavedUserData()
						savedUserData.value = data
					}
				},
			],
			[
				HashActionPlayMusicSchema,
				async ({ data }) => {
					const { confirm } = useUiConfirmDialog()
					const musicStore = useMusicStore()
					const musicData = musicStore.getMusicData(data.musicSrc)!

					const agreed = await confirm({
						title: 'Play Music From Link',
						description: `Are you sure you want to play "${musicData.title}" from link?`,
					})

					if (agreed) {
						const musicStore = useMusicStore()
						musicStore.play('all', data.musicSrc)
					}
				},
			],
		]

		for (const [schema, handler] of actions) {
			const result = safeParse(schema, data)
			if (result.success) {
				await handler(result.output)
				return {
					...to,
					hash: '',
				}
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
} satisfies Record<string, Middleware>

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			name: Routes.Link,
			path: '/link/:recordId',
			component: RouterView,
			meta: {
				middleware: async (to) => {
					const { recordId } = to.params as { recordId: string }
					const hash = await getRecord(recordId)
					if (hash == null) {
						return { name: Routes.Root }
					}

					return {
						name: Routes.Root,
						hash,
					}
				},
			},
		},
		{
			name: Routes.Root,
			path: '/',
			redirect: { name: Routes.Playlists },
			meta: {
				middleware: [
					middlewares.waitUntilReady,
					middlewares.executeHashAction,
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
