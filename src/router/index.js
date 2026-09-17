import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { logAnalyticsEvent } from '../lib/analytics'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
    { path: '/critters', name: 'critters', component: () => import('../views/CrittersView.vue') },
    // Kept so older links/bookmarks to the page when it was called "Browse" still land.
    { path: '/browse', redirect: { name: 'critters' } },
    { path: '/fossils', name: 'fossils', component: () => import('../views/FossilsView.vue') },
    { path: '/art', name: 'art', component: () => import('../views/ArtView.vue') },
    // Kept so links from when fossils and art shared one "Fossils & Art" page
    // still land somewhere sensible.
    { path: '/artifacts', redirect: { name: 'fossils' } },
    { path: '/music', name: 'music', component: () => import('../views/MusicView.vue') },
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

// Runs for the initial load as well as every client-side navigation, and only
// after redirects have resolved — so /browse reports as the critters page.
// Every route shares one <title>, so the route name is the useful page label.
router.afterEach((to) => {
  logAnalyticsEvent('page_view', {
    page_path: to.fullPath,
    page_title: typeof to.name === 'string' ? to.name : to.fullPath,
    page_location: window.location.href,
  })
})

export default router
