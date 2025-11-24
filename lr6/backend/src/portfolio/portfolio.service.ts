import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface Purchase {
  symbol: string;
  quantity: number;
  price: number;
  date: Date;
}

export interface PortfolioStock {
  symbol: string;
  quantity: number;
  currentPrice: number;
  averagePrice: number;
  totalCost: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
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

@Injectable()
export class PortfolioService {
  private portfolios: Portfolio[] = [];
  private readonly dataPath = path.join(process.cwd(), 'data', 'portfolios.json');

  constructor() {
    this.loadPortfolios();
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

  // Добавить покупку в историю
  addPurchase(brokerId: number, brokerName: string, symbol: string, quantity: number, price: number): void {
    let portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    
    if (!portfolio) {
      portfolio = {
        brokerId,
        brokerName,
        stocks: [],
        cash: 0,
        totalValue: 0,
        totalProfit: 0,
        purchaseHistory: []
      };
      this.portfolios.push(portfolio);
    }

    const purchase: Purchase = {
      symbol,
      quantity,
      price,
      date: new Date()
    };

    portfolio.purchaseHistory.push(purchase);
    this.savePortfolios();
    
    console.log(`📝 Добавлена покупка: ${brokerName} купил ${quantity} ${symbol} по $${price}`);
  }

  // Обновить портфель с расчетом средней цены
  updatePortfolio(brokerId: number, brokerName: string, stocks: { [symbol: string]: number }, cash: number, currentPrices: { [symbol: string]: number }): Portfolio {
    let portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    
    if (!portfolio) {
      portfolio = {
        brokerId,
        brokerName,
        stocks: [],
        cash,
        totalValue: cash,
        totalProfit: 0,
        purchaseHistory: []
      };
      this.portfolios.push(portfolio);
    }

    // Получаем историю покупок для этого брокера
    const brokerPurchases = portfolio.purchaseHistory.filter(p => 
      Object.keys(stocks).includes(p.symbol)
    );

    // Обновляем акции в портфеле
    const portfolioStocks: PortfolioStock[] = [];
    let stockValue = 0;
    let totalProfit = 0;

    Object.entries(stocks).forEach(([symbol, quantity]) => {
      if (quantity > 0) {
        const currentPrice = currentPrices[symbol] || 0;
        
        // Получаем историю покупок для этой акции
        const symbolPurchases = brokerPurchases.filter(p => p.symbol === symbol);
        
        // Рассчитываем среднюю цену
        let averagePrice = 0;
        let totalCost = 0;
        
        if (symbolPurchases.length > 0) {
          totalCost = symbolPurchases.reduce((sum, purchase) => sum + (purchase.price * purchase.quantity), 0);
          averagePrice = totalCost / symbolPurchases.reduce((sum, purchase) => sum + purchase.quantity, 0);
        } else {
          // Если нет истории, используем текущую цену
          averagePrice = currentPrice;
          totalCost = currentPrice * quantity;
        }

        const currentValue = currentPrice * quantity;
        const profit = currentValue - totalCost;
        const profitPercentage = averagePrice > 0 ? ((currentPrice - averagePrice) / averagePrice) * 100 : 0;
        
        stockValue += currentValue;
        totalProfit += profit;
        
        portfolioStocks.push({
          symbol,
          quantity,
          currentPrice,
          averagePrice,
          totalCost,
          currentValue,
          profit,
          profitPercentage,
          purchaseHistory: symbolPurchases
        });
      }
    });

    portfolio.stocks = portfolioStocks;
    portfolio.cash = cash;
    portfolio.totalValue = cash + stockValue;
    portfolio.totalProfit = totalProfit;
    portfolio.brokerName = brokerName;

    this.savePortfolios();
    
    return portfolio;
  }

  getAllPortfolios(): Portfolio[] {
    return this.portfolios;
  }

  getPortfolioByBrokerId(brokerId: number): Portfolio | undefined {
    return this.portfolios.find(p => p.brokerId === brokerId);
  }

  // Получить историю покупок брокера
  getPurchaseHistory(brokerId: number): Purchase[] {
    const portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    return portfolio ? portfolio.purchaseHistory : [];
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
