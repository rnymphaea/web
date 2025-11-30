import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { io, Socket } from 'socket.io-client';
import { PortfolioService } from '../portfolio/portfolio.service';

export interface Broker {
  id: number;
  name: string;
  initialFunds: number;
  cash?: number;
  stocks?: { [symbol: string]: number };
}

interface StockUpdate {
  id: number;
  symbol: string;
  name: string;
  currentPrice: number;
  date: string;
}

export interface Stock {
  id: number;
  symbol: string;
  name: string;
  isTrading: boolean;
  historicalData: Array<{
    date: string;
    open: number;
  }>;
}

export interface Settings {
  startDate: string;
  speed: number;
  isRunning: boolean;
  currentDateIndex: number;
}

@Injectable()
export class DataService {
  private brokers: Broker[] = [];
  private adminSocket: Socket;
  private brokerServer: Server;
  private currentPrices: { [symbol: string]: number } = {};
  private currentDate: string = '';
  private stocks: Stock[] = [];
  private tradingStocks: Set<string> = new Set();
  private settings: Settings = {
    startDate: new Date().toLocaleDateString(),
    speed: 1,
    isRunning: false,
    currentDateIndex: 0
  };

  constructor(private readonly portfolioService: PortfolioService) {
    this.connectToAdmin();
    this.loadInitialData();
  }

  private async loadInitialData() {
    try {
      const brokersResponse = await fetch('http://localhost:3001/brokers');
      const adminBrokers = await brokersResponse.json();
      
      const stocksResponse = await fetch('http://localhost:3001/stocks');
      this.stocks = await stocksResponse.json();

      const settingsResponse = await fetch('http://localhost:3001/simulation/settings');
      if (settingsResponse.ok) {
        this.settings = await settingsResponse.json();
      }

      this.updateTradingStocks();

      this.brokers = adminBrokers.map((broker: any) => {
        const initialFunds = broker.initialFunds || 100000;
        
        const newBroker: Broker = {
          id: broker.id,
          name: broker.name,
          initialFunds: initialFunds,
          cash: initialFunds,
          stocks: {}
        };
        
        this.portfolioService.initializePortfolio(broker.id, broker.name, initialFunds);
        
        return newBroker;
      });

      if (this.brokers.length === 0) {
        const defaultBroker: Broker = {
          id: 1,
          name: 'Default Broker',
          initialFunds: 100000,
          cash: 100000,
          stocks: {}
        };
        this.brokers.push(defaultBroker);
        this.portfolioService.initializePortfolio(1, 'Default Broker', 100000);
      }

    } catch (error) {
      if (this.brokers.length === 0) {
        const fallbackBroker: Broker = {
          id: 1,
          name: 'Fallback Broker',
          initialFunds: 100000,
          cash: 100000,
          stocks: {}
        };
        this.brokers.push(fallbackBroker);
        this.portfolioService.initializePortfolio(1, 'Fallback Broker', 100000);
      }
    }
  }

  private updateTradingStocks() {
    this.tradingStocks.clear();
    const tradingStocksList = this.stocks.filter(stock => stock.isTrading);
    
    tradingStocksList.forEach(stock => {
      this.tradingStocks.add(stock.symbol);
    });
  }

  private async reloadStocksFromAdmin() {
    try {
      const stocksResponse = await fetch('http://localhost:3001/stocks');
      if (!stocksResponse.ok) {
        throw new Error(`Failed to fetch stocks: ${stocksResponse.status}`);
      }
      
      this.stocks = await stocksResponse.json();
      this.updateTradingStocks();
      
      this.currentPrices = {};
      
      if (this.adminSocket && this.adminSocket.connected) {
        this.adminSocket.emit('getCurrentData');
      } else {
        await this.fetchCurrentPricesViaHttp();
      }
      
    } catch (error) {
    }
  }

  private async fetchCurrentPricesViaHttp() {
    try {
      const settingsResponse = await fetch('http://localhost:3001/simulation/settings');
      const settings = await settingsResponse.json();
      
      this.currentPrices = {};
      this.stocks.forEach(stock => {
        if (this.tradingStocks.has(stock.symbol) && stock.historicalData) {
          const historicalData = stock.historicalData[settings.currentDateIndex];
          if (historicalData) {
            this.currentPrices[stock.symbol] = historicalData.open;
            this.currentDate = historicalData.date;
          }
        }
      });
      
      this.broadcastToBrokers();
      
    } catch (error) {
    }
  }

  private connectToAdmin() {
    try {
      this.adminSocket = io('http://localhost:3001', {
        transports: ['websocket']
      });
      
      this.adminSocket.on('connect', () => {
        this.adminSocket.emit('getCurrentData');
      });
      
      this.adminSocket.on('stockUpdate', (data: StockUpdate[]) => {
        this.currentPrices = {};
        data.forEach(stock => {
          if (this.tradingStocks.has(stock.symbol)) {
            this.currentPrices[stock.symbol] = stock.currentPrice;
            this.currentDate = stock.date;
          }
        });
        
        this.broadcastToBrokers();
        this.broadcastPortfolioUpdates();
      });

      this.adminSocket.on('stocksUpdated', async () => {
        await this.reloadStocksFromAdmin();
      });

      this.adminSocket.on('currentData', (data: StockUpdate[]) => {
        this.currentPrices = {};
        data.forEach(stock => {
          if (this.tradingStocks.has(stock.symbol)) {
            this.currentPrices[stock.symbol] = stock.currentPrice;
            this.currentDate = stock.date;
          }
        });
        
        this.broadcastToBrokers();
        this.broadcastPortfolioUpdates();
      });

      this.adminSocket.on('brokersUpdated', async () => {
        await this.loadInitialData();
        this.broadcastPortfolioUpdates();
      });

      this.adminSocket.on('settingsUpdated', (settings: Settings) => {
        this.settings = settings;
      });

      this.adminSocket.on('disconnect', () => {
        setTimeout(() => this.connectToAdmin(), 5000);
      });

      this.adminSocket.on('connect_error', (error: any) => {
      });

      this.adminSocket.on('error', (error: any) => {
      });

    } catch (error) {
    }
  }

