import { WebSocketGateway, WebSocketServer, OnGatewayInit } from '@nestjs/websockets';
import { Server } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';

interface StockPrice {
  stockId: number;
  symbol: string;
  price: number;
  date: string;
  change: number;
}

@WebSocketGateway({ cors: true })
export class BrokerGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private interval: NodeJS.Timeout;
  private previousPrices = new Map<number, number>();

  afterInit() {
    console.log('WebSocket Gateway initialized');
    this.sendStockPrices();
    
    this.interval = setInterval(() => {
      this.sendStockPrices();
    }, 5000);
  }

  private sendStockPrices() {
    const stockPrices = this.getStockPricesFromAdminModule();
    this.server.emit('stockPrices', stockPrices);
  }

  private getStockPricesFromAdminModule(): StockPrice[] {
    try {
      const stocksDataPath = path.join(process.cwd(), '../broker-simulator-rnymphaea/data/stocks.json');
      const settingsPath = path.join(process.cwd(), '../broker-simulator-rnymphaea/data/settings.json');
      
      if (fs.existsSync(stocksDataPath) && fs.existsSync(settingsPath)) {
        const stocks = JSON.parse(fs.readFileSync(stocksDataPath, 'utf8'));
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        
        const currentPrices: StockPrice[] = [];

        stocks.forEach((stock: any) => {
          if (stock.isTrading && stock.historicalData && stock.historicalData.length > settings.currentDateIndex) {
            const currentData = stock.historicalData[settings.currentDateIndex];
            const previousPrice = this.previousPrices.get(stock.id) || currentData.open;
            const change = currentData.open - previousPrice;
            
            currentPrices.push({
              stockId: stock.id,
              symbol: stock.symbol,
              price: currentData.open,
              date: currentData.date,
              change: change
            });

            this.previousPrices.set(stock.id, currentData.open);
          }
        });

        if (currentPrices.length > 0) {
          console.log(`Sent ${currentPrices.length} stock prices from admin module`);
          return currentPrices;
        }
      }
    } catch (error) {
      console.log('Failed to load stock prices from admin module, using demo data:', error.message);
    }

    return this.getDemoStockPrices();
  }

  private getDemoStockPrices(): StockPrice[] {
    const stocks: StockPrice[] = [
      { stockId: 1, symbol: 'AAPL', price: 150, date: new Date().toLocaleDateString('ru-RU'), change: 0 },
      { stockId: 2, symbol: 'SBUX', price: 95, date: new Date().toLocaleDateString('ru-RU'), change: 0 },
      { stockId: 3, symbol: 'MSFT', price: 280, date: new Date().toLocaleDateString('ru-RU'), change: 0 },
      { stockId: 4, symbol: 'CSCO', price: 50, date: new Date().toLocaleDateString('ru-RU'), change: 0 },
      { stockId: 5, symbol: 'QCOM', price: 125, date: new Date().toLocaleDateString('ru-RU'), change: 0 },
      { stockId: 6, symbol: 'AMZN', price: 3350, date: new Date().toLocaleDateString('ru-RU'), change: 0 },
      { stockId: 7, symbol: 'TSLA', price: 850, date: new Date().toLocaleDateString('ru-RU'), change: 0 },
      { stockId: 8, symbol: 'AMD', price: 75, date: new Date().toLocaleDateString('ru-RU'), change: 0 }
    ];

    stocks.forEach(stock => {
      const change = (Math.random() - 0.5) * 10;
      stock.price = Math.max(1, stock.price + change);
      stock.price = Number(stock.price.toFixed(2));
      stock.change = change;
    });

    console.log('Sent demo stock prices');
    return stocks;
  }
}
