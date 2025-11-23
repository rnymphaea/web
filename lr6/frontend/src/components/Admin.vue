<template>
  <div class="container">
    <div class="card">
      <h1>Панель администратора</h1>
      <button @click="$router.push('/')">Назад к входу</button>
    </div>

    <div class="card">
      <h2>Участники торгов</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Имя</th>
            <th>Баланс</th>
            <th>Акции</th>
            <th>Общая стоимость</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="broker in brokers" :key="broker.id">
            <td>{{ broker.id }}</td>
            <td>{{ broker.name }}</td>
            <td>${{ broker.cash.toFixed(2) }}</td>
            <td>
              <div v-for="(quantity, symbol) in broker.stocks" :key="symbol" v-if="quantity > 0">
                {{ symbol }}: {{ quantity }}
              </div>
            </td>
            <td>${{ calculateTotalValue(broker).toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      brokers: [],
      currentPrices: {}
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      const [brokersResponse, pricesResponse] = await Promise.all([
        fetch('http://localhost:3002/api/brokers'),
        fetch('http://localhost:3002/api/prices')
      ])
      
      this.brokers = await brokersResponse.json()
      const pricesData = await pricesResponse.json()
      this.currentPrices = pricesData.prices
    },
    calculateTotalValue(broker) {
      let stockValue = 0
      Object.entries(broker.stocks).forEach(([symbol, quantity]) => {
        stockValue += (this.currentPrices[symbol] || 0) * quantity
      })
      return broker.cash + stockValue
    }
  }
}
</script>
