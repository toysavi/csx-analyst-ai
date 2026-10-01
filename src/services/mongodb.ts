import { MongoClient, Db, Collection } from 'mongodb';
import { CSXStock, CSXIndexData, NewsItem, CSXDisclosure, HistoricalPricePoint } from '../types/csx';
import { CSX_INDEX_DATA, INITIAL_NEWS, INITIAL_DISCLOSURES, buildCSXStocks } from './csxMockData';

export interface SyncLogEntry {
  id?: string;
  timestamp: string;
  syncType: 'manual_quote' | 'batch_paste' | 'live_auction_tick' | 'pipeline' | 'api_seed';
  updatedCount: number;
  tickers: string[];
  status: 'success' | 'warning' | 'error';
  details?: string;
  durationMs: number;
}

export interface StockQueryOptions {
  board?: string;
  sector?: string;
  minScore?: number;
  search?: string;
  sortBy?: 'currentPrice' | 'changePercent' | 'marketCapKHR' | 'overallScore' | 'ticker';
  order?: 'asc' | 'desc';
  limit?: number;
}

class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected = false;
  private connectionAttempted = false;
  private lastSyncTime: string = new Date().toISOString();

  // In-memory fallback stores
  private memStocks: CSXStock[] = [];
  private memHistory: Record<string, HistoricalPricePoint[]> = {};
  private memIndex: CSXIndexData = { ...CSX_INDEX_DATA };
  private memNews: NewsItem[] = [...INITIAL_NEWS];
  private memDisclosures: CSXDisclosure[] = [...INITIAL_DISCLOSURES];
  private memSyncLogs: SyncLogEntry[] = [];

  constructor() {
    this.memStocks = buildCSXStocks();
  }

  public async init(): Promise<boolean> {
    if (this.connectionAttempted) return this.isConnected;
    this.connectionAttempted = true;

    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/csx_analyst';
    const dbName = process.env.MONGODB_DB_NAME || 'csx_analyst';

    try {
      console.log(`[MongoDB] Connecting to ${uri.replace(/\/\/.*@/, '//***:***@')}...`);
      this.client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 4000,
      });

      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;

      console.log(`[MongoDB] Connected successfully to database: "${dbName}"`);
      await this.setupIndexes();
      await this.ensureInitialSeed();
      return true;
    } catch (err: any) {
      console.warn(`[MongoDB] Connection note: Unable to connect (${err.message}). Using resilient In-Memory store.`);
      this.isConnected = false;
      return false;
    }
  }

  private async setupIndexes() {
    if (!this.db) return;
    try {
      await Promise.all([
        this.db.collection('stocks').createIndex({ ticker: 1 }, { unique: true }),
        this.db.collection('historical_prices').createIndex({ ticker: 1, date: -1 }),
        this.db.collection('news').createIndex({ id: 1 }, { unique: true }),
        this.db.collection('disclosures').createIndex({ id: 1 }, { unique: true }),
        this.db.collection('sync_logs').createIndex({ timestamp: -1 }),
      ]);
      console.log('[MongoDB] Verified indexes on collections (stocks, historical_prices, news, disclosures, sync_logs)');
    } catch (e: any) {
      console.warn('[MongoDB] Index setup warning:', e.message);
    }
  }

  private async ensureInitialSeed() {
    if (!this.db) return;
    try {
      const stockCount = await this.db.collection('stocks').countDocuments();
      if (stockCount === 0) {
        console.log('[MongoDB] Empty database detected. Seeding 10 CSX listed equities...');
        const initialStocks = buildCSXStocks();
        await this.db.collection('stocks').insertMany(initialStocks as any[]);

        // Seed initial market overview
        await this.db.collection('market_overview').updateOne(
          { id: 'CSX_INDEX' },
          { $set: { id: 'CSX_INDEX', ...CSX_INDEX_DATA } },
          { upsert: true }
        );

        // Seed initial news & disclosures
        if (INITIAL_NEWS.length > 0) {
          await this.db.collection('news').insertMany(INITIAL_NEWS as any[]);
        }
        if (INITIAL_DISCLOSURES.length > 0) {
          await this.db.collection('disclosures').insertMany(INITIAL_DISCLOSURES as any[]);
        }

        // Record seed sync log
        await this.recordSyncLog({
          timestamp: new Date().toISOString(),
          syncType: 'api_seed',
          updatedCount: initialStocks.length,
          tickers: initialStocks.map(s => s.ticker),
          status: 'success',
          details: 'Initial database seeding with 10 CSX equities, disclosures, and market overview.',
          durationMs: 45,
        });

        console.log('[MongoDB] Initial database seed completed successfully!');
      }
    } catch (e: any) {
      console.error('[MongoDB] Seeding error:', e);
    }
  }

  // --- QUERY METHODS (EASY TO QUERY) ---

  public async queryStocks(options: StockQueryOptions = {}): Promise<CSXStock[]> {
    if (this.isConnected && this.db) {
      try {
        const filter: any = {};
        if (options.board) {
          filter.board = { $regex: options.board, $options: 'i' };
        }
        if (options.sector) {
          filter.sector = { $regex: options.sector, $options: 'i' };
        }
        if (options.minScore !== undefined) {
          filter['aiScore.overallScore'] = { $gte: Number(options.minScore) };
        }
        if (options.search) {
          const s = options.search.trim();
          filter.$or = [
            { ticker: { $regex: s, $options: 'i' } },
            { name: { $regex: s, $options: 'i' } },
            { khmerName: { $regex: s, $options: 'i' } },
          ];
        }

        let sort: any = { ticker: 1 };
        if (options.sortBy) {
          const direction = options.order === 'desc' ? -1 : 1;
          if (options.sortBy === 'overallScore') {
            sort = { 'aiScore.overallScore': direction };
          } else {
            sort = { [options.sortBy]: direction };
          }
        }

        let cursor = this.db.collection<CSXStock>('stocks').find(filter).sort(sort);
        if (options.limit) {
          cursor = cursor.limit(options.limit);
        }
        const results = await cursor.toArray();
        if (results.length > 0) {
          return results.map(r => {
            const { _id, ...stock } = r as any;
            return stock as CSXStock;
          });
        }
      } catch (err) {
        console.error('[MongoDB] Query stocks error, falling back to memory:', err);
      }
    }

    // Memory Fallback Querying
    let list = [...this.memStocks];
    if (options.board) {
      list = list.filter(s => s.board.toLowerCase().includes(options.board!.toLowerCase()));
    }
    if (options.sector) {
      list = list.filter(s => s.sector.toLowerCase().includes(options.sector!.toLowerCase()));
    }
    if (options.minScore !== undefined) {
      list = list.filter(s => s.aiScore.overallScore >= Number(options.minScore));
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      list = list.filter(s =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.khmerName.toLowerCase().includes(q)
      );
    }
    if (options.sortBy) {
      list.sort((a, b) => {
        let valA: any = a[options.sortBy as keyof CSXStock];
        let valB: any = b[options.sortBy as keyof CSXStock];
        if (options.sortBy === 'overallScore') {
          valA = a.aiScore.overallScore;
          valB = b.aiScore.overallScore;
        }
        if (valA < valB) return options.order === 'desc' ? 1 : -1;
        if (valA > valB) return options.order === 'desc' ? -1 : 1;
        return 0;
      });
    }
    if (options.limit) {
      list = list.slice(0, options.limit);
    }
    return list;
  }

  public async getStockByTicker(ticker: string): Promise<CSXStock | null> {
    const upper = ticker.toUpperCase();
    if (this.isConnected && this.db) {
      try {
        const found = await this.db.collection<CSXStock>('stocks').findOne({ ticker: upper });
        if (found) {
          const { _id, ...stock } = found as any;
          return stock as CSXStock;
        }
      } catch (e) {
        console.error('[MongoDB] Get stock error:', e);
      }
    }
    const mem = this.memStocks.find(s => s.ticker.toUpperCase() === upper);
    return mem ? { ...mem } : null;
  }

  public async upsertStock(stock: CSXStock): Promise<void> {
    this.lastSyncTime = new Date().toISOString();

    // Memory update
    const idx = this.memStocks.findIndex(s => s.ticker.toUpperCase() === stock.ticker.toUpperCase());
    if (idx >= 0) {
      this.memStocks[idx] = { ...stock };
    } else {
      this.memStocks.push({ ...stock });
    }

    if (this.isConnected && this.db) {
      try {
        await this.db.collection('stocks').updateOne(
          { ticker: stock.ticker.toUpperCase() },
          { $set: stock },
          { upsert: true }
        );
      } catch (e) {
        console.error('[MongoDB] Upsert stock error:', e);
      }
    }
  }

  public async saveHistoricalPrice(ticker: string, point: HistoricalPricePoint): Promise<void> {
    const upper = ticker.toUpperCase();
    if (!this.memHistory[upper]) {
      this.memHistory[upper] = [];
    }
    const hIdx = this.memHistory[upper].findIndex(p => p.date === point.date);
    if (hIdx >= 0) {
      this.memHistory[upper][hIdx] = point;
    } else {
      this.memHistory[upper].push(point);
    }

    if (this.isConnected && this.db) {
      try {
        await this.db.collection('historical_prices').updateOne(
          { ticker: upper, date: point.date },
          { $set: { ticker: upper, ...point, updatedAt: new Date().toISOString() } },
          { upsert: true }
        );
      } catch (e) {
        console.error('[MongoDB] Historical price save error:', e);
      }
    }
  }

  public async getHistoricalPrices(ticker: string, timeframe = '6M'): Promise<HistoricalPricePoint[]> {
    const upper = ticker.toUpperCase();
    if (this.isConnected && this.db) {
      try {
        const records = await this.db
          .collection('historical_prices')
          .find({ ticker: upper })
          .sort({ date: 1 })
          .toArray();

        if (records && records.length > 0) {
          return records.map(r => ({
            date: r.date,
            open: r.open,
            high: r.high,
            low: r.low,
            close: r.close,
            volume: r.volume,
          }));
        }
      } catch (e) {
        console.error('[MongoDB] Get historical prices error:', e);
      }
    }
    return this.memHistory[upper] || [];
  }

  public async getMarketOverview(): Promise<CSXIndexData> {
    if (this.isConnected && this.db) {
      try {
        const found = await this.db.collection('market_overview').findOne({ id: 'CSX_INDEX' });
        if (found) {
          const { _id, id, ...data } = found as any;
          return { ...data, lastUpdated: this.lastSyncTime };
        }
      } catch (e) {
        console.error('[MongoDB] Get market overview error:', e);
      }
    }
    return { ...this.memIndex, lastUpdated: this.lastSyncTime };
  }

  public async saveMarketOverview(indexData: CSXIndexData): Promise<void> {
    this.memIndex = { ...indexData };
    this.lastSyncTime = new Date().toISOString();

    if (this.isConnected && this.db) {
      try {
        await this.db.collection('market_overview').updateOne(
          { id: 'CSX_INDEX' },
          { $set: { id: 'CSX_INDEX', ...indexData, lastUpdated: this.lastSyncTime } },
          { upsert: true }
        );
      } catch (e) {
        console.error('[MongoDB] Save market overview error:', e);
      }
    }
  }

  public async getNews(ticker?: string): Promise<NewsItem[]> {
    if (this.isConnected && this.db) {
      try {
        const filter = ticker ? { ticker: ticker.toUpperCase() } : {};
        const news = await this.db.collection<NewsItem>('news').find(filter).sort({ date: -1 }).toArray();
        if (news.length > 0) {
          return news.map(n => {
            const { _id, ...item } = n as any;
            return item as NewsItem;
          });
        }
      } catch (e) {
        console.error('[MongoDB] Get news error:', e);
      }
    }
    if (!ticker) return this.memNews;
    return this.memNews.filter(n => !n.ticker || n.ticker.toUpperCase() === ticker.toUpperCase());
  }

  public async getDisclosures(ticker?: string): Promise<CSXDisclosure[]> {
    if (this.isConnected && this.db) {
      try {
        const filter = ticker ? { ticker: ticker.toUpperCase() } : {};
        const disc = await this.db.collection<CSXDisclosure>('disclosures').find(filter).sort({ date: -1 }).toArray();
        if (disc.length > 0) {
          return disc.map(d => {
            const { _id, ...item } = d as any;
            return item as CSXDisclosure;
          });
        }
      } catch (e) {
        console.error('[MongoDB] Get disclosures error:', e);
      }
    }
    if (!ticker) return this.memDisclosures;
    return this.memDisclosures.filter(d => d.ticker.toUpperCase() === ticker.toUpperCase());
  }

  public async recordSyncLog(entry: Omit<SyncLogEntry, 'id'>): Promise<SyncLogEntry> {
    const log: SyncLogEntry = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...entry,
    };

    this.memSyncLogs.unshift(log);
    if (this.memSyncLogs.length > 50) this.memSyncLogs.pop();

    if (this.isConnected && this.db) {
      try {
        await this.db.collection('sync_logs').insertOne({ ...log } as any);
      } catch (e) {
        console.error('[MongoDB] Record sync log error:', e);
      }
    }
    return log;
  }

  public async getSyncLogs(limit = 15): Promise<SyncLogEntry[]> {
    if (this.isConnected && this.db) {
      try {
        const logs = await this.db
          .collection<SyncLogEntry>('sync_logs')
          .find({})
          .sort({ timestamp: -1 })
          .limit(limit)
          .toArray();

        if (logs.length > 0) {
          return logs.map(l => {
            const { _id, ...item } = l as any;
            return item as SyncLogEntry;
          });
        }
      } catch (e) {
        console.error('[MongoDB] Get sync logs error:', e);
      }
    }
    return this.memSyncLogs.slice(0, limit);
  }

  public async getDbStatus() {
    let collections = {
      stocks: this.memStocks.length,
      historicalPrices: Object.values(this.memHistory).reduce((acc, cur) => acc + cur.length, 0),
      news: this.memNews.length,
      disclosures: this.memDisclosures.length,
      syncLogs: this.memSyncLogs.length,
    };

    if (this.isConnected && this.db) {
      try {
        const [stocksCount, histCount, newsCount, discCount, syncCount] = await Promise.all([
          this.db.collection('stocks').countDocuments(),
          this.db.collection('historical_prices').countDocuments(),
          this.db.collection('news').countDocuments(),
          this.db.collection('disclosures').countDocuments(),
          this.db.collection('sync_logs').countDocuments(),
        ]);
        collections = {
          stocks: stocksCount,
          historicalPrices: histCount,
          news: newsCount,
          disclosures: discCount,
          syncLogs: syncCount,
        };
      } catch (e) {
        console.error('[MongoDB] Error counting documents:', e);
      }
    }

    return {
      connected: this.isConnected,
      mode: this.isConnected ? 'MongoDB Active' : 'In-Memory Fallback',
      database: this.isConnected ? (this.db?.databaseName || 'csx_analyst') : 'in-memory',
      uri: this.isConnected ? (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/csx_analyst').replace(/\/\/.*@/, '//***:***@') : 'N/A',
      collections,
      lastSyncTime: this.lastSyncTime,
    };
  }
}

export const mongoDBService = new MongoDBService();
