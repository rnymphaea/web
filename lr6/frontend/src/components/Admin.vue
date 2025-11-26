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

      <div v-if="portfolios.length === 0" class="empty">
        <p>Нет данных о портфелях</p>
      </div>

      <div v-else class="portfolios">
        <div v-for="portfolio in portfolios" :key="portfolio.brokerId" class="portfolio">
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
                <span class="price">${{ (stock.currentPrice || 0).toFixed(2) }}</span>
                <span class="value" :class="getStockProfitClass(stock.profit || 0)">
                  ${{ (stock.profit || 0).toFixed(2) }}
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
      socket: null,
      isConnected: false
    }
  },
  computed: {
    connectionClass() {
      return this.isConnected ? 'connected' : 'disconnected'
    },
    connectionText() {
      return this.isConnected ? '✓ Подключено к бирже' : '✗ Отключено от биржи'
    }
  },
  async mounted() {
    await this.loadPortfolios();
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
        }
      } catch (error) {
        console.error('Error loading portfolios:', error);
        this.portfolios = [];
      }
    },

    setupWebSocket() {
      this.socket = io('http://localhost:3002');
      
      this.socket.on('connect', () => {
        console.log('Connected to admin WebSocket');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from admin WebSocket');
        this.isConnected = false;
      });

      this.socket.on('priceUpdate', (data) => {
        console.log('Received price update in admin:', data);
        // При обновлении цен перезагружаем портфели
        this.loadPortfolios();
      });

      this.socket.on('portfolioUpdate', (data) => {
        console.log('Received portfolio update:', data);
        // Если приходит конкретное обновление портфеля
        this.handlePortfolioUpdate(data);
      });
    },

    handlePortfolioUpdate(updatedPortfolio) {
      // Находим индекс обновляемого портфеля
      const index = this.portfolios.findIndex(p => p.brokerId === updatedPortfolio.brokerId);
      
      if (index !== -1) {
        // Обновляем существующий портфель
        this.portfolios.splice(index, 1, updatedPortfolio);
      } else {
        // Добавляем новый портфель
        this.portfolios.push(updatedPortfolio);
      }
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

