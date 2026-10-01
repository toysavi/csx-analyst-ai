import React, { useState } from 'react';
import { CSXStock } from '../types/csx';
import { ArrowUpDown, Check, ShieldAlert } from 'lucide-react';

interface CompareViewProps {
  stocks: CSXStock[];
  onSelectStock: (ticker: string) => void;
  currency: 'KHR' | 'USD';
}

export const CompareView: React.FC<CompareViewProps> = ({ stocks, onSelectStock, currency }) => {
  const [selectedTickers, setSelectedTickers] = useState<string[]>(['PAS', 'PPAP', 'PWSA']);

  const toggleTicker = (ticker: string) => {
    if (selectedTickers.includes(ticker)) {
      if (selectedTickers.length > 1) {
        setSelectedTickers(selectedTickers.filter(t => t !== ticker));
      }
    } else {
      if (selectedTickers.length < 4) {
        setSelectedTickers([...selectedTickers, ticker]);
      }
    }
  };

  const comparedStocks = stocks.filter(s => selectedTickers.includes(s.ticker));

  const formatPrice = (val: number) => {
    if (currency === 'USD') return `$${(val / 4050).toFixed(2)}`;
    return `${val.toLocaleString()} KHR`;
  };

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">CSX Securities Comparative Matrix</h2>
          <p className="text-xs text-slate-400 font-mono">
            Side-by-side quantitative benchmarking across fundamentals, valuation, AI scores, 7-day forecasts, and risks
          </p>
        </div>

        {/* Stock Selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Compare up to 4 securities:</span>
          {stocks.map(s => {
            const isSelected = selectedTickers.includes(s.ticker);
            return (
              <button
                key={s.ticker}
                onClick={() => toggleTicker(s.ticker)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
                <span>{s.ticker}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Grid Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-lg">
        <table className="w-full text-xs text-left font-mono">
          <thead className="bg-slate-800/90 text-slate-300 uppercase tracking-wider border-b border-slate-700">
            <tr>
              <th className="py-3 px-4 w-48 font-sans">Feature / Metric</th>
              {comparedStocks.map(s => (
                <th key={s.ticker} className="py-3 px-4 min-w-[200px] text-center">
                  <div
                    onClick={() => onSelectStock(s.ticker)}
                    className="cursor-pointer hover:text-blue-400 transition"
                  >
                    <div className="text-base font-black text-white">{s.ticker}</div>
                    <div className="text-[10px] text-slate-400 font-sans font-normal truncate">{s.name}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {/* Actual Price */}
            <tr className="hover:bg-slate-800/40">
              <td className="py-2.5 px-4 font-sans font-semibold text-slate-400">Actual Market Price</td>
              {comparedStocks.map(s => (
                <td key={s.ticker} className="py-2.5 px-4 text-center font-bold text-white text-sm">
                  {formatPrice(s.currentPrice)}
                </td>
              ))}
            </tr>

            {/* Daily Change */}
            <tr className="hover:bg-slate-800/40">
              <td className="py-2.5 px-4 font-sans font-semibold text-slate-400">Daily Change</td>
              {comparedStocks.map(s => (
                <td
                  key={s.ticker}
                  className={`py-2.5 px-4 text-center font-bold ${
                    s.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {s.change >= 0 ? '+' : ''}{s.change} ({s.change >= 0 ? '+' : ''}{s.changePercent}%)
                </td>
              ))}
            </tr>

            {/* AI Analysis Score */}
            <tr className="bg-blue-950/20 hover:bg-blue-950/30">
              <td className="py-2.5 px-4 font-sans font-semibold text-blue-300">AI Analysis Score (0-100)</td>
              {comparedStocks.map(s => (
                <td key={s.ticker} className="py-2.5 px-4 text-center">
                  <span className="px-2.5 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800 font-black text-sm">
                    {s.aiScore.overallScore}/100
                  </span>
                  <div className="text-[10px] text-slate-400 font-sans mt-0.5">{s.aiScore.signal}</div>
                </td>
              ))}
            </tr>

            {/* 7-Day Forecast */}
            <tr className="bg-purple-950/20 hover:bg-purple-950/30">
              <td className="py-2.5 px-4 font-sans font-semibold text-purple-300">7-Day Price Forecast</td>
              {comparedStocks.map(s => {
                const isPos = s.forecast7Day.expectedChange7DayPercent >= 0;
                return (
                  <td key={s.ticker} className="py-2.5 px-4 text-center">
                    <div className="font-bold text-white">{formatPrice(s.forecast7Day.targetPrice7Day)}</div>
                    <div className={`text-[11px] font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPos ? '+' : ''}{s.forecast7Day.expectedChange7DayPercent}% ({s.forecast7Day.confidenceScore}% conf)
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Risk Level */}
            <tr className="hover:bg-slate-800/40">
              <td className="py-2.5 px-4 font-sans font-semibold text-slate-400">Risk Assessment</td>
              {comparedStocks.map(s => (
                <td key={s.ticker} className="py-2.5 px-4 text-center">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      s.risk.level === 'Low'
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                        : s.risk.level === 'Medium'
                        ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                        : 'bg-rose-950/80 text-rose-400 border-rose-800'
                    }`}
                  >
                    {s.risk.level} ({s.risk.overallScore}/100)
                  </span>
                </td>
              ))}
            </tr>

            {/* Valuation P/E & P/B */}
            <tr className="hover:bg-slate-800/40">
              <td className="py-2.5 px-4 font-sans font-semibold text-slate-400">Trailing P/E Ratio</td>
              {comparedStocks.map(s => (
                <td key={s.ticker} className="py-2.5 px-4 text-center font-bold text-slate-200">
                  {s.peRatio ? `${s.peRatio}x` : 'N/A'}
                </td>
              ))}
            </tr>

            <tr className="hover:bg-slate-800/40">
              <td className="py-2.5 px-4 font-sans font-semibold text-slate-400">Price to Book (P/B)</td>
              {comparedStocks.map(s => (
                <td key={s.ticker} className="py-2.5 px-4 text-center font-bold text-slate-200">
                  {s.pbRatio ? `${s.pbRatio}x` : 'N/A'}
                </td>
              ))}
            </tr>

            {/* Dividend Yield */}
            <tr className="hover:bg-slate-800/40">
              <td className="py-2.5 px-4 font-sans font-semibold text-slate-400">Dividend Yield</td>
              {comparedStocks.map(s => (
                <td key={s.ticker} className="py-2.5 px-4 text-center font-bold text-emerald-400">
                  {s.dividendYieldPercent ? `${s.dividendYieldPercent}%` : 'N/A'}
                </td>
              ))}
            </tr>

            {/* Technical RSI */}
            <tr className="hover:bg-slate-800/40">
              <td className="py-2.5 px-4 font-sans font-semibold text-slate-400">RSI (14-Day)</td>
              {comparedStocks.map(s => (
                <td key={s.ticker} className="py-2.5 px-4 text-center font-bold text-slate-200">
                  {s.technical.rsi14} ({s.technical.rsiSignal})
                </td>
              ))}
            </tr>

            {/* Trading Volume & Liquidity */}
            <tr className="hover:bg-slate-800/40">
              <td className="py-2.5 px-4 font-sans font-semibold text-slate-400">Daily Trading Volume</td>
              {comparedStocks.map(s => (
                <td key={s.ticker} className="py-2.5 px-4 text-center text-slate-300">
                  {s.volume.toLocaleString()} shares
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
