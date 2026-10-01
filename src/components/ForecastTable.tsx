import React from 'react';
import { StockForecast } from '../types/csx';
import { Sparkles, AlertCircle, ArrowUpRight, ArrowDownRight, Minus, ShieldAlert } from 'lucide-react';

interface ForecastTableProps {
  forecast: StockForecast;
  currency: 'KHR' | 'USD';
}

export const ForecastTable: React.FC<ForecastTableProps> = ({ forecast, currency }) => {
  const formatPrice = (val: number) => {
    if (currency === 'USD') return `$${(val / 4050).toFixed(2)}`;
    return `${val.toLocaleString()} KHR`;
  };

  const isPositive = forecast.expectedChange7DayPercent >= 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
      {/* Forecast Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" />
              7-Day Quantitative Price Forecast Engine
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
              AI ESTIMATION
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <div className="text-slate-400 text-xs font-mono">
              ACTUAL ANCHOR:{' '}
              <strong className="text-white text-sm">{formatPrice(forecast.currentActualPrice)}</strong>
            </div>
            <div className="text-slate-500 text-xs">→</div>
            <div className="text-purple-300 text-xs font-mono">
              7-DAY ESTIMATE:{' '}
              <strong className="text-white text-base font-bold">{formatPrice(forecast.targetPrice7Day)}</strong>
            </div>
            <span
              className={`text-xs font-bold font-mono px-2 py-0.5 rounded inline-flex items-center gap-0.5 ${
                isPositive ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}
              {forecast.expectedChange7DayPercent}%
            </span>
          </div>
        </div>

        {/* Confidence & Bias Meter */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-2 text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Model Confidence</div>
            <div className="text-base font-black text-blue-400 font-mono">{forecast.confidenceScore}%</div>
          </div>
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-2 text-right">
            <div className="text-[10px] text-slate-400 uppercase tracking-wide">Directional Stance</div>
            <div className="text-sm font-bold text-slate-200">{forecast.overallDirection}</div>
          </div>
        </div>
      </div>

      {/* Uncertainty Cone Visual Representation */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
        <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
          <span>7-DAY UNCERTAINTY BAND EXPANSION (Volatility Cone)</span>
          <span className="text-[10px] font-mono text-purple-400">Expanding ±ATR Bounds</span>
        </div>
        <div className="grid grid-cols-8 gap-1.5 text-center text-xs">
          {forecast.dailyBreakdown.map((day, idx) => {
            const isActual = day.isActual;
            const spreadKHR = day.upperRange - day.lowerRange;
            return (
              <div
                key={day.dayLabel}
                className={`p-2 rounded border flex flex-col justify-between ${
                  isActual
                    ? 'bg-blue-950/40 border-blue-800/60'
                    : 'bg-slate-900/60 border-slate-800 hover:border-purple-600/40'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 font-mono">{day.dayLabel}</div>
                <div className="text-[9px] text-slate-400 font-mono">{day.date.slice(5)}</div>
                <div className={`my-1 font-bold font-mono text-xs ${isActual ? 'text-blue-400' : 'text-slate-100'}`}>
                  {formatPrice(day.expectedPrice)}
                </div>
                {!isActual && (
                  <div className="text-[9px] text-slate-400 font-mono">
                    <span className="text-slate-400">{formatPrice(day.lowerRange)}</span>
                    <br />
                    <span className="text-purple-400">to {formatPrice(day.upperRange)}</span>
                  </div>
                )}
                {isActual ? (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 py-0.5 rounded mt-1">
                    ACTUAL
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-blue-300 font-mono bg-blue-950/40 py-0.5 rounded mt-1">
                    {day.confidencePercent}% conf
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Breakdown Table as specified in Section 3 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
          <thead className="bg-slate-800/80 text-slate-300 font-mono text-[11px] uppercase tracking-wider border-b border-slate-700">
            <tr>
              <th className="py-2.5 px-3">Trading Day</th>
              <th className="py-2.5 px-3">Calendar Date</th>
              <th className="py-2.5 px-3 text-right">Expected Price</th>
              <th className="py-2.5 px-3 text-right">Lower Range</th>
              <th className="py-2.5 px-3 text-right">Upper Range</th>
              <th className="py-2.5 px-3 text-center">Confidence</th>
              <th className="py-2.5 px-3">Primary Factor / Driver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono">
            {forecast.dailyBreakdown.map((row, idx) => {
              const isActual = row.isActual;
              return (
                <tr
                  key={row.dayLabel}
                  className={`hover:bg-slate-800/40 transition ${
                    isActual ? 'bg-blue-950/20 font-bold text-white' : 'text-slate-300'
                  }`}
                >
                  <td className="py-2 px-3 flex items-center gap-1.5 font-sans">
                    {isActual ? (
                      <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-purple-400/60 inline-block"></span>
                    )}
                    <span>{row.dayLabel}</span>
                  </td>
                  <td className="py-2 px-3 text-slate-400">{row.date}</td>
                  <td className="py-2 px-3 text-right font-bold text-white">
                    {formatPrice(row.expectedPrice)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">
                    {isActual ? '—' : formatPrice(row.lowerRange)}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">
                    {isActual ? '—' : formatPrice(row.upperRange)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {isActual ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        ACTUAL
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.confidencePercent >= 70
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-purple-950 text-purple-300 border border-purple-800'
                        }`}
                      >
                        {row.confidencePercent}%
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3 font-sans text-slate-400 text-[11px] truncate max-w-xs">
                    {row.keyDrivers.join('; ')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Methodology & Strict Non-guarantee Compliance Notice */}
      <div className="bg-slate-850/80 border border-amber-900/40 rounded-lg p-3 text-[11px] text-slate-300 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Forecasting Methodology & Statutory Warning</span>
        </div>
        <p className="text-slate-400 leading-relaxed text-[11px]">
          {forecast.methodologyNote}
        </p>
        <p className="text-amber-300/80 text-[10px] font-sans">
          {forecast.disclaimer}
        </p>
      </div>
    </div>
  );
};
