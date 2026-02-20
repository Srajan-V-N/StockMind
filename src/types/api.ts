export interface APIResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface MarketSummary {
  indices: IndexData[];
  futures: FutureData[];
  mostActive: AssetData[];
  gainers: AssetData[];
  losers: AssetData[];
}

export interface IndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface FutureData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface AssetData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  type: 'stock' | 'crypto' | 'index' | 'future';
  addedAt: Date;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  type: 'stock' | 'crypto';
  targetPrice: number;
  condition: 'above' | 'below';
  active: boolean;
  triggered?: boolean;
  currentPrice?: number;
  createdAt: Date;
}

export interface BudgetSuggestion {
  symbol: string;
  name: string;
  price: number;
  reason: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type MarketType = 'global' | 'us' | 'europe' | 'india' | 'currencies' | 'crypto' | 'futures';
