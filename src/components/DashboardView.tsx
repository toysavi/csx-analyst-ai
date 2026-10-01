import React from 'react';
import { CSXIndexData, CSXStock, NewsItem, CSXDisclosure } from '../types/csx';
import { StocksTableView } from './StocksTableView';
import { NewsCard } from './NewsCard';
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  Flame,
  Award,
} from 'lucide-react';

interface DashboardViewProps {
  indexData: CSXIndexData;
  stocks: CSXStock[];
  news: NewsItem[];
  disclosures: CSXDisclosure[];
  onSelectStock: (ticker: string) => void;
  onNavigateTab: (tab: any) => void;
  currency: 'KHR' | 'USD';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  indexData,
  stocks,
  news,
  disclosures,
  onSelectStock,
  onNavigateTab,
  currency,
}) => {
  const formatPrice = (val: number) => {
    if (currency === 'USD') return `$${(val / 4050).toFixed(2)}`;
    return `${val.toLocaleString()} KHR`;
  };

  const formatLargeKHR = (val?: number) => {
    if (val === undefined) return '—';
    if (currency === 'USD') return `$${((val / 4050) / 1e6).toFixed(1)}M`;
    if (val >= 1e12) return `${(val / 1e12).toFixed(2)}T KHR`;
    return `${(val / 1e9).toFixed(1)}B KHR`;
  };

  // Top AI Score stock
  const topScoreStock = [...stocks].sort((a, b) => b.aiScore.overallScore - a.aiScore.overallScore)[0] || stocks[0];

  // Highest 7-Day forecast upside
  const topForecastStock = [...stocks].sort(
    (a, b) => b.forecast7Day.expectedChange7DayPercent - a.forecast7Day.expectedChange7DayPercent
  )[0] || stocks[0];

  // Most active by volume
  const topVolumeStock = [...stocks].sort((a, b) => b.volume - a.volume)[0] || stocks[0];

  return (
    <div className="space-y-6">
      {/* Top Highlight Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: CSX Index */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CSX Main Index</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-white font-mono">{indexData.index.toFixed(2)}</span>
            <span
              className={`text-xs font-bold font-mono ${
                indexData.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {indexData.change >= 0 ? '+' : ''}{indexData.changePercent}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-mono flex items-center justify-between">
            <span>Vol: {indexData.volume.toLocaleString()}</span>
            <span>Val: {(indexData.valueKHR / 1e6).toFixed(0)}M KHR</span>
          </div>
        </div>

        {/* Card 2: Highest AI Score */}
        <div
          onClick={() => onSelectStock(topScoreStock.ticker)}
          className="bg-slate-900 border border-blue-900/40 hover:border-blue-700/60 rounded-xl p-4 shadow-sm cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-blue-400">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              Highest AI Score
            </span>
            <span className="font-mono text-white">{topScoreStock.ticker}</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-blue-400 font-mono">
              {topScoreStock.aiScore.overallScore}/100
            </span>
            <span className="text-xs font-semibold text-slate-300">{topScoreStock.name.split(' ')[0]}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-mono flex items-center justify-between">
            <span>Price: {formatPrice(topScoreStock.currentPrice)}</span>
            <span className="text-emerald-400">{topScoreStock.aiScore.signal}</span>
          </div>
        </div>

        {/* Card 3: 7-Day Forecast Top Upside */}
        <div
          onClick={() => onSelectStock(topForecastStock.ticker)}
          className="bg-slate-900 border border-purple-900/40 hover:border-purple-700/60 rounded-xl p-4 shadow-sm cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-purple-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              7-Day Forecast Upside
            </span>
            <span className="font-mono text-white">{topForecastStock.ticker}</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-purple-400 font-mono">
              +{topForecastStock.forecast7Day.expectedChange7DayPercent}%
            </span>
            <span className="text-xs text-slate-400">({topForecastStock.forecast7Day.confidenceScore}% conf)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-mono flex items-center justify-between">
            <span>Est: {formatPrice(topForecastStock.forecast7Day.targetPrice7Day)}</span>
            <span className="text-purple-300">Uncertainty Cone</span>
          </div>
        </div>

        {/* Card 4: Most Active Security */}
        <div
          onClick={() => onSelectStock(topVolumeStock.ticker)}
          className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-sm cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-400">
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              Volume Leader
            </span>
            <span className="font-mono text-white">{topVolumeStock.ticker}</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-200 font-mono">
              {topVolumeStock.volume.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">shares</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-mono flex items-center justify-between">
            <span>Turnover: {formatLargeKHR(topVolumeStock.tradingValueKHR)}</span>
            <span className={topVolumeStock.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {topVolumeStock.change >= 0 ? '+' : ''}{topVolumeStock.changePercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Demonstration Highlight: PAS Spotlight */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/50 border border-blue-800/40 rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-2xl space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500 text-white font-mono">
              DEMO BENCHMARK
            </span>
            <span className="text-xs font-bold text-blue-300">PAS — Sihanoukville Autonomous Port</span>
          </div>
          <h3 className="text-base font-bold text-white">
            Comprehensive Deep Dive: Port Infrastructure, JICA Expansion & Quantitative Modeling
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Examine our fully featured demonstration company featuring live settlement data (12,500 KHR), audited financial statements, technical indicator suite (RSI, SMA, Bollinger), recent JICA terminal milestones, and structured 7-day volatility forecasting.
          </p>
        </div>

        <button
          onClick={() => onSelectStock('PAS')}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-blue-600/30"
        >
          <span>Open Full PAS Analysis</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Stock Table */}
      <StocksTableView stocks={stocks} onSelectStock={onSelectStock} currency={currency} />

      {/* News & Disclosures Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Latest News Articles with AI Impact */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
              <span>Latest News & AI Impact Assessments</span>
            </h3>
            <button
              onClick={() => onNavigateTab('news')}
              className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>View All News</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {news.slice(0, 3).map(item => (
              <NewsCard key={item.id} item={item} onSelectTicker={onSelectStock} />
            ))}
          </div>
        </div>

        {/* Latest Official CSX Filings & Disclosures */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Official CSX Disclosures & SERC Filings
            </h3>
            <button
              onClick={() => onNavigateTab('news')}
              className="text-xs text-blue-400 hover:text-blue-300 transition flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>All Filings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {disclosures.slice(0, 3).map(disc => (
              <div
                key={disc.id}
                onClick={() => onSelectStock(disc.ticker)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 space-y-2 cursor-pointer transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 text-[10px]">
                      {disc.ticker}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {disc.category}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{disc.date}</span>
                  </div>
                  <span className="text-emerald-400 text-[10px] font-semibold">Verified Filing</span>
                </div>

                <h4 className="text-xs font-bold text-white leading-snug">{disc.title}</h4>
                <p className="text-[11px] text-slate-300 line-clamp-2">{disc.summary}</p>

                <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] text-slate-300">
                  <span className="text-purple-400 font-semibold">AI Takeaway: </span>
                  <span>{disc.aiTakeaway}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