  setBrokerServer(server: Server) {
    this.brokerServer = server;
    this.portfolioService.setBrokerServer(server);
  }

  private broadcastToBrokers() {
    if (this.brokerServer) {
      const updateData = {
        prices: this.currentPrices,
        date: this.currentDate,
        settings: this.settings
      };
      this.brokerServer.emit('priceUpdate', updateData);
    }
  }

  private broadcastPortfolioUpdates() {
    if (this.brokerServer) {
      this.brokers.forEach(broker => {
        const portfolio = this.getBrokerPortfolio(broker.id);
        if (portfolio) {
          this.brokerServer.emit('portfolioUpdate', portfolio);
        }
      });
    }
  }

  getBrokers(): Broker[] {
    return this.brokers;
  }

  getBroker(id: number): Broker | undefined {
    return this.brokers.find(b => b.id === id);
  }

  createBroker(name: string): Broker {
    const existingBrokers = this.brokers;
    const maxId = existingBrokers.length > 0 
      ? Math.max(...existingBrokers.map(b => b.id)) 
      : 0;
    
    const id = maxId + 1;
    
    const broker: Broker = {
      id,
      name,
      initialFunds: 100000,
      cash: 100000,
      stocks: {}
    };
    
    this.brokers.push(broker);
    
    this.portfolioService.initializePortfolio(id, name, 100000);
    
    this.saveBrokerToAdmin(broker);
    this.broadcastPortfolioUpdates();
    
    return broker;
  }

  private async saveBrokerToAdmin(broker: Broker) {
    try {
      const response = await fetch('http://localhost:3001/brokers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: broker.name,
          initialFunds: broker.initialFunds
        })
      });
      
      if (response.ok) {
        const savedBroker = await response.json();
      } else {
      }
    } catch (error) {
    }
  }

  buyStock(brokerId: number, symbol: string, quantity: number): boolean {
    if (!this.tradingStocks.has(symbol)) {
      return false;
    }

    const broker = this.getBroker(brokerId);
    const price = this.currentPrices[symbol];
    
    if (!broker || !price) {
      return false;
    }
    
    const totalCost = price * quantity;
    if (broker.cash < totalCost) {
      return false;
    }
    
    broker.cash -= totalCost;
    broker.stocks[symbol] = (broker.stocks[symbol] || 0) + quantity;
    
    this.portfolioService.addTransaction(brokerId, broker.name, symbol, quantity, price, 'buy');
    this.portfolioService.updateCash(brokerId, broker.cash);

    this.broadcastPortfolioUpdates();
    
    return true;
  }

  sellStock(brokerId: number, symbol: string, quantity: number): boolean {
    const broker = this.getBroker(brokerId);
    const price = this.currentPrices[symbol];
    
    if (!broker || !price) {
      return false;
    }
    
    if (!broker.stocks[symbol] || broker.stocks[symbol] < quantity) {
      return false;
    }
    
    broker.cash += price * quantity;
    broker.stocks[symbol] -= quantity;
    
    if (broker.stocks[symbol] === 0) {
      delete broker.stocks[symbol];
    }
    
    this.portfolioService.addTransaction(brokerId, broker.name, symbol, quantity, price, 'sell');
    this.portfolioService.updateCash(brokerId, broker.cash);

    this.broadcastPortfolioUpdates();
    
    return true;
  }

  getCurrentPrices() {
    return { prices: this.currentPrices, date: this.currentDate };
  }

  getAllStocks(): Stock[] {
    return this.stocks;
  }

  getSettings(): Settings {
    return this.settings;
  }

  getBrokerPortfolio(brokerId: number) {
    const broker = this.getBroker(brokerId);
    if (!broker) return null;
    
    const portfolioData = this.portfolioService.getPortfolio(brokerId, this.currentPrices);
    
    if (!portfolioData) {
      this.portfolioService.initializePortfolio(brokerId, broker.name, broker.cash || 100000);
      return this.getBrokerPortfolio(brokerId);
    }

    if (portfolioData.brokerName !== broker.name) {
      portfolioData.brokerName = broker.name;
      this.portfolioService.updateBrokerName(brokerId, broker.name);
    }

    const portfolio = {
      broker,
      stocks: portfolioData.stocks.map(stock => {
        const currentPrice = this.currentPrices[stock.symbol] || 0;
        const stats = this.portfolioService.calculateStockStats(stock, currentPrice);
        
        return {
          symbol: stock.symbol,
          quantity: stock.quantity,
          currentPrice: currentPrice,
          averagePrice: stats.averagePrice,
          value: stats.currentValue,
          profit: stats.profit,
          profitPercentage: stats.profitPercentage,
          purchaseHistory: stock.purchaseHistory
        };
      }),
      totalValue: portfolioData.totalValue,
      totalProfit: portfolioData.totalProfit,
      cash: portfolioData.cash
    };
    
    return portfolio;
  }

  getStockChartData(brokerId: number, symbol: string) {
    const stock = this.stocks.find(s => s.symbol === symbol);
    if (!stock) return null;

    return this.portfolioService.getStockChartData(brokerId, symbol, stock.historicalData);
  }

  async syncWithAdmin(): Promise<boolean> {
    try {
      await this.loadInitialData();
      if (this.adminSocket && this.adminSocket.connected) {
        this.adminSocket.emit('getCurrentData');
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}
