import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../pages/LandingPage.vue'
import EditorPage from '../pages/EditorPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'Landing', component: LandingPage },
    { path: '/:roomId', name: 'Editor', component: EditorPage },
  ],
})

export default router
