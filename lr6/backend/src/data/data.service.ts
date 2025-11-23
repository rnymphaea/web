import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { io, Socket } from 'socket.io-client';

export interface Broker {
  id: number;
  name: string;
  cash: number;
  stocks: { [symbol: string]: number };
  initialCash: number;
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
  symbol: string;
  currentPrice: number;
  date: string;
}

@Injectable()
export class DataService {
  private brokers: Broker[] = [];
  private transactions: Transaction[] = [];
  private adminSocket: Socket;
  private brokerServer: Server;
  private currentPrices: { [symbol: string]: number } = {};
  private currentDate: string = '';

  constructor() {
    this.connectToAdmin();
  }

  private connectToAdmin() {
    try {
      console.log('Connecting to admin WebSocket...');
      this.adminSocket = io('http://localhost:3001', {
        transports: ['websocket']
      });
      
      this.adminSocket.on('connect', () => {
        console.log('✅ Connected to admin WebSocket');
      });
      
      this.adminSocket.on('stockUpdate', (data: StockUpdate[]) => {
        console.log('📈 Received stock update from admin:', data.length, 'stocks');
        data.forEach(stock => {
          this.currentPrices[stock.symbol] = stock.currentPrice;
          this.currentDate = stock.date;
        });
        
        this.broadcastToBrokers();
      });

      this.adminSocket.on('disconnect', () => {
        console.log('❌ Disconnected from admin WebSocket');
        setTimeout(() => this.connectToAdmin(), 5000);
      });

      this.adminSocket.on('connect_error', (error: any) => {
        console.log('❌ Connection error to admin:', error.message);
      });

    } catch (error) {
      console.error('Failed to connect to admin:', error);
    }
  }

  setBrokerServer(server: Server) {
    this.brokerServer = server;
  }

  private broadcastToBrokers() {
    if (this.brokerServer) {
      const updateData = {
        prices: this.currentPrices,
        date: this.currentDate
      };
      this.brokerServer.emit('priceUpdate', updateData);
      console.log('📤 Broadcasted price update to brokers');
    }
  }

  getBrokers(): Broker[] {
    return this.brokers;
  }

  getBroker(id: number): Broker | undefined {
    return this.brokers.find(b => b.id === id);
  }

  createBroker(name: string): Broker {
    const id = this.brokers.length + 1;
    const broker: Broker = {
      id,
      name,
      cash: 100000,
      stocks: {},
      initialCash: 100000
    };
    this.brokers.push(broker);
    console.log('Created new broker:', broker);
    return broker;
  }

  buyStock(brokerId: number, symbol: string, quantity: number): boolean {
    const broker = this.getBroker(brokerId);
    const price = this.currentPrices[symbol];
    
    if (!broker || !price) {
      console.log('Buy failed: broker or price not found');
      return false;
    }
    
    const totalCost = price * quantity;
    if (broker.cash < totalCost) {
      console.log('Buy failed: insufficient funds');
      return false;
    }
    
    broker.cash -= totalCost;
    broker.stocks[symbol] = (broker.stocks[symbol] || 0) + quantity;
    
    this.transactions.push({
      brokerId,
      stockSymbol: symbol,
      type: 'buy',
      quantity,
      price,
      timestamp: new Date()
    });

    console.log(`Broker ${brokerId} bought ${quantity} ${symbol} at $${price}`);
    return true;
  }

  sellStock(brokerId: number, symbol: string, quantity: number): boolean {
    const broker = this.getBroker(brokerId);
    const price = this.currentPrices[symbol];
    
    if (!broker || !price) {
      console.log('Sell failed: broker or price not found');
      return false;
    }
    
    if (!broker.stocks[symbol] || broker.stocks[symbol] < quantity) {
      console.log('Sell failed: insufficient stocks');
      return false;
    }
    
    broker.cash += price * quantity;
    broker.stocks[symbol] -= quantity;
    
    this.transactions.push({
      brokerId,
      stockSymbol: symbol,
      type: 'sell',
      quantity,
      price,
      timestamp: new Date()
    });

    console.log(`Broker ${brokerId} sold ${quantity} ${symbol} at $${price}`);
    return true;
  }

  getCurrentPrices() {
    return { prices: this.currentPrices, date: this.currentDate };
  }

  getBrokerPortfolio(brokerId: number) {
    const broker = this.getBroker(brokerId);
    if (!broker) return null;
    
    const portfolio = {
      broker,
      stocks: [] as Array<{
        symbol: string;
        quantity: number;
        currentPrice: number;
        value: number;
      }>,
      totalValue: broker.cash
    };
    
    Object.entries(broker.stocks).forEach(([symbol, quantity]) => {
      if (quantity > 0) {
        const currentPrice = this.currentPrices[symbol] || 0;
        const value = currentPrice * quantity;
        portfolio.stocks.push({
          symbol,
          quantity,
          currentPrice,
          value
        });
        portfolio.totalValue += value;
      }
    });
    
    return portfolio;
  }
}
