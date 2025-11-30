<template>
  <div class="container">
    <div class="header">
      <h1>Брокер: {{ broker?.name }}</h1>
      <p>Текущая дата: {{ currentDate }}</p>
    </div>

    <div class="section">
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
          <tr v-for="stock in currentStocks" :key="stock.symbol">
            <td>{{ stock.symbol }}</td>
            <td>${{ (stock.currentPrice || 0).toFixed(2) }}</td>
            <td class="actions">
              <button @click="openTradeDialog(stock.symbol, 'buy')">Купить</button>
              <button @click="openTradeDialog(stock.symbol, 'sell')">Продать</button>
              <button @click="showStockChart(stock.symbol)">График</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
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

    <div v-if="showDialog" class="modal" @click.self="showDialog = false">
      <div class="modal-content">
        <h3>{{ tradeType === 'buy' ? 'Покупка' : 'Продажа' }} {{ tradeSymbol }}</h3>
        <p>Цена: ${{ (getCurrentPrice(tradeSymbol) || 0).toFixed(2) }}</p>
        <div class="form-group">
          <label>Количество:</label>
          <input v-model.number="tradeQuantity" type="number" min="1">
        </div>
        <p>Стоимость: ${{ (getCurrentPrice(tradeSymbol) * tradeQuantity).toFixed(2) }}</p>
        <div class="dialog-actions">
          <button @click="executeTrade" :disabled="!tradeQuantity">Выполнить</button>
          <button @click="showDialog = false">Отмена</button>
        </div>
      </div>
    </div>

    <div v-if="showChartDialog" class="modal" @click.self="showChartDialog = false">
      <div class="modal-content chart-modal">
        <h3>График {{ chartSymbol }}</h3>
        <div class="chart-container">
          <Line 
            v-if="chartData"
            :data="chartData"
            :options="chartOptions"
            :height="400"
          />
          <div v-else class="chart-loading">
            Загрузка данных графика...
          </div>
        </div>
        <button @click="showChartDialog = false">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script>
