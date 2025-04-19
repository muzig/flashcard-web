import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/theme/:id',
      name: 'theme',
      component: () => import('../views/ThemeView.vue')
    },
    {
      path: '/custom',
      name: 'custom',
      component: () => import('../views/CustomThemeView.vue')
    }
  ]
})

export default router
