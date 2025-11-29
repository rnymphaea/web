import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DataService, Broker } from '../data/data.service';

interface PortfolioResponse {
  broker: Broker;
  stocks: Array<{
    symbol: string;
    quantity: number;
    currentPrice: number;
    averagePrice: number;
    value: number;
    profit: number;
    profitPercentage: number;
    purchaseHistory: Array<{
      symbol: string;
      quantity: number;
      price: number;
      date: Date;
      type: 'buy' | 'sell';
    }>;
  }>;
  totalValue: number;
  totalProfit: number;
  cash: number;
}

@Controller('api')
export class BrokersController {
  constructor(private readonly dataService: DataService) {}

  @Get('brokers')
  getBrokers(): Broker[] {
    return this.dataService.getBrokers();
  }

  @Post('brokers')
  createBroker(@Body() body: { name: string }): Broker {
    return this.dataService.createBroker(body.name);
  }

  @Get('brokers/:id/portfolio')
  getPortfolio(@Param('id') id: string): PortfolioResponse | { error: string } {
    const portfolio = this.dataService.getBrokerPortfolio(parseInt(id));
    if (!portfolio) {
      return { error: 'Broker not found' };
    }
    return portfolio;
  }

  @Post('brokers/:id/buy')
  buyStock(
    @Param('id') id: string,
    @Body() body: { symbol: string; quantity: number }
  ): { success: boolean } {
    const success = this.dataService.buyStock(parseInt(id), body.symbol, body.quantity);
    return { success };
  }

  @Post('brokers/:id/sell')
  sellStock(
    @Param('id') id: string,
    @Body() body: { symbol: string; quantity: number }
  ): { success: boolean } {
    const success = this.dataService.sellStock(parseInt(id), body.symbol, body.quantity);
    return { success };
  }

  @Get('prices')
  getPrices() {
    return this.dataService.getCurrentPrices();
  }

  @Get('stocks')
  getStocks() {
    return this.dataService.getAllStocks();
  }

  @Get('brokers/:id/stock/:symbol/chart')
  getStockChart(
    @Param('id') id: string,
    @Param('symbol') symbol: string
  ) {
    const chartData = this.dataService.getStockChartData(parseInt(id), symbol);
    if (!chartData) {
      return { error: 'Stock not found' };
    }
    return chartData;
  }

  // Новый endpoint для графика любой акции с учетом текущей даты симуляции
  @Get('stocks/:symbol/chart')
  getStockChartForSymbol(@Param('symbol') symbol: string) {
    const settings = this.dataService.getSettings();
    const stocks = this.dataService.getAllStocks();
    const stock = stocks.find(s => s.symbol === symbol);
    
    if (!stock) {
      return { error: 'Stock not found' };
    }

    // Ограничиваем данные до текущей даты симуляции
    const historicalData = stock.historicalData.slice(0, settings.currentDateIndex + 1);
    const currentPrice = this.dataService.getCurrentPrices().prices[symbol] || 0;

    const chartData = {
      symbol: stock.symbol,
      name: stock.name,
      prices: historicalData.map(data => data.open),
      dates: historicalData.map(data => data.date),
      currentPrice: currentPrice,
      currentDateIndex: settings.currentDateIndex,
      totalDataPoints: stock.historicalData.length,
      availableDataPoints: historicalData.length
    };
    
    return chartData;
  }

  @Post('sync')
  async syncWithAdmin(): Promise<{ success: boolean }> {
    const success = await this.dataService.syncWithAdmin();
    return { success };
  }
}
