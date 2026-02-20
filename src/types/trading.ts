export interface Holding {
  symbol: string;
  type: 'stock' | 'crypto';
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalCost: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

export interface Transaction {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  timestamp: string;
}

export interface Portfolio {
  balance: number;
  baseCurrency: string;
  holdings: Holding[];
  transactions: Transaction[];
  startingBalance: number;
  createdAt: string;
}

export interface TradeFormData {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  action: 'buy' | 'sell';
  quantity: number;
  price: number;
}
