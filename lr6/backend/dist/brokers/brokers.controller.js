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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrokersController = void 0;
const common_1 = require("@nestjs/common");
const data_service_1 = require("../data/data.service");
let BrokersController = class BrokersController {
    constructor(dataService) {
        this.dataService = dataService;
    }
    getBrokers() {
        return this.dataService.getBrokers();
    }
    createBroker(body) {
        return this.dataService.createBroker(body.name);
    }
    getPortfolio(id) {
        const portfolio = this.dataService.getBrokerPortfolio(parseInt(id));
        if (!portfolio) {
            return { error: 'Broker not found' };
        }
        return portfolio;
    }
    buyStock(id, body) {
        const success = this.dataService.buyStock(parseInt(id), body.symbol, body.quantity);
        return { success };
    }
    sellStock(id, body) {
        const success = this.dataService.sellStock(parseInt(id), body.symbol, body.quantity);
        return { success };
    }
    getPrices() {
        return this.dataService.getCurrentPrices();
    }
};
__decorate([
    (0, common_1.Get)('brokers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], BrokersController.prototype, "getBrokers", null);
__decorate([
    (0, common_1.Post)('brokers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], BrokersController.prototype, "createBroker", null);
__decorate([
    (0, common_1.Get)('brokers/:id/portfolio'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], BrokersController.prototype, "getPortfolio", null);
__decorate([
    (0, common_1.Post)('brokers/:id/buy'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Object)
], BrokersController.prototype, "buyStock", null);
__decorate([
    (0, common_1.Post)('brokers/:id/sell'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Object)
], BrokersController.prototype, "sellStock", null);
__decorate([
    (0, common_1.Get)('prices'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BrokersController.prototype, "getPrices", null);
BrokersController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [data_service_1.DataService])
], BrokersController);
exports.BrokersController = BrokersController;
//# sourceMappingURL=brokers.controller.js.map