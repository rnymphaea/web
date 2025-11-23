import { DataService, Broker } from '../data/data.service';
interface PortfolioResponse {
    broker: Broker;
    stocks: Array<{
        symbol: string;
        quantity: number;
        currentPrice: number;
        value: number;
    }>;
    totalValue: number;
}
export declare class BrokersController {
    private readonly dataService;
    constructor(dataService: DataService);
    getBrokers(): Broker[];
    createBroker(body: {
        name: string;
    }): Broker;
    getPortfolio(id: string): PortfolioResponse | {
        error: string;
    };
    buyStock(id: string, body: {
        symbol: string;
        quantity: number;
    }): {
        success: boolean;
    };
    sellStock(id: string, body: {
        symbol: string;
        quantity: number;
    }): {
        success: boolean;
    };
    getPrices(): {
        prices: {
            [symbol: string]: number;
        };
        date: string;
    };
}
export {};
