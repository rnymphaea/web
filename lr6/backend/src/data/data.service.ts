// backend/src/data/data.service.ts

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

interface Transaction {
  brokerId: number;
  stockSymbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: Date;
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
  private transactions: Transaction[] = [];
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
      console.log('🔄 Loading initial data from admin backend...');
      
      // Загружаем брокеров из админского бэкенда
      const brokersResponse = await fetch('http://localhost:3001/brokers');
      const adminBrokers = await brokersResponse.json();
      
      // Загружаем акции из админского бэкенда
      const stocksResponse = await fetch('http://localhost:3001/stocks');
      this.stocks = await stocksResponse.json();

      // Загружаем настройки из админского бэкенда
      const settingsResponse = await fetch('http://localhost:3001/simulation/settings');
      if (settingsResponse.ok) {
        this.settings = await settingsResponse.json();
      }

      // Обновляем список акций в торгах
      this.updateTradingStocks();

      // Инициализируем брокеров с начальными данными
      this.brokers = adminBrokers.map((broker: any) => {
        console.log('👤 Processing broker:', broker);
        
        const initialFunds = broker.initialFunds || 100000;
        
        const newBroker: Broker = {
          id: broker.id,
          name: broker.name,
          initialFunds: initialFunds,
          cash: initialFunds,
          stocks: {}
        };
        
        console.log('✅ Created broker object:', newBroker);
        return newBroker;
      });

      console.log('✅ Final brokers list:', this.brokers);
      console.log('✅ Loaded brokers from admin:', this.brokers.length);
      console.log('✅ Loaded stocks from admin:', this.stocks.length);
      console.log('✅ Trading stocks:', Array.from(this.tradingStocks));
      console.log('✅ Settings:', this.settings);

