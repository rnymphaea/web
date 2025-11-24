<template>
  <div class="container">
    <div class="card">
      <h1>Кабинет брокера: {{ broker?.name }}</h1>
      <p>Текущая дата: {{ currentDate }}</p>
    </div>

    <div class="card">
      <h2>Текущие цены акций</h2>
      <table>
        <thead>
          <tr>
            <th>Акция</th>
            <th>Текущая цена</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(price, symbol) in currentPrices" :key="symbol">
            <td>{{ symbol }}</td>
            <td>${{ price.toFixed(2) }}</td>
            <td>
              <button @click="openTradeDialog(symbol, 'buy')">Купить</button>
              <button @click="openTradeDialog(symbol, 'sell')">Продать</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Портфель</h2>
      <div class="portfolio-summary">
        <div class="summary-item">
          <span class="label">Общие средства:</span>
          <span class="value">${{ portfolio?.totalValue?.toFixed(2) || '0.00' }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Денежные средства:</span>
          <span class="value">${{ broker?.cash?.toFixed(2) || '0.00' }}</span>
        </div>
        <div class="summary-item" :class="getProfitClass(portfolio?.totalProfit || 0)">
          <span class="label">Общая прибыль:</span>
          <span class="value">${{ (portfolio?.totalProfit || 0).toFixed(2) }}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Акция</th>
            <th>Количество</th>
            <th>Средняя цена</th>
            <th>Текущая цена</th>
            <th>Стоимость</th>
            <th>Прибыль/Убыток</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stock in portfolio?.stocks || []" :key="stock.symbol">
            <td>{{ stock.symbol }}</td>
            <td>{{ stock.quantity }}</td>
            <td>${{ stock.averagePrice.toFixed(2) }}</td>
            <td>${{ stock.currentPrice.toFixed(2) }}</td>
            <td>${{ stock.value.toFixed(2) }}</td>
            <td :class="getStockProfitClass(stock)">
              ${{ stock.profit.toFixed(2) }} ({{ stock.profitPercentage > 0 ? '+' : '' }}{{ stock.profitPercentage.toFixed(2) }}%)
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Trade Dialog -->
    <div v-if="showDialog" class="dialog-overlay">
      <div class="card dialog">
        <h3>{{ tradeType === 'buy' ? 'Покупка' : 'Продажа' }} {{ tradeSymbol }}</h3>
        <p>Текущая цена: ${{ currentPrices[tradeSymbol]?.toFixed(2) }}</p>
        <div class="form-group">
          <label>Количество:</label>
          <input v-model.number="tradeQuantity" type="number" min="1">
        </div>
        <p>Общая стоимость: ${{ (currentPrices[tradeSymbol] * tradeQuantity).toFixed(2) }}</p>
        <button @click="executeTrade" :disabled="!tradeQuantity">Выполнить</button>
        <button @click="closeDialog">Отмена</button>
      </div>
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables);

export default {
  data() {
    return {
      broker: null,
      portfolio: null,
      currentPrices: {},
      currentDate: '',
      socket: null,
      showDialog: false,
      tradeSymbol: '',
      tradeType: 'buy',
      tradeQuantity: 1
    }
  },
  computed: {
    brokerId() {
      return this.$route.params.id
    }
  },
  async mounted() {
    await this.loadBrokerData()
    this.setupWebSocket()
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect()
    }
  },
  methods: {
    async loadBrokerData() {
      try {
        const [portfolioResponse, pricesResponse] = await Promise.all([
          fetch(`http://localhost:3002/api/brokers/${this.brokerId}/portfolio`),
          fetch('http://localhost:3002/api/prices')
        ])
        
        if (!portfolioResponse.ok || !pricesResponse.ok) {
          throw new Error('Failed to fetch data')
        }
        
        this.portfolio = await portfolioResponse.json()
        this.broker = this.portfolio.broker
        
        const pricesData = await pricesResponse.json()
        this.currentPrices = pricesData.prices
        this.currentDate = pricesData.date
        
      } catch (error) {
        console.error('Error loading broker data:', error)
        alert('Ошибка загрузки данных')
      }
    },
    setupWebSocket() {
      this.socket = io('http://localhost:3002')
      
      this.socket.on('priceUpdate', (data) => {
        console.log('Received price update:', data)
        this.currentPrices = data.prices
        this.currentDate = data.date
        this.loadBrokerData()
      })

      this.socket.on('connect', () => {
        console.log('Connected to brokers WebSocket')
      })

      this.socket.on('disconnect', () => {
        console.log('Disconnected from brokers WebSocket')
      })
    },
    openTradeDialog(symbol, type) {
      this.tradeSymbol = symbol
      this.tradeType = type
      this.tradeQuantity = 1
      this.showDialog = true
    },
    closeDialog() {
      this.showDialog = false
    },
    async executeTrade() {
      const endpoint = this.tradeType === 'buy' ? 'buy' : 'sell'
      const response = await fetch(`http://localhost:3002/api/brokers/${this.brokerId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: this.tradeSymbol,
          quantity: this.tradeQuantity
        })
      })
      
      const result = await response.json()
      if (result.success) {
        await this.loadBrokerData()
        this.closeDialog()
      } else {
        alert('Ошибка выполнения операции')
      }
    },
    getProfitClass(profit) {
      return profit >= 0 ? 'profit' : 'loss'
    },
    getStockProfitClass(stock) {
      return stock.profit >= 0 ? 'profit' : 'loss'
    }
  }
}
</script>

<style scoped>
.portfolio-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.summary-item .label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.summary-item .value {
  font-size: 1.2rem;
  font-weight: bold;
}

.profit {
  color: #28a745;
}

.loss {
  color: #dc3545;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  max-width: 400px;
  background: white;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
  font-weight: bold;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-right: 0.5rem;
}

button:hover {
  background: #2980b9;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
