<template>
  <div class="container">
    <div class="card">
      <h1>Вход в систему брокера</h1>
      <form @submit.prevent="login">
        <div class="form-group">
          <label>Выберите брокера:</label>
          <select v-model="selectedBrokerId">
            <option value="">Новый брокер</option>
            <option v-for="broker in brokers" :key="broker.id" :value="broker.id">
              {{ broker.name }}
            </option>
          </select>
        </div>
        
        <div v-if="!selectedBrokerId" class="form-group">
          <label>Имя нового брокера:</label>
          <input v-model="newBrokerName" required>
        </div>
        
        <button type="submit">Войти</button>
        <button type="button" @click="goToAdmin">Администратор</button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      brokers: [],
      selectedBrokerId: '',
      newBrokerName: ''
    }
  },
  async mounted() {
    const response = await fetch('http://localhost:3002/api/brokers')
    this.brokers = await response.json()
  },
  methods: {
    async login() {
      let brokerId = this.selectedBrokerId
      
      if (!brokerId) {
        const response = await fetch('http://localhost:3002/api/brokers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: this.newBrokerName })
        })
        const broker = await response.json()
        brokerId = broker.id
      }
      
      this.$router.push(`/broker/${brokerId}`)
    },
    goToAdmin() {
      this.$router.push('/admin')
    }
  }
}
</script>
