import { createRouter, createWebHistory } from 'vue-router'

export const Routes = {
	Root: 'Root',
	Home: 'Home',
} as const

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			name: Routes.Root,
			path: '/',
			component: () => import('@/components/DefaultLayout.vue'),
			children: [
				{
					name: Routes.Home,
					path: '',
					component: () => import('@/views/Home.vue'),
				},
			],
		},
	],
})

export default router
