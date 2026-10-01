import { CSXIndexData, CSXStock, NewsItem, CSXDisclosure, MarketAlert, HistoricalPricePoint } from '../types/csx';
import { CSX_INDEX_DATA, INITIAL_NEWS, INITIAL_DISCLOSURES, INITIAL_ALERTS, buildCSXStocks } from './csxMockData';

export interface ICSXDataProvider {
  readonly isDemoProvider: boolean;
  readonly providerName: string;
  getMarketOverview(): Promise<CSXIndexData>;
  getAllStocks(): Promise<CSXStock[]>;
  getStock(ticker: string): Promise<CSXStock | null>;
  getHistoricalPrices(ticker: string, timeframe?: string): Promise<HistoricalPricePoint[]>;
  getNews(ticker?: string): Promise<NewsItem[]>;
  getDisclosures(ticker?: string): Promise<CSXDisclosure[]>;
  getAlerts(): Promise<MarketAlert[]>;
}

class CSXDemoDataProvider implements ICSXDataProvider {
  readonly isDemoProvider = true;
  readonly providerName = 'CSX Synthesized Market Feed (Demo Grounded)';

  private stocks: CSXStock[] = [];
  private news: NewsItem[] = [...INITIAL_NEWS];
  private disclosures: CSXDisclosure[] = [...INITIAL_DISCLOSURES];
  private alerts: MarketAlert[] = [...INITIAL_ALERTS];
  private indexData: CSXIndexData = { ...CSX_INDEX_DATA };

  constructor() {
    this.stocks = buildCSXStocks();
  }

  async getMarketOverview(): Promise<CSXIndexData> {
    return { ...this.indexData, lastUpdated: new Date().toISOString() };
  }

  async getAllStocks(): Promise<CSXStock[]> {
    return this.stocks;
  }

  async getStock(ticker: string): Promise<CSXStock | null> {
    const s = this.stocks.find(st => st.ticker.toUpperCase() === ticker.toUpperCase());
    return s ? { ...s } : null;
  }

  async getHistoricalPrices(ticker: string, timeframe = '6M'): Promise<HistoricalPricePoint[]> {
    const stock = await this.getStock(ticker);
    if (!stock) return [];
    
    // We can filter based on timeframe (1D, 1W, 1M, 3M, 6M, 1Y, 3Y)
    const all = buildCSXStocks().find(s => s.ticker === ticker)?.technical;
    // Generate synthetic history for that ticker if not directly in stock
    const basePrice = stock.currentPrice;
    let days = 180;
    if (timeframe === '1D') days = 1;
    else if (timeframe === '1W') days = 7;
    else if (timeframe === '1M') days = 30;
    else if (timeframe === '3M') days = 90;
    else if (timeframe === '6M') days = 180;
    else if (timeframe === '1Y') days = 365;
    else if (timeframe === '3Y') days = 1000;

    const points: HistoricalPricePoint[] = [];
    const now = new Date();
    let p = basePrice * (1 - days * 0.0003);
    for (let i = days; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const noise = (Math.random() - 0.48) * 0.015;
      p = Math.max(100, Math.round(p * (1 + noise) / 10) * 10);
      const high = Math.round(p * 1.01);
      const low = Math.round(p * 0.99);
      points.push({
        date: d.toISOString().split('T')[0],
        open: Math.round((high + low) / 2),
        high,
        low,
        close: p,
        volume: Math.round(5000 + Math.random() * 30000),
      });
    }
    if (points.length > 0) {
      points[points.length - 1].close = basePrice;
    }
    return points;
  }

  async getNews(ticker?: string): Promise<NewsItem[]> {
    if (!ticker) return this.news;
    return this.news.filter(n => !n.ticker || n.ticker.toUpperCase() === ticker.toUpperCase());
  }

  async getDisclosures(ticker?: string): Promise<CSXDisclosure[]> {
    if (!ticker) return this.disclosures;
    return this.disclosures.filter(d => d.ticker.toUpperCase() === ticker.toUpperCase());
  }

  async getAlerts(): Promise<MarketAlert[]> {
    return this.alerts;
  }
}

// Singleton provider instance
export const csxDataProvider: ICSXDataProvider = new CSXDemoDataProvider();
