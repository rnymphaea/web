import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface Broker {
  id: number;
  name: string;
  initialFunds: number;
  cash?: number;
  stocks?: { [symbol: string]: number };
  portfolio?: {
    stocks: Array<{
      symbol: string;
      quantity: number;
      currentPrice: number;
      value: number;
    }>;
    totalValue: number;
  };
}

export interface Stock {
  id: number;
  symbol: string;
  name: string;
  historicalData: HistoricalData[];
  isTrading: boolean;
}

export interface HistoricalData {
  date: string;
  open: number;
}

export interface Settings {
  startDate: string;
  speed: number;
  isRunning: boolean;
  currentDateIndex: number;
}

@Injectable()
export class DataService {
  private readonly dataPath = path.join(process.cwd(), 'data');

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath);
    }

    const defaultBrokers: Broker[] = [
      { id: 1, name: 'Broker 1', initialFunds: 100000 },
      { id: 2, name: 'Broker 2', initialFunds: 200000 },
    ];

    const defaultStocks: Stock[] = [
      {
        id: 1,
        symbol: 'AAPL',
        name: 'Apple, Inc.',
        isTrading: true,
        historicalData: this.generateHistoricalData(150, 160),
      },
      {
        id: 2,
        symbol: 'SBUX',
        name: 'Starbucks, Inc.',
        isTrading: true,
        historicalData: this.generateHistoricalData(90, 100),
      },
      {
        id: 3,
        symbol: 'MSFT',
        name: 'Microsoft, Inc.',
        isTrading: true,
        historicalData: this.generateHistoricalData(280, 300),
      },
      {
        id: 4,
        symbol: 'CSCO',
        name: 'Cisco Systems, Inc.',
        isTrading: true,
        historicalData: this.generateHistoricalData(45, 55),
      },
      {
        id: 5,
        symbol: 'QCOM',
        name: 'QUALCOMM Incorporated',
        isTrading: true,
        historicalData: this.generateHistoricalData(120, 130),
      },
      {
        id: 6,
        symbol: 'AMZN',
        name: 'Amazon.com, Inc.',
        isTrading: true,
        historicalData: this.generateHistoricalData(3300, 3400),
      },
      {
        id: 7,
        symbol: 'TSLA',
        name: 'Tesla, Inc.',
        isTrading: true,
        historicalData: this.generateHistoricalData(800, 900),
      },
      {
        id: 8,
        symbol: 'AMD',
        name: 'Advanced Micro Devices, Inc.',
        isTrading: true,
        historicalData: this.generateHistoricalData(70, 80),
      },
    ];

    const defaultSettings: Settings = {
      startDate: new Date().toLocaleDateString(),
      speed: 1,
      isRunning: false,
      currentDateIndex: 0,
    };

    this.ensureFile('brokers.json', defaultBrokers);
    this.ensureFile('stocks.json', defaultStocks);
    this.ensureFile('settings.json', defaultSettings);
  }

  private generateHistoricalData(min: number, max: number): HistoricalData[] {
    const data: HistoricalData[] = [];
    const today = new Date();
    
    for (let i = 365; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toLocaleDateString(),
        open: Number((min + Math.random() * (max - min)).toFixed(2)),
      });
    }
    
    return data;
  }

  private ensureFile(filename: string, defaultData: any) {
    const filePath = path.join(this.dataPath, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
  }

  private readFile<T>(filename: string): T {
    const filePath = path.join(this.dataPath, filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }

  private writeFile(filename: string, data: any): void {
    const filePath = path.join(this.dataPath, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  getBrokers(): Broker[] {
    return this.readFile<Broker[]>('brokers.json');
  }

  saveBrokers(brokers: Broker[]): void {
    this.writeFile('brokers.json', brokers);
  }

  getStocks(): Stock[] {
    return this.readFile<Stock[]>('stocks.json');
  }

  saveStocks(stocks: Stock[]): void {
    this.writeFile('stocks.json', stocks);
  }

  getSettings(): Settings {
    return this.readFile<Settings>('settings.json');
  }

  saveSettings(settings: Settings): void {
    this.writeFile('settings.json', settings);
  }
}
