export interface Purchase {
  symbol: string;
  quantity: number;
  price: number;
  date: Date;
  type: 'buy' | 'sell';
}

export interface PortfolioStock {
  symbol: string;
  quantity: number;
  purchaseHistory: Purchase[];
}

export interface Portfolio {
  brokerId: number;
  brokerName: string;
  stocks: PortfolioStock[];
  cash: number;
  totalValue: number;
  totalProfit: number;
  purchaseHistory: Purchase[];
}
