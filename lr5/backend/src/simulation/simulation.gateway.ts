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
    const stocks = this.dataService.getStocks();

    let startIndex = 0;
    if (settings.startDate && stocks.length > 0 && stocks[0].historicalData) {
      const startDateIndex = stocks[0].historicalData.findIndex(
        data => data.date === settings.startDate
      );
      if (startDateIndex !== -1) {
        startIndex = startDateIndex;
      }
    }

    settings.currentDateIndex = startIndex;
    settings.isRunning = true;
    this.dataService.saveSettings(settings);

    console.log(`Simulation started from date: ${settings.startDate}, index: ${startIndex}`);

    this.simulationInterval = setInterval(() => {
      this.nextDay();
    }, settings.speed * 1000);
  }

  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    
    const settings = this.dataService.getSettings();
    settings.isRunning = false;
    this.dataService.saveSettings(settings);
  }

  private nextDay() {
    const settings = this.dataService.getSettings();
    const stocks = this.dataService.getStocks();

    if (settings.currentDateIndex >= stocks[0].historicalData.length - 1) {
      this.stopSimulation();
      console.log('Simulation finished - reached end of historical data');
      return;
    }

    settings.currentDateIndex += 1;
    this.dataService.saveSettings(settings);

    const currentStocksData = stocks
      .filter(stock => stock.isTrading)
      .map(stock => {
        const historicalData = stock.historicalData[settings.currentDateIndex];
        return {
          id: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          currentPrice: historicalData ? historicalData.open : 0,
          date: historicalData ? historicalData.date : 'N/A',
          isTrading: stock.isTrading
        };
      });

    this.server.emit('stockUpdate', currentStocksData);
    console.log(`Day ${settings.currentDateIndex}: ${currentStocksData[0]?.date}, Trading stocks: ${currentStocksData.length}`);
  }

  private sendCurrentData() {
    const settings = this.dataService.getSettings();
    const stocks = this.dataService.getStocks();

    const currentStocksData = stocks
      .filter(stock => stock.isTrading)
      .map(stock => {
        const historicalData = stock.historicalData[settings.currentDateIndex];
        return {
          id: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          currentPrice: historicalData ? historicalData.open : 0,
          date: historicalData ? historicalData.date : 'N/A',
          isTrading: stock.isTrading
        };
      });

    this.server.emit('stockUpdate', currentStocksData);
  }
}
