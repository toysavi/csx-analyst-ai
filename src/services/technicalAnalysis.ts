import { HistoricalPricePoint, TechnicalIndicators, SignalType } from '../types/csx';

export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return Math.round(sum / period);
}

export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return Math.round(ema);
}

export function calculateRSI(prices: number[], period = 14): number {
  if (prices.length <= period) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round(100 - (100 / (1 + rs)));
}

export function calculateBollingerBands(prices: number[], period = 20, multiplier = 2) {
  const sma = calculateSMA(prices, period);
  const slice = prices.slice(-period);
  if (slice.length === 0) return { upper: sma, middle: sma, lower: sma, percentB: 50 };
  const variance = slice.reduce((acc, p) => acc + Math.pow(p - sma, 2), 0) / slice.length;
  const stdDev = Math.sqrt(variance);
  const upper = Math.round(sma + stdDev * multiplier);
  const lower = Math.round(Math.max(0, sma - stdDev * multiplier));
  const current = prices[prices.length - 1];
  const percentB = upper !== lower ? Math.round(((current - lower) / (upper - lower)) * 100) : 50;
  return { upper, middle: sma, lower, percentB };
}

export function calculateATR(history: HistoricalPricePoint[], period = 14): number {
  if (history.length < 2) return 100;
  const trs: number[] = [];
  for (let i = 1; i < history.length; i++) {
    const current = history[i];
    const prev = history[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trs.push(tr);
  }
  const slice = trs.slice(-period);
  const avg = slice.reduce((a, b) => a + b, 0) / (slice.length || 1);
  return Math.round(avg);
}

export function computeTechnicalIndicators(history: HistoricalPricePoint[]): TechnicalIndicators {
  const closes = history.map(h => h.close);
  const currentPrice = closes[closes.length - 1] || 10000;
  const sma5 = calculateSMA(closes, 5);
  const sma10 = calculateSMA(closes, 10);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const ema20 = calculateEMA(closes, 20);
  const rsi14 = calculateRSI(closes, 14);
  const bb = calculateBollingerBands(closes, 20, 2);
  const atr14 = calculateATR(history, 14);

  // MACD estimation (12, 26, 9)
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12 - ema26;
  const signalLine = Math.round(macdLine * 0.85);
  const histogram = macdLine - signalLine;
  const macdTrend = histogram > 10 ? 'Bullish' : histogram < -10 ? 'Bearish' : 'Neutral';

  // Volume Trend
  const volumes = history.map(h => h.volume);
  const recentVol = volumes[volumes.length - 1] || 0;
  const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.min(volumes.length, 20) || 1;
  const volRatio = recentVol / avgVol;
  const volumeTrend = volRatio > 2.0 ? 'Surging' : volRatio > 1.2 ? 'Above Average' : volRatio < 0.6 ? 'Drying Up' : 'Normal';

  // Support & Resistance
  const recentLows = history.slice(-30).map(h => h.low);
  const recentHighs = history.slice(-30).map(h => h.high);
  const supportLevel = Math.min(...recentLows);
  const resistanceLevel = Math.max(...recentHighs);

  // Volatility 30-day (annualized approx)
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const sliceRet = returns.slice(-30);
  const meanRet = sliceRet.reduce((a, b) => a + b, 0) / (sliceRet.length || 1);
  const varianceRet = sliceRet.reduce((a, r) => a + Math.pow(r - meanRet, 2), 0) / (sliceRet.length || 1);
  const volatility30d = Math.round(Math.sqrt(varianceRet) * Math.sqrt(250) * 100 * 10) / 10;

  // Signal summary
  let bullCount = 0;
  if (currentPrice > sma20) bullCount++;
  if (sma20 > sma50) bullCount++;
  if (rsi14 > 45 && rsi14 < 70) bullCount++;
  if (macdTrend === 'Bullish') bullCount++;
  if (volRatio > 1.0 && currentPrice >= sma5) bullCount++;

  let technicalSummary: SignalType = 'Neutral';
  if (bullCount >= 4) technicalSummary = 'Strong Positive';
  else if (bullCount === 3) technicalSummary = 'Positive';
  else if (bullCount === 1) technicalSummary = 'Negative';
  else if (bullCount === 0) technicalSummary = 'Strong Negative';

  const rsiSignal = rsi14 >= 70 ? 'Overbought' : rsi14 <= 30 ? 'Oversold' : 'Neutral';

  return {
    sma5,
    sma10,
    sma20,
    sma50,
    ema20,
    rsi14,
    rsiSignal,
    macd: { macdLine, signalLine, histogram, trend: macdTrend },
    bollingerBands: bb,
    atr14,
    volumeTrend,
    volatility30d,
    supportLevel,
    resistanceLevel,
    technicalSummary,
  };
}
