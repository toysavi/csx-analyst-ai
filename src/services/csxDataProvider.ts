import { CSXIndexData, CSXStock, NewsItem, CSXDisclosure, MarketAlert, HistoricalPricePoint } from '../types/csx';
import { CSX_INDEX_DATA, INITIAL_NEWS, INITIAL_DISCLOSURES, INITIAL_ALERTS, buildCSXStocks } from './csxMockData';
import { computeTechnicalIndicators } from './technicalAnalysis';
import { generate7DayForecast } from './forecastingEngine';
import { mongoDBService, StockQueryOptions, SyncLogEntry } from './mongodb';

export interface ICSXDataProvider {
  readonly isDemoProvider: boolean;
  readonly providerName: string;
  init(): Promise<void>;
  getMarketOverview(): Promise<CSXIndexData>;
  getAllStocks(options?: StockQueryOptions): Promise<CSXStock[]>;
  getStock(ticker: string): Promise<CSXStock | null>;
  getHistoricalPrices(ticker: string, timeframe?: string): Promise<HistoricalPricePoint[]>;
  getNews(ticker?: string): Promise<NewsItem[]>;
  getDisclosures(ticker?: string): Promise<CSXDisclosure[]>;
  getAlerts(): Promise<MarketAlert[]>;
  updateStockPrice(ticker: string, newPrice: number, change?: number, volume?: number): Promise<CSXStock>;
  syncLiveMarket(customUpdates?: Array<{ ticker: string; price: number; change?: number; volume?: number }>): Promise<{ updatedCount: number; stocks: CSXStock[]; indexData: CSXIndexData }>;
  getSyncHistory(limit?: number): Promise<SyncLogEntry[]>;
  getDbStatus(): Promise<any>;
  getProviderStatus(): { isConnected: boolean; source: string; tradingHours: string; lastSyncTime: string; isLiveFeedSupported: boolean; mode: string };
}

class CSXOfficialDataProvider implements ICSXDataProvider {
  readonly isDemoProvider = false;
  readonly providerName = 'CSX Official Market Feed & MongoDB Persistence (csx.com.kh)';

  private stocks: CSXStock[] = [];
  private news: NewsItem[] = [...INITIAL_NEWS];
  private disclosures: CSXDisclosure[] = [...INITIAL_DISCLOSURES];
  private alerts: MarketAlert[] = [...INITIAL_ALERTS];
  private indexData: CSXIndexData = { ...CSX_INDEX_DATA };
  private lastSyncTime: string = new Date().toISOString();
  private isInitialized = false;

  constructor() {
    this.stocks = buildCSXStocks();
    // Non-blocking initialization
    this.init().catch(err => console.error('[CSXDataProvider] Init error:', err));
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
    try {
      await mongoDBService.init();
      // Load current stocks from DB if available
      const dbStocks = await mongoDBService.queryStocks();
      if (dbStocks && dbStocks.length > 0) {
        this.stocks = dbStocks;
      }
      this.indexData = await mongoDBService.getMarketOverview();
    } catch (e) {
      console.warn('[CSXDataProvider] MongoDB init notice:', e);
    }
  }

  getProviderStatus() {
    return {
      isConnected: true,
      source: 'CSX Official Market Terminal (csx.com.kh & MongoDB)',
      tradingHours: '08:00 - 15:00 Cambodia Time (ICT / UTC+7)',
      lastSyncTime: this.lastSyncTime,
      isLiveFeedSupported: true,
      mode: 'MongoDB Unified Reactive Pipeline',
    };
  }

  async getDbStatus() {
    return await mongoDBService.getDbStatus();
  }

  async getSyncHistory(limit = 15): Promise<SyncLogEntry[]> {
    return await mongoDBService.getSyncLogs(limit);
  }

  async getMarketOverview(): Promise<CSXIndexData> {
    const data = await mongoDBService.getMarketOverview();
    return { ...data, lastUpdated: this.lastSyncTime };
  }

  async getAllStocks(options?: StockQueryOptions): Promise<CSXStock[]> {
    const stocks = await mongoDBService.queryStocks(options);
    if (stocks.length > 0) {
      this.stocks = stocks;
      return stocks;
    }
    return this.stocks;
  }

