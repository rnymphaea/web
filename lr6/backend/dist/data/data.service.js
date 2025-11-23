"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataService = void 0;
const common_1 = require("@nestjs/common");
const socket_io_client_1 = require("socket.io-client");
let DataService = class DataService {
    constructor() {
        this.brokers = [];
        this.transactions = [];
        this.currentPrices = {};
        this.currentDate = '';
        this.connectToAdmin();
    }
    connectToAdmin() {
        try {
            console.log('Connecting to admin WebSocket...');
            this.adminSocket = (0, socket_io_client_1.io)('http://localhost:3001', {
                transports: ['websocket']
            });
            this.adminSocket.on('connect', () => {
                console.log('✅ Connected to admin WebSocket');
            });
            this.adminSocket.on('stockUpdate', (data) => {
                console.log('📈 Received stock update from admin:', data.length, 'stocks');
                data.forEach(stock => {
                    this.currentPrices[stock.symbol] = stock.currentPrice;
                    this.currentDate = stock.date;
                });
                this.broadcastToBrokers();
            });
            this.adminSocket.on('disconnect', () => {
                console.log('❌ Disconnected from admin WebSocket');
                setTimeout(() => this.connectToAdmin(), 5000);
            });
            this.adminSocket.on('connect_error', (error) => {
                console.log('❌ Connection error to admin:', error.message);
            });
        }
        catch (error) {
            console.error('Failed to connect to admin:', error);
        }
    }
    setBrokerServer(server) {
        this.brokerServer = server;
    }
    broadcastToBrokers() {
        if (this.brokerServer) {
            const updateData = {
                prices: this.currentPrices,
                date: this.currentDate
            };
            this.brokerServer.emit('priceUpdate', updateData);
            console.log('📤 Broadcasted price update to brokers');
        }
    }
    getBrokers() {
        return this.brokers;
    }
    getBroker(id) {
        return this.brokers.find(b => b.id === id);
    }
    createBroker(name) {
        const id = this.brokers.length + 1;
        const broker = {
            id,
            name,
            cash: 100000,
            stocks: {},
            initialCash: 100000
        };
        this.brokers.push(broker);
        console.log('Created new broker:', broker);
        return broker;
    }
    buyStock(brokerId, symbol, quantity) {
        const broker = this.getBroker(brokerId);
        const price = this.currentPrices[symbol];
        if (!broker || !price) {
            console.log('Buy failed: broker or price not found');
            return false;
        }
        const totalCost = price * quantity;
        if (broker.cash < totalCost) {
            console.log('Buy failed: insufficient funds');
            return false;
        }
        broker.cash -= totalCost;
        broker.stocks[symbol] = (broker.stocks[symbol] || 0) + quantity;
        this.transactions.push({
            brokerId,
            stockSymbol: symbol,
            type: 'buy',
            quantity,
            price,
            timestamp: new Date()
        });
        console.log(`Broker ${brokerId} bought ${quantity} ${symbol} at $${price}`);
        return true;
    }
    sellStock(brokerId, symbol, quantity) {
        const broker = this.getBroker(brokerId);
        const price = this.currentPrices[symbol];
        if (!broker || !price) {
            console.log('Sell failed: broker or price not found');
            return false;
        }
        if (!broker.stocks[symbol] || broker.stocks[symbol] < quantity) {
            console.log('Sell failed: insufficient stocks');
            return false;
        }
        broker.cash += price * quantity;
        broker.stocks[symbol] -= quantity;
        this.transactions.push({
            brokerId,
            stockSymbol: symbol,
            type: 'sell',
            quantity,
            price,
            timestamp: new Date()
        });
        console.log(`Broker ${brokerId} sold ${quantity} ${symbol} at $${price}`);
        return true;
    }
    getCurrentPrices() {
        return { prices: this.currentPrices, date: this.currentDate };
    }
    getBrokerPortfolio(brokerId) {
        const broker = this.getBroker(brokerId);
        if (!broker)
            return null;
        const portfolio = {
            broker,
            stocks: [],
            totalValue: broker.cash
        };
        Object.entries(broker.stocks).forEach(([symbol, quantity]) => {
            if (quantity > 0) {
                const currentPrice = this.currentPrices[symbol] || 0;
                const value = currentPrice * quantity;
                portfolio.stocks.push({
                    symbol,
                    quantity,
                    currentPrice,
                    value
                });
                portfolio.totalValue += value;
            }
        });
        return portfolio;
    }
};
DataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DataService);
exports.DataService = DataService;
//# sourceMappingURL=data.service.js.map