import React from 'react';
import { CSXIndexData } from '../types/csx';
import { TrendingUp, TrendingDown, Clock, ShieldCheck, Activity } from 'lucide-react';

interface TickerBarProps {
  indexData: CSXIndexData;
  currency: 'KHR' | 'USD';
  onCurrencyToggle: () => void;
  language: 'EN' | 'KH';
  onLanguageToggle: () => void;
}

export const TickerBar: React.FC<TickerBarProps> = ({
  indexData,
  currency,
  onCurrencyToggle,
  language,
  onLanguageToggle,
}) => {
  const isPositive = indexData.change >= 0;

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-xs text-slate-300 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
      {/* Index ticker & live indicator */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 font-mono">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800/60">
            CSX INDEX
          </span>
          <span className="text-white font-bold text-sm">{indexData.index.toFixed(2)}</span>
          <span className={`inline-flex items-center font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
            {isPositive ? '+' : ''}{indexData.change.toFixed(2)} ({isPositive ? '+' : ''}{indexData.changePercent.toFixed(2)}%)
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-slate-400 border-l border-slate-700/80 pl-3">
          <span>Vol: <strong className="text-slate-200">{indexData.volume.toLocaleString()}</strong> shs</span>
          <span>Val: <strong className="text-slate-200">{(indexData.valueKHR / 1e6).toFixed(1)}M</strong> KHR</span>
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">▲ {indexData.advancing}</span>
            <span className="text-rose-400 font-semibold">▼ {indexData.declining}</span>
            <span className="text-slate-400">● {indexData.unchanged}</span>
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50 font-mono">
          <Clock className="w-3 h-3 text-blue-400" />
          <span>CSX Feed: <strong className="text-slate-200">csx.com.kh</strong></span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-semibold">{indexData.tradingSession || 'Continuous Trading (09:00 - 14:50)'}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" title="Official CSX Market Feed Connected"></span>
        </div>
      </div>

      {/* Actual Data vs AI tag + Currency Switcher */}
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-1.5 bg-slate-800/90 text-slate-300 text-[11px] px-2.5 py-0.5 rounded border border-slate-700/70">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Strict Segregation:</span>
          <span className="bg-emerald-950/80 text-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded border border-emerald-800/50">ACTUAL</span>
          <span>vs</span>
          <span className="bg-purple-950/80 text-purple-300 text-[9px] font-bold px-1.5 py-0.2 rounded border border-purple-800/50">AI FORECAST</span>
        </div>

        {/* Currency Switcher */}
        <button
          onClick={onCurrencyToggle}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] border border-slate-700 transition flex items-center gap-1 cursor-pointer"
          title="Switch currency display between KHR and USD (1 USD ≈ 4,050 KHR)"
        >
          <span className={currency === 'KHR' ? 'font-bold text-amber-400' : 'text-slate-400'}>KHR</span>
          <span className="text-slate-500">/</span>
          <span className={currency === 'USD' ? 'font-bold text-emerald-400' : 'text-slate-400'}>USD</span>
        </button>

        {/* Language Preview */}
        <button
          onClick={onLanguageToggle}
          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] border border-slate-700 transition cursor-pointer"
          title="Toggle English / Khmer language terms"
        >
          {language === 'EN' ? '🇰🇭 KH Preview' : '🇬🇧 EN'}
        </button>
      </div>
    </div>
  );
};
