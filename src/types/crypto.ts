export interface CryptoSearchResult {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
  image?: string;
  _type?: 'crypto';
}

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  volume: number;
  circulatingSupply: number;
  totalSupply?: number;
  allTimeHigh?: number;
  allTimeLow?: number;
  image?: string;
  description?: string;
}

export interface CryptoCompetitor {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap: number;
}