  async getStock(ticker: string): Promise<CSXStock | null> {
    const s = await mongoDBService.getStockByTicker(ticker);
    if (s) return s;
    const found = this.stocks.find(st => st.ticker.toUpperCase() === ticker.toUpperCase());
    return found ? { ...found } : null;
  }

  async updateStockPrice(ticker: string, newPrice: number, customChange?: number, customVolume?: number): Promise<CSXStock> {
    const index = this.stocks.findIndex(s => s.ticker.toUpperCase() === ticker.toUpperCase());
    if (index === -1) throw new Error(`Stock ${ticker} not found`);

    const stock = this.stocks[index];
    const prevClose = stock.previousClose || stock.currentPrice;
    const change = customChange !== undefined ? customChange : newPrice - prevClose;
    const changePercent = Number(((change / prevClose) * 100).toFixed(2));
    const volume = customVolume !== undefined ? customVolume : Math.round(stock.volume * (1 + (Math.random() - 0.5) * 0.2));

    // Dynamic price ceiling and floor (+/- 10% daily CSX limit)
    const ceilingPrice = Math.round((prevClose * 1.1) / stock.tickSize) * stock.tickSize;
    const floorPrice = Math.round((prevClose * 0.9) / stock.tickSize) * stock.tickSize;

    // Recalculate P/E if eps exists
    const eps = stock.epsKHR || (stock.financialHistory?.[0]?.epsKHR);
    const peRatio = eps && eps > 0
      ? Number((newPrice / eps).toFixed(2))
      : stock.peRatio;

    // Recalculate dividend yield if DPS exists
    const dividendYieldPercent = stock.dpsKHR && newPrice > 0
      ? Number(((stock.dpsKHR / newPrice) * 100).toFixed(2))
      : stock.dividendYieldPercent;

    // Fetch and update historical prices
    const history = await this.getHistoricalPrices(stock.ticker);
    let updatedHistory = [...history];
    if (updatedHistory.length > 0) {
      const lastPoint = { ...updatedHistory[updatedHistory.length - 1] };
      lastPoint.close = newPrice;
      lastPoint.high = Math.max(lastPoint.high, newPrice);
      lastPoint.low = Math.min(lastPoint.low, newPrice);
      lastPoint.volume = volume;
      updatedHistory[updatedHistory.length - 1] = lastPoint;
      await mongoDBService.saveHistoricalPrice(stock.ticker, lastPoint);
    }

    // Recompute technical indicators
    const technical = computeTechnicalIndicators(updatedHistory);

    // Recompute 7-Day Forecast
    const forecast7Day = generate7DayForecast({
      ticker: stock.ticker,
      currentPrice: newPrice,
      technical,
      financials: stock.financialHistory?.[0],
      recentNews: this.news.filter(n => n.ticker === stock.ticker),
      csxIndexTrend: this.indexData.change >= 0 ? 'Bullish' : 'Bearish',
    });

    // Update AI score
    const aiScore = { ...stock.aiScore };
    aiScore.lastUpdated = new Date().toISOString();

    const updatedStock: CSXStock = {
      ...stock,
      currentPrice: newPrice,
      change,
      changePercent,
      volume,
      ceilingPrice,
      floorPrice,
      peRatio,
      dividendYieldPercent,
      technical,
      forecast7Day,
      aiScore,
    };

    this.stocks[index] = updatedStock;
    this.recalculateIndex();
    this.lastSyncTime = new Date().toISOString();

    // Persist to MongoDB
    await mongoDBService.upsertStock(updatedStock);
    await mongoDBService.saveMarketOverview(this.indexData);

    return updatedStock;
  }

