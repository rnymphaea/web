<template>
  <div class="admin">
    <header class="header">
      <h1>Портфели брокеров</h1>
      <button @click="$router.push('/')" class="back-btn">← Назад</button>
    </header>

    <main class="main">
      <div class="connection-status" :class="connectionClass">
        {{ connectionText }}
      </div>

      <div class="current-info">
        <p><strong>Текущая дата:</strong> {{ currentDate }}</p>
        <p><strong>Статус симуляции:</strong> {{ simulationStatus }}</p>
      </div>

      <div v-if="portfolios.length === 0" class="empty">
        <p>Нет данных о портфелях</p>
      </div>

      <div v-else class="portfolios">
        <div v-for="portfolio in portfoliosWithCurrentPrices" :key="portfolio.brokerId" class="portfolio">
          <div class="portfolio-header">
            <h2>{{ portfolio.brokerName }}</h2>
            <div class="portfolio-total" :class="getProfitClass(portfolio.totalProfit || 0)">
              ${{ (portfolio.totalValue || 0).toLocaleString() }}
              <div class="profit-badge">
                {{ (portfolio.totalProfit || 0) > 0 ? '+' : '' }}{{ (portfolio.totalProfit || 0).toFixed(2) }}
              </div>
            </div>
          </div>

          <div class="portfolio-details">
            <div class="cash">Наличные: ${{ (portfolio.cash || 0).toLocaleString() }}</div>
            
            <div v-if="portfolio.stocks && portfolio.stocks.length > 0" class="stocks">
              <div v-for="stock in portfolio.stocks" :key="stock.symbol" class="stock">
                <span class="symbol">{{ stock.symbol }}</span>
                <span class="quantity">{{ stock.quantity || 0 }} шт</span>
                <span class="avg-price">${{ (stock.averagePrice || 0).toFixed(2) }}</span>
                <span class="price">${{ (getCurrentStockPrice(stock.symbol) || 0).toFixed(2) }}</span>
                <span class="value" :class="getStockProfitClass(calculateStockProfit(stock))">
                  ${{ (calculateStockProfit(stock) || 0).toFixed(2) }}
                </span>
              </div>
            </div>
            
            <div v-else class="no-stocks">
              Нет акций
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { io } from 'socket.io-client'

