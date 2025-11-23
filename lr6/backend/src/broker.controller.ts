import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface Broker {
  id: number;
  name: string;
  balance: number;
  portfolio: PortfolioItem[];
}

interface PortfolioItem {
  stockId: number;
  symbol: string;
  quantity: number;
  averagePrice: number;
  profitLoss?: number;
}

interface StockData {
  id: number;
  symbol: string;
  name: string;
  currentPrice: number;
  isTrading: boolean;
}

interface SimulationStatus {
  isRunning: boolean;
  currentDate: string;
  speed: number;
  currentDateIndex: number;
}

@Controller('brokers')
export class BrokerController {
  private brokers: Broker[] = this.loadBrokersFromAdminModule();
  private stockPrices = new Map<number, number>();

  constructor() {
    this.initializeStockPrices();
  }

  private loadBrokersFromAdminModule(): Broker[] {
    try {
      const adminDataPath = path.join(process.cwd(), '../broker-simulator-rnymphaea/data/brokers.json');
      console.log('Loading brokers from:', adminDataPath);
      
      if (fs.existsSync(adminDataPath)) {
        const adminBrokers = JSON.parse(fs.readFileSync(adminDataPath, 'utf8'));
        console.log('Found brokers in admin module:', adminBrokers);
        
        return adminBrokers.map((broker: any) => ({
          id: broker.id,
          name: broker.name,
          balance: broker.initialFunds || 100000,
          portfolio: []
        }));
      }
    } catch (error) {
      console.log('Failed to load brokers from admin module, using demo data:', error.message);
    }

    return [
      { id: 1, name: 'Иван Иванов', balance: 100000, portfolio: [] },
      { id: 2, name: 'Петр Петров', balance: 150000, portfolio: [] },
      { id: 3, name: 'Мария Сидорова', balance: 200000, portfolio: [] }
    ];
  }

  private initializeStockPrices() {
    try {
      const stocksDataPath = path.join(process.cwd(), '../broker-simulator-rnymphaea/data/stocks.json');
      const settingsPath = path.join(process.cwd(), '../broker-simulator-rnymphaea/data/settings.json');
      
      console.log('Loading stock prices from admin module...');
      
      if (fs.existsSync(stocksDataPath) && fs.existsSync(settingsPath)) {
        const stocks = JSON.parse(fs.readFileSync(stocksDataPath, 'utf8'));
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        
        console.log(`Found ${stocks.length} stocks, current date index: ${settings.currentDateIndex}`);
        
        stocks.forEach((stock: any) => {
          if (stock.historicalData && stock.historicalData.length > 0) {
            const currentData = stock.historicalData[settings.currentDateIndex];
            if (currentData) {
              this.stockPrices.set(stock.id, currentData.open);
              console.log(`Stock ${stock.symbol}: $${currentData.open}`);
            }
          }
        });
        
        if (this.stockPrices.size > 0) {
          console.log('Successfully loaded stock prices from admin module');
          return;
        }
      }
    } catch (error) {
      console.log('Failed to load stock prices from admin module:', error.message);
    }

    console.log('Using demo stock prices');
    const demoPrices = [
      [1, 150], [2, 95], [3, 280], [4, 50], 
      [5, 125], [6, 3350], [7, 850], [8, 75]
    ];
    demoPrices.forEach(([id, price]) => this.stockPrices.set(id, price));
  }

  @Get()
  getBrokers() {
    return this.brokers.map(broker => ({
      id: broker.id,
      name: broker.name,
      balance: broker.balance,
      portfolioValue: this.calculatePortfolioValue(broker),
      totalValue: broker.balance + this.calculatePortfolioValue(broker)
    }));
  }

  @Get(':id')
  getBroker(@Param('id') id: string) {
    const broker = this.brokers.find(b => b.id === parseInt(id));
    if (!broker) throw new Error('Broker not found');
    
    const portfolioWithPL = broker.portfolio.map(item => ({
      ...item,
      currentPrice: this.stockPrices.get(item.stockId) || 0,
      profitLoss: ((this.stockPrices.get(item.stockId) || 0) - item.averagePrice) * item.quantity
    }));

    return {
      ...broker,
      portfolio: portfolioWithPL
    };
  }

