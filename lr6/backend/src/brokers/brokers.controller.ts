import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { DataService, Broker } from '../data/data.service';

interface PortfolioResponse {
  broker: Broker;
  stocks: Array<{
    symbol: string;
    quantity: number;
    currentPrice: number;
    value: number;
  }>;
  totalValue: number;
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
}