import { io } from 'socket.io-client'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default {
  name: 'Broker',
  components: {
    Line
  },
  data() {
    return {
      broker: null,
      portfolio: null,
      currentStocks: [],
      currentDate: '',
      socket: null,
      showDialog: false,
      tradeSymbol: '',
      tradeType: 'buy',
      tradeQuantity: 1,
      showChartDialog: false,
      chartSymbol: '',
      chartData: null,
      priceHistory: {},
      allStocks: [],
      
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Дата'
            },
            ticks: {
              maxTicksLimit: 15
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Цена ($)'
            }
          }
        }
      }
    }
  },
  computed: {
    brokerId() {
      return this.$route.params.id
    }
  },
  async mounted() {
    await this.loadAllStocks()
    await this.loadBrokerData()
    this.setupWebSocket()
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect()
    }
  },
  methods: {
    async loadAllStocks() {
      try {
        const response = await fetch('http://localhost:3001/stocks')
        this.allStocks = await response.json()
      } catch (error) {
        this.allStocks = []
      }
    },

    async loadBrokerData() {
      try {
        const portfolioResponse = await fetch(`http://localhost:3002/api/brokers/${this.brokerId}/portfolio`)
        
        if (!portfolioResponse.ok) {
          throw new Error(`Portfolio failed: ${portfolioResponse.status}`)
        }
        
        const portfolioData = await portfolioResponse.json()
        
        if (portfolioData.error) {
          this.portfolio = { stocks: [], totalValue: 0, totalProfit: 0 }
          this.broker = { cash: 0, name: 'Unknown' }
        } else {
          this.portfolio = portfolioData
          this.broker = portfolioData.broker || { cash: 0, name: 'Unknown' }
        }
        
      } catch (error) {
        this.portfolio = { stocks: [], totalValue: 0, totalProfit: 0 }
        this.broker = { cash: 0, name: 'Error' }
      }
    },
    
    setupWebSocket() {
      try {
        this.socket = io('http://localhost:3001')
        
        this.socket.on('stockUpdate', (data) => {
          this.currentStocks = data || [];
          
          if (data && data.length > 0) {
            this.currentDate = data[0].date || ''
          }
          
          this.updatePriceHistory(data)
          
          if (this.showChartDialog && this.chartSymbol) {
            this.updateChartData()
          }
          
          this.loadBrokerData()
        })

        this.socket.on('portfolioUpdate', (portfolio) => {
          if (portfolio.brokerId === parseInt(this.brokerId)) {
            this.portfolio = portfolio
          }
        })
        
      } catch (error) {
      }
    },
    
    getCurrentPrice(symbol) {
      const stock = this.currentStocks.find(s => s.symbol === symbol)
      return stock ? stock.currentPrice : 0
    },
    
    updatePriceHistory(stocksData) {
      if (!stocksData || !Array.isArray(stocksData)) return
      
      const currentDate = stocksData[0]?.date || new Date().toLocaleDateString()
      
      stocksData.forEach(stock => {
        if (!stock.symbol) return
        
        if (!this.priceHistory[stock.symbol]) {
          this.priceHistory[stock.symbol] = []
        }
        
        this.priceHistory[stock.symbol].push({
          date: currentDate,
          price: stock.currentPrice
        })
        
        if (this.priceHistory[stock.symbol].length > 100) {
          this.priceHistory[stock.symbol] = this.priceHistory[stock.symbol].slice(-100)
        }
      })
    },
    
    async showStockChart(symbol) {
      this.chartSymbol = symbol
      this.showChartDialog = true
      this.updateChartFromHistoricalData()
    },
    
    updateChartFromHistoricalData() {
      const stock = this.allStocks.find(s => s.symbol === this.chartSymbol)
      
      if (!stock || !stock.historicalData) {
        this.updateChartFromHistory()
        return
      }
      
      const historicalData = stock.historicalData
      
      const ordered = [...historicalData].sort((a, b) => {
        const dateA = this.parseDateToTimestamp(a.date);
        const dateB = this.parseDateToTimestamp(b.date);
        return dateA - dateB;
      })
      
      const dedup = ordered.filter((item, i, arr) => 
        i === 0 || item.date !== arr[i - 1].date
      )
      
      const labels = dedup.map(h => h.date);
      
      this.chartData = {
        labels: labels,
        datasets: [
          {
            label: this.chartSymbol,
            data: dedup.map(h => h.open),
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.15,
            fill: true
          }
        ]
      }
    },

    parseDateToTimestamp(dateString) {
      if (!dateString) return 0;
      
      if (dateString.includes('.')) {
        const parts = dateString.split('.');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const year = parseInt(parts[2]);
          const date = new Date(year, month, day);
          return date.getTime();
        }
      }
      
      return new Date(dateString).getTime();
    },
    
    updateChartFromHistory() {
      const history = this.priceHistory[this.chartSymbol] || []
      
      if (history.length === 0) {
        this.chartData = {
          labels: ['Нет данных'],
          datasets: [
            {
              label: this.chartSymbol,
              data: [0],
              borderColor: '#007bff',
              backgroundColor: 'rgba(0, 123, 255, 0.1)',
              tension: 0.15,
              fill: true
            }
          ]
        }
        return
      }
      
      const ordered = [...history].sort((a, b) => 
        this.parseDateToTimestamp(a.date) - this.parseDateToTimestamp(b.date)
      )
      
      const dedup = ordered.filter((item, i, arr) => 
        i === 0 || item.date !== arr[i - 1].date
      )
      
      this.chartData = {
        labels: dedup.map(h => h.date),
        datasets: [
          {
            label: this.chartSymbol,
            data: dedup.map(h => h.price),
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.15,
            fill: true
          }
        ]
      }
    },
    
    updateChartData() {
      this.updateChartFromHistory()
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
        const currentPrice = this.getCurrentPrice(this.tradeSymbol)
        if (!currentPrice) {
          alert('Не удалось получить текущую цену')
          return
        }

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
        alert('Ошибка операции')
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
  font-family: Arial, sans-serif;
}

.header {
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.section {
  margin-bottom: 2rem;
}

.section h2 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.portfolio-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
}

table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #dee2e6;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.profit {
  color: #28a745;
}

.loss {
  color: #dc3545;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.actions button {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  padding: 2rem;
  border-radius: 4px;
  max-width: 500px;
  width: 90%;
}

.chart-modal {
  max-width: 800px;
  width: 95%;
}

.chart-container {
  height: 400px;
  margin-bottom: 1rem;
}

.chart-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #666;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.dialog-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

button {
  padding: 0.5rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}

button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .portfolio-summary {
    grid-template-columns: 1fr;
    gap: 0.5rem;
    padding: 0.5rem;
  }

  table {
    font-size: 0.8rem;
  }

  th, td {
    padding: 0.5rem;
  }

  .actions {
    flex-direction: column;
    gap: 0.25rem;
  }

  .modal-content {
    padding: 1rem;
  }

  .chart-modal {
    max-width: 100%;
    width: 95%;
  }

  .chart-container {
    height: 300px;
  }
}
</style>
