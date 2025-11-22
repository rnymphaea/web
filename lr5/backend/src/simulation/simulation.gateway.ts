import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { DataService } from '../data/data.service';

@WebSocketGateway({ cors: true })
export class SimulationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private simulationInterval: NodeJS.Timeout;

  constructor(private readonly dataService: DataService) {}

  afterInit(server: Server) {
    console.log('WebSocket server initialized');
  }

  handleConnection(client: any) {
    console.log(`Client connected: ${client.id}`);
    this.sendCurrentData();
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
  }

  startSimulation() {
    const settings = this.dataService.getSettings();
    settings.currentDateIndex = 0;
    this.dataService.saveSettings(settings);

    this.simulationInterval = setInterval(() => {
      this.nextDay();
    }, settings.speed * 1000);
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
  }

  private nextDay() {
    const settings = this.dataService.getSettings();
    const stocks = this.dataService.getStocks();

    settings.currentDateIndex += 1;
    this.dataService.saveSettings(settings);

    const currentStocksData = stocks.map(stock => {
      const historicalData = stock.historicalData[settings.currentDateIndex];
      return {
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: historicalData ? historicalData.open : 0,
        date: historicalData ? historicalData.date : 'N/A',
      };
    });

    this.server.emit('stockUpdate', currentStocksData);

    // Stop simulation if we've reached the end of historical data
    if (settings.currentDateIndex >= stocks[0].historicalData.length - 1) {
      this.stopSimulation();
      settings.isRunning = false;
      this.dataService.saveSettings(settings);
    }
  }

  private sendCurrentData() {
    const settings = this.dataService.getSettings();
    const stocks = this.dataService.getStocks();

    const currentStocksData = stocks.map(stock => {
      const historicalData = stock.historicalData[settings.currentDateIndex];
      return {
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        currentPrice: historicalData ? historicalData.open : 0,
        date: historicalData ? historicalData.date : 'N/A',
      };
    });

    this.server.emit('stockUpdate', currentStocksData);
  }
}
