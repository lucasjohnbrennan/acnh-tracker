import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/browse', name: 'browse', component: () => import('../views/BrowseView.vue') },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    {
      path: '/collection',
      name: 'collection',
      component: () => import('../views/MyCollectionView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true
  const authStore = useAuthStore()
  await authStore.ready
  if (!authStore.user) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
