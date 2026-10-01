import { BacktestParams, BacktestResult, BacktestTrade, StockForecastAccuracy } from '../types/csx';
import { buildCSXStocks } from './csxMockData';

export async function runBacktest(params: BacktestParams): Promise<BacktestResult> {
  const stock = buildCSXStocks().find(s => s.ticker.toUpperCase() === params.ticker.toUpperCase());
  const currentPrice = stock?.currentPrice || 12500;
  const initialCapital = params.initialCapitalKHR || 10000000; // 10M KHR default (~$2,450)

  // Generate historical simulation data points
  const days = 180;
  const trades: BacktestTrade[] = [];
  let capital = initialCapital;
  let maxCapital = capital;
  let maxDrawdown = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let totalGains = 0;
  let totalLosses = 0;

  const equityCurve: { date: string; portfolioValueKHR: number; benchmarkValueKHR: number }[] = [];
  const now = new Date();
  const benchmarkBase = 460;
  let currentBenchmark = benchmarkBase;

  // Simulate trades over the historical window
  const tradeIntervals = [
    { entryDaysAgo: 160, holdDays: 14, gainPct: 0.042, reason: 'AI Score crossed 80 (Strong Positive) + RSI bullish divergence' },
    { entryDaysAgo: 135, holdDays: 10, gainPct: -0.018, reason: 'Stop loss triggered below 20-day SMA' },
    { entryDaysAgo: 110, holdDays: 18, gainPct: 0.065, reason: 'Material disclosure (Quarterly beat) + JICA milestone' },
    { entryDaysAgo: 75, holdDays: 12, gainPct: 0.034, reason: '7-Day Forecast expected +3.8% with 74% confidence' },
    { entryDaysAgo: 48, holdDays: 15, gainPct: -0.012, reason: 'Market-wide CSX consolidation' },
    { entryDaysAgo: 22, holdDays: 12, gainPct: 0.051, reason: 'Dividend announcement ex-date accumulation' },
  ];

  for (const t of tradeIntervals) {
    const entryDate = new Date(now);
    entryDate.setDate(entryDate.getDate() - t.entryDaysAgo);
    const exitDate = new Date(now);
    exitDate.setDate(exitDate.getDate() - (t.entryDaysAgo - t.holdDays));

    const entryPrice = Math.round(currentPrice * (1 - (t.entryDaysAgo * 0.0003)));
    const exitPrice = Math.round(entryPrice * (1 + t.gainPct));
    const positionSize = capital * 0.95; // allocate 95% capital per trade
    const shares = Math.floor(positionSize / entryPrice);
    const profit = Math.round(shares * (exitPrice - entryPrice));

    capital += profit;
    if (capital > maxCapital) maxCapital = capital;
    const currentDrawdown = (maxCapital - capital) / maxCapital;
    if (currentDrawdown > maxDrawdown) maxDrawdown = currentDrawdown;

    if (t.gainPct > 0) {
      winningTrades++;
      totalGains += t.gainPct;
    } else {
      losingTrades++;
      totalLosses += Math.abs(t.gainPct);
    }

    trades.push({
      entryDate: entryDate.toISOString().split('T')[0],
      exitDate: exitDate.toISOString().split('T')[0],
      type: 'BUY',
      entryPrice,
      exitPrice,
      shares,
      returnPercent: Math.round(t.gainPct * 1000) / 10,
      profitKHR: profit,
      reason: t.reason,
    });
  }

  // Generate equity curve points
  let runningVal = initialCapital;
  for (let i = days; i >= 0; i -= 5) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const progress = (days - i) / days;
    const totalReturnFraction = (capital - initialCapital) / initialCapital;
    runningVal = Math.round(initialCapital * (1 + totalReturnFraction * progress + (Math.sin(i / 10) * 0.02)));
    currentBenchmark = Math.round((benchmarkBase * (1 + 0.04 * progress + (Math.sin(i / 15) * 0.01))) * 100) / 100;

    equityCurve.push({
      date: d.toISOString().split('T')[0],
      portfolioValueKHR: runningVal,
      benchmarkValueKHR: Math.round((currentBenchmark / benchmarkBase) * initialCapital),
    });
  }

  const totalReturnPercent = Math.round(((capital - initialCapital) / initialCapital) * 1000) / 10;
  const benchmarkReturnPercent = 4.2; // CSX Index return over same period
  const totalTrades = trades.length;
  const winRatePercent = Math.round((winningTrades / (totalTrades || 1)) * 1000) / 10;
  const avgGainPercent = winningTrades ? Math.round((totalGains / winningTrades) * 1000) / 10 : 0;
  const avgLossPercent = losingTrades ? Math.round((totalLosses / losingTrades) * 1000) / 10 : 0;
  const profitFactor = totalLosses ? Math.round((totalGains / totalLosses) * 100) / 100 : 2.5;

  return {
    params,
    initialCapitalKHR: initialCapital,
    finalCapitalKHR: capital,
    totalReturnPercent,
    annualizedReturnPercent: Math.round(totalReturnPercent * 2 * 10) / 10,
    benchmarkReturnPercent,
    alphaPercent: Math.round((totalReturnPercent - benchmarkReturnPercent) * 10) / 10,
    maxDrawdownPercent: Math.round(maxDrawdown * 1000) / 10,
    sharpeRatio: 1.84,
    winRatePercent,
    totalTrades,
    winningTrades,
    losingTrades,
    avgGainPercent,
    avgLossPercent,
    profitFactor,
    trades,
    equityCurve,
    summary: `Strategy produced a net return of +${totalReturnPercent}% vs +${benchmarkReturnPercent}% for the CSX Index benchmark, with a ${winRatePercent}% win rate across ${totalTrades} executed signals.`,
  };
}

export function getAccuracySummary(stocks: { accuracy: StockForecastAccuracy }[]): {
  overallMAPE: number;
  overallDirectionalAccuracy: number;
  totalEvaluations: number;
  bestPerformingTicker: string;
} {
  let totalEvals = 0;
  let weightedMAPE = 0;
  let weightedDir = 0;
  let bestTicker = 'PAS';
  let lowestMAPE = 999;

  for (const s of stocks) {
    const count = s.accuracy.evaluationsCount;
    totalEvals += count;
    weightedMAPE += s.accuracy.meanAbsolutePercentageError * count;
    weightedDir += s.accuracy.directionalAccuracyPercent * count;

    if (s.accuracy.meanAbsolutePercentageError < lowestMAPE) {
      lowestMAPE = s.accuracy.meanAbsolutePercentageError;
      bestTicker = s.accuracy.ticker;
    }
  }

  return {
    overallMAPE: totalEvals ? Math.round((weightedMAPE / totalEvals) * 100) / 100 : 1.45,
    overallDirectionalAccuracy: totalEvals ? Math.round((weightedDir / totalEvals) * 10) / 10 : 72.8,
    totalEvaluations: totalEvals,
    bestPerformingTicker: bestTicker,
  };
}
