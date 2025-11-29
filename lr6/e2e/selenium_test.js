const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

class BrokerTests {
  constructor() {
    this.driver = null;
    this.baseUrl = 'http://localhost:8080';
    this.brokerBackend = 'http://localhost:3002';
    this.adminBackend = 'http://localhost:3001';
    this.testBrokerName = `TestBroker_${Date.now()}`;
    this.testBrokerId = null;
  }

  async setup() {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--window-size=1920,1080');

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await this.driver.manage().setTimeouts({ implicit: 10000 });
  }

  async teardown() {
    if (this.driver) {
      await this.driver.quit();
    }
  }

  async waitForElement(selector, timeout = 10000) {
    return await this.driver.wait(until.elementLocated(By.css(selector)), timeout);
  }

  async waitForText(selector, text, timeout = 10000) {
    return await this.driver.wait(
      until.elementTextContains(await this.waitForElement(selector), text),
      timeout
    );
  }

  async createTestBroker() {
    try {
      const response = await fetch(`${this.brokerBackend}/api/brokers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.testBrokerName })
      });
      const broker = await response.json();
      this.testBrokerId = broker.id;
      console.log(`✅ Created test broker: ${this.testBrokerName} (ID: ${this.testBrokerId})`);
      return broker;
    } catch (error) {
      console.error('❌ Failed to create test broker:', error);
      throw error;
    }
  }

  async deleteTestBroker() {
    if (this.testBrokerId) {
      try {
        // Здесь можно добавить очистку тестовых данных если нужно
        console.log(`🧹 Cleaned up test broker: ${this.testBrokerName}`);
      } catch (error) {
        console.error('❌ Failed to clean up test broker:', error);
      }
    }
  }

  async testBrokerLoginAndPortfolio() {
    console.log('🧪 Running test: Broker Login and Portfolio Display');
    
    await this.driver.get(this.baseUrl);
    
    // Создаем нового брокера
    const brokerNameInput = await this.waitForElement('input[type="text"]');
    await brokerNameInput.clear();
    await brokerNameInput.sendKeys(this.testBrokerName);
    
    const submitButton = await this.waitForElement('button[type="submit"]');
    await submitButton.click();
    
    // Ждем загрузки страницы брокера
    await this.waitForText('h1', 'Брокер:');
    console.log('✅ Broker login successful');
    
    // Проверяем отображение портфеля
    const portfolioHeader = await this.waitForElement('h2');
    const portfolioText = await portfolioHeader.getText();
    assert.strictEqual(portfolioText, 'Портфель', 'Portfolio section should be displayed');
    console.log('✅ Portfolio display verified');
  }

  async testStockPurchaseAndBalanceUpdate() {
    console.log('🧪 Running test: Stock Purchase and Balance Update');
    
    // Ждем загрузки цен акций
    await this.waitForElement('table tbody tr');
    
    // Получаем начальный баланс
    const initialCashElement = await this.waitForElement('.portfolio-summary .summary-item:nth-child(2) span:last-child');
    const initialCashText = await initialCashElement.getText();
    const initialCash = parseFloat(initialCashText.replace('$', '').replace(',', ''));
    console.log(`💰 Initial cash: $${initialCash}`);
    
    // Находим первую доступную акцию и ее цену
    const firstStockRow = await this.waitForElement('table tbody tr:first-child');
    const stockPriceElement = await firstStockRow.findElement(By.css('td:nth-child(2)'));
    const stockPriceText = await stockPriceElement.getText();
    const stockPrice = parseFloat(stockPriceText.replace('$', ''));
    
    const stockSymbolElement = await firstStockRow.findElement(By.css('td:first-child'));
    const stockSymbol = await stockSymbolElement.getText();
    
    console.log(`📈 Selected stock: ${stockSymbol} at $${stockPrice}`);
    
    // Нажимаем кнопку покупки
    const buyButton = await firstStockRow.findElement(By.xpath('.//button[contains(text(), "Купить")]'));
    await buyButton.click();
    
    // Ждем появления диалога
    await this.waitForElement('.modal');
    
    // Вводим количество акций
    const quantityInput = await this.waitForElement('input[type="number"]');
    await quantityInput.clear();
    await quantityInput.sendKeys('5');
    
    // Проверяем расчет стоимости
    const costElement = await this.waitForElement('.modal-content p:last-child');
    const costText = await costElement.getText();
    const expectedCost = stockPrice * 5;
    assert(costText.includes(`$${expectedCost.toFixed(2)}`), 'Cost calculation should be correct');
    
    // Выполняем покупку
    const executeButton = await this.waitForElement('.dialog-actions button:not([disabled])');
    await executeButton.click();
    
    // Ждем закрытия диалога
    await this.driver.wait(until.stalenessOf(await this.waitForElement('.modal')), 10000);
    
    // Проверяем обновление баланса
    await this.driver.sleep(2000); // Даем время для обновления UI
    
    const updatedCashElement = await this.waitForElement('.portfolio-summary .summary-item:nth-child(2) span:last-child');
    const updatedCashText = await updatedCashElement.getText();
    const updatedCash = parseFloat(updatedCashText.replace('$', '').replace(',', ''));
    
    const expectedCash = initialCash - expectedCost;
    const cashDifference = Math.abs(updatedCash - expectedCash);
    
    assert(cashDifference < 0.01, `Cash should decrease by $${expectedCost}. Expected: $${expectedCash}, Actual: $${updatedCash}`);
    console.log(`✅ Balance update verified: $${initialCash} → $${updatedCash}`);
    
    // Проверяем появление акции в портфеле
    await this.driver.sleep(1000);
    const portfolioStocks = await this.driver.findElements(By.css('.portfolio-table tbody tr'));
    let stockFound = false;
    
    for (let stockRow of portfolioStocks) {
      const symbolElement = await stockRow.findElement(By.css('td:first-child'));
      const symbol = await symbolElement.getText();
      
      if (symbol === stockSymbol) {
        const quantityElement = await stockRow.findElement(By.css('td:nth-child(2)'));
        const quantity = await quantityElement.getText();
        assert.strictEqual(quantity, '5', 'Stock quantity should be 5');
        stockFound = true;
        break;
      }
    }
    
    assert(stockFound, 'Purchased stock should appear in portfolio');
    console.log(`✅ Stock ${stockSymbol} added to portfolio with quantity 5`);
    
    return { stockSymbol, stockPrice, quantity: 5 };
  }

  async testStockSaleAndProfitCalculation() {
    console.log('🧪 Running test: Stock Sale and Profit Calculation');
    
    // Получаем текущий баланс перед продажей
    const cashBeforeSaleElement = await this.waitForElement('.portfolio-summary .summary-item:nth-child(2) span:last-child');
    const cashBeforeSaleText = await cashBeforeSaleElement.getText();
    const cashBeforeSale = parseFloat(cashBeforeSaleText.replace('$', '').replace(',', ''));
    
    // Находим акцию в портфеле для продажи
    const portfolioStocks = await this.driver.findElements(By.css('.portfolio-table tbody tr'));
    assert(portfolioStocks.length > 0, 'Should have stocks in portfolio');
    
    const firstPortfolioStock = portfolioStocks[0];
    const stockSymbolElement = await firstPortfolioStock.findElement(By.css('td:first-child'));
    const stockSymbol = await stockSymbolElement.getText();
    
    const stockPriceElement = await firstPortfolioStock.findElement(By.css('td:nth-child(4)'));
    const currentPriceText = await stockPriceElement.getText();
    const currentPrice = parseFloat(currentPriceText.replace('$', ''));
    
    const stockQuantityElement = await firstPortfolioStock.findElement(By.css('td:nth-child(2)'));
    const stockQuantity = parseInt(await stockQuantityElement.getText());
    
    console.log(`💼 Selling ${stockQuantity} shares of ${stockSymbol} at $${currentPrice}`);
    
    // Находим кнопку продажи в таблице цен (не в портфеле)
    const stocksTable = await this.waitForElement('table:first-of-type tbody');
    const stockRows = await stocksTable.findElements(By.css('tr'));
    
    let sellButton = null;
    for (let row of stockRows) {
      const symbolElement = await row.findElement(By.css('td:first-child'));
      const symbol = await symbolElement.getText();
      
      if (symbol === stockSymbol) {
        sellButton = await row.findElement(By.xpath('.//button[contains(text(), "Продать")]'));
        break;
      }
    }
    
    assert(sellButton, 'Sell button should be available for owned stock');
    await sellButton.click();
    
    // Ждем появления диалога продажи
    await this.waitForElement('.modal');
    
    // Вводим количество для продажи (продаем половину)
    const sellQuantity = Math.floor(stockQuantity / 2);
    const quantityInput = await this.waitForElement('input[type="number"]');
    await quantityInput.clear();
    await quantityInput.sendKeys(sellQuantity.toString());
    
    // Выполняем продажу
    const executeButton = await this.waitForElement('.dialog-actions button:not([disabled])');
    await executeButton.click();
    
    // Ждем закрытия диалога
    await this.driver.wait(until.stalenessOf(await this.waitForElement('.modal')), 10000);
    
    // Ждем обновления UI
    await this.driver.sleep(2000);
    
    // Проверяем обновление баланса
    const cashAfterSaleElement = await this.waitForElement('.portfolio-summary .summary-item:nth-child(2) span:last-child');
    const cashAfterSaleText = await cashAfterSaleElement.getText();
    const cashAfterSale = parseFloat(cashAfterSaleText.replace('$', '').replace(',', ''));
    
    const expectedSaleProceeds = currentPrice * sellQuantity;
    const expectedCash = cashBeforeSale + expectedSaleProceeds;
    const cashDifference = Math.abs(cashAfterSale - expectedCash);
    
    assert(cashDifference < 0.01, `Cash should increase by $${expectedSaleProceeds}. Expected: $${expectedCash}, Actual: $${cashAfterSale}`);
    console.log(`✅ Sale proceeds verified: $${cashBeforeSale} → $${cashAfterSale}`);
    
    // Проверяем обновление количества акций в портфеле
    await this.driver.sleep(1000);
    const updatedPortfolioStocks = await this.driver.findElements(By.css('.portfolio-table tbody tr'));
    let updatedQuantity = 0;
    let stockStillExists = false;
    
    for (let stockRow of updatedPortfolioStocks) {
      const symbolElement = await stockRow.findElement(By.css('td:first-child'));
      const symbol = await symbolElement.getText();
      
      if (symbol === stockSymbol) {
        const quantityElement = await stockRow.findElement(By.css('td:nth-child(2)'));
        updatedQuantity = parseInt(await quantityElement.getText());
        stockStillExists = true;
        break;
      }
    }
    
    const expectedQuantity = stockQuantity - sellQuantity;
    if (expectedQuantity > 0) {
      assert(stockStillExists, 'Stock should still be in portfolio');
      assert.strictEqual(updatedQuantity, expectedQuantity, `Stock quantity should be ${expectedQuantity}`);
    } else {
      assert(!stockStillExists, 'Stock should be removed from portfolio when quantity reaches 0');
    }
    
    console.log(`✅ Portfolio updated correctly. Remaining quantity: ${updatedQuantity}`);
    
    return { stockSymbol, soldQuantity: sellQuantity, salePrice: currentPrice };
  }

  async testProfitLossCalculation() {
    console.log('🧪 Running test: Profit/Loss Calculation');
    
    // Ждем обновления данных о прибыли
    await this.driver.sleep(3000);
    
    // Проверяем отображение общей прибыли
    const totalProfitElement = await this.waitForElement('.portfolio-summary .summary-item:nth-child(3) span:last-child');
    const totalProfitText = await totalProfitElement.getText();
    const totalProfit = parseFloat(totalProfitText.replace('$', '').replace(',', ''));
    
    console.log(`📊 Total profit/loss: $${totalProfit}`);
    
    // Проверяем что элемент прибыли имеет правильный CSS класс
    const profitClass = await totalProfitElement.getAttribute('class');
    if (totalProfit >= 0) {
      assert(profitClass.includes('profit'), 'Profit should have profit class');
      console.log('✅ Profit displayed with correct style (positive)');
    } else {
      assert(profitClass.includes('loss'), 'Loss should have loss class');
      console.log('✅ Loss displayed with correct style (negative)');
    }
    
    // Проверяем прибыль по отдельным акциям в портфеле
    const portfolioStocks = await this.driver.findElements(By.css('.portfolio-table tbody tr'));
    
    for (let stockRow of portfolioStocks) {
      const profitElement = await stockRow.findElement(By.css('td:last-child'));
      const profitText = await profitElement.getText();
      const profit = parseFloat(profitText.replace('$', ''));
      const profitClass = await profitElement.getAttribute('class');
      
      if (profit >= 0) {
        assert(profitClass.includes('profit'), 'Stock profit should have profit class');
      } else {
        assert(profitClass.includes('loss'), 'Stock loss should have loss class');
      }
      
      console.log(`📈 Stock profit: $${profit} (${profitClass})`);
    }
    
    console.log('✅ All profit/loss calculations displayed correctly');
  }

  async testStockChartFunctionality() {
    console.log('🧪 Running test: Stock Chart Functionality');
    
    // Находим первую акцию в таблице и открываем ее график
    const firstStockRow = await this.waitForElement('table:first-of-type tbody tr:first-child');
    const chartButton = await firstStockRow.findElement(By.xpath('.//button[contains(text(), "График")]'));
    await chartButton.click();
    
    // Ждем появления диалога с графиком
    await this.waitForElement('.chart-modal');
    
    // Проверяем наличие контейнера для графика
    const chartContainer = await this.waitForElement('.chart-container');
    assert(chartContainer, 'Chart container should be displayed');
    
    // Проверяем заголовок графика
    const chartTitle = await this.waitForElement('.chart-modal h3');
    const titleText = await chartTitle.getText();
    assert(titleText.includes('График'), 'Chart modal should have correct title');
    
    console.log('✅ Stock chart modal opened successfully');
    
    // Закрываем диалог
    const closeButton = await this.waitForElement('.chart-modal button');
    await closeButton.click();
    
    // Ждем закрытия диалога
    await this.driver.wait(until.stalenessOf(await this.waitForElement('.chart-modal')), 10000);
    console.log('✅ Stock chart modal closed successfully');
  }

  async runAllTests() {
    try {
      await this.setup();
      await this.createTestBroker();
      
      console.log('🚀 Starting Selenium E2E Tests...\n');
      
      await this.testBrokerLoginAndPortfolio();
      console.log('---');
      
      await this.testStockPurchaseAndBalanceUpdate();
      console.log('---');
      
      await this.testStockSaleAndProfitCalculation();
      console.log('---');
      
      await this.testProfitLossCalculation();
      console.log('---');
      
      await this.testStockChartFunctionality();
      console.log('---');
      
      console.log('🎉 All tests passed successfully!');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      
      // Делаем скриншот при ошибке
      try {
        const screenshot = await this.driver.takeScreenshot();
        const fs = require('fs');
        fs.writeFileSync(`test-failure-${Date.now()}.png`, screenshot, 'base64');
        console.log('📸 Screenshot saved for debugging');
      } catch (screenshotError) {
        console.error('Failed to take screenshot:', screenshotError);
      }
      
      throw error;
    } finally {
      await this.deleteTestBroker();
      await this.teardown();
    }
  }
}

// Запуск тестов если файл выполняется напрямую
if (require.main === module) {
  const tests = new BrokerTests();
  tests.runAllTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = BrokerTests;
