<template>
  <div class="container">
    <div class="card">
      <h1>Брокер: {{ broker?.name }}</h1>
      <p>Текущая дата: {{ currentDate }}</p>
    </div>

    <div class="card">
      <h2>Цены акций</h2>
      <table>
        <thead>
          <tr>
            <th>Акция</th>
            <th>Цена</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(price, symbol) in currentPrices" :key="symbol">
            <td>{{ symbol }}</td>
    <td>${{ (price || 0).toFixed(2) }}</td>
            <td class="actions">
              <button @click="openTradeDialog(symbol, 'buy')">Купить</button>
              <button @click="openTradeDialog(symbol, 'sell')">Продать</button>
              <button @click="showStockChart(symbol)" class="chart-btn">График</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>Портфель</h2>
      <div class="portfolio-summary">
        <div class="summary-item">
          <span>Общие средства:</span>
          <span>${{ (portfolio?.totalValue || 0).toFixed(2) }}</span>
        </div>
        <div class="summary-item">
          <span>Денежные средства:</span>
          <span>${{ (broker?.cash || 0).toFixed(2) }}</span>
        </div>
        <div class="summary-item" :class="getProfitClass(portfolio?.totalProfit || 0)">
          <span>Прибыль:</span>
          <span>${{ ((portfolio?.totalProfit || 0)).toFixed(2) }}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Акция</th>
            <th>Кол-во</th>
            <th>Ср. цена</th>
            <th>Тек. цена</th>
            <th>Стоимость</th>
            <th>Прибыль</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stock in portfolio?.stocks || []" :key="stock.symbol">
            <td>{{ stock.symbol }}</td>
            <td>{{ stock.quantity || 0 }}</td>
            <td>${{ (stock.averagePrice || 0).toFixed(2) }}</td>
            <td>${{ (stock.currentPrice || 0).toFixed(2) }}</td>
            <td>${{ (stock.value || 0).toFixed(2) }}</td>
            <td :class="getStockProfitClass(stock)">
              ${{ (stock.profit || 0).toFixed(2) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Trade Dialog -->
    <div v-if="showDialog" class="dialog-overlay">
      <div class="card dialog">
        <h3>{{ tradeType === 'buy' ? 'Покупка' : 'Продажа' }} {{ tradeSymbol }}</h3>
        <p>Цена: ${{ (currentPrices[tradeSymbol] || 0).toFixed(2) }}</p>
        <div class="form-group">
          <label>Количество:</label>
          <input v-model.number="tradeQuantity" type="number" min="1">
        </div>
        <p>Стоимость: ${{ ((currentPrices[tradeSymbol] || 0) * tradeQuantity).toFixed(2) }}</p>
        <div class="dialog-actions">
          <button @click="executeTrade" :disabled="!tradeQuantity">Выполнить</button>
          <button @click="closeDialog">Отмена</button>
        </div>
      </div>
    </div>

    <!-- Stock Chart Dialog -->
    <div v-if="showChartDialog" class="dialog-overlay">
      <div class="card dialog chart-dialog">
        <div class="chart-header">
          <h3>{{ chartSymbol }}</h3>
          <button @click="closeChartDialog" class="close-btn">×</button>
        </div>
        
        <div class="chart-info" v-if="chartData">
          <div class="info-row">
            <div><strong>Текущая цена:</strong> ${{ (currentPrices[chartSymbol] || 0).toFixed(2) }}</div>
            <div><strong>Данные:</strong> {{ chartData.availableDataPoints }}/{{ chartData.totalDataPoints }} дней</div>
          </div>
        </div>

        <div class="chart-container">
          <canvas ref="chartCanvas"></canvas>
        </div>
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
      tradeQuantity: 1,
      showChartDialog: false,
      chartSymbol: '',
      chartData: null,
      stockChart: null
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
    this.destroyChart()
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
        
        const portfolioData = await portfolioResponse.json()
        if (portfolioData.error) {
          this.portfolio = { stocks: [], totalValue: 0, totalProfit: 0 }
          this.broker = { cash: 0 }
        } else {
          this.portfolio = portfolioData
          this.broker = portfolioData.broker || {}
        }
        
        const pricesData = await pricesResponse.json()
        this.currentPrices = pricesData.prices || {}
        this.currentDate = pricesData.date || ''
        
      } catch (error) {
        console.error('Error loading broker data:', error)
        this.portfolio = { stocks: [], totalValue: 0, totalProfit: 0 }
        this.broker = { cash: 0 }
        this.currentPrices = {}
      }
    },
    setupWebSocket() {
      this.socket = io('http://localhost:3002')
      
      this.socket.on('priceUpdate', (data) => {
        this.currentPrices = data.prices || {}
        this.currentDate = data.date || ''
        this.loadBrokerData()
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
      try {
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
          alert('Ошибка операции')
        }
      } catch (error) {
        console.error('Trade error:', error)
        alert('Ошибка операции')
      }
    },
    async showStockChart(symbol) {
      this.chartSymbol = symbol
      this.showChartDialog = true
      
      try {
        const response = await fetch(`http://localhost:3002/api/stocks/${symbol}/chart`);
        const data = await response.json();
        
        if (data.error) {
          this.chartData = null;
          return;
        }
        
        this.chartData = data;
        this.$nextTick(() => {
          this.renderChart();
        });
        
      } catch (error) {
        console.error('Chart error:', error);
        this.chartData = null;
      }
    },
    closeChartDialog() {
      this.showChartDialog = false
      this.chartSymbol = ''
      this.chartData = null
      this.destroyChart()
    },
    renderChart() {
      if (!this.chartData || !this.$refs.chartCanvas) return;

      this.destroyChart()

      const ctx = this.$refs.chartCanvas.getContext('2d');
      
      const labels = this.chartData.dates || [];
      const prices = this.chartData.prices || [];
      
      this.stockChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: `Цена ${this.chartSymbol}`,
              data: prices,
              borderColor: '#3498db',
              backgroundColor: 'rgba(52, 152, 219, 0.1)',
              borderWidth: 2,
              tension: 0.1,
              fill: true,
              pointRadius: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            }
          },
          scales: {
            x: {
              display: true,
              grid: {
                display: false
              }
            },
            y: {
              display: true,
              beginAtZero: false
            }
          }
        }
      });
    },
    destroyChart() {
      if (this.stockChart) {
        this.stockChart.destroy();
        this.stockChart = null;
      }
    },
    getProfitClass(profit) {
      return profit >= 0 ? 'profit' : 'loss'
    },
    getStockProfitClass(stock) {
      return (stock.profit || 0) >= 0 ? 'profit' : 'loss'
    }
  }
}
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

