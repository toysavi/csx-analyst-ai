import React, { useState, useMemo } from 'react';
import { CSXStock } from '../types/csx';
import { TrendingUp, TrendingDown, ArrowUpDown, Filter, Search, Sparkles } from 'lucide-react';

interface StocksTableViewProps {
  stocks: CSXStock[];
  onSelectStock: (ticker: string) => void;
  currency: 'KHR' | 'USD';
}

type SortField = 'ticker' | 'currentPrice' | 'changePercent' | 'volume' | 'marketCapKHR' | 'peRatio' | 'dividendYieldPercent' | 'aiScore' | 'forecast';

export const StocksTableView: React.FC<StocksTableViewProps> = ({ stocks, onSelectStock, currency }) => {
  const [sortField, setSortField] = useState<SortField>('aiScore');
  const [sortAsc, setSortAsc] = useState(false);
  const [boardFilter, setBoardFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const formatPrice = (val: number) => {
    if (currency === 'USD') return `$${(val / 4050).toFixed(2)}`;
    return `${val.toLocaleString()} KHR`;
  };

  const formatLargeKHR = (val?: number) => {
    if (val === undefined) return '—';
    if (currency === 'USD') return `$${((val / 4050) / 1e6).toFixed(1)}M`;
    if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
    return `${(val / 1e9).toFixed(1)}B`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = stocks.filter(s => {
      if (boardFilter !== 'ALL' && s.board !== boardFilter) return false;
      if (riskFilter !== 'ALL' && s.risk.level !== riskFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.ticker.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.sector.toLowerCase().includes(q)
        );
      }
      return true;
    });

    result.sort((a, b) => {
      let va: any = 0;
      let vb: any = 0;

      switch (sortField) {
        case 'ticker':
          va = a.ticker;
          vb = b.ticker;
          return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
        case 'currentPrice':
          va = a.currentPrice;
          vb = b.currentPrice;
          break;
        case 'changePercent':
          va = a.changePercent;
          vb = b.changePercent;
          break;
        case 'volume':
          va = a.volume;
          vb = b.volume;
          break;
        case 'marketCapKHR':
          va = a.marketCapKHR || 0;
          vb = b.marketCapKHR || 0;
          break;
        case 'peRatio':
          va = a.peRatio || 999;
          vb = b.peRatio || 999;
          break;
        case 'dividendYieldPercent':
          va = a.dividendYieldPercent || 0;
          vb = b.dividendYieldPercent || 0;
          break;
        case 'aiScore':
          va = a.aiScore.overallScore;
          vb = b.aiScore.overallScore;
          break;
        case 'forecast':
          va = a.forecast7Day.expectedChange7DayPercent;
          vb = b.forecast7Day.expectedChange7DayPercent;
          break;
      }

      return sortAsc ? va - vb : vb - va;
    });

    return result;
  }, [stocks, sortField, sortAsc, boardFilter, riskFilter, search]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
      {/* Title & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Cambodia Securities Exchange (CSX) Listed Equities</span>
            <span className="text-xs font-mono font-normal text-slate-400">({filteredAndSorted.length} securities)</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Ground-truth market data integrated with 7-day quantitative forecasting and news intelligence
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter stock..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-slate-200 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={boardFilter}
            onChange={e => setBoardFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">All Boards</option>
            <option value="Main Board">Main Board</option>
            <option value="Growth Board">Growth Board</option>
          </select>

          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">All Risks</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
          <thead className="bg-slate-800/80 text-slate-300 font-mono text-[11px] uppercase tracking-wider border-b border-slate-700">
            <tr>
              <th
                onClick={() => handleSort('ticker')}
                className="py-2.5 px-3 cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1">
                  <span>Stock</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('currentPrice')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Price (Actual)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('changePercent')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Change</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('volume')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition hidden md:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Volume</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('marketCapKHR')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition hidden lg:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Market Cap</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('peRatio')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition hidden xl:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>P/E</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('dividendYieldPercent')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition hidden sm:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Div Yield</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th
                onClick={() => handleSort('aiScore')}
                className="py-2.5 px-3 text-center cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>AI Score</span>
                  <ArrowUpDown className="w-3 h-3 text-blue-400" />
                </div>
              </th>
              <th
                onClick={() => handleSort('forecast')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>7-Day Est.</span>
                  <ArrowUpDown className="w-3 h-3 text-purple-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 text-center hidden md:table-cell">News Impact</th>
              <th className="py-2.5 px-3 text-center">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono">
            {filteredAndSorted.map(stock => {
              const isUp = stock.change >= 0;
              const fUp = stock.forecast7Day.expectedChange7DayPercent >= 0;
              return (
                <tr
                  key={stock.ticker}
                  onClick={() => onSelectStock(stock.ticker)}
                  className="hover:bg-slate-800/60 transition cursor-pointer"
                >
                  {/* Stock ticker & name */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{stock.ticker}</span>
                      <span className="text-slate-400 font-sans text-xs truncate max-w-[130px] hidden sm:inline">
                        {stock.name}
                      </span>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-3 text-right">
                    <div className="font-bold text-white text-sm">{formatPrice(stock.currentPrice)}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      <span>L: {stock.floorPrice ? stock.floorPrice.toLocaleString() : Math.round(stock.currentPrice * 0.9).toLocaleString()}</span>
                      <span className="mx-1">•</span>
                      <span>H: {stock.ceilingPrice ? stock.ceilingPrice.toLocaleString() : Math.round(stock.currentPrice * 1.1).toLocaleString()}</span>
                    </div>
                  </td>

                  {/* Daily Change */}
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-flex items-center font-semibold ${
                        isUp ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isUp ? '+' : ''}{stock.changePercent}%
                    </span>
                  </td>

                  {/* Volume */}
                  <td className="py-3 px-3 text-right text-slate-300 hidden md:table-cell">
                    {stock.volume.toLocaleString()}
                  </td>

                  {/* Market Cap */}
                  <td className="py-3 px-3 text-right text-slate-300 hidden lg:table-cell">
                    {formatLargeKHR(stock.marketCapKHR)}
                  </td>

                  {/* P/E */}
                  <td className="py-3 px-3 text-right text-slate-300 hidden xl:table-cell">
                    {stock.peRatio ? `${stock.peRatio}x` : '—'}
                  </td>

                  {/* Dividend Yield */}
                  <td className="py-3 px-3 text-right text-emerald-400 font-semibold hidden sm:table-cell">
                    {stock.dividendYieldPercent ? `${stock.dividendYieldPercent}%` : '—'}
                  </td>

                  {/* AI Score */}
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded font-bold text-blue-400 bg-blue-950/80 border border-blue-800/60 inline-block min-w-[55px]">
                      {stock.aiScore.overallScore}/100
                    </span>
                  </td>

                  {/* 7-Day Forecast */}
                  <td className="py-3 px-3 text-right">
                    <div className="font-bold text-purple-300">{formatPrice(stock.forecast7Day.targetPrice7Day)}</div>
                    <div className={`text-[10px] ${fUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {fUp ? '+' : ''}{stock.forecast7Day.expectedChange7DayPercent}% ({stock.forecast7Day.confidenceScore}%)
                    </div>
                  </td>

                  {/* News Impact */}
                  <td className="py-3 px-3 text-center hidden md:table-cell">
                    <span className="text-[10px] font-sans font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                      Positive
                    </span>
                  </td>

                  {/* Risk */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        stock.risk.level === 'Low'
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                          : stock.risk.level === 'Medium'
                          ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                          : 'bg-rose-950/80 text-rose-400 border-rose-800'
                      }`}
                    >
                      {stock.risk.level}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
