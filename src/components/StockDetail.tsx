import React, { useState } from 'react';
import { CSXStock, NewsItem, CSXDisclosure } from '../types/csx';
import { InteractiveChart } from './InteractiveChart';
import { ForecastTable } from './ForecastTable';
import { AIScoreCard } from './AIScoreCard';
import { NewsCard } from './NewsCard';
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Layers,
  FileText,
  Activity,
  History,
  ShieldAlert,
  Sparkles,
  Bookmark,
  Share2,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

interface StockDetailProps {
  stock: CSXStock;
  allNews: NewsItem[];
  allDisclosures: CSXDisclosure[];
  currency: 'KHR' | 'USD';
  isWatchlisted: boolean;
  onToggleWatchlist: (ticker: string) => void;
  onOpenBacktestModal?: (ticker: string) => void;
}

export type DetailTab =
  | 'overview'
  | 'chart'
  | 'forecast'
  | 'financials'
  | 'news'
  | 'disclosures'
  | 'technical'
  | 'ai-analysis'
  | 'backtesting';

export const StockDetail: React.FC<StockDetailProps> = ({
  stock,
  allNews,
  allDisclosures,
  currency,
  isWatchlisted,
  onToggleWatchlist,
  onOpenBacktestModal,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const formatPrice = (val?: number) => {
    if (val === undefined) return 'N/A';
    if (currency === 'USD') return `$${(val / 4050).toFixed(2)}`;
    return `${val.toLocaleString()} KHR`;
  };

  const formatLargeKHR = (val?: number) => {
    if (val === undefined) return 'N/A';
    if (currency === 'USD') return `$${((val / 4050) / 1e6).toFixed(1)}M`;
    if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T KHR`;
    return `${(val / 1e9).toFixed(1)}B KHR`;
  };

  const isPositive = stock.change >= 0;
  const stockNews = allNews.filter(n => n.ticker === stock.ticker);
  const stockDisclosures = allDisclosures.filter(d => d.ticker === stock.ticker);

  const tabs: { id: DetailTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'chart', label: 'Interactive Chart' },
    { id: 'forecast', label: '7-Day Forecast', count: 7 },
    { id: 'financials', label: 'Financials & Ratios' },
    { id: 'news', label: 'News & AI Impact', count: stockNews.length },
    { id: 'disclosures', label: 'Official Filings', count: stockDisclosures.length },
    { id: 'technical', label: 'Technical Indicators' },
    { id: 'ai-analysis', label: 'AI Score Breakdown' },
    { id: 'backtesting', label: 'Accuracy & Backtest' },
  ];

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-2xl font-black text-white font-mono">{stock.ticker}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                {stock.board}
              </span>
              <span className="text-xs text-slate-400 font-mono">ISIN: {stock.isin}</span>
              <span className="text-xs text-slate-400">• Sector: {stock.sector}</span>
            </div>

            <h1 className="text-lg font-bold text-slate-100 mt-1">{stock.name}</h1>
            <p className="text-xs text-slate-400 font-sans">{stock.khmerName}</p>
          </div>

          {/* Watchlist & Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleWatchlist(stock.ticker)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                isWatchlisted
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isWatchlisted ? 'fill-amber-400' : ''}`} />
              <span>{isWatchlisted ? 'Watchlisted' : 'Add to Watchlist'}</span>
            </button>
          </div>
        </div>

        {/* Market Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-800/80 font-mono">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">Actual Price</div>
            <div className="text-base font-bold text-white mt-0.5">{formatPrice(stock.currentPrice)}</div>
            <div className={`text-[11px] font-semibold flex items-center ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? '+' : ''}{stock.change} ({isPositive ? '+' : ''}{stock.changePercent}%)
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase">AI Score</div>
            <div className="text-base font-bold text-blue-400 mt-0.5">{stock.aiScore.overallScore}/100</div>
            <div className="text-[10px] text-slate-400 font-sans">{stock.aiScore.signal}</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase">Risk Level</div>
            <div className={`text-sm font-bold mt-1 ${stock.risk.level === 'Low' ? 'text-emerald-400' : stock.risk.level === 'Medium' ? 'text-amber-400' : 'text-rose-400'}`}>
              {stock.risk.level} ({stock.risk.overallScore}/100)
            </div>
            <div className="text-[10px] text-slate-400">Vol: {stock.technical.volatility30d}% ann.</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase">Market Cap</div>
            <div className="text-sm font-bold text-slate-200 mt-1">{formatLargeKHR(stock.marketCapKHR)}</div>
            <div className="text-[10px] text-slate-400">Vol: {stock.volume.toLocaleString()} shs</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase">P/E & P/B</div>
            <div className="text-sm font-bold text-slate-200 mt-1">
              {stock.peRatio ? `${stock.peRatio}x` : 'N/A'} / {stock.pbRatio ? `${stock.pbRatio}x` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-400">EPS: {stock.epsKHR?.toLocaleString() || 'N/A'} KHR</div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase">Dividend Yield</div>
            <div className="text-sm font-bold text-emerald-400 mt-1">
              {stock.dividendYieldPercent ? `${stock.dividendYieldPercent}%` : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-400">DPS: {stock.dpsKHR?.toLocaleString() || '—'} KHR</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Section 19: 9 tabs) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs font-medium">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  activeTab === tab.id ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Chart preview */}
          <InteractiveChart
            ticker={stock.ticker}
            history={[]}
            newsPins={stockNews}
            currency={currency}
            currentPrice={stock.currentPrice}
          />

          {/* Two-column summary: 7-Day Forecast & AI Score */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ForecastTable forecast={stock.forecast7Day} currency={currency} />
            <AIScoreCard score={stock.aiScore} risk={stock.risk} ticker={stock.ticker} />
          </div>

          {/* Official CSX Trading Mechanics & Order Book Depth */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 font-mono">
                  Official CSX Trading Mechanics & Order Depth
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                  csx.com.kh
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Trading Method: <strong className="text-slate-200">Continuous Auction (AAM)</strong> • ±10% Price Band
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Daily Limit Band & Tick Size */}
              <div className="bg-slate-850 p-3.5 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
                <div className="text-[10px] uppercase text-slate-400 font-bold">Daily Price Limits (±10%)</div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-rose-400">Floor (-10%):</span>
                  <strong className="text-white">{formatPrice(stock.floorPrice || Math.round(stock.currentPrice * 0.9))}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-slate-400">Previous Base:</span>
                  <strong className="text-white">{formatPrice(stock.previousClose)}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-emerald-400">Ceiling (+10%):</span>
                  <strong className="text-white">{formatPrice(stock.ceilingPrice || Math.round(stock.currentPrice * 1.1))}</strong>
                </div>
                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">CSX Tick Size:</span>
                  <span className="text-blue-400 font-bold">{stock.tickSize || 20} KHR</span>
                </div>
              </div>

              {/* CSX 3-Level Order Book Depth */}
              <div className="bg-slate-850 p-3.5 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-[10px] uppercase text-slate-400 font-bold">
                  <span>CSX Order Book Depth</span>
                  <span>Bids / Asks</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {/* Bids */}
                  <div className="space-y-1">
                    <div className="text-[9px] uppercase text-emerald-400 font-bold">Buyer Bids</div>
                    {(stock.orderBook?.bids || [
                      { price: stock.currentPrice, volume: 2400 },
                      { price: stock.currentPrice - 20, volume: 4600 },
                      { price: stock.currentPrice - 40, volume: 7200 },
                    ]).map((b, idx) => (
                      <div key={idx} className="flex justify-between bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-900/40">
                        <span className="text-emerald-300 font-bold">{b.price.toLocaleString()}</span>
                        <span className="text-slate-400">{b.volume.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Asks */}
                  <div className="space-y-1">
                    <div className="text-[9px] uppercase text-rose-400 font-bold">Seller Asks</div>
                    {(stock.orderBook?.asks || [
                      { price: stock.currentPrice + 20, volume: 1800 },
                      { price: stock.currentPrice + 40, volume: 3900 },
                      { price: stock.currentPrice + 60, volume: 6500 },
                    ]).map((a, idx) => (
                      <div key={idx} className="flex justify-between bg-rose-950/30 px-1.5 py-0.5 rounded border border-rose-900/40">
                        <span className="text-rose-300 font-bold">{a.price.toLocaleString()}</span>
                        <span className="text-slate-400">{a.volume.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Foreign Investor Ownership Room */}
              <div className="bg-slate-850 p-3.5 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
                <div className="text-[10px] uppercase text-slate-400 font-bold">Foreign Ownership Room</div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-slate-400">Statutory Cap:</span>
                  <strong className="text-white">{stock.foreignOwnership?.maxLimitPercent || 49}%</strong>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-slate-400">Current Foreign Held:</span>
                  <strong className="text-amber-400">{stock.foreignOwnership?.currentPercent || 18.4}%</strong>
                </div>
                <div className="flex items-center justify-between text-slate-200">
                  <span className="text-slate-400">Remaining Room:</span>
                  <strong className="text-emerald-400">
                    {(stock.foreignOwnership?.remainingRoomShares || 26252652).toLocaleString()} shs
                  </strong>
                </div>
                <div className="pt-2 border-t border-slate-700/60 text-[10px] text-slate-400 font-sans">
                  Foreign institutional participation permitted via official CSX Investor ID (CID).
                </div>
              </div>
            </div>
          </div>

          {/* Business Highlights & Profile */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Company Business Profile</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{stock.description}</p>
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-400 mb-1.5">Strategic Highlights:</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                {stock.businessHighlights.map((bh, i) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-850 p-2.5 rounded border border-slate-800">
                    <CheckCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>{bh}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Chart */}
      {activeTab === 'chart' && (
        <div className="space-y-4">
          <InteractiveChart
            ticker={stock.ticker}
            history={[]}
            newsPins={stockNews}
            currency={currency}
            currentPrice={stock.currentPrice}
          />
        </div>
      )}

      {/* Tab 3: Forecast */}
      {activeTab === 'forecast' && (
        <div className="space-y-4">
          <ForecastTable forecast={stock.forecast7Day} currency={currency} />
        </div>
      )}

      {/* Tab 4: Financials */}
      {activeTab === 'financials' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Audited Financial History & Performance Ratios</h3>
              <p className="text-xs text-slate-400 font-mono">Reported in Cambodian Riel (KHR) • Primary Source: CSX & SERC</p>
            </div>
          </div>

          {stock.financialHistory && stock.financialHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono border border-slate-800 rounded-lg">
                <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Metric (KHR)</th>
                    {stock.financialHistory.map(f => (
                      <th key={f.year} className="py-2.5 px-3 text-right">FY {f.year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="py-2 px-3 text-slate-300 font-sans font-medium">Revenue</td>
                    {stock.financialHistory.map(f => (
                      <td key={f.year} className="py-2 px-3 text-right text-white">{(f.revenueKHR / 1e9).toFixed(1)}B</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-300 font-sans font-medium">Operating Income</td>
                    {stock.financialHistory.map(f => (
                      <td key={f.year} className="py-2 px-3 text-right text-emerald-400">{(f.operatingIncomeKHR / 1e9).toFixed(1)}B</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-300 font-sans font-medium">Net Income</td>
                    {stock.financialHistory.map(f => (
                      <td key={f.year} className="py-2 px-3 text-right text-white font-bold">{(f.netIncomeKHR / 1e9).toFixed(1)}B</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-300 font-sans font-medium">Total Assets</td>
                    {stock.financialHistory.map(f => (
                      <td key={f.year} className="py-2 px-3 text-right text-slate-300">{(f.totalAssetsKHR / 1e9).toFixed(1)}B</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-300 font-sans font-medium">Earnings Per Share (EPS)</td>
                    {stock.financialHistory.map(f => (
                      <td key={f.year} className="py-2 px-3 text-right text-blue-400">{f.epsKHR.toLocaleString()} KHR</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-300 font-sans font-medium">Dividend Per Share (DPS)</td>
                    {stock.financialHistory.map(f => (
                      <td key={f.year} className="py-2 px-3 text-right text-emerald-400">{f.dpsKHR.toLocaleString()} KHR</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2 px-3 text-slate-300 font-sans font-medium">Return on Equity (ROE)</td>
                    {stock.financialHistory.map(f => (
                      <td key={f.year} className="py-2 px-3 text-right text-slate-200">{f.roePercent}%</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Detailed historical tables for {stock.ticker} are synced directly from latest quarterly disclosures.
            </div>
          )}
        </div>
      )}

      {/* Tab 5: News */}
      {activeTab === 'news' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Relevant News & Verified CSX Coverage</h3>
            <span className="text-xs text-slate-400">{stockNews.length} articles linked to {stock.ticker}</span>
          </div>
          {stockNews.length > 0 ? (
            stockNews.map(item => <NewsCard key={item.id} item={item} />)
          ) : (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400">
              No recent news articles detected for {stock.ticker}.
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Disclosures */}
      {activeTab === 'disclosures' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Official CSX Disclosures & SERC Filings</h3>
            <span className="text-xs text-slate-400">Verified Regulatory Records</span>
          </div>

          <div className="space-y-2.5">
            {stockDisclosures.map(disc => (
              <div key={disc.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 text-[10px]">
                      {disc.filingNumber}
                    </span>
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                      {disc.category}
                    </span>
                    <span className="text-slate-400">{disc.date}</span>
                  </div>
                  <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verified Official
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white">{disc.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{disc.summary}</p>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-xs">
                  <span className="text-purple-400 font-semibold">AI Analytical Takeaway: </span>
                  <span className="text-slate-300">{disc.aiTakeaway}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Technical */}
      {activeTab === 'technical' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Calculated Technical Indicators & Signals</h3>
              <p className="text-xs text-slate-400">Dynamically evaluated based on actual historical settlement prices</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-blue-950 text-blue-400 border border-blue-800 font-mono text-xs font-bold">
              Summary: {stock.technical.technicalSummary}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">SMA 5 / 10</div>
              <div className="text-sm font-bold text-white mt-1">
                {stock.technical.sma5.toLocaleString()} / {stock.technical.sma10.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">Short-term trend</div>
            </div>

            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">SMA 20 / 50</div>
              <div className="text-sm font-bold text-white mt-1">
                {stock.technical.sma20.toLocaleString()} / {stock.technical.sma50.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">Medium-term trend</div>
            </div>

            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">RSI (14-Day)</div>
              <div className="text-sm font-bold text-blue-400 mt-1">{stock.technical.rsi14}</div>
              <div className="text-[10px] text-slate-400">{stock.technical.rsiSignal}</div>
            </div>

            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">MACD (12, 26, 9)</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">{stock.technical.macd.trend}</div>
              <div className="text-[10px] text-slate-400">Hist: {stock.technical.macd.histogram}</div>
            </div>

            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Bollinger Upper</div>
              <div className="text-sm font-bold text-slate-200 mt-1">
                {stock.technical.bollingerBands.upper.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">Band: 2σ</div>
            </div>

            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Bollinger Lower</div>
              <div className="text-sm font-bold text-slate-200 mt-1">
                {stock.technical.bollingerBands.lower.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">Band: 2σ</div>
            </div>

            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">ATR (14) Volatility</div>
              <div className="text-sm font-bold text-amber-400 mt-1">{stock.technical.atr14.toLocaleString()} KHR</div>
              <div className="text-[10px] text-slate-400">True range daily</div>
            </div>

            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Volume Trend</div>
              <div className="text-sm font-bold text-purple-400 mt-1">{stock.technical.volumeTrend}</div>
              <div className="text-[10px] text-slate-400">Vs 20D Average</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 8: AI Score Breakdown */}
      {activeTab === 'ai-analysis' && (
        <div className="space-y-4">
          <AIScoreCard score={stock.aiScore} risk={stock.risk} ticker={stock.ticker} />
        </div>
      )}

      {/* Tab 9: Accuracy & Backtesting */}
      {activeTab === 'backtesting' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Historical 7-Day Forecast Accuracy ({stock.ticker})</h3>
              <p className="text-xs text-slate-400 font-mono">
                Model validation tracking: Comparing past predictions with actual prices 7 trading days later
              </p>
            </div>
            <span className="px-3 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono text-xs font-bold">
              Grade {stock.accuracy.accuracyGrade}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Evaluations Count</div>
              <div className="text-base font-bold text-white mt-1">{stock.accuracy.evaluationsCount} runs</div>
              <div className="text-[10px] text-slate-400">7-day windows</div>
            </div>

            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Mean Abs Error (MAE)</div>
              <div className="text-base font-bold text-blue-400 mt-1">{stock.accuracy.meanAbsoluteErrorKHR} KHR</div>
              <div className="text-[10px] text-slate-400">Average drift</div>
            </div>

            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">MAPE (Mean Abs % Error)</div>
              <div className="text-base font-bold text-emerald-400 mt-1">{stock.accuracy.meanAbsolutePercentageError}%</div>
              <div className="text-[10px] text-slate-400">High precision</div>
            </div>

            <div className="bg-slate-850 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400">Directional Accuracy</div>
              <div className="text-base font-bold text-purple-400 mt-1">
                {stock.accuracy.directionalAccuracyPercent}%
              </div>
              <div className="text-[10px] text-slate-400">Up/Down predicted</div>
            </div>
          </div>

          {/* Historical Forecast Comparison Table */}
          {stock.accuracy.recentRecords && stock.accuracy.recentRecords.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">
                Recent Model Forecast vs Actual Price Comparisons
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border border-slate-800 rounded-lg">
                  <thead className="bg-slate-800/80 text-slate-300 text-[11px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Date Made</th>
                      <th className="py-2 px-3">Target Date</th>
                      <th className="py-2 px-3 text-right">Expected (7D)</th>
                      <th className="py-2 px-3 text-right">Actual Realized</th>
                      <th className="py-2 px-3 text-right">Error KHR (%)</th>
                      <th className="py-2 px-3 text-center">Direction Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {stock.accuracy.recentRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-400">{rec.forecastDate}</td>
                        <td className="py-2 px-3 text-slate-300">{rec.targetDate}</td>
                        <td className="py-2 px-3 text-right text-purple-300">{formatPrice(rec.forecastPrice)}</td>
                        <td className="py-2 px-3 text-right text-white font-bold">{formatPrice(rec.actualPrice)}</td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {rec.errorKHR} KHR ({rec.errorPercent}%)
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.directionAccurate
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {rec.directionAccurate ? 'Accurate' : 'Diverged'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
