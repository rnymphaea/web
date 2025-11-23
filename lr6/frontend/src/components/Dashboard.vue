<template>
  <div>
    <h2>💼 Торговая площадка</h2>
    
    <div class="card">
      <h3>📅 Текущая дата: {{ simulationStatus.currentDate }}</h3>
      <p>Статус симуляции: 
        <span :class="simulationStatus.isRunning ? 'status-running' : 'status-stopped'">
          {{ simulationStatus.isRunning ? '🟢 Активна' : '🔴 Остановлена' }}
        </span>
      </p>
      <p>💰 Баланс: <strong>${{ broker.balance.toLocaleString() }}</strong></p>
      <p>📊 Общая стоимость: <strong>${{ (broker.balance + portfolioValue).toLocaleString() }}</strong></p>
    </div>

    <div class="card">
      <h3>📈 Рыночные цены</h3>
      <table>
        <thead>
          <tr>
            <th>Акция</th>
            <th>Цена</th>
            <th>Изменение</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stock in stockPrices" :key="stock.stockId">
            <td><strong>{{ stock.symbol }}</strong></td>
            <td>${{ stock.price.toFixed(2) }}</td>
            <td :class="getChangeClass(stock.change)">
              {{ stock.change > 0 ? '↗' : stock.change < 0 ? '↘' : '→' }}
              ${{ Math.abs(stock.change).toFixed(2) }}
            </td>
            <td>
              <button class="btn-buy" @click="openTradeModal('buy', stock)">🛒 Купить</button>
              <button class="btn-sell" @click="openTradeModal('sell', stock)">💰 Продать</button>
              <button @click="openChart(stock)">📊 График</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card" v-if="broker.portfolio.length > 0">
      <h3>💼 Портфель</h3>
      <table>
        <thead>
          <tr>
            <th>Акция</th>
            <th>Количество</th>
            <th>Средняя цена</th>
            <th>Текущая цена</th>
            <th>Прибыль/Убыток</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in broker.portfolio" :key="item.stockId">
            <td><strong>{{ item.symbol }}</strong></td>
            <td>{{ item.quantity }}</td>
            <td>${{ item.averagePrice.toFixed(2) }}</td>
            <td>${{ getCurrentPrice(item.stockId).toFixed(2) }}</td>
            <td :class="item.profitLoss >= 0 ? 'profit' : 'loss'">
              {{ item.profitLoss >= 0 ? '🟢' : '🔴' }}
              ${{ item.profitLoss.toFixed(2) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card" v-else>
      <h3>💼 Портфель</h3>
      <p>📭 Портфель пуст. Начните покупать акции!</p>
    </div>

    <div v-if="showTradeModal" class="modal">
      <div class="modal-content">
        <h3>{{ tradeType === 'buy' ? '🛒 Покупка' : '💰 Продажа' }} {{ selectedStock.symbol }}</h3>
        <p>Текущая цена: <strong>${{ selectedStock.price.toFixed(2) }}</strong></p>
        <input type="number" v-model.number="tradeQuantity" placeholder="Количество" min="1" @input="validateQuantity">
        <p>Общая стоимость: <strong>${{ (selectedStock.price * tradeQuantity).toFixed(2) }}</strong></p>
        <p v-if="tradeType === 'buy' && selectedStock.price * tradeQuantity > broker.balance" style="color: #dc3545;">
          ❌ Недостаточно средств!
        </p>
        <div>
          <button @click="executeTrade" :class="tradeType === 'buy' ? 'btn-buy' : 'btn-sell'" 
                  :disabled="tradeType === 'buy' && selectedStock.price * tradeQuantity > broker.balance">
            {{ tradeType === 'buy' ? '🛒 Купить' : '💰 Продать' }}
          </button>
          <button @click="closeModals">❌ Отмена</button>
        </div>
      </div>
    </div>

    <div v-if="showChartModal" class="modal">
      <div class="modal-content">
        <h3>📊 График {{ selectedStock.symbol }}</h3>
        <div class="chart-placeholder">
          <p>График изменения цены акции <strong>{{ selectedStock.symbol }}</strong></p>
          <p>Текущая цена: <strong>${{ selectedStock.price.toFixed(2) }}</strong></p>
          <p>📅 Исторические данные с начала торгов</p>
          <p>🔄 Данные обновляются в реальном времени</p>
        </div>
        <button @click="closeModals">❌ Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { io } from 'socket.io-client'
import axios from 'axios'

export default {
  name: 'Dashboard',
  setup() {
    const broker = ref({ balance: 0, portfolio: [] })
    const stockPrices = ref([])
    const simulationStatus = ref({ 
      currentDate: new Date().toLocaleDateString('ru-RU'),
      isRunning: false,
      speed: 1 
    })
    const showTradeModal = ref(false)
    const showChartModal = ref(false)
    const tradeType = ref('buy')
    const selectedStock = ref(null)
    const tradeQuantity = ref(1)
    const socket = ref(null)

    const portfolioValue = computed(() => {
      return broker.value.portfolio.reduce((total, item) => {
        return total + (getCurrentPrice(item.stockId) * item.quantity)
      }, 0)
    })

    const loadBrokerData = async (brokerId) => {
      try {
        const response = await axios.get(`http://localhost:3002/brokers/${brokerId}`)
        broker.value = response.data
      } catch (error) {
        console.error('Ошибка загрузки данных брокера:', error)
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

    const updatePortfolioPrices = () => {
      broker.value.portfolio.forEach(item => {
        const currentPrice = getCurrentPrice(item.stockId)
        item.profitLoss = (currentPrice - item.averagePrice) * item.quantity
      })
    }

    const getCurrentPrice = (stockId) => {
      const stock = stockPrices.value.find(s => s.stockId === stockId)
      return stock ? stock.price : 0
    }

    const getChangeClass = (change) => {
      if (change > 0) return 'change-positive'
      if (change < 0) return 'change-negative'
      return 'change-neutral'
    }

    const validateQuantity = () => {
      if (tradeQuantity.value < 1) {
        tradeQuantity.value = 1
      }
    }

    const openTradeModal = (type, stock) => {
      tradeType.value = type
      selectedStock.value = stock
      tradeQuantity.value = 1
      showTradeModal.value = true
    }

    const openChart = (stock) => {
      selectedStock.value = stock
      showChartModal.value = true
    }

    const closeModals = () => {
      showTradeModal.value = false
      showChartModal.value = false
      tradeQuantity.value = 1
    }

    const executeTrade = async () => {
      try {
        const brokerId = JSON.parse(localStorage.getItem('currentBroker')).id
        const endpoint = tradeType.value === 'buy' ? 'buy' : 'sell'
        
        const response = await axios.post(`http://localhost:3002/brokers/${brokerId}/${endpoint}`, {
          stockId: selectedStock.value.stockId,
          symbol: selectedStock.value.symbol,
          quantity: parseInt(tradeQuantity.value),
          price: selectedStock.value.price
        })

        if (response.data.success) {
          await loadBrokerData(brokerId)
          closeModals()
          alert(`✅ Операция выполнена успешно!\nНовый баланс: $${response.data.newBalance.toLocaleString()}`)
        }
      } catch (error) {
        alert(`❌ Ошибка: ${error.response?.data?.message || 'Неизвестная ошибка'}`)
      }
    }

    onMounted(async () => {
      const savedBroker = JSON.parse(localStorage.getItem('currentBroker'))
      if (savedBroker) {
        await loadBrokerData(savedBroker.id)
      }

      await loadSimulationStatus()

      socket.value = io('http://localhost:3002')
      socket.value.on('stockPrices', (prices) => {
        stockPrices.value = prices
        updatePortfolioPrices()
      })

      setInterval(loadSimulationStatus, 5000)
    })

    onUnmounted(() => {
      if (socket.value) {
        socket.value.disconnect()
      }
    })

    return {
      broker,
      stockPrices,
      simulationStatus,
      showTradeModal,
      showChartModal,
      tradeType,
      selectedStock,
      tradeQuantity,
      portfolioValue,
      openTradeModal,
      openChart,
      closeModals,
      executeTrade,
      getCurrentPrice,
      getChangeClass,
      validateQuantity
    }
  }
}
</script>