  @Get('stocks/prices')
  getStockPrices() {
    const stocks: StockData[] = [];
    this.stockPrices.forEach((price, stockId) => {
      stocks.push({
        id: stockId,
        symbol: this.getStockSymbol(stockId),
        name: this.getStockName(stockId),
        currentPrice: price,
        isTrading: true
      });
    });
    return stocks;
  }

  @Get('simulation/status')
  getSimulationStatus(): SimulationStatus {
    try {
      const settingsPath = path.join(process.cwd(), '../broker-simulator-rnymphaea/data/settings.json');
      const stocksPath = path.join(process.cwd(), '../broker-simulator-rnymphaea/data/stocks.json');
      
      if (fs.existsSync(settingsPath) && fs.existsSync(stocksPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        const stocks = JSON.parse(fs.readFileSync(stocksPath, 'utf8'));
        
        let currentDate = settings.startDate;
        if (stocks.length > 0 && stocks[0].historicalData && stocks[0].historicalData.length > settings.currentDateIndex) {
          currentDate = stocks[0].historicalData[settings.currentDateIndex].date;
        }

        return {
          isRunning: settings.isRunning || false,
          currentDate: currentDate,
          speed: settings.speed || 1,
          currentDateIndex: settings.currentDateIndex || 0
        };
      }
    } catch (error) {
      console.log('Failed to load simulation status:', error.message);
    }

    return {
      isRunning: false,
      currentDate: new Date().toLocaleDateString('ru-RU'),
      speed: 1,
      currentDateIndex: 0
    };
  }

  @Post(':id/buy')
  buyStock(@Param('id') id: string, @Body() body: { stockId: number; symbol: string; quantity: number; price: number }) {
    const broker = this.brokers.find(b => b.id === parseInt(id));
    if (!broker) throw new Error('Broker not found');

    const totalCost = body.quantity * body.price;
    if (broker.balance < totalCost) {
      throw new Error('Insufficient funds');
    }

    broker.balance -= totalCost;

    const existingItem = broker.portfolio.find(item => item.stockId === body.stockId);
    if (existingItem) {
      const totalValue = existingItem.averagePrice * existingItem.quantity + totalCost;
      existingItem.quantity += body.quantity;
      existingItem.averagePrice = totalValue / existingItem.quantity;
    } else {
      broker.portfolio.push({
        stockId: body.stockId,
        symbol: body.symbol,
        quantity: body.quantity,
        averagePrice: body.price
      });
    }

    return { success: true, newBalance: broker.balance };
  }

  @Post(':id/sell')
  sellStock(@Param('id') id: string, @Body() body: { stockId: number; quantity: number; price: number }) {
    const broker = this.brokers.find(b => b.id === parseInt(id));
    if (!broker) throw new Error('Broker not found');

    const portfolioItem = broker.portfolio.find(item => item.stockId === body.stockId);
    if (!portfolioItem || portfolioItem.quantity < body.quantity) {
      throw new Error('Insufficient shares');
    }

    const totalValue = body.quantity * body.price;
    broker.balance += totalValue;

    portfolioItem.quantity -= body.quantity;
    if (portfolioItem.quantity === 0) {
      broker.portfolio = broker.portfolio.filter(item => item.stockId !== body.stockId);
    }

    return { success: true, newBalance: broker.balance };
  }

  private calculatePortfolioValue(broker: Broker): number {
    return broker.portfolio.reduce((total, item) => {
      return total + (this.stockPrices.get(item.stockId) || 0) * item.quantity;
    }, 0);
  }

  private getStockSymbol(stockId: number): string {
    const symbols: { [key: number]: string } = {
      1: 'AAPL', 2: 'SBUX', 3: 'MSFT', 4: 'CSCO',
      5: 'QCOM', 6: 'AMZN', 7: 'TSLA', 8: 'AMD'
    };
    return symbols[stockId] || `STOCK${stockId}`;
  }

  private getStockName(stockId: number): string {
    const names: { [key: number]: string } = {
      1: 'Apple, Inc.',
      2: 'Starbucks, Inc.', 
      3: 'Microsoft, Inc.',
      4: 'Cisco Systems, Inc.',
      5: 'QUALCOMM Incorporated',
      6: 'Amazon.com, Inc.',
      7: 'Tesla, Inc.',
      8: 'Advanced Micro Devices, Inc.'
    };
    return names[stockId] || `Stock ${stockId}`;
  }
}
