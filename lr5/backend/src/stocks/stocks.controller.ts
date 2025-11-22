import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { DataService, Stock } from '../data/data.service';

@Controller('stocks')
export class StocksController {
  constructor(private readonly dataService: DataService) {}

  @Get()
  getStocks(): Stock[] {
    return this.dataService.getStocks();
  }

  @Put(':id')
  updateStock(@Param('id') id: string, @Body() updateData: Partial<Stock>): Stock {
    const stocks = this.dataService.getStocks();
    const index = stocks.findIndex(s => s.id === parseInt(id));
    if (index === -1) {
      throw new Error('Stock not found');
    }
    stocks[index] = { ...stocks[index], ...updateData };
    this.dataService.saveStocks(stocks);
    return stocks[index];
  }
}
