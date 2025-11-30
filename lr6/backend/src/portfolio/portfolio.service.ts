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
      }
    } catch (error) {
      this.portfolios = [];
    }
  }

  private savePortfolios() {
    try {
      fs.writeFileSync(this.dataPath, JSON.stringify(this.portfolios, null, 2));
    } catch (error) {
    }
  }

  notifyPortfolioUpdate(brokerId: number) {
    if (this.brokerServer) {
      const portfolio = this.getPortfolioByBrokerId(brokerId);
      if (portfolio) {
        this.brokerServer.emit('portfolioUpdate', portfolio);
      }
    }
  }

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
    } else {
      if (portfolio.brokerName !== brokerName) {
        portfolio.brokerName = brokerName;
        this.savePortfolios();
      }
    }
  }

  updateBrokerName(brokerId: number, brokerName: string): void {
    const portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    if (portfolio && portfolio.brokerName !== brokerName) {
      portfolio.brokerName = brokerName;
      this.savePortfolios();
    }
  }

  private calculateAveragePrice(purchases: Purchase[]): number {
    if (purchases.length === 0) return 0;
    
    const totalCost = purchases.reduce((sum, purchase) => sum + (purchase.price * purchase.quantity), 0);
    const totalQuantity = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);
    
    return totalCost / totalQuantity;
  }

  calculateStockStats(stock: PortfolioStock, currentPrice: number) {
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

  addTransaction(brokerId: number, brokerName: string, symbol: string, quantity: number, price: number, type: 'buy' | 'sell'): void {
    let portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    
    if (!portfolio) {
      this.initializePortfolio(brokerId, brokerName, 100000);
      portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    }

    if (!portfolio) {
      return;
    }

    const transaction: Purchase = {
      symbol,
      quantity,
      price,
      date: new Date(),
      type
    };

    portfolio.purchaseHistory.push(transaction);

    let stock = portfolio.stocks.find(s => s.symbol === symbol);
    if (!stock) {
      stock = {
        symbol,
        quantity: 0,
        purchaseHistory: []
      };
      portfolio.stocks.push(stock);
    }

    stock.purchaseHistory.push(transaction);

    if (type === 'buy') {
      stock.quantity += quantity;
    } else {
      stock.quantity -= quantity;
      
      if (stock.quantity === 0) {
        portfolio.stocks = portfolio.stocks.filter(s => s.symbol !== symbol);
      }
    }

    this.savePortfolios();
    this.notifyPortfolioUpdate(brokerId);
  }

  getPortfolio(brokerId: number, currentPrices: { [symbol: string]: number }): Portfolio | undefined {
    let portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    
    if (!portfolio) {
      this.initializePortfolio(brokerId, `Брокер ${brokerId}`, 100000);
      portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    }

    if (!portfolio) return undefined;

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

  getStockChartData(brokerId: number, symbol: string, historicalData: any[]) {
    const portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    if (!portfolio) return null;

    const stock = portfolio.stocks.find(s => s.symbol === symbol);
    if (!stock) return null;

    const prices = historicalData.map(data => data.open);
    const dates = historicalData.map(data => data.date);

    const currentPrice = prices.length > 0 ? prices[prices.length - 1] : 0;

    return {
      symbol,
      prices,
      dates,
      currentPrice
    };
  }

  updateCash(brokerId: number, cash: number): void {
    let portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    
    if (!portfolio) {
      this.initializePortfolio(brokerId, `Брокер ${brokerId}`, cash);
      portfolio = this.portfolios.find(p => p.brokerId === brokerId);
    }
    
    if (portfolio) {
      portfolio.cash = cash;
      this.savePortfolios();
      this.notifyPortfolioUpdate(brokerId);
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