export default {
  data() {
    return {
      portfolios: [],
      currentPrices: {}, // Храним текущие цены акций
      socket: null,
      isConnected: false,
      currentDate: '',
      simulationSettings: null
    }
  },
  computed: {
    connectionClass() {
      return this.isConnected ? 'connected' : 'disconnected'
    },
    connectionText() {
      return this.isConnected ? '✓ Подключено к бирже' : '✗ Отключено от бирже'
    },
    simulationStatus() {
      return this.simulationSettings?.isRunning ? 'Запущена' : 'Остановлена'
    },
    // Вычисляем портфели с актуальными ценами
    portfoliosWithCurrentPrices() {
      return this.portfolios.map(portfolio => {
        // Пересчитываем стоимость портфеля с актуальными ценами
        let stockValue = 0;
        let totalProfit = 0;
        
        const updatedStocks = portfolio.stocks?.map(stock => {
          const currentPrice = this.getCurrentStockPrice(stock.symbol);
          const currentValue = currentPrice * stock.quantity;
          const totalCost = stock.averagePrice * stock.quantity;
          const profit = currentValue - totalCost;
          
          stockValue += currentValue;
          totalProfit += profit;
          
          return {
            ...stock,
            currentPrice: currentPrice,
            value: currentValue,
            profit: profit
          };
        }) || [];
        
        const totalValue = portfolio.cash + stockValue;
        
        return {
          ...portfolio,
          stocks: updatedStocks,
          totalValue: totalValue,
          totalProfit: totalProfit
        };
      });
    }
  },
  async mounted() {
    await this.loadPortfolios();
    await this.loadSimulationSettings();
    this.setupWebSocket();
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
  methods: {
    async loadPortfolios() {
      try {
        const response = await fetch('http://localhost:3002/api/portfolios');
        const result = await response.json();
        
        if (result.success) {
          this.portfolios = result.data || [];
          console.log('Loaded portfolios:', this.portfolios);
        }
      } catch (error) {
        console.error('Error loading portfolios:', error);
        this.portfolios = [];
      }
    },

    async loadSimulationSettings() {
      try {
        const response = await fetch('http://localhost:3001/simulation/settings');
        this.simulationSettings = await response.json();
        console.log('Simulation settings:', this.simulationSettings);
      } catch (error) {
        console.error('Error loading simulation settings:', error);
        this.simulationSettings = { isRunning: false };
      }
    },

    setupWebSocket() {
      // Подключаемся к брокерскому WebSocket для получения портфелей
      this.socket = io('http://localhost:3002');
      
      this.socket.on('connect', () => {
        console.log('Connected to broker WebSocket for admin');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from broker WebSocket');
        this.isConnected = false;
      });

      this.socket.on('priceUpdate', (data) => {
        console.log('Received price update in admin:', data);
        // Обновляем текущие цены
        this.currentPrices = data.prices || {};
        this.currentDate = data.date || '';
      });

      this.socket.on('portfolioUpdate', (portfolio) => {
        console.log('Received portfolio update:', portfolio);
        this.handlePortfolioUpdate(portfolio);
      });

      // Подключаемся также к симуляционному WebSocket для получения обновлений цен
      this.setupSimulationWebSocket();
    },

    setupSimulationWebSocket() {
      const simulationSocket = io('http://localhost:3001');
      
      simulationSocket.on('connect', () => {
        console.log('Connected to simulation WebSocket for admin');
      });

      simulationSocket.on('stockUpdate', (data) => {
        console.log('Received stock update from simulation:', data);
        // Обновляем цены из симуляции
        if (data && Array.isArray(data)) {
          data.forEach(stock => {
            this.currentPrices[stock.symbol] = stock.currentPrice;
          });
        }
        if (data && data.length > 0) {
          this.currentDate = data[0].date || '';
        }
      });

      simulationSocket.on('settingsUpdated', (settings) => {
        console.log('Settings updated in admin:', settings);
        this.simulationSettings = settings;
      });
    },

    handlePortfolioUpdate(updatedPortfolio) {
      const index = this.portfolios.findIndex(p => p.brokerId === updatedPortfolio.brokerId);
      
      if (index !== -1) {
        // Обновляем существующий портфель
        this.portfolios.splice(index, 1, updatedPortfolio);
      } else {
        // Добавляем новый портфель
        this.portfolios.push(updatedPortfolio);
      }
    },

    // Получить текущую цену акции
    getCurrentStockPrice(symbol) {
      return this.currentPrices[symbol] || 0;
    },

    // Рассчитать прибыль для акции с текущими ценами
    calculateStockProfit(stock) {
      const currentPrice = this.getCurrentStockPrice(stock.symbol);
      const currentValue = currentPrice * stock.quantity;
      const totalCost = stock.averagePrice * stock.quantity;
      return currentValue - totalCost;
    },

    getProfitClass(profit) {
      return profit >= 0 ? 'profit' : 'loss';
    },

    getStockProfitClass(profit) {
      return profit >= 0 ? 'profit' : 'loss';
    }
  }
}
</script>

<style scoped>
.admin {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  color: #333;
}

.back-btn {
  background: #666;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.back-btn:hover {
  background: #555;
}

.main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.connection-status {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-weight: 500;
  text-align: center;
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

.current-info {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.current-info p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.empty {
  text-align: center;
  padding: 4rem;
  color: #666;
  font-size: 1.1rem;
}

.portfolios {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}

.portfolio {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.portfolio:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.portfolio-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.portfolio-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 500;
  color: #333;
}

.portfolio-total {
  font-size: 1.3rem;
  font-weight: 600;
  text-align: right;
}

.portfolio-total.profit {
  color: #28a745;
}

.portfolio-total.loss {
  color: #dc3545;
}

.profit-badge {
  font-size: 0.9rem;
  font-weight: normal;
  margin-top: 0.25rem;
}

.portfolio-details {
  font-size: 0.9rem;
}

.cash {
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  color: #666;
}

.stocks {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stock {
  display: grid;
  grid-template-columns: 60px 1fr 80px 80px 1fr;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.stock:hover {
  background: #e9ecef;
}

.symbol {
  font-weight: 600;
  color: #333;
}

.quantity {
  color: #666;
}

.avg-price, .price {
  color: #666;
  text-align: right;
}

.value {
  font-weight: 600;
  text-align: right;
}

.value.profit {
  color: #28a745;
}

.value.loss {
  color: #dc3545;
}

.no-stocks {
  text-align: center;
  padding: 1rem;
  color: #999;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .main {
    padding: 1rem;
  }
  
  .portfolios {
    grid-template-columns: 1fr;
  }
  
  .stock {
    grid-template-columns: 50px 1fr 70px 70px 1fr;
    gap: 0.5rem;
    font-size: 0.8rem;
  }
}
</style>