      // Если брокеров нет, создаем тестового
      if (this.brokers.length === 0) {
        console.log('⚠️ No brokers found, creating default broker...');
        const defaultBroker: Broker = {
          id: 1,
          name: 'Default Broker',
          initialFunds: 100000,
          cash: 100000,
          stocks: {}
        };
        this.brokers.push(defaultBroker);
        console.log('✅ Created default broker:', defaultBroker);
      }

    } catch (error) {
      console.error('❌ Failed to load initial data from admin:', error);
      
      // Создаем тестового брокера при ошибке
      if (this.brokers.length === 0) {
        console.log('🔄 Creating fallback broker due to error...');
        const fallbackBroker: Broker = {
          id: 1,
          name: 'Fallback Broker',
          initialFunds: 100000,
          cash: 100000,
          stocks: {}
        };
        this.brokers.push(fallbackBroker);
        console.log('✅ Created fallback broker:', fallbackBroker);
      }
    }
  }

  private updateTradingStocks() {
    this.tradingStocks.clear();
    const tradingStocksList = this.stocks.filter(stock => stock.isTrading);
    
    tradingStocksList.forEach(stock => {
      this.tradingStocks.add(stock.symbol);
    });
    
    console.log('🔄 Updated trading stocks:', Array.from(this.tradingStocks));
    console.log('📊 Total trading stocks:', tradingStocksList.length);
  }

  private async reloadStocksFromAdmin() {
    try {
      console.log('🔄 Reloading stocks from admin backend...');
      
      const stocksResponse = await fetch('http://localhost:3001/stocks');
      if (!stocksResponse.ok) {
        throw new Error(`Failed to fetch stocks: ${stocksResponse.status}`);
      }
      
      this.stocks = await stocksResponse.json();
      this.updateTradingStocks();
      
      console.log('✅ Stocks reloaded. Trading stocks:', Array.from(this.tradingStocks));
      
      // Очищаем текущие цены
      this.currentPrices = {};
      
      // Запрашиваем актуальные цены у админского бэкенда
      if (this.adminSocket && this.adminSocket.connected) {
        console.log('📡 Requesting current prices from admin...');
        this.adminSocket.emit('getCurrentData');
      } else {
        console.log('❌ Admin socket not connected, trying fallback...');
        await this.fetchCurrentPricesViaHttp();
      }
      
    } catch (error) {
      console.error('❌ Failed to reload stocks from admin:', error);
    }
  }

  private async fetchCurrentPricesViaHttp() {
    try {
      console.log('🔄 Fetching current prices via HTTP...');
      
      // Получаем текущие настройки симуляции
      const settingsResponse = await fetch('http://localhost:3001/simulation/settings');
      const settings = await settingsResponse.json();
      
      // Формируем текущие цены на основе historicalData и currentDateIndex
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
      
      console.log('✅ Prices loaded via HTTP:', this.currentPrices);
      this.broadcastToBrokers();
      
    } catch (error) {
      console.error('❌ Failed to fetch prices via HTTP:', error);
    }
  }

  private connectToAdmin() {
    try {
      console.log('🔌 Connecting to admin WebSocket...');
      this.adminSocket = io('http://localhost:3001', {
        transports: ['websocket']
      });
      
      this.adminSocket.on('connect', () => {
        console.log('✅ Connected to admin WebSocket');
        this.adminSocket.emit('getCurrentData');
      });
      
      this.adminSocket.on('stockUpdate', (data: StockUpdate[]) => {
        console.log('📈 Received stock update from admin:', data.length, 'stocks');
        
        // Обновляем текущие цены
        this.currentPrices = {};
        data.forEach(stock => {
          if (this.tradingStocks.has(stock.symbol)) {
            this.currentPrices[stock.symbol] = stock.currentPrice;
            this.currentDate = stock.date;
            console.log(`💰 ${stock.symbol}: $${stock.currentPrice}`);
          }
        });
        
        console.log('📅 Current date:', this.currentDate);
        console.log('💵 Current trading prices:', this.currentPrices);
        
        // Отправляем обновление всем подключенным клиентам
        this.broadcastToBrokers();
        
        // Отправляем обновление портфелей всем брокерам
        this.broadcastPortfolioUpdates();
      });

      this.adminSocket.on('stocksUpdated', async () => {
        console.log('🔄 Stocks updated event received from admin!');
        await this.reloadStocksFromAdmin();
      });

      this.adminSocket.on('currentData', (data: StockUpdate[]) => {
        console.log('📊 Received current data from admin:', data.length, 'stocks');
        
        this.currentPrices = {};
        data.forEach(stock => {
          if (this.tradingStocks.has(stock.symbol)) {
            this.currentPrices[stock.symbol] = stock.currentPrice;
            this.currentDate = stock.date;
          }
        });
        
        console.log('📅 Current date:', this.currentDate);
        console.log('💵 Current trading prices:', this.currentPrices);
        
        this.broadcastToBrokers();
        this.broadcastPortfolioUpdates();
      });

      this.adminSocket.on('brokersUpdated', async () => {
        console.log('🔄 Brokers updated in admin, reloading...');
        await this.loadInitialData();
        this.broadcastPortfolioUpdates();
      });

      this.adminSocket.on('settingsUpdated', (settings: Settings) => {
        console.log('🔄 Settings updated from admin:', settings);
        this.settings = settings;
      });

      this.adminSocket.on('disconnect', () => {
        console.log('❌ Disconnected from admin WebSocket');
        setTimeout(() => this.connectToAdmin(), 5000);
      });

      this.adminSocket.on('connect_error', (error: any) => {
        console.log('❌ Connection error to admin:', error.message);
      });

      this.adminSocket.on('error', (error: any) => {
        console.log('❌ WebSocket error:', error);
      });

    } catch (error) {
      console.error('❌ Failed to connect to admin:', error);
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
      console.log('📤 Broadcasted price update to brokers:', updateData);
    }
  }

  // Новый метод для отправки обновлений портфелей
  private broadcastPortfolioUpdates() {
    if (this.brokerServer) {
      this.brokers.forEach(broker => {
        const portfolio = this.getBrokerPortfolio(broker.id);
        if (portfolio) {
          this.brokerServer.emit('portfolioUpdate', portfolio);
        }
      });
      console.log('📤 Broadcasted portfolio updates to all brokers');
    }
  }

  getBrokers(): Broker[] {
    return this.brokers;
  }

  getBroker(id: number): Broker | undefined {
    return this.brokers.find(b => b.id === id);
  }

  createBroker(name: string): Broker {
    // Находим максимальный ID среди всех брокеров (из загруженных и существующих)
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
    console.log('✅ Created new broker:', broker);
    console.log('📊 Total brokers now:', this.brokers.length);
    
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
        console.log('✅ Broker saved to admin backend');
        const savedBroker = await response.json();
        console.log('📋 Saved broker data:', savedBroker);
      } else {
        console.error('❌ Failed to save broker to admin:', response.status);
      }
    } catch (error) {
      console.error('❌ Failed to save broker to admin:', error);
    }
  }

  buyStock(brokerId: number, symbol: string, quantity: number): boolean {
    if (!this.tradingStocks.has(symbol)) {
      console.log('❌ Buy failed: stock not trading', { symbol });
      return false;
    }

    const broker = this.getBroker(brokerId);
    const price = this.currentPrices[symbol];
    
    if (!broker || !price) {
      console.log('❌ Buy failed: broker or price not found', { brokerId, symbol, price });
      return false;
    }
    
    const totalCost = price * quantity;
    if (broker.cash < totalCost) {
      console.log('❌ Buy failed: insufficient funds');
      return false;
    }
    
    broker.cash -= totalCost;
    broker.stocks[symbol] = (broker.stocks[symbol] || 0) + quantity;
    
    // Сохраняем в историю портфеля
    this.portfolioService.addTransaction(brokerId, broker.name, symbol, quantity, price, 'buy');
    this.portfolioService.updateCash(brokerId, broker.cash);

    this.transactions.push({
      brokerId,
      stockSymbol: symbol,
      type: 'buy',
      quantity,
      price,
      timestamp: new Date()
    });

    console.log(`✅ Broker ${brokerId} bought ${quantity} ${symbol} at $${price}`);
    
    // Отправляем обновление портфеля
    this.broadcastPortfolioUpdates();
    
    return true;
  }

  sellStock(brokerId: number, symbol: string, quantity: number): boolean {
    const broker = this.getBroker(brokerId);
    const price = this.currentPrices[symbol];
    
    if (!broker || !price) {
      console.log('❌ Sell failed: broker or price not found');
      return false;
    }
    
    if (!broker.stocks[symbol] || broker.stocks[symbol] < quantity) {
      console.log('❌ Sell failed: insufficient stocks');
      return false;
    }
    
    broker.cash += price * quantity;
    broker.stocks[symbol] -= quantity;
    
    if (broker.stocks[symbol] === 0) {
      delete broker.stocks[symbol];
    }
    
    // Сохраняем в историю портфеля
    this.portfolioService.addTransaction(brokerId, broker.name, symbol, quantity, price, 'sell');
    this.portfolioService.updateCash(brokerId, broker.cash);

    this.transactions.push({
      brokerId,
      stockSymbol: symbol,
      type: 'sell',
      quantity,
      price,
      timestamp: new Date()
    });

    console.log(`✅ Broker ${brokerId} sold ${quantity} ${symbol} at $${price}`);
    
    // Отправляем обновление портфеля
    this.broadcastPortfolioUpdates();
    
    return true;
  }

  getCurrentPrices() {
    return { prices: this.currentPrices, date: this.currentDate };
  }

  getTradingStocks(): Stock[] {
    return this.stocks.filter(stock => stock.isTrading);
  }

  getAllStocks(): Stock[] {
    return this.stocks;
  }

  getStocks(): Stock[] {
    return this.stocks;
  }

  getSettings(): Settings {
    return this.settings;
  }

  getBrokerPortfolio(brokerId: number) {
    const broker = this.getBroker(brokerId);
    if (!broker) return null;
    
    const portfolioData = this.portfolioService.getPortfolio(brokerId, this.currentPrices);
    if (!portfolioData) return null;

    // Обновляем имя брокера в портфеле, если оно изменилось
    if (portfolioData.brokerName !== broker.name) {
      portfolioData.brokerName = broker.name;
    }

    // Формируем ответ с вычисленными значениями для фронтенда
    const portfolio = {
      broker,
      stocks: portfolioData.stocks.map(stock => {
        const currentPrice = this.currentPrices[stock.symbol] || 0;
        const stats = this.portfolioService.calculateStockStats(stock, currentPrice);
        
        return {
          symbol: stock.symbol,
          quantity: stock.quantity,
          currentPrice: currentPrice, // Используем актуальные цены
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
      console.error('Sync with admin failed:', error);
      return false;
    }
  }
}
