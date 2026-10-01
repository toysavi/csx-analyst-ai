import React, { useState, useMemo } from 'react';
import { HistoricalPricePoint, NewsItem } from '../types/csx';
import { Calendar, Eye, Layers, Info } from 'lucide-react';

interface InteractiveChartProps {
  ticker: string;
  history: HistoricalPricePoint[];
  newsPins?: NewsItem[];
  currency: 'KHR' | 'USD';
  currentPrice: number;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  ticker,
  history,
  newsPins = [],
  currency,
  currentPrice,
}) => {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y'>('6M');
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<HistoricalPricePoint | null>(null);

  // Filter history points based on active timeframe
  const filteredHistory = useMemo(() => {
    if (!history || history.length === 0) return [];
    let count = 180;
    if (timeframe === '1D') count = 1;
    else if (timeframe === '1W') count = 7;
    else if (timeframe === '1M') count = 22;
    else if (timeframe === '3M') count = 65;
    else if (timeframe === '6M') count = 130;
    else if (timeframe === '1Y') count = 260;
    else if (timeframe === '3Y') count = 750;
    return history.slice(-Math.min(count, history.length));
  }, [history, timeframe]);

  // Compute scale boundaries
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (filteredHistory.length === 0) return { minPrice: 0, maxPrice: 100, maxVolume: 100 };
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    for (const p of filteredHistory) {
      if (p.low < min) min = p.low;
      if (p.high > max) max = p.high;
      if (showBollinger && p.upperBand && p.upperBand > max) max = p.upperBand;
      if (showBollinger && p.lowerBand && p.lowerBand < min) min = p.lowerBand;
      if (p.volume > maxVol) maxVol = p.volume;
    }

    const padding = (max - min) * 0.08 || 100;
    return {
      minPrice: Math.max(0, Math.floor(min - padding)),
      maxPrice: Math.ceil(max + padding),
      maxVolume: maxVol || 1,
    };
  }, [filteredHistory, showBollinger]);

  const chartWidth = 840;
  const chartHeight = 320;
  const volumeHeight = 60;
  const priceHeight = showVolume ? chartHeight - volumeHeight - 10 : chartHeight;

  // Convert (index, price) to SVG coordinates
  const getX = (idx: number) => {
    const len = filteredHistory.length;
    if (len <= 1) return chartWidth / 2;
    return (idx / (len - 1)) * (chartWidth - 40) + 20;
  };

  const getY = (price: number) => {
    if (maxPrice === minPrice) return priceHeight / 2;
    return priceHeight - ((price - minPrice) / (maxPrice - minPrice)) * (priceHeight - 20) - 10;
  };

  const getVolY = (vol: number) => {
    return chartHeight - (vol / (maxVolume || 1)) * volumeHeight;
  };

  // Generate SVG path for Close prices
  const pricePath = useMemo(() => {
    if (filteredHistory.length < 2) return '';
    return filteredHistory
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx).toFixed(1)} ${getY(p.close).toFixed(1)}`)
      .join(' ');
  }, [filteredHistory, minPrice, maxPrice, priceHeight]);

  // Generate Area Fill under Price
  const areaPath = useMemo(() => {
    if (filteredHistory.length < 2) return '';
    const firstX = getX(0).toFixed(1);
    const lastX = getX(filteredHistory.length - 1).toFixed(1);
    return `${pricePath} L ${lastX} ${priceHeight} L ${firstX} ${priceHeight} Z`;
  }, [pricePath, filteredHistory, priceHeight]);

  // Moving average SMA20 path
  const sma20Path = useMemo(() => {
    if (!showSMA20 || filteredHistory.length < 5) return '';
    const pts = [];
    for (let i = 0; i < filteredHistory.length; i++) {
      const slice = filteredHistory.slice(Math.max(0, i - 19), i + 1);
      const avg = slice.reduce((a, b) => a + b.close, 0) / slice.length;
      pts.push(`${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(avg).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [filteredHistory, showSMA20, minPrice, maxPrice]);

  // Moving average SMA50 path
  const sma50Path = useMemo(() => {
    if (!showSMA50 || filteredHistory.length < 10) return '';
    const pts = [];
    for (let i = 0; i < filteredHistory.length; i++) {
      const slice = filteredHistory.slice(Math.max(0, i - 49), i + 1);
      const avg = slice.reduce((a, b) => a + b.close, 0) / slice.length;
      pts.push(`${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(avg).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [filteredHistory, showSMA50, minPrice, maxPrice]);

  const formatPrice = (val: number) => {
    if (currency === 'USD') return `$${(val / 4050).toFixed(2)}`;
    return `${val.toLocaleString()} KHR`;
  };

  const activeDisplayPoint = hoveredPoint || (filteredHistory[filteredHistory.length - 1] || null);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      {/* Header with timeframes & indicator toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base font-mono">{ticker}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                ACTUAL MARKET DATA
              </span>
            </div>
            {activeDisplayPoint && (
              <div className="flex items-center gap-3 text-xs font-mono mt-0.5">
                <span className="text-slate-400">Date: <strong className="text-slate-200">{activeDisplayPoint.date}</strong></span>
                <span className="text-slate-400">Close: <strong className="text-emerald-400">{formatPrice(activeDisplayPoint.close)}</strong></span>
                <span className="text-slate-400">Vol: <strong className="text-slate-200">{activeDisplayPoint.volume.toLocaleString()}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/80 text-xs font-mono">
          {(['1D', '1W', '1M', '3M', '6M', '1Y', '3Y'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 rounded text-xs transition cursor-pointer font-semibold ${
                timeframe === tf
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Indicator Toggles */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setShowSMA20(!showSMA20)}
            className={`px-2 py-1 rounded border text-[11px] font-mono transition cursor-pointer ${
              showSMA20
                ? 'bg-amber-500/10 border-amber-500/50 text-amber-300 font-bold'
                : 'border-slate-800 bg-slate-800/50 text-slate-400'
            }`}
          >
            SMA 20
          </button>
          <button
            onClick={() => setShowSMA50(!showSMA50)}
            className={`px-2 py-1 rounded border text-[11px] font-mono transition cursor-pointer ${
              showSMA50
                ? 'bg-purple-500/10 border-purple-500/50 text-purple-300 font-bold'
                : 'border-slate-800 bg-slate-800/50 text-slate-400'
            }`}
          >
            SMA 50
          </button>
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2 py-1 rounded border text-[11px] font-mono transition cursor-pointer ${
              showVolume
                ? 'bg-blue-500/10 border-blue-500/50 text-blue-300 font-bold'
                : 'border-slate-800 bg-slate-800/50 text-slate-400'
            }`}
          >
            Volume
          </button>
        </div>
      </div>

      {/* Main SVG Interactive Chart Area */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-72 sm:h-80 block"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          {[0.2, 0.4, 0.6, 0.8].map((pct, i) => {
            const y = priceHeight * pct;
            const priceVal = Math.round(maxPrice - pct * (maxPrice - minPrice));
            return (
              <g key={i}>
                <line x1="20" y1={y} x2={chartWidth - 20} y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                <text x={chartWidth - 25} y={y - 3} fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="end">
                  {formatPrice(priceVal)}
                </text>
              </g>
            );
          })}

          {/* Volume Section Separator Line */}
          {showVolume && (
            <line
              x1="20"
              y1={priceHeight}
              x2={chartWidth - 20}
              y2={priceHeight}
              stroke="#334155"
              strokeDasharray="2 2"
            />
          )}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#priceGradient)" />}

          {/* Volume Bars */}
          {showVolume &&
            filteredHistory.map((p, idx) => {
              const x = getX(idx);
              const barWidth = Math.max(2, (chartWidth / (filteredHistory.length || 1)) * 0.6);
              const barHeight = Math.max(2, (p.volume / (maxVolume || 1)) * volumeHeight);
              const isUp = p.close >= p.open;
              return (
                <rect
                  key={`vol-${idx}`}
                  x={x - barWidth / 2}
                  y={chartHeight - barHeight}
                  width={barWidth}
                  height={barHeight}
                  fill={isUp ? '#10b981' : '#f43f5e'}
                  opacity={0.35}
                />
              );
            })}

          {/* SMA 50 Line */}
          {showSMA50 && sma50Path && (
            <path d={sma50Path} fill="none" stroke="#a855f7" strokeWidth="1.5" opacity="0.8" />
          )}

          {/* SMA 20 Line */}
          {showSMA20 && sma20Path && (
            <path d={sma20Path} fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.9" />
          )}

          {/* Close Price Line */}
          {pricePath && (
            <path d={pricePath} fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinejoin="round" />
          )}

          {/* News Pins on Timeline */}
          {newsPins.map((news, i) => {
            // Find closest date in history
            const idx = filteredHistory.findIndex(h => h.date >= news.date);
            if (idx === -1) return null;
            const px = getX(idx);
            const py = getY(filteredHistory[idx].close);
            return (
              <g key={`pin-${i}`} className="cursor-pointer">
                <line x1={px} y1={py} x2={px} y2={py - 30} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
                <circle cx={px} cy={py - 30} r="6" fill="#f59e0b" />
                <text x={px} y={py - 27} fill="#0f172a" fontSize="8" fontWeight="bold" textAnchor="middle">
                  N
                </text>
              </g>
            );
          })}

          {/* Hover Crosshair & Scrubbing Target Rectangles */}
          {filteredHistory.map((p, idx) => {
            const x = getX(idx);
            const w = chartWidth / (filteredHistory.length || 1);
            return (
              <rect
                key={`hit-${idx}`}
                x={x - w / 2}
                y="0"
                width={w}
                height={chartHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredPoint(p)}
              />
            );
          })}

          {/* Hover Indicator Crosshair */}
          {hoveredPoint && (
            <g>
              {(() => {
                const idx = filteredHistory.findIndex(h => h.date === hoveredPoint.date);
                if (idx === -1) return null;
                const hx = getX(idx);
                const hy = getY(hoveredPoint.close);
                return (
                  <>
                    <line x1={hx} y1="0" x2={hx} y2={chartHeight} stroke="#94a3b8" strokeDasharray="3 3" opacity="0.6" />
                    <line x1="20" y1={hy} x2={chartWidth - 20} y2={hy} stroke="#94a3b8" strokeDasharray="3 3" opacity="0.6" />
                    <circle cx={hx} cy={hy} r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                  </>
                );
              })()}
            </g>
          )}
        </svg>
      </div>

      {/* Chart Footer with Legend & Timeline Marker Info */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-500 rounded"></span>
            <span>Close Price (Actual)</span>
          </div>
          {showSMA20 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-amber-500 rounded"></span>
              <span>SMA 20</span>
            </div>
          )}
          {showSMA50 && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-purple-500 rounded"></span>
              <span>SMA 50</span>
            </div>
          )}
          {newsPins.length > 0 && (
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>CSX Disclosure Pins ({newsPins.length})</span>
            </div>
          )}
        </div>

        <div className="font-mono text-slate-400">
          Source: CSX Listed Securities Historical Database
        </div>
      </div>
    </div>
  );
};
