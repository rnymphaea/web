import { Module } from '@nestjs/common';
import { BrokerController } from './broker.controller';
import { BrokerGateway } from './broker.gateway';

@Module({
  imports: [],
  controllers: [BrokerController],
  providers: [BrokerGateway],
})
export class AppModule {}
