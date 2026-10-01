import { DayForecast, StockForecast, TechnicalIndicators, NewsItem, FinancialYearData } from '../types/csx';

export interface ForecastInput {
  ticker: string;
  currentPrice: number;
  technical: TechnicalIndicators;
  financials?: FinancialYearData;
  recentNews?: NewsItem[];
  csxIndexTrend?: 'Bullish' | 'Neutral' | 'Bearish';
  dateStr?: string;
}

export function generate7DayForecast(input: ForecastInput): StockForecast {
  const { ticker, currentPrice, technical, financials, recentNews, csxIndexTrend = 'Neutral', dateStr } = input;
  const baseDate = dateStr ? new Date(dateStr) : new Date();

  // 1. Technical momentum factor (-2.5% to +2.5%)
  let techFactor = 0;
  if (technical.rsi14 < 35) techFactor += 0.012; // oversold bounce potential
  else if (technical.rsi14 > 70) techFactor -= 0.010; // overbought consolidation
  else if (technical.rsi14 > 50) techFactor += 0.006;

  if (technical.macd.trend === 'Bullish') techFactor += 0.008;
  else if (technical.macd.trend === 'Bearish') techFactor -= 0.008;

  if (currentPrice > technical.sma20) techFactor += 0.005;
  else techFactor -= 0.005;

  // 2. Fundamental & Valuation factor (-1.5% to +1.5%)
  let fundFactor = 0;
  if (financials) {
    if (financials.peRatio > 0 && financials.peRatio < 10) fundFactor += 0.008;
    else if (financials.peRatio > 20) fundFactor -= 0.006;
    if (financials.dividendYieldPercent > 4.5) fundFactor += 0.007;
    if (financials.roePercent > 12) fundFactor += 0.005;
  }

  // 3. News sentiment factor (-2.0% to +2.0%)
  let newsFactor = 0;
  const drivers: string[] = [];
  if (recentNews && recentNews.length > 0) {
    for (const item of recentNews.slice(0, 3)) {
      if (item.aiImpact.newsImpact === 'Positive') {
        const boost = item.aiImpact.marketPricedIn === 'No' ? 0.012 : 0.004;
        newsFactor += boost;
        drivers.push(`Positive catalyst: ${item.headline.slice(0, 45)}...`);
      } else if (item.aiImpact.newsImpact === 'Negative') {
        const drag = item.aiImpact.marketPricedIn === 'No' ? -0.012 : -0.004;
        newsFactor += drag;
        drivers.push(`Headwind: ${item.headline.slice(0, 45)}...`);
      }
    }
  }

  // 4. CSX Market macro factor (-0.5% to +0.5%)
  let marketFactor = 0;
  if (csxIndexTrend === 'Bullish') marketFactor = 0.004;
  else if (csxIndexTrend === 'Bearish') marketFactor = -0.004;

  // Total 7-day expected drift
  const raw7DayDrift = techFactor + fundFactor + newsFactor + marketFactor;
  // Dampen extreme drift to realistic CSX stock volatility limits (-6% to +8%)
  const boundedDrift = Math.max(-0.06, Math.min(0.08, raw7DayDrift));

  const dailyDrift = boundedDrift / 7;
  const atr = technical.atr14 || Math.round(currentPrice * 0.015);
  const baseVolatility = Math.max(0.008, (technical.volatility30d || 15) / 100 / Math.sqrt(250));

  const dailyBreakdown: DayForecast[] = [];
  let prevExpected = currentPrice;

  // Add Day 0 as Actual Anchor
  dailyBreakdown.push({
    dayLabel: 'Today (Actual)',
    date: baseDate.toISOString().split('T')[0],
    expectedPrice: currentPrice,
    lowerRange: currentPrice,
    upperRange: currentPrice,
    confidencePercent: 100,
    isActual: true,
    predictedChangePercent: 0,
    keyDrivers: ['Closing price anchor on CSX'],
  });

  // Project Days 1 through 7
  let currentDate = new Date(baseDate);
  for (let day = 1; day <= 7; day++) {
    // increment to next business day (skip weekends)
    currentDate.setDate(currentDate.getDate() + 1);
    while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const dayChangePct = dailyDrift + (Math.sin(day * 1.5) * 0.001);
    const expected = Math.round((prevExpected * (1 + dayChangePct)) / 10) * 10;
    prevExpected = expected;

    // Uncertainty band widens with time: sqrt(day)
    const bandWidth = Math.round(currentPrice * (baseVolatility * Math.sqrt(day) * 1.8 + 0.005));
    const lower = Math.round(Math.max(100, expected - Math.max(bandWidth, atr * Math.sqrt(day))) / 10) * 10;
    const upper = Math.round((expected + Math.max(bandWidth, atr * Math.sqrt(day))) / 10) * 10;

    // Confidence decays monotonically with forecast horizon (e.g., Day 1 = 74%, Day 7 = 58%)
    const confidence = Math.max(50, Math.round(76 - day * 2.5));

    const dayDrivers: string[] = [];
    if (day === 1) {
      dayDrivers.push(`Short-term momentum (RSI ${technical.rsi14}, MACD ${technical.macd.trend})`);
    } else if (day === 3) {
      dayDrivers.push(`Key support at ${technical.supportLevel.toLocaleString()} KHR`);
    } else if (day === 5) {
      dayDrivers.push(`Valuation drift toward moving average SMA20 (${technical.sma20.toLocaleString()} KHR)`);
    } else if (day === 7) {
      if (drivers.length > 0) dayDrivers.push(drivers[0]);
      else dayDrivers.push(`Multi-factor fundamental drift (P/E & Dividend yield balance)`);
    }

    dailyBreakdown.push({
      dayLabel: `Day ${day}`,
      date: currentDate.toISOString().split('T')[0],
      expectedPrice: expected,
      lowerRange: lower,
      upperRange: upper,
      confidencePercent: confidence,
      isActual: false,
      predictedChangePercent: Math.round(((expected - currentPrice) / currentPrice) * 1000) / 10,
      keyDrivers: dayDrivers.length > 0 ? dayDrivers : ['Consolidation in trading band'],
    });
  }

  const finalDay = dailyBreakdown[dailyBreakdown.length - 1];
  const targetPrice7Day = finalDay.expectedPrice;
  const expectedChange7DayPercent = Math.round(((targetPrice7Day - currentPrice) / currentPrice) * 1000) / 10;
  const overallDirection = expectedChange7DayPercent > 1.0 ? 'Positive' : expectedChange7DayPercent < -1.0 ? 'Negative' : 'Neutral';

  // Overall confidence
  const avgConfidence = Math.round(dailyBreakdown.slice(1).reduce((sum, d) => sum + d.confidencePercent, 0) / 7);

  return {
    ticker,
    currentActualPrice: currentPrice,
    forecastDate: baseDate.toISOString().split('T')[0],
    targetPrice7Day,
    expectedChange7DayPercent,
    overallDirection,
    confidenceScore: avgConfidence,
    dailyBreakdown,
    methodologyNote: 'Calculated using technical momentum, ATR volatility expansion, valuation anchor, and CSX market liquidity. Not guaranteed.',
    disclaimer: 'DISCLAIMER: AI price forecasts are mathematical estimations based on past patterns and publicly reported disclosures. CSX securities carry market risk and prices may deviate significantly due to low liquidity or unexpected events. This is NOT certified investment advice.',
  };
}
