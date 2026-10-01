import React, { useState } from 'react';
import { CSXStock, BacktestResult, BacktestParams } from '../types/csx';
import { runBacktest, getAccuracySummary } from '../services/backtestingService';
import { Play, RotateCcw, TrendingUp, Award, Target, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface BacktestingViewProps {
  stocks: CSXStock[];
  currency: 'KHR' | 'USD';
}

export const BacktestingView: React.FC<BacktestingViewProps> = ({ stocks, currency }) => {
  const [selectedTicker, setSelectedTicker] = useState('PAS');
  const [strategy, setStrategy] = useState<BacktestParams['strategy']>('AI_SCORE_MOMENTUM');
  const [capitalKHR, setCapitalKHR] = useState<number>(10000000); // 10M KHR default
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  // Auto-run initial backtest for PAS
  React.useEffect(() => {
    handleRun();
  }, [selectedTicker, strategy]);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await runBacktest({
        ticker: selectedTicker,
        strategy,
        startDate: '2026-03-01',
        endDate: '2026-09-30',
        initialCapitalKHR: capitalKHR,
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  const formatPrice = (val: number) => {
    if (currency === 'USD') return `$${(val / 4050).toFixed(2)}`;
    return `${val.toLocaleString()} KHR`;
  };

  const accuracyOverview = getAccuracySummary(stocks);

  return (
    <div className="space-y-6">
      {/* Accuracy Header Banner (Section 11) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Target className="w-4 h-4" />
                7-Day Model Forecast Accuracy Dashboard
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                VERIFIED HISTORICAL ACCURACY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Empirical tracking comparing model 7-day expected prices against actual historical settlement prices
            </p>
          </div>
        </div>

        {/* Global Accuracy Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 font-mono">
          <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">Total Evaluations</div>
            <div className="text-xl font-black text-white mt-1">{accuracyOverview.totalEvaluations} runs</div>
            <div className="text-[10px] text-slate-400 font-sans">Across 10 listed CSX stocks</div>
          </div>

          <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">Average MAPE Error</div>
            <div className="text-xl font-black text-emerald-400 mt-1">{accuracyOverview.overallMAPE}%</div>
            <div className="text-[10px] text-slate-400 font-sans">Mean Absolute % Error</div>
          </div>

          <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">Directional Accuracy</div>
            <div className="text-xl font-black text-purple-400 mt-1">
              {accuracyOverview.overallDirectionalAccuracy}%
            </div>
            <div className="text-[10px] text-slate-400 font-sans">Correct Up/Down call</div>
          </div>

          <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">Best Performing Stock</div>
            <div className="text-xl font-black text-blue-400 mt-1">{accuracyOverview.bestPerformingTicker}</div>
            <div className="text-[10px] text-slate-400 font-sans">Lowest forecast error rate</div>
          </div>
        </div>
      </div>

      {/* Backtesting Lab Configuration Card (Section 10) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">Algorithmic Backtesting Lab</h2>
          <p className="text-xs text-slate-400 font-mono">
            Test quantitative trading strategies against CSX historical tick and daily settlement data
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
          {/* Stock selection */}
          <div>
            <label className="text-slate-400 font-medium block mb-1">Target Stock</label>
            <select
              value={selectedTicker}
              onChange={e => setSelectedTicker(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2 font-mono"
            >
              {stocks.map(s => (
                <option key={s.ticker} value={s.ticker}>
                  {s.ticker} — {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Strategy */}
          <div>
            <label className="text-slate-400 font-medium block mb-1">Quantitative Strategy</label>
            <select
              value={strategy}
              onChange={e => setStrategy(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2"
            >
              <option value="AI_SCORE_MOMENTUM">AI Score Momentum (Score &gt; 80)</option>
              <option value="TECHNICAL_MEAN_REVERSION">Technical Mean Reversion + RSI</option>
              <option value="VALUE_DIVIDEND">Deep Value & Dividend Yield Filter</option>
              <option value="FORECAST_TREND_FOLLOWING">7-Day Forecast Trend Following</option>
            </select>
          </div>

          {/* Capital */}
          <div>
            <label className="text-slate-400 font-medium block mb-1">Initial Capital (KHR)</label>
            <input
              type="number"
              value={capitalKHR}
              onChange={e => setCapitalKHR(Number(e.target.value))}
              step={1000000}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 rounded-lg p-2 font-mono"
            />
          </div>

          {/* Run button */}
          <div className="flex items-end">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg p-2 font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-md shadow-blue-600/20"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isRunning ? 'Simulating...' : 'Run Simulation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backtest Results Breakdown */}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 font-mono text-center">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-400">Total Return</div>
              <div className="text-lg font-black text-emerald-400 mt-1">+{result.totalReturnPercent}%</div>
              <div className="text-[10px] text-slate-400">Net Portfolio</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-400">Benchmark Return</div>
              <div className="text-lg font-black text-slate-300 mt-1">+{result.benchmarkReturnPercent}%</div>
              <div className="text-[10px] text-slate-400">CSX Index</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-400">Alpha Generated</div>
              <div className="text-lg font-black text-blue-400 mt-1">+{result.alphaPercent}%</div>
              <div className="text-[10px] text-slate-400">Excess return</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-400">Win Rate</div>
              <div className="text-lg font-black text-white mt-1">{result.winRatePercent}%</div>
              <div className="text-[10px] text-slate-400">{result.winningTrades}W / {result.losingTrades}L</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-400">Max Drawdown</div>
              <div className="text-lg font-black text-rose-400 mt-1">-{result.maxDrawdownPercent}%</div>
              <div className="text-[10px] text-slate-400">Peak-to-trough</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-400">Profit Factor</div>
              <div className="text-lg font-black text-white mt-1">{result.profitFactor}x</div>
              <div className="text-[10px] text-slate-400">Gain/Loss ratio</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <div className="text-[10px] text-slate-400">Sharpe Ratio</div>
              <div className="text-lg font-black text-blue-400 mt-1">{result.sharpeRatio}</div>
              <div className="text-[10px] text-slate-400">Risk-adjusted</div>
            </div>
          </div>

          {/* Trade Executions History Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Simulated Trade Executions & Analytical Triggers
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono border border-slate-800 rounded-lg">
                <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Entry Date</th>
                    <th className="py-2.5 px-3">Exit Date</th>
                    <th className="py-2.5 px-3 text-right">Entry Price</th>
                    <th className="py-2.5 px-3 text-right">Exit Price</th>
                    <th className="py-2.5 px-3 text-right">Return %</th>
                    <th className="py-2.5 px-3 text-right">Profit (KHR)</th>
                    <th className="py-2.5 px-3 font-sans">Trigger Strategy Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {result.trades.map((t, idx) => {
                    const isProfit = t.profitKHR >= 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-400">{t.entryDate}</td>
                        <td className="py-2 px-3 text-slate-400">{t.exitDate}</td>
                        <td className="py-2 px-3 text-right text-slate-300">{formatPrice(t.entryPrice)}</td>
                        <td className="py-2 px-3 text-right text-slate-300">{formatPrice(t.exitPrice)}</td>
                        <td
                          className={`py-2 px-3 text-right font-bold ${
                            isProfit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isProfit ? '+' : ''}{t.returnPercent}%
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-bold ${
                            isProfit ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isProfit ? '+' : ''}{formatPrice(t.profitKHR)}
                        </td>
                        <td className="py-2 px-3 text-slate-400 font-sans text-[11px] truncate max-w-sm">
                          {t.reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
