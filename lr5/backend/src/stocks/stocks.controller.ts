import { Controller, Get, Put, Body, Param } from '@nestjs/common';
import { DataService, Stock } from '../data/data.service';
import { SimulationGateway } from '../simulation/simulation.gateway'; // Добавьте этот импорт

@Controller('stocks')
export class StocksController {
  constructor(
    private readonly dataService: DataService,
    private readonly simulationGateway: SimulationGateway // Добавьте в конструктор
  ) {}

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
    
    // Отправляем событие об обновлении акций всем подключенным клиентам
    console.log(`Stock ${id} updated, isTrading: ${updateData.isTrading}`);
    this.simulationGateway.server.emit('stocksUpdated');
    
    return stocks[index];
  }
}
