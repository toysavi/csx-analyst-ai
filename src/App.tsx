/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CSXStock, CSXIndexData, NewsItem, CSXDisclosure, MarketAlert } from './types/csx';
import { CSX_INDEX_DATA, INITIAL_NEWS, INITIAL_DISCLOSURES, INITIAL_ALERTS, buildCSXStocks } from './services/csxMockData';
import { TickerBar } from './components/TickerBar';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { StocksTableView } from './components/StocksTableView';
import { StockDetail } from './components/StockDetail';
import { NewsCard } from './components/NewsCard';
import { CompareView } from './components/CompareView';
import { BacktestingView } from './components/BacktestingView';
import { SettingsView } from './components/SettingsView';
import { ForecastTable } from './components/ForecastTable';
import { AIChatModal } from './components/AIChatModal';
import { DailyPipelineModal } from './components/DailyPipelineModal';
import { AlertsModal } from './components/AlertsModal';

export default function App() {
  const [stocks, setStocks] = useState<CSXStock[]>(() => buildCSXStocks());
  const [indexData, setIndexData] = useState<CSXIndexData>(CSX_INDEX_DATA);
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);
  const [disclosures, setDisclosures] = useState<CSXDisclosure[]>(INITIAL_DISCLOSURES);
  const [alerts, setAlerts] = useState<MarketAlert[]>(INITIAL_ALERTS);

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedTicker, setSelectedTicker] = useState<string>('PAS');
  const [viewingStockDetail, setViewingStockDetail] = useState(false);

  const [currency, setCurrency] = useState<'KHR' | 'USD'>('KHR');
  const [language, setLanguage] = useState<'EN' | 'KH'>('EN');
  const [watchlist, setWatchlist] = useState<string[]>(['PAS', 'PPAP']);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPipelineOpen, setIsPipelineOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  // Initial data loading from server API
  useEffect(() => {
    async function loadData() {
      try {
        const [stocksRes, overviewRes, newsRes, disclosuresRes, alertsRes] = await Promise.all([
          fetch('/api/csx/stocks').catch(() => null),
          fetch('/api/csx/market-overview').catch(() => null),
          fetch('/api/csx/news').catch(() => null),
          fetch('/api/csx/disclosures').catch(() => null),
          fetch('/api/csx/alerts').catch(() => null),
        ]);

        if (stocksRes && stocksRes.ok) {
          const data = await stocksRes.json();
          if (Array.isArray(data) && data.length > 0) setStocks(data);
        }
        if (overviewRes && overviewRes.ok) {
          const data = await overviewRes.json();
          if (data && data.index) setIndexData(data);
        }
        if (newsRes && newsRes.ok) {
          const data = await newsRes.json();
          if (Array.isArray(data)) setNews(data);
        }
        if (disclosuresRes && disclosuresRes.ok) {
          const data = await disclosuresRes.json();
          if (Array.isArray(data)) setDisclosures(data);
        }
        if (alertsRes && alertsRes.ok) {
          const data = await alertsRes.json();
          if (Array.isArray(data)) setAlerts(data);
        }
      } catch (err) {
        console.warn('Using client fallback data while server connects:', err);
      }
    }
    loadData();
  }, []);

  const handleSelectStock = (ticker: string) => {
    setSelectedTicker(ticker);
    setViewingStockDetail(true);
  };

  const handleToggleWatchlist = (ticker: string) => {
    setWatchlist(prev =>
      prev.includes(ticker) ? prev.filter(t => t !== ticker) : [...prev, ticker]
    );
  };

  const handleTabChange = (tab: NavTab) => {
    if (tab === 'chat') {
      setIsChatOpen(true);
      return;
    }
    setViewingStockDetail(false);
    setCurrentTab(tab);
  };

  const currentStock = stocks.find(s => s.ticker === selectedTicker) || stocks[0];
  const unreadAlertsCount = alerts.filter(a => !a.read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Ticker Bar (CSX Index & Segment Status) */}
      <TickerBar
        indexData={indexData}
        currency={currency}
        onCurrencyToggle={() => setCurrency(prev => (prev === 'KHR' ? 'USD' : 'KHR'))}
        language={language}
        onLanguageToggle={() => setLanguage(prev => (prev === 'EN' ? 'KH' : 'EN'))}
      />

      {/* Main App Navbar */}
      <Navbar
        stocks={stocks}
        onSelectStock={handleSelectStock}
        onOpenAIChat={() => setIsChatOpen(true)}
        onOpenDailyPipeline={() => setIsPipelineOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        unreadAlertsCount={unreadAlertsCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={viewingStockDetail ? ('stocks' as NavTab) : currentTab}
          onTabChange={handleTabChange}
          watchlistCount={watchlist.length}
        />

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {/* Breadcrumb if viewing detail */}
          {viewingStockDetail && (
            <div className="mb-4 flex items-center gap-2 text-xs font-mono text-slate-400">
              <button
                onClick={() => setViewingStockDetail(false)}
                className="hover:text-blue-400 transition cursor-pointer"
              >
                CSX Stocks
              </button>
              <span>/</span>
              <span className="text-white font-bold">{selectedTicker}</span>
            </div>
          )}

          {/* View rendering */}
          {viewingStockDetail ? (
            <StockDetail
              stock={currentStock}
              allNews={news}
              allDisclosures={disclosures}
              currency={currency}
              isWatchlisted={watchlist.includes(currentStock.ticker)}
              onToggleWatchlist={handleToggleWatchlist}
            />
          ) : currentTab === 'dashboard' ? (
            <DashboardView
              indexData={indexData}
              stocks={stocks}
              news={news}
              disclosures={disclosures}
              onSelectStock={handleSelectStock}
              onNavigateTab={setCurrentTab}
              currency={currency}
            />
          ) : currentTab === 'stocks' ? (
            <StocksTableView
              stocks={stocks}
              onSelectStock={handleSelectStock}
              currency={currency}
            />
          ) : currentTab === 'forecasts' ? (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-base font-bold text-white">7-Day Quantitative Price Forecasts</h2>
                <p className="text-xs text-slate-400 font-mono">
                  Multi-factor models incorporating momentum, volatility expansion, and news impact across all CSX equities
                </p>
              </div>

              {/* Cross-stock 7-Day Forecast summaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {stocks.map(s => (
                  <div key={s.ticker} className="space-y-2">
                    <div className="flex items-center justify-between text-xs px-1">
                      <button
                        onClick={() => handleSelectStock(s.ticker)}
                        className="font-bold text-white font-mono hover:text-blue-400 transition cursor-pointer"
                      >
                        {s.ticker} — {s.name}
                      </button>
                      <span className="text-slate-400 font-mono">Actual: {s.currentPrice.toLocaleString()} KHR</span>
                    </div>
                    <ForecastTable forecast={s.forecast7Day} currency={currency} />
                  </div>
                ))}
              </div>
            </div>
          ) : currentTab === 'news' ? (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-base font-bold text-white">News Intelligence & CSX Disclosures</h2>
                <p className="text-xs text-slate-400 font-mono">
                  Verified announcements from Cambodia Securities Exchange, SERC, and leading local economic sources
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {news.map(item => (
                  <NewsCard key={item.id} item={item} onSelectTicker={handleSelectStock} />
                ))}
              </div>
            </div>
          ) : currentTab === 'watchlist' ? (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-base font-bold text-white">My Watchlist ({watchlist.length})</h2>
                <p className="text-xs text-slate-400 font-mono">
                  Monitored securities on Cambodia Securities Exchange
                </p>
              </div>
              <StocksTableView
                stocks={stocks.filter(s => watchlist.includes(s.ticker))}
                onSelectStock={handleSelectStock}
                currency={currency}
              />
            </div>
          ) : currentTab === 'compare' ? (
            <CompareView stocks={stocks} onSelectStock={handleSelectStock} currency={currency} />
          ) : currentTab === 'backtesting' || currentTab === 'accuracy' ? (
            <BacktestingView stocks={stocks} currency={currency} />
          ) : currentTab === 'settings' ? (
            <SettingsView
              currency={currency}
              onCurrencyToggle={() => setCurrency(prev => (prev === 'KHR' ? 'USD' : 'KHR'))}
              language={language}
              onLanguageToggle={() => setLanguage(prev => (prev === 'EN' ? 'KH' : 'EN'))}
            />
          ) : null}
        </main>
      </div>

      {/* AI Analyst Chat Modal */}
      <AIChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        selectedStock={currentStock}
        stocks={stocks}
      />

      {/* Daily Analysis Pipeline Modal */}
      <DailyPipelineModal
        isOpen={isPipelineOpen}
        onClose={() => setIsPipelineOpen(false)}
        onRunSuccess={() => {
          // Add a notification alert
          setAlerts(prev => [
            {
              id: `alert-${Date.now()}`,
              ticker: 'CSX',
              type: 'SCORE_CHANGE',
              severity: 'info',
              title: 'Daily Analysis Pipeline Completed',
              message: 'Refreshed 10 CSX stocks, recalculated indicators and 7-day forecast bands.',
              timestamp: new Date().toISOString(),
              read: false,
            },
            ...prev,
          ]);
        }}
      />

      {/* Market Alerts Modal */}
      <AlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onMarkAllAsRead={() => setAlerts(prev => prev.map(a => ({ ...a, read: true })))}
        onSelectStock={handleSelectStock}
      />
    </div>
  );
}
