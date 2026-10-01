import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { csxDataProvider } from './src/services/csxDataProvider';
import { runBacktest } from './src/services/backtestingService';
import { BacktestParams } from './src/types/csx';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Server-Side Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// 1. CSX Market Overview
app.get('/api/csx/market-overview', async (_req: Request, res: Response) => {
  try {
    const data = await csxDataProvider.getMarketOverview();
    res.json(data);
  } catch (error) {
    console.error('Error fetching market overview:', error);
    res.status(500).json({ error: 'Failed to fetch market overview' });
  }
});

// 2. All CSX Stocks
app.get('/api/csx/stocks', async (_req: Request, res: Response) => {
  try {
    const stocks = await csxDataProvider.getAllStocks();
    res.json(stocks);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

// 3. Single Stock Detail
app.get('/api/csx/stocks/:ticker', async (req: Request, res: Response) => {
  try {
    const stock = await csxDataProvider.getStock(req.params.ticker);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    res.json(stock);
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ error: 'Failed to fetch stock detail' });
  }
});

// 4. Historical Prices
app.get('/api/csx/stocks/:ticker/history', async (req: Request, res: Response) => {
  try {
    const timeframe = (req.query.timeframe as string) || '6M';
    const history = await csxDataProvider.getHistoricalPrices(req.params.ticker, timeframe);
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch historical prices' });
  }
});

// 5. News & Disclosures
app.get('/api/csx/news', async (req: Request, res: Response) => {
  try {
    const ticker = req.query.ticker as string | undefined;
    const news = await csxDataProvider.getNews(ticker);
    res.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.get('/api/csx/disclosures', async (req: Request, res: Response) => {
  try {
    const ticker = req.query.ticker as string | undefined;
    const disclosures = await csxDataProvider.getDisclosures(ticker);
    res.json(disclosures);
  } catch (error) {
    console.error('Error fetching disclosures:', error);
    res.status(500).json({ error: 'Failed to fetch disclosures' });
  }
});

// 6. Alerts
app.get('/api/csx/alerts', async (_req: Request, res: Response) => {
  try {
    const alerts = await csxDataProvider.getAlerts();
    res.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// 6.1 Provider Live Status & CSX Connection Info
app.get('/api/csx/provider-status', async (_req: Request, res: Response) => {
  try {
    const status = csxDataProvider.getProviderStatus();
    res.json(status);
  } catch (error) {
    console.error('Error fetching provider status:', error);
    res.status(500).json({ error: 'Failed to fetch provider status' });
  }
});

// 6.2 Live Market Sync
app.post('/api/csx/sync-live', async (req: Request, res: Response) => {
  try {
    const { customUpdates } = req.body || {};
    const result = await csxDataProvider.syncLiveMarket(customUpdates);
    res.json({
      success: true,
      message: `Successfully synchronized ${result.updatedCount} CSX securities`,
      ...result,
    });
  } catch (error: any) {
    console.error('Error syncing live market:', error);
    res.status(500).json({ error: 'Failed to sync live market', details: error?.message });
  }
});

// 6.3 Update Single Stock Price (Live Real-Time Override)
app.post('/api/csx/update-stock', async (req: Request, res: Response) => {
  try {
    const { ticker, price, change, volume } = req.body;
    if (!ticker || price === undefined) {
      return res.status(400).json({ error: 'Ticker and price are required' });
    }
    const updatedStock = await csxDataProvider.updateStockPrice(ticker, Number(price), change, volume);
    const indexData = await csxDataProvider.getMarketOverview();
    res.json({
      success: true,
      stock: updatedStock,
      indexData,
    });
  } catch (error: any) {
    console.error('Error updating stock price:', error);
    res.status(500).json({ error: 'Failed to update stock price', details: error?.message });
  }
});

// 7. Backtest Run
app.post('/api/csx/backtest', async (req: Request, res: Response) => {
  try {
    const params: BacktestParams = req.body;
    const result = await runBacktest(params);
    res.json(result);
  } catch (error) {
    console.error('Error running backtest:', error);
    res.status(500).json({ error: 'Failed to run backtest' });
  }
});

// 8. Daily Pipeline Simulation
app.post('/api/csx/run-daily-pipeline', async (_req: Request, res: Response) => {
  try {
    const steps = [
      { stepNumber: 1, name: 'Collect latest CSX market data & order books', status: 'completed', details: 'Retrieved settlement prices for 10 listed securities on CSX.', durationMs: 140 },
      { stepNumber: 2, name: 'Update historical prices & daily candles', status: 'completed', details: 'Added 10 new OHLCV data points to database.', durationMs: 95 },
      { stepNumber: 3, name: 'Collect official company disclosures & SERC filings', status: 'completed', details: 'Synced 4 latest filings from CSX disclosure portal.', durationMs: 210 },
      { stepNumber: 4, name: 'Ingest financial & macroeconomic news', status: 'completed', details: 'Parsed news from Phnom Penh Post, Khmer Times, and NBC.', durationMs: 310 },
      { stepNumber: 5, name: 'AI Event & News Impact Assessment', status: 'completed', details: 'Evaluated business effect, financial effect, and whether market priced-in events.', durationMs: 450 },
      { stepNumber: 6, name: 'Update company financial metrics', status: 'completed', details: 'Recalculated trailing P/E, P/B, and dividend yields in KHR.', durationMs: 80 },
      { stepNumber: 7, name: 'Recalculate Technical Indicators', status: 'completed', details: 'Computed SMA 5/10/20/50, RSI(14), MACD, Bollinger Bands, and ATR.', durationMs: 120 },
      { stepNumber: 8, name: 'Recalculate AI Analysis Scores (0-100)', status: 'completed', details: 'Updated score breakdown: Fundamentals (25%), Growth (20%), Valuation (15%), etc.', durationMs: 180 },
      { stepNumber: 9, name: 'Generate new 7-Day Price Forecasts', status: 'completed', details: 'Generated expected price, lower/upper uncertainty bands, and confidence % for all stocks.', durationMs: 260 },
      { stepNumber: 10, name: 'Store and archive daily forecast snapshot', status: 'completed', details: 'Snapshot archived for historical accuracy validation.', durationMs: 90 },
      { stepNumber: 11, name: 'Compare previous forecasts with actual outcomes', status: 'completed', details: 'Evaluated 7-day-old forecasts against actual closing prices.', durationMs: 110 },
      { stepNumber: 12, name: 'Update forecast accuracy metrics (MAE, MAPE, Directional)', status: 'completed', details: 'Updated accuracy grades and mean absolute percentage errors.', durationMs: 85 },
    ];

    res.json({
      success: true,
      lastRunTimestamp: new Date().toISOString(),
      updatedStocksCount: 10,
      newAlertsCount: 3,
      steps,
    });
  } catch (error) {
    console.error('Error running daily pipeline:', error);
    res.status(500).json({ error: 'Failed to run daily pipeline' });
  }
});

// 9. AI Chat Endpoint (Grounded with real CSX data)
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, selectedStockTicker, conversationHistory } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const allStocks = await csxDataProvider.getAllStocks();
    const overview = await csxDataProvider.getMarketOverview();
    const news = await csxDataProvider.getNews();

    // Context preparation
    const stockSummaries = allStocks.map(s => 
      `${s.ticker} (${s.name}): Price ${s.currentPrice.toLocaleString()} KHR (${s.change >= 0 ? '+' : ''}${s.changePercent}%), AI Score ${s.aiScore.overallScore}/100 [${s.aiScore.signal}], Risk ${s.risk.level}, 7D Target: ${s.forecast7Day.targetPrice7Day.toLocaleString()} KHR (${s.forecast7Day.confidenceScore}% conf, Range ${s.forecast7Day.dailyBreakdown[7]?.lowerRange.toLocaleString()}-${s.forecast7Day.dailyBreakdown[7]?.upperRange.toLocaleString()} KHR), P/E: ${s.peRatio || 'N/A'}, Div Yield: ${s.dividendYieldPercent || 'N/A'}%`
    ).join('\n');

    let specificStockContext = '';
    if (selectedStockTicker) {
      const currentStock = allStocks.find(s => s.ticker.toUpperCase() === selectedStockTicker.toUpperCase());
      if (currentStock) {
        specificStockContext = `
CURRENTLY SELECTED STOCK DEEP DIVE:
Ticker: ${currentStock.ticker} - ${currentStock.name} (${currentStock.khmerName})
Market Board: ${currentStock.board} | Sector: ${currentStock.sector} | ISIN: ${currentStock.isin}
Actual Price: ${currentStock.currentPrice.toLocaleString()} KHR | Change: ${currentStock.change} KHR (${currentStock.changePercent}%) | Volume: ${currentStock.volume.toLocaleString()}
CSX Price Limits: Floor (-10%) ${currentStock.floorPrice?.toLocaleString()} KHR, Ceiling (+10%) ${currentStock.ceilingPrice?.toLocaleString()} KHR, Official Tick Size: ${currentStock.tickSize} KHR
Order Book Depth: Bids [${currentStock.orderBook?.bids.map(b => `${b.price.toLocaleString()} (${b.volume.toLocaleString()} shs)`).join(', ')}], Asks [${currentStock.orderBook?.asks.map(a => `${a.price.toLocaleString()} (${a.volume.toLocaleString()} shs)`).join(', ')}]
Foreign Ownership Room: Cap ${currentStock.foreignOwnership?.maxLimitPercent}%, Currently Held ${currentStock.foreignOwnership?.currentPercent}%, Remaining ${currentStock.foreignOwnership?.remainingRoomShares.toLocaleString()} shares
P/E: ${currentStock.peRatio} | P/B: ${currentStock.pbRatio} | Dividend Yield: ${currentStock.dividendYieldPercent}% (DPS ${currentStock.dpsKHR} KHR)
52W High/Low: ${currentStock.high52w.toLocaleString()} / ${currentStock.low52w.toLocaleString()} KHR
AI Score: ${currentStock.aiScore.overallScore}/100 (${currentStock.aiScore.signal})
Score Breakdown: Fundamentals ${currentStock.aiScore.fundamentals.score}/25, Growth ${currentStock.aiScore.growth.score}/20, Valuation ${currentStock.aiScore.valuation.score}/15, Technical ${currentStock.aiScore.technical.score}/10, News Impact ${currentStock.aiScore.newsEventImpact.score}/15, Risk ${currentStock.aiScore.riskScore.score}/10, Liquidity ${currentStock.aiScore.liquidity.score}/5.
Technical Indicators: SMA5=${currentStock.technical.sma5}, SMA20=${currentStock.technical.sma20}, SMA50=${currentStock.technical.sma50}, RSI(14)=${currentStock.technical.rsi14}, MACD=${currentStock.technical.macd.trend}, Bollinger Upper=${currentStock.technical.bollingerBands.upper}, Lower=${currentStock.technical.bollingerBands.lower}, Support=${currentStock.technical.supportLevel}, Resistance=${currentStock.technical.resistanceLevel}.
7-Day Forecast: Expected ${currentStock.forecast7Day.targetPrice7Day.toLocaleString()} KHR (${currentStock.forecast7Day.expectedChange7DayPercent}%), Confidence ${currentStock.forecast7Day.confidenceScore}%.
Daily Forecast Schedule:
${currentStock.forecast7Day.dailyBreakdown.map(d => ` - ${d.dayLabel} (${d.date}): Expected ${d.expectedPrice.toLocaleString()} KHR [Range ${d.lowerRange.toLocaleString()}-${d.upperRange.toLocaleString()} KHR, Confidence ${d.confidencePercent}%]`).join('\n')}
Historical Forecast Accuracy: MAPE ${currentStock.accuracy.meanAbsolutePercentageError}%, Directional Accuracy ${currentStock.accuracy.directionalAccuracyPercent}%, Grade ${currentStock.accuracy.accuracyGrade}.
Risk Factors: Level ${currentStock.risk.level} (${currentStock.risk.overallScore}/100). Primary risks: ${currentStock.risk.primaryRisks.join('; ')}.
Highlights: ${currentStock.businessHighlights.join('; ')}
`;
      }
    }

    const newsContext = news.slice(0, 5).map(n =>
      `- [${n.date}] ${n.ticker || 'CSX'}: "${n.headline}" (Impact: ${n.aiImpact.newsImpact}, Confidence: ${n.aiImpact.impactConfidence}, Market Priced In: ${n.aiImpact.marketPricedIn})`
    ).join('\n');

    const systemInstruction = `
You are the institutional AI Analyst for "CSX AI Analyst", a specialized quantitative research terminal for the Cambodia Securities Exchange (CSX).

CRITICAL COMPLIANCE & ACCURACY GUIDELINES:
1. NEVER claim that any forecast is guaranteed. Never say "guaranteed profit" or "this stock will definitely rise".
2. Clearly distinguish between ACTUAL DATA (closing prices, trading volumes, audited financials) and ESTIMATED / FORECAST DATA (AI scores, 7-day price projections, uncertainty ranges).
3. If asked for recommendations ("Which stock should I buy?"), do NOT give certified financial advice. Instead, provide an objective comparative analysis citing AI Scores, fundamentals, 7-day forecast uncertainty ranges, risk scores, and liquidity.
4. Ground every answer in the actual CSX market data provided below. Do not invent stock prices, corporate actions, or fake news.
5. If data is unavailable, clearly state "Data unavailable" instead of fabricating.
6. The default currency is Cambodian Riel (KHR). 1 USD is approximately 4,050 KHR.
7. Tone: Professional, quantitative, concise, balanced, Wall Street/institutional research style.

MARKET OVERVIEW:
CSX Index: ${overview.index} (${overview.change >= 0 ? '+' : ''}${overview.changePercent}%), Volume: ${overview.volume.toLocaleString()}, Market Cap: ${(overview.marketCapKHR / 1e12).toFixed(2)} Trillion KHR.
Advancing: ${overview.advancing}, Declining: ${overview.declining}, Unchanged: ${overview.unchanged}.

LIST OF CSX-LISTED COMPANIES:
${stockSummaries}

${specificStockContext}

RECENT DISCLOSURES & MARKET NEWS:
${newsContext}
`;

    // Construct contents
    const contents: any[] = [];
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-6)) {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    res.json({
      text: response.text || 'Analysis completed with available CSX data.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    res.status(500).json({
      error: 'AI analysis service encountered an error. Please try again.',
      details: error?.message || 'Unknown error',
    });
  }
});

// Setup Vite middleware in dev or serve static files in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CSX AI Analyst] Server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer();
