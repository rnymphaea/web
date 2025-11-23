<template>
  <div class="container">
    <header>
      <h1>📈 Торговая платформа брокера</h1>
      <nav v-if="$route.path !== '/' && currentBroker">
        <button @click="$router.push('/admin')" v-if="$route.path !== '/admin'">👨‍💼 Админ-панель</button>
        <button @click="$router.push('/dashboard')" v-if="$route.path !== '/dashboard'">💼 Торговая площадка</button>
        <button @click="logout">🚪 Выйти ({{ currentBroker.name }})</button>
      </nav>
    </header>
    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const router = useRouter()
    const currentBroker = ref(null)

    onMounted(() => {
      currentBroker.value = JSON.parse(localStorage.getItem('currentBroker'))
    })

    const logout = () => {
      localStorage.removeItem('currentBroker')
      currentBroker.value = null
      router.push('/')
    }

    return { currentBroker, logout }
  }
}
</script>
