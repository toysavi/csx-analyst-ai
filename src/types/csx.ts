export type MarketBoard = 'Main Board' | 'Growth Board';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type SignalType = 'Strong Positive' | 'Positive' | 'Neutral' | 'Negative' | 'Strong Negative';

export type NewsImpactType = 'Positive' | 'Neutral' | 'Negative';

export type NewsConfidence = 'High' | 'Medium' | 'Low';

export type MarketPricedIn = 'Yes' | 'Partially' | 'No';

export interface CSXIndexData {
  index: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  valueKHR: number;
  marketCapKHR: number;
  advancing: number;
  declining: number;
  unchanged: number;
  lastUpdated: string;
  isMarketOpen: boolean;
  tradingSession?: string;
  officialSource?: string;
  tradingMethod?: string; // 'Automated Auction Trading (AAM)' | 'Negotiated Trading (NTM)'
}

export interface HistoricalPricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  valueKHR?: number;
  sma5?: number;
  sma20?: number;
  sma50?: number;
  upperBand?: number;
  lowerBand?: number;
  newsPin?: string;
}

export interface TechnicalIndicators {
  sma5: number;
  sma10: number;
  sma20: number;
  sma50: number;
  ema20: number;
  rsi14: number;
  rsiSignal: 'Oversold' | 'Neutral' | 'Overbought';
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    trend: 'Bullish' | 'Bearish' | 'Neutral';
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    percentB: number;
  };
  atr14: number;
  volumeTrend: 'Surging' | 'Above Average' | 'Normal' | 'Drying Up';
  volatility30d: number;
  supportLevel: number;
  resistanceLevel: number;
  technicalSummary: SignalType;
}

export interface ComponentScore {
  score: number;
  maxScore: number;
  weightPercent: number;
  label: string;
  explanation: string;
  keyMetrics: { name: string; value: string; assessment: 'positive' | 'neutral' | 'negative' }[];
}

export interface AIScoreBreakdown {
  overallScore: number; // 0-100
  signal: SignalType;
  fundamentals: ComponentScore; // 25 max
  growth: ComponentScore; // 20 max
  valuation: ComponentScore; // 15 max
  technical: ComponentScore; // 10 max
  newsEventImpact: ComponentScore; // 15 max
  riskScore: ComponentScore; // 10 max
  liquidity: ComponentScore; // 5 max
  summaryNarrative: string;
  lastUpdated: string;
}

export interface RiskAnalysis {
  level: RiskLevel;
  overallScore: number; // 0 (safest) - 100 (highest risk)
  factors: {
    name: string;
    level: RiskLevel;
    impact: string;
    details: string;
  }[];
  primaryRisks: string[];
  mitigatingFactors: string[];
  riskExplanation: string;
}

export interface DayForecast {
  dayLabel: string; // e.g. "Day 1", "Day 2", ...
  date: string;
  expectedPrice: number;
  lowerRange: number;
  upperRange: number;
  confidencePercent: number;
  isActual?: boolean;
  predictedChangePercent: number;
  keyDrivers: string[];
}

export interface StockForecast {
  ticker: string;
  currentActualPrice: number;
  forecastDate: string;
  targetPrice7Day: number;
  expectedChange7DayPercent: number;
  overallDirection: 'Positive' | 'Neutral' | 'Negative';
  confidenceScore: number; // e.g. 68%
  dailyBreakdown: DayForecast[];
  methodologyNote: string;
  disclaimer: string;
}

export interface FinancialYearData {
  year: number;
  revenueKHR: number;
  grossProfitKHR: number;
  operatingIncomeKHR: number;
  netIncomeKHR: number;
  totalAssetsKHR: number;
  totalLiabilitiesKHR: number;
  totalEquityKHR: number;
  cashAndEquivalentsKHR: number;
  operatingCashFlowKHR: number;
  capexKHR: number;
  epsKHR: number;
  dpsKHR: number;
  peRatio: number;
  pbRatio: number;
  roePercent: number;
  debtToEquity: number;
  dividendYieldPercent: number;
}

export interface NewsItem {
  id: string;
  ticker?: string; // empty if general market
  companyName?: string;
  headline: string;
  khmerHeadline?: string;
  source: string;
  date: string;
  url: string;
  eventType: 'Infrastructure' | 'Financial Report' | 'Dividend' | 'Regulatory' | 'Contract' | 'Market Movement' | 'Corporate Governance';
  summary: string;
  fullContent?: string;
  aiImpact: {
    event: string;
    potentialBusinessEffect: string;
    potentialFinancialEffect: string;
    risk: string;
    newsImpact: NewsImpactType;
    impactConfidence: NewsConfidence;
    marketPricedIn: MarketPricedIn;
    scoreAdjustment: number;
    reasoning: string;
  };
}

