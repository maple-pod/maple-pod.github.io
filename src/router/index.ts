import { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    name: 'Home',
    path: '/',
    component: () => import('@/pages/Home.vue')
  },
  {
    name: 'NotFound',
    path: '/:pathMatch(.*)*',
    redirect: { name: 'Home' }
  }
]
