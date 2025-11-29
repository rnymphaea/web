<template>
  <div class="container">
    <div class="card">
      <h1>Брокер: {{ broker?.name }}</h1>
      <p>Текущая дата: {{ currentDate }}</p>
      <div class="connection-status" :class="connectionClass">
        {{ connectionText }}
      </div>
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

    <!-- Stock Chart Dialog -->
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

// Регистрируем компоненты Chart.js
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
      currentStocks: [], // Данные от бэкенда в формате stockUpdate
      currentDate: '',
      socket: null,
      showDialog: false,
      tradeSymbol: '',
      tradeType: 'buy',
      tradeQuantity: 1,
      showChartDialog: false,
      chartSymbol: '',
      chartData: null,
      isConnected: false,
      priceHistory: {}, // Храним историю цен для графиков
      allStocks: [], // Все акции для графиков
      
      // Настройки графика
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: function(context) {
                return context[0].label;
              }
            }
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
              maxTicksLimit: 15,
              callback: function(value, index, values) {
                if (values.length > 15 && index % Math.ceil(values.length / 15) !== 0) {
                  return '';
                }
                return this.getLabelForValue(value);
              }
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
    },
    connectionClass() {
      return this.isConnected ? 'connected' : 'disconnected'
    },
    connectionText() {
      return this.isConnected ? '✓ Подключено к бирже' : '✗ Отключено от биржи'
    }
  },
  async mounted() {
    await this.loadAllStocks() // Загружаем данные акций для графиков
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
        console.log('Loaded stocks for charts:', this.allStocks.length)
      } catch (error) {
        console.error('Error loading stocks:', error)
        this.allStocks = []
      }
    },

    async loadBrokerData() {
      try {
        console.log('Loading broker data for ID:', this.brokerId)
        
        const portfolioResponse = await fetch(`http://localhost:3002/api/brokers/${this.brokerId}/portfolio`)
        
        if (!portfolioResponse.ok) {
          throw new Error(`Portfolio failed: ${portfolioResponse.status}`)
        }
        
        const portfolioData = await portfolioResponse.json()
        console.log('Portfolio data:', portfolioData)
        
        if (portfolioData.error) {
          this.portfolio = { stocks: [], totalValue: 0, totalProfit: 0 }
          this.broker = { cash: 0, name: 'Unknown' }
        } else {
          this.portfolio = portfolioData
          this.broker = portfolioData.broker || { cash: 0, name: 'Unknown' }
        }
        
      } catch (error) {
        console.error('Error loading broker data:', error)
        this.portfolio = { stocks: [], totalValue: 0, totalProfit: 0 }
        this.broker = { cash: 0, name: 'Error' }
      }
    },
    
    setupWebSocket() {
      try {
        // Подключаемся к вашему бэкенду на 3001 порту
        this.socket = io('http://localhost:3001')
        
        this.socket.on('connect', () => {
          console.log('Connected to simulation WebSocket')
          this.isConnected = true
        })

        this.socket.on('disconnect', () => {
          console.log('Disconnected from simulation WebSocket')
          this.isConnected = false
        })
        
        // Обрабатываем stockUpdate от вашего бэкенда
        this.socket.on('stockUpdate', (data) => {
          console.log('Received stockUpdate:', data)
          this.currentStocks = data || []
          
          // Обновляем текущую дату из первого элемента
          if (data && data.length > 0) {
            this.currentDate = data[0].date || ''
          }
          
          // Обновляем историю цен для графиков
          this.updatePriceHistory(data)
          
          // Если график открыт - обновляем его
          if (this.showChartDialog && this.chartSymbol) {
            this.updateChartData()
          }
          
          // Обновляем данные брокера
          this.loadBrokerData()
        })

        this.socket.on('portfolioUpdate', (portfolio) => {
          console.log('Received portfolio update for broker:', portfolio.brokerId)
          if (portfolio.brokerId === parseInt(this.brokerId)) {
            this.portfolio = portfolio
          }
        })
        
      } catch (error) {
        console.error('WebSocket setup error:', error)
      }
    },
    
    // Получить текущую цену по символу
    getCurrentPrice(symbol) {
      const stock = this.currentStocks.find(s => s.symbol === symbol)
      return stock ? stock.currentPrice : 0
    },
    
    // Обновляем историю цен при каждом обновлении
    updatePriceHistory(stocksData) {
      if (!stocksData || !Array.isArray(stocksData)) return
      
      const currentDate = stocksData[0]?.date || new Date().toLocaleDateString()
      
      stocksData.forEach(stock => {
        if (!stock.symbol) return
        
        if (!this.priceHistory[stock.symbol]) {
          this.priceHistory[stock.symbol] = []
        }
        
        // Добавляем новую точку данных
        this.priceHistory[stock.symbol].push({
          date: currentDate,
          price: stock.currentPrice
        })
        
        // Ограничиваем размер истории (последние 100 точек)
        if (this.priceHistory[stock.symbol].length > 100) {
          this.priceHistory[stock.symbol] = this.priceHistory[stock.symbol].slice(-100)
        }
      })
    },
    
    async showStockChart(symbol) {
      this.chartSymbol = symbol
      this.showChartDialog = true
      
      // Используем исторические данные из allStocks для графика
      this.updateChartFromHistoricalData()
    },
    
    // Обновляем график из исторических данных акций
    updateChartFromHistoricalData() {
      const stock = this.allStocks.find(s => s.symbol === this.chartSymbol)
      
      if (!stock || !stock.historicalData) {
        // Если нет исторических данных, используем локальную историю
        this.updateChartFromHistory()
        return
      }
      
      const historicalData = stock.historicalData
      
      // Сортируем по дате
      const ordered = [...historicalData].sort((a, b) => {
        const dateA = this.parseDateToTimestamp(a.date);
        const dateB = this.parseDateToTimestamp(b.date);
        return dateA - dateB;
      })
      
      const dedup = ordered.filter((item, i, arr) => 
        i === 0 || item.date !== arr[i - 1].date
      )
      
      // Используем даты как есть, так как они уже в правильном формате DD.MM.YYYY
      const labels = dedup.map(h => h.date);
      
      console.log('First 10 dates:', labels.slice(0, 10));
      
      this.chartData = {
        labels: labels,
        datasets: [
          {
            label: this.chartSymbol,
            data: dedup.map(h => h.open),
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.15,
            fill: true
          }
        ]
      }
    },

    // Вспомогательный метод для сортировки дат в формате DD.MM.YYYY
    parseDateToTimestamp(dateString) {
      if (!dateString) return 0;
      
      if (dateString.includes('.')) {
        const parts = dateString.split('.');
        if (parts.length === 3) {
          const day = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // Месяцы в JS: 0-11
          const year = parseInt(parts[2]);
          
          // Создаем дату и возвращаем timestamp
          const date = new Date(year, month, day);
          return date.getTime();
        }
      }
      
      // Fallback
      return new Date(dateString).getTime();
    },
    
    // Обновляем график из локальной истории (резервный вариант)
    updateChartFromHistory() {
      const history = this.priceHistory[this.chartSymbol] || []
      
      if (history.length === 0) {
        this.chartData = {
          labels: ['Нет данных'],
          datasets: [
            {
              label: this.chartSymbol,
              data: [0],
              borderColor: '#667eea',
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              tension: 0.15,
              fill: true
            }
          ]
        }
        return
      }
      
      // Сортируем по дате и убираем дубликаты
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
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.15,
            fill: true
          }
        ]
      }
    },
    
    // Обновляем данные графика (для WebSocket обновлений)
    updateChartData() {
      // При обновлении цен переключаемся на локальную историю для актуальности
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
        console.error('Trade error:', error)
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

.connection-status {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  display: inline-block;
}

.connection-status.connected {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.connection-status.disconnected {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
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

.actions {
  display: flex;
  gap: 5px;
}

.actions button {
  padding: 6px 12px;
  font-size: 12px;
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
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
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
  font-style: italic;
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
  font-size: 16px;
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
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

button:hover {
  background: #2980b9;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
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
    flex-direction: column;
    gap: 4px;
  }

  .actions button {
    padding: 6px 8px;
    font-size: 12px;
  }

  .modal-content {
    padding: 1.5rem;
    width: 95%;
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
