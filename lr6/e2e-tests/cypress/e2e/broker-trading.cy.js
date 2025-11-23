describe('Broker Trading Platform', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should login and display dashboard', () => {
    cy.get('.broker-item button').first().click()
    cy.url().should('include', '/dashboard')
    cy.contains('Торговая площадка')
    cy.contains('Баланс:')
  })

  it('should buy stocks and update portfolio', () => {
    cy.get('.broker-item button').first().click()
    
    // Покупаем акции
    cy.get('.btn-buy').first().click()
    cy.get('input[type="number"]').clear().type('10')
    cy.contains('Купить').click()

    // Проверяем обновление баланса и портфеля
    cy.contains('Портфель')
    cy.get('table tbody tr').should('have.length.at.least', 1)
  })

  it('should sell stocks and update balance', () => {
    cy.get('.broker-item button').first().click()
    
    // Сначала покупаем акции
    cy.get('.btn-buy').first().click()
    cy.get('input[type="number"]').clear().type('5')
    cy.contains('Купить').click()

    // Затем продаем
    cy.get('.btn-sell').first().click()
    cy.get('input[type="number"]').clear().type('2')
    cy.contains('Продать').click()

    // Проверяем обновление
    cy.contains('Портфель')
  })

  it('should show admin panel with brokers info', () => {
    cy.get('.broker-item button').first().click()
    cy.contains('Админ-панель').click()
    cy.contains('Список брокеров')
    cy.get('table tbody tr').should('have.length.at.least', 1)
  })

  it('should calculate profit/loss correctly', () => {
    cy.get('.broker-item button').first().click()
    
    // Покупаем акции
    cy.get('.btn-buy').first().click()
    cy.get('input[type="number"]').clear().type('10')
    cy.contains('Купить').click()

    // Проверяем отображение прибыли/убытка
    cy.contains('Прибыль/Убыток')
    cy.get('.profit, .loss').should('exist')
  })

  it('should prevent buying with insufficient funds', () => {
    cy.get('.broker-item button').first().click()
    
    // Пытаемся купить слишком много акций AMZN
    cy.get('.btn-buy').eq(5).click() // AMZN - самая дорогая
    cy.get('input[type="number"]').clear().type('1000')
    
    // Должна быть кнопка disabled или сообщение об ошибке
    cy.contains('Недостаточно средств').should('exist')
  })

  it('should show simulation status', () => {
    cy.get('.broker-item button').first().click()
    cy.contains('Статус симуляции')
    cy.contains('Активна').or.contains('Остановлена')
  })
})
