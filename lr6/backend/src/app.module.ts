import { Module } from '@nestjs/common';
import { BrokersController } from './brokers/brokers.controller';
import { DataService } from './data/data.service';

@Module({
  imports: [],
  controllers: [BrokersController],
  providers: [DataService],
})
export class AppModule {}
