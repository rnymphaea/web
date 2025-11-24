import { Controller, Get, Param, Delete } from '@nestjs/common';
import { PortfolioService } from './portfolio.service';

@Controller('api/portfolios')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get()
  getAllPortfolios() {
    const portfolios = this.portfolioService.getAllPortfolios();
    return {
      success: true,
      data: portfolios
    };
  }

  @Get('broker/:brokerId')
  getPortfolioByBrokerId(@Param('brokerId') brokerId: string) {
    const portfolio = this.portfolioService.getPortfolioByBrokerId(parseInt(brokerId));
    if (!portfolio) {
      return { success: false, error: 'Portfolio not found' };
    }
    return { success: true, data: portfolio };
  }

  @Delete('broker/:brokerId')
  deletePortfolio(@Param('brokerId') brokerId: string) {
    const success = this.portfolioService.deletePortfolio(parseInt(brokerId));
    return { success };
  }
}
