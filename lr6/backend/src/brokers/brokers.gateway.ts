import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { DataService } from '../data/data.service';

@WebSocketGateway({
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})
export class BrokersGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly dataService: DataService) {}

  afterInit(server: Server) {
    console.log('Brokers WebSocket server initialized');
    this.dataService.setBrokerServer(server);
  }

  handleConnection(client: any) {
    console.log(`Broker client connected: ${client.id}`);
    const currentData = this.dataService.getCurrentPrices();
    client.emit('priceUpdate', currentData);
  }

  handleDisconnect(client: any) {
    console.log(`Broker client disconnected: ${client.id}`);
  }
}
