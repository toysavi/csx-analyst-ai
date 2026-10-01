import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Newspaper,
  CalendarDays,
  Bookmark,
  GitCompare,
  History,
  Target,
  Bot,
  Settings,
  AlertTriangle,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'stocks'
  | 'news'
  | 'forecasts'
  | 'watchlist'
  | 'compare'
  | 'backtesting'
  | 'accuracy'
  | 'chat'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  watchlistCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, watchlistCount }) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'stocks', label: 'CSX Stocks', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'forecasts', label: '7-Day Forecasts', icon: <CalendarDays className="w-4 h-4" />, badge: 'AI' },
    { id: 'news', label: 'News & Disclosures', icon: <Newspaper className="w-4 h-4" /> },
    { id: 'watchlist', label: 'Watchlist', icon: <Bookmark className="w-4 h-4" />, badge: watchlistCount || undefined },
    { id: 'compare', label: 'Compare Stocks', icon: <GitCompare className="w-4 h-4" /> },
    { id: 'backtesting', label: 'Backtesting Lab', icon: <History className="w-4 h-4" /> },
    { id: 'accuracy', label: 'Forecast Accuracy', icon: <Target className="w-4 h-4" />, badge: 'MAPE' },
    { id: 'chat', label: 'AI Analyst Chat', icon: <Bot className="w-4 h-4 text-amber-400" /> },
    { id: 'settings', label: 'Settings & Data', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-3 shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Compliance / Disclaimer Box */}
      <div className="mt-4 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Non-Guarantee Notice</span>
        </div>
        <p className="leading-relaxed text-[10px] text-slate-400">
          All forecasts and scores are quantitative estimates, NOT certified investment advice. CSX prices subject to market risk.
        </p>
        <div className="pt-1 border-t border-slate-700/50 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Feed: Demo (Grounded)</span>
          <span className="text-emerald-400">v2.4</span>
        </div>
      </div>
    </aside>
  );
};