export interface CSXDisclosure {
  id: string;
  ticker: string;
  title: string;
  khmerTitle?: string;
  date: string;
  category: 'Quarterly Report' | 'Annual Report' | 'Dividend Distribution' | 'Material Information' | 'Board Resolution' | 'Investor Meeting';
  filingNumber: string;
  source: 'CSX Disclosures' | 'SERC Regulatory Filing' | 'Company IR';
  summary: string;
  aiTakeaway: string;
  verifiedOfficial: boolean;
}

export interface ForecastAccuracyRecord {
  id: string;
  ticker: string;
  forecastDate: string;
  targetDate: string;
  forecastPrice: number;
  actualPrice: number;
  errorKHR: number;
  errorPercent: number;
  directionPredicted: 'Up' | 'Down' | 'Flat';
  directionActual: 'Up' | 'Down' | 'Flat';
  directionAccurate: boolean;
}

export interface StockForecastAccuracy {
  ticker: string;
  evaluationsCount: number;
  meanAbsoluteErrorKHR: number;
  meanAbsolutePercentageError: number; // MAPE %
  directionalAccuracyPercent: number; // e.g. 71.4%
  forecastBias: 'Neutral' | 'Slight Upward Bias' | 'Slight Downward Bias';
  accuracyGrade: 'A' | 'B+' | 'B' | 'C';
  recentRecords: ForecastAccuracyRecord[];
}

export interface CSXStock {
  ticker: string;
  name: string;
  khmerName: string;
  isin: string;
  sector: string;
  board: MarketBoard;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  tradingValueKHR: number;
  marketCapKHR: number;
  peRatio?: number;
  pbRatio?: number;
  epsKHR?: number;
  dividendYieldPercent?: number;
  dpsKHR?: number;
  high52w: number;
  low52w: number;
  sharesOutstanding: number;
  listingDate: string;
  ceilingPrice: number; // +10% daily price limit
  floorPrice: number; // -10% daily price limit
  tickSize: number; // 10, 20, 50 KHR per CSX rule
  orderBook?: {
    bids: { price: number; volume: number }[];
    asks: { price: number; volume: number }[];
  };
  foreignOwnership?: {
    maxLimitPercent: number;
    currentPercent: number;
    remainingRoomShares: number;
  };
  description: string;
  businessHighlights: string[];
  aiScore: AIScoreBreakdown;
  risk: RiskAnalysis;
  forecast7Day: StockForecast;
  technical: TechnicalIndicators;
  financialHistory: FinancialYearData[];
  accuracy: StockForecastAccuracy;
}

export interface BacktestParams {
  ticker: string;
  strategy: 'AI_SCORE_MOMENTUM' | 'TECHNICAL_MEAN_REVERSION' | 'VALUE_DIVIDEND' | 'FORECAST_TREND_FOLLOWING';
  startDate: string;
  endDate: string;
  initialCapitalKHR: number;
}

export interface BacktestTrade {
  entryDate: string;
  exitDate: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  shares: number;
  returnPercent: number;
  profitKHR: number;
  reason: string;
}

export interface BacktestResult {
  params: BacktestParams;
  initialCapitalKHR: number;
  finalCapitalKHR: number;
  totalReturnPercent: number;
  annualizedReturnPercent: number;
  benchmarkReturnPercent: number; // CSX Index over same period
  alphaPercent: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  winRatePercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgGainPercent: number;
  avgLossPercent: number;
  profitFactor: number;
  trades: BacktestTrade[];
  equityCurve: { date: string; portfolioValueKHR: number; benchmarkValueKHR: number }[];
  summary: string;
}

export interface MarketAlert {
  id: string;
  ticker?: string;
  type: 'PRICE_MOVE' | 'VOLUME_SURGE' | 'DISCLOSURE' | 'SCORE_CHANGE' | 'FORECAST_REVISION' | 'RISK_UPDATE';
  severity: 'info' | 'warning' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface DailyPipelineStep {
  stepNumber: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  details: string;
  durationMs?: number;
}

export interface DailyPipelineStatus {
  lastRunTimestamp: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  steps: DailyPipelineStep[];
  updatedStocksCount: number;
  newAlertsCount: number;
}
