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
              <button @click="showChart(symbol)">График</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Портфель</h2>
      <p>Общие средства: ${{ portfolio?.totalValue?.toFixed(2) || '0.00' }}</p>
      <p>Денежные средства: ${{ broker?.cash?.toFixed(2) || '0.00' }}</p>
      
      <table>
        <thead>
          <tr>
            <th>Акция</th>
            <th>Количество</th>
            <th>Текущая цена</th>
            <th>Стоимость</th>
            <th>Прибыль/Убыток</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stock in portfolio?.stocks || []" :key="stock.symbol">
            <td>{{ stock.symbol }}</td>
            <td>{{ stock.quantity }}</td>
            <td>${{ stock.currentPrice.toFixed(2) }}</td>
            <td>${{ stock.value.toFixed(2) }}</td>
            <td :class="getProfitClass(stock)">
              ${{ calculateProfit(stock).toFixed(2) }}
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

    <!-- Chart Dialog -->
    <div v-if="showChartDialog" class="dialog-overlay">
      <div class="card dialog">
        <h3>График {{ chartSymbol }}</h3>
        <canvas ref="chartCanvas" width="400" height="200"></canvas>
        <button @click="closeChartDialog">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client'
import { Chart } from 'chart.js'

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
      tradeQuantity: 1,
      showChartDialog: false,
      chartSymbol: '',
      chart: null
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
      const [brokerResponse, portfolioResponse, pricesResponse] = await Promise.all([
        fetch(`http://localhost:3002/api/brokers/${this.brokerId}/portfolio`),
        fetch(`http://localhost:3002/api/brokers/${this.brokerId}/portfolio`),
        fetch('http://localhost:3002/api/prices')
      ])
      
      this.portfolio = await portfolioResponse.json()
      this.broker = this.portfolio.broker
      
      const pricesData = await pricesResponse.json()
      this.currentPrices = pricesData.prices
      this.currentDate = pricesData.date
    },
    setupWebSocket() {
      this.socket = io('http://localhost:3002')
      
      this.socket.on('priceUpdate', (data) => {
        this.currentPrices = data.prices
        this.currentDate = data.date
        this.loadBrokerData() // Refresh portfolio
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
    showChart(symbol) {
      this.chartSymbol = symbol
      this.showChartDialog = true
      this.$nextTick(() => {
        this.renderChart()
      })
    },
    closeChartDialog() {
      this.showChartDialog = false
      if (this.chart) {
        this.chart.destroy()
      }
    },
    renderChart() {
      const ctx = this.$refs.chartCanvas.getContext('2d')
      // Simplified chart - in real app, fetch historical data
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['День 1', 'День 2', 'День 3', 'День 4', 'День 5'],
          datasets: [{
            label: this.chartSymbol,
            data: [100, 120, 90, 150, 130],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        }
      })
    },
    calculateProfit(stock) {
      // Simplified profit calculation
      return (stock.currentPrice - 100) * stock.quantity
    },
    getProfitClass(stock) {
      const profit = this.calculateProfit(stock)
      return profit >= 0 ? 'profit' : 'loss'
    }
  }
}
</script>

<style scoped>
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
}

.dialog {
  max-width: 400px;
}
</style>
