import { Server } from 'socket.io';
export interface Broker {
    id: number;
    name: string;
    cash: number;
    stocks: {
        [symbol: string]: number;
    };
    initialCash: number;
}
export declare class DataService {
    private brokers;
    private transactions;
    private adminSocket;
    private brokerServer;
    private currentPrices;
    private currentDate;
    constructor();
    private connectToAdmin;
    setBrokerServer(server: Server): void;
    private broadcastToBrokers;
    getBrokers(): Broker[];
    getBroker(id: number): Broker | undefined;
    createBroker(name: string): Broker;
    buyStock(brokerId: number, symbol: string, quantity: number): boolean;
    sellStock(brokerId: number, symbol: string, quantity: number): boolean;
    getCurrentPrices(): {
        prices: {
            [symbol: string]: number;
        };
        date: string;
    };
    getBrokerPortfolio(brokerId: number): {
        broker: Broker;
        stocks: {
            symbol: string;
            quantity: number;
            currentPrice: number;
            value: number;
        }[];
        totalValue: number;
    };
}