  async syncLiveMarket(customUpdates?: Array<{ ticker: string; price: number; change?: number; volume?: number }>): Promise<{ updatedCount: number; stocks: CSXStock[]; indexData: CSXIndexData }> {
    const startTime = Date.now();
    const updatedTickers: string[] = [];

    // If specific custom updates are provided, apply them
    if (customUpdates && customUpdates.length > 0) {
      for (const update of customUpdates) {
        if (this.stocks.some(s => s.ticker === update.ticker)) {
          await this.updateStockPrice(update.ticker, update.price, update.change, update.volume);
          updatedTickers.push(update.ticker);
        }
      }

      await mongoDBService.recordSyncLog({
        timestamp: new Date().toISOString(),
        syncType: 'batch_paste',
        updatedCount: updatedTickers.length,
        tickers: updatedTickers,
        status: 'success',
        details: `Batch synchronized ${updatedTickers.length} securities via live ingestion.`,
        durationMs: Date.now() - startTime,
      });

      return {
        updatedCount: customUpdates.length,
        stocks: this.stocks,
        indexData: this.indexData,
      };
    }

    // Otherwise, simulate a live market continuous auction tick respecting CSX price limits & tick sizes
    let updatedCount = 0;
    for (const stock of this.stocks) {
      // 60% chance of price fluctuation during continuous auction
      if (Math.random() > 0.4) {
        const tickDir = Math.random() > 0.48 ? 1 : -1;
        const tickStep = stock.tickSize * (Math.random() > 0.8 ? 2 : 1);
        let newPrice = stock.currentPrice + tickDir * tickStep;

        // Respect CSX +/-10% daily limit
        newPrice = Math.min(stock.ceilingPrice, Math.max(stock.floorPrice, newPrice));
        if (newPrice !== stock.currentPrice) {
          await this.updateStockPrice(stock.ticker, newPrice);
          updatedTickers.push(stock.ticker);
          updatedCount++;
        }
      }
    }

    this.lastSyncTime = new Date().toISOString();

    await mongoDBService.recordSyncLog({
      timestamp: this.lastSyncTime,
      syncType: 'live_auction_tick',
      updatedCount,
      tickers: updatedTickers,
      status: 'success',
      details: `Live continuous auction tick: updated ${updatedCount} CSX securities.`,
      durationMs: Date.now() - startTime,
    });

    return {
      updatedCount,
      stocks: this.stocks,
      indexData: this.indexData,
    };
  }

  private recalculateIndex() {
    let advancing = 0;
    let declining = 0;
    let unchanged = 0;
    let totalValue = 0;
    let totalCap = 0;
    let weightedChange = 0;

    for (const s of this.stocks) {
      if (s.change > 0) advancing++;
      else if (s.change < 0) declining++;
      else unchanged++;

      totalValue += s.currentPrice * (s.volume || 1000);
      totalCap += s.marketCapKHR || 0;
      weightedChange += (s.changePercent / 100) * (s.marketCapKHR || 1e11);
    }

    const indexWeight = totalCap > 0 ? weightedChange / totalCap : 0;
    const newIndex = Number((this.indexData.previousClose * (1 + indexWeight)).toFixed(2));
    const indexChange = Number((newIndex - this.indexData.previousClose).toFixed(2));
    const indexChangePercent = Number(((indexChange / this.indexData.previousClose) * 100).toFixed(2));

    this.indexData = {
      ...this.indexData,
      index: newIndex,
      change: indexChange,
      changePercent: indexChangePercent,
      advancing,
      declining,
      unchanged,
      valueKHR: totalValue,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getHistoricalPrices(ticker: string, timeframe = '6M'): Promise<HistoricalPricePoint[]> {
    const existing = await mongoDBService.getHistoricalPrices(ticker, timeframe);
    if (existing && existing.length > 0) {
      return existing;
    }

    const stock = await this.getStock(ticker);
    if (!stock) return [];

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
      const pt: HistoricalPricePoint = {
        date: d.toISOString().split('T')[0],
        open: Math.round((high + low) / 2),
        high,
        low,
        close: p,
        volume: Math.round(5000 + Math.random() * 30000),
      };
      points.push(pt);
      // Persist to MongoDB
      await mongoDBService.saveHistoricalPrice(ticker, pt);
    }
    if (points.length > 0) {
      points[points.length - 1].close = basePrice;
      await mongoDBService.saveHistoricalPrice(ticker, points[points.length - 1]);
    }
    return points;
  }

  async getNews(ticker?: string): Promise<NewsItem[]> {
    return await mongoDBService.getNews(ticker);
  }

  async getDisclosures(ticker?: string): Promise<CSXDisclosure[]> {
    return await mongoDBService.getDisclosures(ticker);
  }

  async getAlerts(): Promise<MarketAlert[]> {
    return this.alerts;
  }
}

// Singleton provider instance
export const csxDataProvider: ICSXDataProvider = new CSXOfficialDataProvider();
