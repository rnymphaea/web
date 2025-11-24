export interface Portfolio {
  id: number;
  brokerId: number;
  brokerName: string;
  stocks: PortfolioStock[];
  totalValue: number;
  cash: number;
  lastUpdated: Date;
}

export interface PortfolioStock {
  symbol: string;
  quantity: number;
  currentPrice: number;
  value: number;
  averageBuyPrice?: number;
}
