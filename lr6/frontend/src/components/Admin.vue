<template>
  <div class="admin">
    <header class="header">
      <h1>Портфели брокеров</h1>
      <button @click="$router.push('/')" class="back-btn">← Назад</button>
    </header>

    <main class="main">
      <div class="current-info">
        <p><strong>Текущая дата:</strong> {{ currentDate }}</p>
      </div>

      <div v-if="portfolios.length === 0" class="empty">
        <p>Нет данных о портфелях</p>
      </div>

      <div v-else class="portfolios">
        <div v-for="portfolio in validPortfolios" :key="portfolio.brokerId" class="portfolio">
          <div class="portfolio-header">
            <h2>{{ portfolio.brokerName || `Брокер ${portfolio.brokerId}` }}</h2>
            <div class="portfolio-total" :class="getProfitClass(portfolio.totalProfit || 0)">
              ${{ (portfolio.totalValue || 0).toLocaleString() }}
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
      currentPrices: {},
      socket: null,
      currentDate: '',
      brokers: []
    }
  },
  computed: {
    validPortfolios() {
      return this.portfolios.filter(portfolio => {
        if (portfolio.brokerName && portfolio.brokerName.trim() !== '') {
          return true;
        }
        const brokerExists = this.brokers.some(broker => broker.id === portfolio.brokerId);
        return brokerExists;
      });
    }
  },
  async mounted() {
    await this.loadBrokers();
    await this.loadPortfolios();
    this.setupWebSocket();
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  },
  methods: {
    async loadBrokers() {
      try {
        const response = await fetch('http://localhost:3001/brokers');
        this.brokers = await response.json();
      } catch (error) {
        this.brokers = [];
      }
    },

    async loadPortfolios() {
      try {
        const response = await fetch('http://localhost:3002/api/portfolios');
        const result = await response.json();
        
        if (result.success) {
          this.portfolios = result.data || [];
        }
      } catch (error) {
        this.portfolios = [];
      }
    },

    setupWebSocket() {
      this.socket = io('http://localhost:3002');
      
      this.socket.on('priceUpdate', (data) => {
        this.currentPrices = data.prices || {};
        this.currentDate = data.date || '';
      });

      this.socket.on('portfolioUpdate', (portfolio) => {
        this.handlePortfolioUpdate(portfolio);
      });

      const simulationSocket = io('http://localhost:3001');
      
      simulationSocket.on('stockUpdate', (data) => {
        if (data && Array.isArray(data)) {
          data.forEach(stock => {
            this.currentPrices[stock.symbol] = stock.currentPrice;
          });
        }
        if (data && data.length > 0) {
          this.currentDate = data[0].date || '';
        }
      });

      simulationSocket.on('brokersUpdated', async () => {
        await this.loadBrokers();
      });
    },

    handlePortfolioUpdate(updatedPortfolio) {
      const index = this.portfolios.findIndex(p => p.brokerId === updatedPortfolio.brokerId);
      
      if (index !== -1) {
        this.portfolios.splice(index, 1, updatedPortfolio);
      } else {
        this.portfolios.push(updatedPortfolio);
      }
    },

    getCurrentStockPrice(symbol) {
      return this.currentPrices[symbol] || 0;
    },

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
  background: white;
  font-family: Arial, sans-serif;
}

.header {
  background: #f8f9fa;
  padding: 1rem 2rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.back-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.current-info {
  margin-bottom: 1.5rem;
}

.current-info p {
  margin: 0;
  font-size: 0.9rem;
}

.empty {
  text-align: center;
  padding: 4rem;
  color: #666;
}

.portfolios {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
}

.portfolio {
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1.5rem;
}

.portfolio-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.portfolio-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.portfolio-total {
  font-size: 1.3rem;
  font-weight: 600;
}

.portfolio-total.profit {
  color: #28a745;
}

.portfolio-total.loss {
  color: #dc3545;
}

.portfolio-details {
  font-size: 0.9rem;
}

.cash {
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
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
}

.symbol {
  font-weight: 600;
}

.quantity, .avg-price, .price {
  color: #666;
}

.price, .avg-price {
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
