<template>
  <div class="card">
    <h2>🔐 Вход в систему</h2>
    <div v-if="brokers.length > 0">
      <h3>Выберите брокера:</h3>
      <div v-for="broker in brokers" :key="broker.id" class="broker-item">
        <button @click="selectBroker(broker)">
          👤 {{ broker.name }} - 💰 Баланс: ${{ broker.balance.toLocaleString() }}
        </button>
      </div>
    </div>
    <div v-else>
      <p>⏳ Загрузка списка брокеров...</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  name: 'Login',
  setup() {
    const brokers = ref([])
    const router = useRouter()

    onMounted(async () => {
      try {
        const response = await axios.get('http://localhost:3002/brokers')
        brokers.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки брокеров:', error)
      }
    })

    const selectBroker = (broker) => {
      localStorage.setItem('currentBroker', JSON.stringify(broker))
      router.push('/dashboard')
    }

    return { brokers, selectBroker }
  }
}
</script>