h1 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

h2 {
  margin: 0 0 15px 0;
  font-size: 18px;
}

h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
}

.portfolio-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

th {
  font-weight: 600;
  background: #f8f9fa;
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
  padding: 20px;
}

.dialog {
  max-width: 400px;
  width: 100%;
}

.chart-dialog {
  max-width: 800px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-info {
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  gap: 15px;
}

.chart-container {
  height: 400px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 16px; /* Увеличим для мобильных */
}

.dialog-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

button {
  padding: 10px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #3498db;
  cursor: pointer;
  font-size: 14px;
}

.chart-btn {
  background: #6c757d;
  color: white;
  border-color: #6c757d;
}

.chart-btn:hover {
  background: #5a6268;
}

/* Адаптивность для мобильных */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }

  .card {
    padding: 15px;
    margin-bottom: 15px;
  }

  h1 {
    font-size: 20px;
  }

  h2 {
    font-size: 16px;
  }

  .portfolio-summary {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 10px;
  }

  table {
    font-size: 14px;
  }

  th, td {
    padding: 8px 4px;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .actions button {
    padding: 6px 8px;
    font-size: 12px;
  }

  .dialog-overlay {
    padding: 10px;
  }

  .chart-dialog {
    max-width: 100%;
  }

  .chart-container {
    height: 300px;
  }

  .info-row {
    flex-direction: column;
    gap: 8px;
  }

  .dialog-actions {
    flex-direction: column;
  }

  .dialog-actions button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 5px;
  }

  .card {
    padding: 10px;
  }

  table {
    font-size: 12px;
  }

  th, td {
    padding: 6px 2px;
  }

  .chart-container {
    height: 250px;
  }
}
</style>
