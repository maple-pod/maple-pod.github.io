import type { PlaylistId } from '@/composables/useMusicStore'
import { handleMiddlewares, type Middleware } from '@deviltea/vue-router-middleware'
import { createRouter, createWebHistory } from 'vue-router'

export const Routes = {
	Root: 'Root',
	Playlists: 'Playlists',
	Playlist: 'Playlist',
} as const

const middlewares = {
	waitUntilReady: async () => {
		const appStore = useAppStore()
		await appStore.ready
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
			name: Routes.Root,
			path: '/',
			redirect: { name: Routes.Playlists },
			meta: {
				middleware: middlewares.waitUntilReady,
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
