import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: () => import('../views/Login.vue'), meta: { public: true } },
  { path: '/register', component: () => import('../views/Register.vue'), meta: { public: true } },
  { path: '/dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/settings', component: () => import('../views/WorkspaceSettings.vue'), meta: { adminOnly: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const { token, role } = useAuth()
  if (!to.meta.public && !token.value) {
    next('/login')
  } else if (to.meta.adminOnly && role.value !== 'admin') {
    next('/dashboard')
  } else if (to.meta.public && token.value) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
