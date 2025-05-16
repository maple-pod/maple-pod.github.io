import type { PlaylistId } from '@/types/Playlist'
import { createRouter, createWebHistory } from 'vue-router'

export const Routes = {
	Root: 'Root',
	Playlists: 'Playlists',
	Playlist: 'Playlist',
} as const

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			name: Routes.Root,
			path: '/',
			redirect: { name: Routes.Playlists },
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
					component: () => import('@/views/Playlist.vue'),
					props: (to) => {
						let scrollToIndex: number | undefined = Number(to.query.scrollToIndex)
						scrollToIndex = Number.isNaN(scrollToIndex) ? undefined : scrollToIndex

						return {
							playlistId: to.params.playlistId as PlaylistId,
							scrollToIndex,
						}
					},
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

router.beforeEach(async (to) => {
	await useAppStore().ready

	if (to.name === Routes.Playlist) {
		const playlistId = to.params.playlistId as PlaylistId
		const musicStore = useMusicStore()
		if (musicStore.getPlaylist(playlistId) == null) {
			return { name: Routes.Playlists }
		}

		return true
	}

	return true
})

export default router
