import { Module } from '@nestjs/common';
import { BrokersController } from './brokers/brokers.controller';
import { BrokersGateway } from './brokers/brokers.gateway';
import { DataService } from './data/data.service';
import { PortfolioController } from './portfolio/portfolio.controller';
import { PortfolioService } from './portfolio/portfolio.service';

@Module({
  imports: [],
  controllers: [BrokersController, PortfolioController],
  providers: [DataService, BrokersGateway, PortfolioService],
})
export class AppModule {}
