import { Module } from '@nestjs/common';
import { BrokersController } from './brokers/brokers.controller';
import { StocksController } from './stocks/stocks.controller';
import { SimulationController } from './simulation/simulation.controller';
import { SimulationGateway } from './simulation/simulation.gateway';
import { DataService } from './data/data.service';

@Module({
  imports: [],
  controllers: [BrokersController, StocksController, SimulationController],
  providers: [SimulationGateway, DataService],
})
export class AppModule {}
