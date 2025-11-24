<template>
  <div class="admin">
    <header class="header">
      <h1>Портфели брокеров</h1>
      <button @click="$router.push('/')" class="back-btn">← Назад</button>
    </header>

    <main class="main">
      <div v-if="portfolios.length === 0" class="empty">
        <p>Нет данных о портфелях</p>
      </div>

      <div v-else class="portfolios">
        <div v-for="portfolio in portfolios" :key="portfolio.brokerId" class="portfolio">
          <div class="portfolio-header">
            <h2>{{ portfolio.brokerName }}</h2>
            <div class="portfolio-total" :class="getProfitClass(portfolio.totalProfit)">
              ${{ portfolio.totalValue.toLocaleString() }}
              <div class="profit-badge">
                {{ portfolio.totalProfit > 0 ? '+' : '' }}{{ portfolio.totalProfit.toFixed(2) }}
              </div>
            </div>
          </div>

          <div class="portfolio-details">
            <div class="cash">Наличные: ${{ portfolio.cash.toLocaleString() }}</div>
            
            <div v-if="portfolio.stocks.length > 0" class="stocks">
              <div v-for="stock in portfolio.stocks" :key="stock.symbol" class="stock">
                <span class="symbol">{{ stock.symbol }}</span>
                <span class="quantity">{{ stock.quantity }} шт</span>
                <span class="avg-price">${{ stock.averagePrice.toFixed(2) }}</span>
                <span class="price">${{ stock.currentPrice.toFixed(2) }}</span>
                <span class="value" :class="getStockProfitClass(stock.profit)">
                  ${{ stock.profit.toFixed(2) }}
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
export default {
  data() {
    return {
      portfolios: []
    }
  },
  async mounted() {
    await this.loadPortfolios();
  },
  methods: {
    async loadPortfolios() {
      try {
        const response = await fetch('http://localhost:3002/api/portfolios');
        const result = await response.json();
        
        if (result.success) {
          this.portfolios = result.data;
        }
      } catch (error) {
        console.error('Error loading portfolios:', error);
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
