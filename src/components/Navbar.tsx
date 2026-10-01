import React from 'react';
import { Search, Sparkles, Bell, PlayCircle, BarChart3, HelpCircle } from 'lucide-react';
import { CSXStock } from '../types/csx';

interface NavbarProps {
  stocks: CSXStock[];
  onSelectStock: (ticker: string) => void;
  onOpenAIChat: () => void;
  onOpenDailyPipeline: () => void;
  onOpenAlerts: () => void;
  unreadAlertsCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stocks,
  onSelectStock,
  onOpenAIChat,
  onOpenDailyPipeline,
  onOpenAlerts,
  unreadAlertsCount,
  searchQuery,
  onSearchChange,
}) => {
  const filteredSearch = searchQuery.trim()
    ? stocks.filter(
        s =>
          s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-lg tracking-wider">
            CSX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">CSX AI ANALYST</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                PRO TERMINAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Cambodia Securities Exchange Research & 7-Day Forecast</p>
          </div>
        </div>

        {/* Search Bar with Quick Dropdown */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search CSX ticker or company (e.g. PAS, PPAP, ABC)..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-sans"
            />
          </div>

          {filteredSearch.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50">
              {filteredSearch.map(s => (
                <button
                  key={s.ticker}
                  onClick={() => {
                    onSelectStock(s.ticker);
                    onSearchChange('');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-center justify-between border-b border-slate-800/50 text-xs transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono">{s.ticker}</span>
                    <span className="text-slate-300 truncate max-w-[200px]">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-200">{s.currentPrice.toLocaleString()} KHR</span>
                    <span className={`text-[11px] ${s.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.change >= 0 ? '+' : ''}{s.changePercent}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Daily Pipeline Button */}
          <button
            onClick={onOpenDailyPipeline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/90 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer shadow-sm"
            title="Execute 12-step daily market data, disclosure ingestion, & forecast calculation"
          >
            <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Daily Pipeline</span>
          </button>

          {/* AI Chat Button */}
          <button
            onClick={onOpenAIChat}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            title="Ask AI Analyst questions regarding CSX companies, forecasts, or risks"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Analyst</span>
          </button>

          {/* Alerts Notification Button */}
          <button
            onClick={onOpenAlerts}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="View market alerts and notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadAlertsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
