import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

const routes = [
  { path: '/', component: () => import('./components/Login.vue') },
  { path: '/admin', component: () => import('./components/Admin.vue') },
  { path: '/dashboard', component: () => import('./components/Dashboard.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App).use(router).mount('#app')
