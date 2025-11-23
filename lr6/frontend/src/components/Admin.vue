<template>
  <div>
    <h2>👨‍💼 Админ-панель</h2>
    
    <div class="card">
      <h3>📊 Статус симуляции</h3>
      <p>Дата: <strong>{{ simulationStatus.currentDate }}</strong></p>
      <p>Статус: 
        <span :class="simulationStatus.isRunning ? 'status-running' : 'status-stopped'">
          {{ simulationStatus.isRunning ? '🟢 Активна' : '🔴 Остановлена' }}
        </span>
      </p>
      <p>Скорость: <strong>{{ simulationStatus.speed }} сек</strong></p>
    </div>

    <div class="card">
      <h3>👥 Список брокеров</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Баланс</th>
            <th>Стоимость портфеля</th>
            <th>Общая стоимость</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="broker in brokers" :key="broker.id">
            <td>{{ broker.id }}</td>
            <td>{{ broker.name }}</td>
            <td>${{ broker.balance.toLocaleString() }}</td>
            <td>${{ Math.round(broker.portfolioValue).toLocaleString() }}</td>
            <td><strong>${{ Math.round(broker.totalValue).toLocaleString() }}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import axios from 'axios'

export default {
  name: 'Admin',
  setup() {
    const brokers = ref([])
    const simulationStatus = ref({ 
      currentDate: new Date().toLocaleDateString('ru-RU'),
      isRunning: false,
      speed: 1 
    })

    const loadBrokers = async () => {
      try {
        const response = await axios.get('http://localhost:3002/brokers')
        brokers.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
      }
    }

    const loadSimulationStatus = async () => {
      try {
        const response = await axios.get('http://localhost:3002/brokers/simulation/status')
        simulationStatus.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки статуса симуляции:', error)
      }
    }

    onMounted(async () => {
      await loadBrokers()
      await loadSimulationStatus()
      
      setInterval(loadSimulationStatus, 5000)
    })

    return { brokers, simulationStatus }
  }
}
</script>
