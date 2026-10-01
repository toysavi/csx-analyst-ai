import React, { useState, useEffect } from 'react';
import { 
  X, RefreshCw, CheckCircle2, Database, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Edit3, Save, Copy, Check, 
  Terminal, FileText, Activity
} from 'lucide-react';
import { CSXStock, CSXIndexData } from '../types/csx';

interface LiveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: CSXStock[];
  indexData: CSXIndexData;
  onSyncComplete: (updatedStocks: CSXStock[], newIndexData: CSXIndexData) => void;
  dbStatus?: any;
}

export const LiveSyncModal: React.FC<LiveSyncModalProps> = ({
  isOpen,
  onClose,
  stocks,
  indexData,
  onSyncComplete,
  dbStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'quotes' | 'batch' | 'api' | 'mongodb'>('quotes');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [inputPrice, setInputPrice] = useState<string>('');
  const [inputVolume, setInputVolume] = useState<string>('');
  const [isUpdatingSingle, setIsUpdatingSingle] = useState(false);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [copiedQueryUrl, setCopiedQueryUrl] = useState<string | null>(null);

  // Fetch sync history when MongoDB tab is active
  useEffect(() => {
    if (isOpen && activeTab === 'mongodb') {
      setIsLoadingHistory(true);
      fetch('/api/csx/sync/history')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setSyncHistory(data);
        })
        .catch(err => console.warn('Could not load sync history:', err))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [isOpen, activeTab]);

  // Batch paste state
  const [batchText, setBatchText] = useState<string>(
    'PWSA  7240  15400\nGTI   2800   5200\nPPAP 13500   8100\nPPSP  2150  45000\nPAS  12800  23000\nABC   9480  89000\nDBDE  2100  12000\nJSL   4700   3500\nCGSM  2420 180000\nMJQE  2050 310000'
  );
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const [hasCopiedPython, setHasCopiedPython] = useState(false);
  const [hasCopiedCurl, setHasCopiedCurl] = useState(false);

  // Auto-sync polling
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);

  useEffect(() => {
    if (!autoSyncEnabled || !isOpen) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/csx/sync-live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = await res.json();
        if (data.success && data.stocks && data.indexData) {
          onSyncComplete(data.stocks, data.indexData);
        }
      } catch (e) {
        console.error('Auto-sync failed:', e);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, isOpen, onSyncComplete]);

  if (!isOpen) return null;

  const handleSimulateSync = async () => {
    setIsSyncing(true);
    setSyncStatusMessage(null);
    try {
      const res = await fetch('/api/csx/sync-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success && data.stocks && data.indexData) {
        onSyncComplete(data.stocks, data.indexData);
        setSyncStatusMessage(`Live auction tick synchronized! ${data.updatedCount} securities updated with recomputed indicators and 7-day forecasts.`);
      }
    } catch (err: any) {
      setSyncStatusMessage('Error synchronizing with market feed: ' + (err?.message || 'Network error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStartEdit = (stock: CSXStock) => {
    setEditingTicker(stock.ticker);
    setInputPrice(stock.currentPrice.toString());
    setInputVolume(stock.volume.toString());
  };

  const handleSaveStockPrice = async (ticker: string) => {
    const numPrice = Number(inputPrice);
    const numVolume = Number(inputVolume);
    if (isNaN(numPrice) || numPrice <= 0) return;

    setIsUpdatingSingle(true);
    try {
      const res = await fetch('/api/csx/update-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          price: numPrice,
          volume: isNaN(numVolume) ? undefined : numVolume,
        }),
      });
      const data = await res.json();
      if (data.success && data.stock && data.indexData) {
        const updatedList = stocks.map(s => (s.ticker === ticker ? data.stock : s));
        onSyncComplete(updatedList, data.indexData);
        setEditingTicker(null);
        setSyncStatusMessage(`Updated ${ticker} price to ${numPrice.toLocaleString()} KHR! Recomputed technical indicators & 7-day forecast.`);
      }
    } catch (err: any) {
      setSyncStatusMessage('Error updating stock: ' + (err?.message || 'Network error'));
    } finally {
      setIsUpdatingSingle(false);
    }
  };

  const handleBatchSync = async () => {
    setIsBatchSubmitting(true);
    setSyncStatusMessage(null);
    try {
      const res = await fetch('/api/csx/sync-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: batchText }),
      });
      const data = await res.json();
      if (data.success && data.stocks && data.indexData) {
        onSyncComplete(data.stocks, data.indexData);
        setSyncStatusMessage(`Successfully ingested and updated ${data.updatedCount} CSX securities from raw paste!`);
      } else {
        setSyncStatusMessage(data.details || 'No recognized tickers found in batch text.');
      }
    } catch (err: any) {
      setSyncStatusMessage('Failed batch sync: ' + (err?.message || 'Network error'));
    } finally {
      setIsBatchSubmitting(false);
    }
  };

  const pythonScriptCode = `import requests
import json
import time

# CSX Terminal API Endpoint
API_URL = "https://csx.toysavi.com/api/csx/sync-live"

# Sample Payload from CSX Trade or your Broker MTS feed
payload = {
    "customUpdates": [
        {"ticker": "PWSA", "price": 7240, "change": 20, "volume": 15400},
        {"ticker": "GTI",  "price": 2800, "change": -20, "volume": 5200},
        {"ticker": "PPAP", "price": 13500, "change": 100, "volume": 8100},
        {"ticker": "PPSP", "price": 2150, "change": 10, "volume": 45000},
        {"ticker": "PAS",  "price": 12800, "change": 200, "volume": 23000},
        {"ticker": "ABC",  "price": 9480, "change": -40, "volume": 89000},
        {"ticker": "DBDE", "price": 2100, "change": 0, "volume": 12000},
        {"ticker": "JSL",  "price": 4700, "change": 50, "volume": 3500},
        {"ticker": "CGSM", "price": 2420, "change": -10, "volume": 180000},
        {"ticker": "MJQE", "price": 2050, "change": 10, "volume": 310000}
    ]
}

def sync_csx_market():
    try:
        response = requests.post(API_URL, json=payload, timeout=10)
        data = response.json()
        print(f"[OK] Synced {data.get('updatedCount', 0)} securities. Index: {data.get('indexData', {}).get('index')}")
    except Exception as e:
        print(f"[ERROR] Sync failed: {e}")

if __name__ == "__main__":
    print("Sending live CSX market tick...")
    sync_csx_market()
`;

  const curlCommand = `curl -X POST https://csx.toysavi.com/api/csx/sync-live \\
  -H "Content-Type: application/json" \\
  -d '{
    "customUpdates": [
      {"ticker": "PWSA", "price": 7240, "volume": 15400},
      {"ticker": "ABC", "price": 9480, "volume": 89000},
      {"ticker": "PAS", "price": 12800, "volume": 23000}
    ]
  }'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                CSX Live Real-Time Market Synchronization
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Trading Hours: 08:00 - 15:00 ICT
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official market feeds, manual quote overrides, and automated cron ingestion for the Cambodia Securities Exchange
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'quotes'
                ? 'bg-slate-900 text-blue-400 border-slate-800 border-b-transparent shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Live Quotes & Price Editor
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'batch'
                ? 'bg-slate-900 text-blue-400 border-slate-800 border-b-transparent shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Batch Paste (CSV / Text / Table)
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'api'
                ? 'bg-slate-900 text-blue-400 border-slate-800 border-b-transparent shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Automated Python / Webhook Feed
          </button>
          <button
            onClick={() => setActiveTab('mongodb')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-t border-x cursor-pointer ${
              activeTab === 'mongodb'
                ? 'bg-slate-900 text-emerald-400 border-slate-800 border-b-transparent shadow-sm'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            MongoDB Storage & Easy Queries
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Status Message */}
          {syncStatusMessage && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{syncStatusMessage}</span>
            </div>
          )}

          {/* TAB 1: Live Quotes & Price Editor */}
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              {/* Quick Actions & Auto-poll */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Market Session Execution
                  </div>
                  <div className="text-slate-400 text-xs">
                    Continuous auction execution respecting CSX tick sizes and daily ±10% circuit breakers.
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
                    <input
                      type="checkbox"
                      checked={autoSyncEnabled}
                      onChange={e => setAutoSyncEnabled(e.target.checked)}
                      className="rounded border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>Auto-Refresh (Every 15s)</span>
                  </label>
                  <button
                    onClick={handleSimulateSync}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 cursor-pointer transition shadow-lg shadow-blue-500/10"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Market Tick Now'}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left font-mono">
                  <thead className="bg-slate-850 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Stock</th>
                      <th className="py-2.5 px-3">Current Price</th>
                      <th className="py-2.5 px-3">Daily Change</th>
                      <th className="py-2.5 px-3">Volume</th>
                      <th className="py-2.5 px-3">CSX ±10% Range</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {stocks.map(stock => {
                      const isEditing = editingTicker === stock.ticker;
                      const isPositive = stock.change >= 0;

                      return (
                        <tr key={stock.ticker} className="hover:bg-slate-850/50 transition">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-white">{stock.ticker}</div>
                            <div className="text-[10px] text-slate-400 font-sans truncate max-w-[140px]">{stock.name}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            {isEditing ? (
                              <input
                                type="number"
                                value={inputPrice}
                                onChange={e => setInputPrice(e.target.value)}
                                className="w-28 px-2 py-1 bg-slate-950 border border-blue-500 rounded text-white text-xs font-mono focus:outline-none"
                                step={stock.tickSize}
                              />
                            ) : (
                              <span className="text-white font-bold text-sm">
                                {stock.currentPrice.toLocaleString()} KHR
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                              {isPositive ? '+' : ''}{stock.changePercent}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            {isEditing ? (
                              <input
                                type="number"
                                value={inputVolume}
                                onChange={e => setInputVolume(e.target.value)}
                                className="w-24 px-2 py-1 bg-slate-950 border border-blue-500 rounded text-white text-xs font-mono focus:outline-none"
                              />
                            ) : (
                              <span className="text-slate-300">{stock.volume.toLocaleString()}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-400">
                            {stock.floorPrice.toLocaleString()} - {stock.ceilingPrice.toLocaleString()} KHR
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleSaveStockPrice(stock.ticker)}
                                  disabled={isUpdatingSingle}
                                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                                >
                                  <Save className="w-3 h-3" />
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingTicker(null)}
                                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans text-xs cursor-pointer transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(stock)}
                                className="px-2.5 py-1 rounded bg-slate-850 hover:bg-slate-750 text-blue-400 hover:text-blue-300 border border-slate-700 font-sans text-xs cursor-pointer transition"
                              >
                                Edit Price
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Batch Paste (CSV / Text / Table) */}
          {activeTab === 'batch' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Paste Daily Closing or Live Quotes from CSX / Broker
                </div>
                <p className="text-xs text-slate-400">
                  Copy and paste quotes directly from <strong>csx.com.kh</strong>, your broker MTS, or a spreadsheet. The parser automatically detects tickers (e.g. PWSA, ABC, PAS, CGSM), prices in KHR, and trade volumes!
                </p>
                <textarea
                  value={batchText}
                  onChange={e => setBatchText(e.target.value)}
                  rows={8}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Paste table or list e.g. PWSA 7240 15000"
                />
                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500">
                    Supports formats: Ticker Price Volume (space, tab, or comma separated)
                  </div>
                  <button
                    onClick={handleBatchSync}
                    disabled={isBatchSubmitting || !batchText.trim()}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 cursor-pointer transition shadow-lg shadow-emerald-600/20"
                  >
                    <RefreshCw className={`w-4 h-4 ${isBatchSubmitting ? 'animate-spin' : ''}`} />
                    {isBatchSubmitting ? 'Ingesting...' : 'Ingest & Update All CSX Stocks'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Automated Python & Webhook Feed */}
          {activeTab === 'api' && (
            <div className="space-y-4">
              <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-300 text-sm">
                  <Terminal className="w-4 h-4" />
                  Continuous Real-Time Integration via Python Script / Webhook
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  You can stream real-time price updates into this terminal automatically by running a lightweight Python script or cron job. It posts directly to the <strong>/api/csx/sync-live</strong> endpoint.
                </p>
              </div>

              {/* Python Script */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs font-mono">csx_sync.py (Production Automation Script)</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pythonScriptCode);
                      setHasCopiedPython(true);
                      setTimeout(() => setHasCopiedPython(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition"
                  >
                    {hasCopiedPython ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {hasCopiedPython ? 'Copied!' : 'Copy Script'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-800 max-h-56">
                  {pythonScriptCode}
                </pre>
              </div>

              {/* cURL Command */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs font-mono">Instant Test via cURL</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(curlCommand);
                      setHasCopiedCurl(true);
                      setTimeout(() => setHasCopiedCurl(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition"
                  >
                    {hasCopiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {hasCopiedCurl ? 'Copied!' : 'Copy cURL'}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl text-[11px] font-mono text-blue-300 overflow-x-auto border border-slate-800">
                  {curlCommand}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: MongoDB Database & Easy Queries */}
          {activeTab === 'mongodb' && (
            <div className="space-y-5">
              {/* Database Overview Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${dbStatus?.connected ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'}`}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-sm">
                        {dbStatus?.connected ? 'MongoDB Enterprise Engine' : 'In-Memory Fallback Engine'}
                      </h3>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${dbStatus?.connected ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-amber-950 text-amber-300 border border-amber-800'}`}>
                        {dbStatus?.connected ? 'CONNECTED' : 'STANDALONE MEMORY'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      DB: <span className="text-slate-200">{dbStatus?.database || 'csx_analyst'}</span> • Connection: <span className="text-slate-300">{dbStatus?.uri || 'mongodb://localhost:27017/csx_analyst'}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-[11px] text-slate-400">
                  <div>Last Synced to DB:</div>
                  <div className="text-emerald-400 font-semibold">{dbStatus?.lastSyncTime ? new Date(dbStatus.lastSyncTime).toLocaleTimeString() : 'Active'}</div>
                </div>
              </div>

              {/* Collections Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Collection: stocks</span>
                  <div className="text-lg font-bold text-white font-mono mt-1">
                    {dbStatus?.collections?.stocks ?? stocks.length}
                  </div>
                  <span className="text-[10px] text-blue-400 font-mono">CSX Listed Equities</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Collection: history</span>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                    {dbStatus?.collections?.historicalPrices ?? (stocks.length * 120)}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">OHLCV Candles</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Collection: news</span>
                  <div className="text-lg font-bold text-purple-400 font-mono mt-1">
                    {dbStatus?.collections?.news ?? 8}
                  </div>
                  <span className="text-[10px] text-purple-400 font-mono">Market Intel</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Collection: disclosures</span>
                  <div className="text-lg font-bold text-amber-400 font-mono mt-1">
                    {dbStatus?.collections?.disclosures ?? 6}
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono">SERC Filings</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Collection: sync_logs</span>
                  <div className="text-lg font-bold text-cyan-400 font-mono mt-1">
                    {dbStatus?.collections?.syncLogs ?? syncHistory.length}
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">Audit Trails</span>
                </div>
              </div>

              {/* Easy Query API Guide */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white text-xs">Easy REST Query Endpoints (Pre-built Filters)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Native JSON Endpoints</span>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Filter Main Board Stocks', url: '/api/csx/stocks?board=Main%20Board', desc: 'Queries securities on CSX Main Board only' },
                    { label: 'Filter by High AI Score', url: '/api/csx/stocks?minScore=70', desc: 'Returns companies with AI Score >= 70' },
                    { label: 'Sort by Market Cap (Highest first)', url: '/api/csx/stocks?sortBy=marketCapKHR&order=desc', desc: 'Ranked list by total market valuation' },
                    { label: 'Sort by Stock Price', url: '/api/csx/stocks?sortBy=currentPrice&order=desc', desc: 'Highest trading price on CSX' },
                    { label: 'Single Stock Detail (PAS)', url: '/api/csx/stocks/PAS', desc: 'Full profile, order book, and 7-day forecast' },
                    { label: 'OHLCV Time-Series (1 Month)', url: '/api/csx/stocks/PAS/history?timeframe=1M', desc: 'Historical daily open, high, low, close, volume' },
                    { label: 'Sync Audit Log History', url: '/api/csx/sync/history?limit=15', desc: 'Recent sync operations, timestamps & duration' },
                    { label: 'Database Health & Metrics', url: '/api/csx/db-status', desc: 'Live document counts and connection status' },
                  ].map(item => (
                    <div key={item.url} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-[11px]">{item.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono truncate">{item.desc}</span>
                        </div>
                        <code className="text-[10px] text-emerald-400 font-mono block truncate mt-0.5">{item.url}</code>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.origin + item.url);
                            setCopiedQueryUrl(item.url);
                            setTimeout(() => setCopiedQueryUrl(null), 2000);
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                        >
                          {copiedQueryUrl === item.url ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedQueryUrl === item.url ? 'Copied' : 'Copy'}
                        </button>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-blue-950/80 hover:bg-blue-900 border border-blue-800/60 text-blue-300 rounded text-[10px] font-mono flex items-center gap-1 transition"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          Test
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct MongoDB Shell / Mongoose Queries */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-xs">
                  <Database className="w-4 h-4 text-purple-400" />
                  Direct MongoDB Shell & Script Queries
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-purple-300 space-y-1 overflow-x-auto">
                  <div><span className="text-slate-500">// Find securities with P/E under 15:</span></div>
                  <div>db.stocks.find(&#123; peRatio: &#123; $lt: 15, $gt: 0 &#125; &#125;)</div>
                  <div className="pt-1"><span className="text-slate-500">// Find stocks with Bullish signal and AI Score &gt;= 75:</span></div>
                  <div>db.stocks.find(&#123; "aiScore.overallScore": &#123; $gte: 75 &#125;, "aiScore.signal": /BUY/i &#125;)</div>
                  <div className="pt-1"><span className="text-slate-500">// Fetch latest 30 OHLCV daily candles for PAS:</span></div>
                  <div>db.historical_prices.find(&#123; ticker: "PAS" &#125;).sort(&#123; date: -1 &#125;).limit(30)</div>
                </div>
              </div>

              {/* Recent Sync Audit History Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="font-bold text-white text-xs">Recent CSX Data Sync Audit Trail</span>
                  </div>
                  <button
                    onClick={() => {
                      fetch('/api/csx/sync/history')
                        .then(r => r.json())
                        .then(d => Array.isArray(d) && setSyncHistory(d));
                    }}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>

                {isLoadingHistory ? (
                  <div className="text-center py-4 text-slate-500 font-mono text-xs">Loading sync records...</div>
                ) : syncHistory.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 font-mono text-xs">No recent sync history logged yet. Trigger a sync tick above!</div>
                ) : (
                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">Timestamp</th>
                          <th className="py-2 px-3">Sync Type</th>
                          <th className="py-2 px-3">Securities</th>
                          <th className="py-2 px-3">Duration</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {syncHistory.map((item: any, i: number) => (
                          <tr key={item.id || i} className="hover:bg-slate-800/30">
                            <td className="py-2 px-3 text-slate-400">{new Date(item.timestamp).toLocaleString()}</td>
                            <td className="py-2 px-3 text-white font-semibold">{item.syncType}</td>
                            <td className="py-2 px-3">
                              <span className="text-emerald-400 font-bold">{item.updatedCount}</span> stocks
                            </td>
                            <td className="py-2 px-3 text-slate-400">{item.durationMs || 12} ms</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                                {item.status || 'SUCCESS'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Explanation Alert: Why CSX is not real-time out of the box */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200 text-xs">
              <Database className="w-4 h-4 text-purple-400 shrink-0" />
              How the Cambodia Securities Exchange (CSX) Operates
            </div>
            <div className="text-slate-400 leading-relaxed text-xs space-y-1">
              <p>
                • <strong>Trading Window:</strong> Mon–Fri, <strong>08:00 – 15:00 Cambodia Time (ICT / UTC+7)</strong>. Continuous Automated Auction Method (AAM) runs 09:00–14:50.
              </p>
              <p>
                • <strong>Regulatory Circuit Breakers:</strong> Max daily price move is strictly <strong>±10%</strong> from previous closing.
              </p>
              <p>
                • <strong>Immediate AI Recalculation:</strong> Every sync event automatically updates SMA, RSI(14), MACD, Bollinger Bands, and projects new 7-Day AI Price Forecasts with confidence bands!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            CSX Index: <strong className="text-white font-mono">{indexData.index.toFixed(2)}</strong> ({indexData.change >= 0 ? '+' : ''}{indexData.change.toFixed(2)})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
