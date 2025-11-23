import { createRouter, createWebHistory } from 'vue-router'
import Login from './components/Login.vue'
import Broker from './components/Broker.vue'
import Admin from './components/Admin.vue'

const routes = [
  { path: '/', component: Login },
  { path: '/broker/:id', component: Broker },
  { path: '/admin', component: Admin }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
