import React from 'react';
import { NewsItem } from '../types/csx';
import { ExternalLink, Sparkles, AlertCircle, ArrowUpRight, ArrowDownRight, Minus, CheckCircle } from 'lucide-react';

interface NewsCardProps {
  item: NewsItem;
  onSelectTicker?: (ticker: string) => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item, onSelectTicker }) => {
  const isPositive = item.aiImpact.newsImpact === 'Positive';
  const isNegative = item.aiImpact.newsImpact === 'Negative';

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 space-y-3 transition">
      {/* Top Meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {item.ticker ? (
            <button
              onClick={() => onSelectTicker?.(item.ticker!)}
              className="font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/80 hover:bg-blue-900 transition cursor-pointer"
            >
              {item.ticker}
            </button>
          ) : (
            <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">CSX MARKET</span>
          )}
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-800/70 px-2 py-0.5 rounded">
            {item.eventType}
          </span>
          <span className="text-slate-400">{item.date}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
              isPositive
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                : isNegative
                ? 'bg-rose-950/80 text-rose-400 border-rose-800'
                : 'bg-amber-950/80 text-amber-400 border-amber-800'
            }`}
          >
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : isNegative ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {item.aiImpact.newsImpact} Impact
          </span>

          <span className="text-[10px] text-slate-400 font-mono">
            Priced in: <strong className="text-slate-200">{item.aiImpact.marketPricedIn}</strong>
          </span>
        </div>
      </div>

      {/* Headline & Summary */}
      <div>
        <h4 className="text-sm font-bold text-white leading-snug hover:text-blue-300 transition">
          {item.headline}
        </h4>
        {item.khmerHeadline && (
          <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">{item.khmerHeadline}</p>
        )}
        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{item.summary}</p>
      </div>

      {/* AI Impact Assessment Box */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
        <div className="flex items-center justify-between text-[11px] font-bold text-purple-400 uppercase tracking-wide">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            AI Analytical Assessment
          </span>
          <span className="text-slate-400 font-mono text-[10px]">Confidence: {item.aiImpact.impactConfidence}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400">Potential Business Effect:</span>
            <p className="text-slate-300 mt-0.5">{item.aiImpact.potentialBusinessEffect}</p>
          </div>
          <div>
            <span className="text-slate-400">Potential Financial Effect:</span>
            <p className="text-slate-300 mt-0.5">{item.aiImpact.potentialFinancialEffect}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="text-slate-400">
            <span className="text-amber-400/90 font-medium">Risk Factor:</span> {item.aiImpact.risk}
          </div>
          <div className="text-slate-400 font-mono text-[10px]">
            AI Score Adjustment: <strong className="text-emerald-400">+{item.aiImpact.scoreAdjustment} pts</strong>
          </div>
        </div>
      </div>

      {/* Source Link */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span>Source: <strong className="text-slate-300">{item.source}</strong></span>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition"
        >
          <span>View Primary Filing</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
