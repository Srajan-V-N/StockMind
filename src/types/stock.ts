export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  country: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  _type?: 'stock';
  logo?: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  preMarket?: number;
  previousClose: number;
  dayLow: number;
  dayHigh: number;
  yearLow: number;
  yearHigh: number;
  marketCap: number;
  volume: number;
  avgVolume: number;
  pe?: number;
  eps?: number;
  dividend?: number;
  dividendYield?: number;
  exchange: string;
  currency: string;
  description?: string;
  logo?: string;
}

export interface Competitor {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  logo?: string;
}

export interface SectorCompetitors {
  sectorName: string;
  competitors: Competitor[];
}

export interface CompetitorsData {
  peerCompetitors: SectorCompetitors[];
  topCompetitors: (Competitor & { chartData?: any[] })[];
}
