import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';

export interface Purchase {
  symbol: string;
  quantity: number;
  price: number;
  date: Date;
  type: 'buy' | 'sell';
}

export interface PortfolioStock {
  symbol: string;
  quantity: number;
  purchaseHistory: Purchase[];
}

export interface Portfolio {
  brokerId: number;
  brokerName: string;
  stocks: PortfolioStock[];
  cash: number;
  totalValue: number;
  totalProfit: number;
  purchaseHistory: Purchase[];
}

export interface StockChartData {
  symbol: string;
  prices: number[];
  dates: string[];
  currentPrice: number;
}

export interface StockStats {
  averagePrice: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
}

@Injectable()
export class PortfolioService {
  private portfolios: Portfolio[] = [];
  private readonly dataPath = path.join(process.cwd(), 'data', 'portfolios.json');
  private brokerServer: Server;

  constructor() {
    this.loadPortfolios();
  }

  setBrokerServer(server: Server) {
    this.brokerServer = server;
  }

  private loadPortfolios() {
    try {
      const dataDir = path.dirname(this.dataPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf8');
        const parsedData = JSON.parse(data);
        
        // Восстанавливаем даты
        this.portfolios = parsedData.map((portfolio: any) => ({
          ...portfolio,
          purchaseHistory: (portfolio.purchaseHistory || []).map((purchase: any) => ({
            ...purchase,
            date: new Date(purchase.date)
          })),
          stocks: (portfolio.stocks || []).map((stock: any) => ({
            ...stock,
            purchaseHistory: (stock.purchaseHistory || []).map((purchase: any) => ({
              ...purchase,
              date: new Date(purchase.date)
            }))
          }))
        }));
        
        console.log(`✅ Загружено ${this.portfolios.length} портфелей`);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки портфелей:', error);
      this.portfolios = [];
    }
  }

  private savePortfolios() {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(this.portfolios, null, 2));
    } catch (error) {
      console.error('❌ Ошибка сохранения портфелей:', error);
    }
  }

  // Уведомить об изменении портфеля
  notifyPortfolioUpdate(brokerId: number) {
    if (this.brokerServer) {
      const portfolio = this.getPortfolioByBrokerId(brokerId);
      if (portfolio) {
        this.brokerServer.emit('portfolioUpdate', portfolio);
      }
    }
  }

  // Инициализировать портфель для нового брокера
  initializePortfolio(brokerId: number, brokerName: string, initialCash: number): void {
    let portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    
    if (!portfolio) {
      portfolio = {
        brokerId,
        brokerName,
        stocks: [],
        cash: initialCash,
        totalValue: initialCash,
        totalProfit: 0,
        purchaseHistory: []
      };
      this.portfolios.push(portfolio);
      this.savePortfolios();
      console.log(`✅ Инициализирован портфель для брокера ${brokerName} (ID: ${brokerId}) с балансом $${initialCash}`);
    } else {
      // Обновляем имя брокера если портфель уже существует
      if (portfolio.brokerName !== brokerName) {
        portfolio.brokerName = brokerName;
        this.savePortfolios();
      }
    }
  }

  // Обновить имя брокера в портфеле
  updateBrokerName(brokerId: number, brokerName: string): void {
    const portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    if (portfolio && portfolio.brokerName !== brokerName) {
      portfolio.brokerName = brokerName;
      this.savePortfolios();
      console.log(`✅ Обновлено имя брокера в портфеле: ${brokerName} (ID: ${brokerId})`);
    }
  }

  // Вычисляем среднюю цену покупки для акции
  private calculateAveragePrice(purchases: Purchase[]): number {
    if (purchases.length === 0) return 0;
    
    const totalCost = purchases.reduce((sum, purchase) => sum + (purchase.price * purchase.quantity), 0);
    const totalQuantity = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);
    
    return totalCost / totalQuantity;
  }

  // Вычисляем текущую стоимость и прибыль (публичный метод)
  calculateStockStats(stock: PortfolioStock, currentPrice: number): StockStats {
    const averagePrice = this.calculateAveragePrice(stock.purchaseHistory);
    const currentValue = currentPrice * stock.quantity;
    const totalCost = averagePrice * stock.quantity;
    const profit = currentValue - totalCost;
    const profitPercentage = averagePrice > 0 ? ((currentPrice - averagePrice) / averagePrice) * 100 : 0;

    return {
      averagePrice,
      currentValue,
      profit,
      profitPercentage
    };
  }

  // Добавить сделку в историю
  addTransaction(brokerId: number, brokerName: string, symbol: string, quantity: number, price: number, type: 'buy' | 'sell'): void {
    let portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    
    if (!portfolio) {
      // Если портфеля нет, создаем его
      this.initializePortfolio(brokerId, brokerName, 100000);
      portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    }

    if (!portfolio) {
      console.error(`❌ Не удалось создать портфель для брокера ${brokerId}`);
      return;
    }

    const transaction: Purchase = {
      symbol,
      quantity,
      price,
      date: new Date(),
      type
    };

    // Добавляем в общую историю
    portfolio.purchaseHistory.push(transaction);

    // Обновляем или добавляем акцию в портфель
    let stock = portfolio.stocks.find(s => s.symbol === symbol);
    if (!stock) {
      stock = {
        symbol,
        quantity: 0,
        purchaseHistory: []
      };
      portfolio.stocks.push(stock);
    }

    // Добавляем в историю покупок акции
    stock.purchaseHistory.push(transaction);

    // Обновляем количество акций
    if (type === 'buy') {
      stock.quantity += quantity;
    } else {
      stock.quantity -= quantity;
      
      // Удаляем акцию из портфеля если количество 0
      if (stock.quantity === 0) {
        portfolio.stocks = portfolio.stocks.filter(s => s.symbol !== symbol);
      }
    }

    this.savePortfolios();
    this.notifyPortfolioUpdate(brokerId); // Добавляем уведомление
    
    console.log(`📝 Добавлена сделка: ${brokerName} ${type === 'buy' ? 'купил' : 'продал'} ${quantity} ${symbol} по $${price}`);
  }

  // Получить портфель с вычисленными значениями
  getPortfolio(brokerId: number, currentPrices: { [symbol: string]: number }): Portfolio | undefined {
    let portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    
    // Если портфель не найден, создаем базовый
    if (!portfolio) {
      console.log(`🔄 Портфель для брокера ${brokerId} не найден, создаем базовый`);
      this.initializePortfolio(brokerId, `Брокер ${brokerId}`, 100000);
      portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    }

    if (!portfolio) return undefined;

    // Вычисляем общую стоимость и прибыль
    let stockValue = 0;
    let totalProfit = 0;

    portfolio.stocks.forEach(stock => {
      const currentPrice = currentPrices[stock.symbol] || 0;
      const stats = this.calculateStockStats(stock, currentPrice);
      
      stockValue += stats.currentValue;
      totalProfit += stats.profit;
    });

    portfolio.totalValue = portfolio.cash + stockValue;
    portfolio.totalProfit = totalProfit;

    return portfolio;
  }

  // Получить данные для графика акции
  getStockChartData(brokerId: number, symbol: string, historicalData: any[]): StockChartData | null {
    const portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    if (!portfolio) return null;

    const stock = portfolio.stocks.find(s => s.symbol === symbol);
    if (!stock) return null;

    // Получаем цены из исторических данных
    const prices = historicalData.map(data => data.open);
    const dates = historicalData.map(data => data.date);

    // Текущая цена - последняя из исторических данных
    const currentPrice = prices.length > 0 ? prices[prices.length - 1] : 0;

    return {
      symbol,
      prices,
      dates,
      currentPrice
    };
  }

  // Получить историю покупок брокера
  getPurchaseHistory(brokerId: number): Purchase[] {
    const portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    return portfolio ? portfolio.purchaseHistory : [];
  }

  // Обновить денежные средства брокера
  updateCash(brokerId: number, cash: number): void {
    let portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    
    if (!portfolio) {
      console.log(`🔄 Портфель для брокера ${brokerId} не найден при обновлении баланса, создаем`);
      this.initializePortfolio(brokerId, `Брокер ${brokerId}`, cash);
      portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    }
    
    if (portfolio) {
      portfolio.cash = cash;
      this.savePortfolios();
      this.notifyPortfolioUpdate(brokerId); // Добавляем уведомление
      console.log(`💰 Обновлен баланс брокера ${brokerId}: $${cash}`);
    }
  }

  getAllPortfolios(): Portfolio[] {
    return this.portfolios;
  }

  getPortfolioByBrokerId(brokerId: number): Portfolio | undefined {
    return this.portfolios.find(p => p.brokerId === brokerId);
  }

  deletePortfolio(brokerId: number): boolean {
    const index = this.portfolios.findIndex(p => p.brokerId === brokerId);
    if (index !== -1) {
      this.portfolios.splice(index, 1);
      this.savePortfolios();
      return true;
    }
    return false;
  }
}
