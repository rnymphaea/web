import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { DataService, Broker } from '../data/data.service';

@Controller('brokers')
export class BrokersController {
  constructor(private readonly dataService: DataService) {}

  @Get()
  getBrokers(): Broker[] {
    return this.dataService.getBrokers();
  }

  @Post()
  createBroker(@Body() broker: Omit<Broker, 'id'>): Broker {
    const brokers = this.dataService.getBrokers();
    const newBroker: Broker = {
      ...broker,
      id: brokers.length ? Math.max(...brokers.map(b => b.id)) + 1 : 1,
    };
    brokers.push(newBroker);
    this.dataService.saveBrokers(brokers);
    return newBroker;
  }

  @Put(':id')
  updateBroker(@Param('id') id: string, @Body() updateData: Partial<Broker>): Broker {
    const brokers = this.dataService.getBrokers();
    const index = brokers.findIndex(b => b.id === parseInt(id));
    if (index === -1) {
      throw new Error('Broker not found');
    }
    brokers[index] = { ...brokers[index], ...updateData };
    this.dataService.saveBrokers(brokers);
    return brokers[index];
  }

  @Delete(':id')
  deleteBroker(@Param('id') id: string): { success: boolean } {
    const brokers = this.dataService.getBrokers();
    const filteredBrokers = brokers.filter(b => b.id !== parseInt(id));
    this.dataService.saveBrokers(filteredBrokers);
    return { success: true };
  }
}
