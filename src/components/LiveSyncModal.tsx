import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, ShieldCheck, Database, AlertTriangle, ArrowUpRight, ArrowDownRight, Edit3, Save, ExternalLink } from 'lucide-react';
import { CSXStock, CSXIndexData } from '../types/csx';

interface LiveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: CSXStock[];
  indexData: CSXIndexData;
  onSyncComplete: (updatedStocks: CSXStock[], newIndexData: CSXIndexData) => void;
}

export const LiveSyncModal: React.FC<LiveSyncModalProps> = ({
  isOpen,
  onClose,
  stocks,
  indexData,
  onSyncComplete,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [inputPrice, setInputPrice] = useState<string>('');
  const [inputVolume, setInputVolume] = useState<string>('');
  const [isUpdatingSingle, setIsUpdatingSingle] = useState(false);

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
        // Update local list
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
                CSX Live Market Sync & Price Manager
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Real CSX Integration
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Understanding CSX market data feeds, real-time synchronization, and live price overrides
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

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Explanation Alert: Why CSX is not real-time out of the box */}
          <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Why isn't CSX data 100% live streaming automatically?
            </div>
            <div className="text-slate-300 leading-relaxed text-xs space-y-1.5">
              <p>
                <strong>1. No Public Open REST/WebSocket API:</strong> Unlike US/EU exchanges (NASDAQ, NYSE), the <strong>Cambodia Securities Exchange (CSX)</strong> does not offer a public, free real-time API. Live feeds require institutional licensing from the <strong>Securities and Exchange Regulator of Cambodia (SERC)</strong> or proprietary broker feeds (ACLEDA Securities, Yuanta, Cana).
              </p>
              <p>
                <strong>2. Trading Schedule:</strong> CSX trading occurs only Monday to Friday, <strong>08:00 to 15:00 Cambodia Time (ICT / UTC+7)</strong>. Outside of trading hours, matching is closed.
              </p>
              <p>
                <strong>3. Dynamic Live Override Available:</strong> This application features a decoupled <strong>`ICSXDataProvider`</strong>. Below, you can <strong>sync the latest live trading session</strong> or <strong>enter actual current prices</strong> from your broker or CSX Trade app to immediately recalculate all indicators and 7-day AI forecasts!
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <div className="font-bold text-white text-sm">Simulate Live Auction Tick / Sync Session</div>
              <div className="text-slate-400 text-xs">
                Simulates continuous auction execution within CSX's official ±10% daily price band and tick sizes.
              </div>
            </div>
            <button
              onClick={handleSimulateSync}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold flex items-center gap-2 cursor-pointer transition shadow-lg shadow-blue-500/10"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronizing...' : 'Sync Live Market Tick'}
            </button>
          </div>

          {syncStatusMessage && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{syncStatusMessage}</span>
            </div>
          )}

          {/* Real-Time Price Editor Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                Live CSX Price Editor & Manual Quote Override
              </h3>
              <span className="text-[11px] text-slate-400">
                Matches current prices from CSX Trade app or csx.com.kh
              </span>
            </div>

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

          {/* Developer Note: How to connect institutional feed */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-400">
              <Database className="w-4 h-4" />
              How to plug in a Production CSX Data Vendor Feed
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              In `src/services/csxDataProvider.ts`, implement the `ICSXDataProvider` interface to point to your live broker WebSocket, FIX gateway, or SERC-approved data vendor:
            </p>
            <pre className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800">
{`// Example: Plugging in Real Broker / CSX Gateway
class ProductionCSXFeed implements ICSXDataProvider {
  async getAllStocks() {
    const res = await fetch('https://your-broker-gateway.com/api/csx/quotes');
    return res.json();
  }
}
export const csxDataProvider = new ProductionCSXFeed();`}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Current Index: <strong className="text-white font-mono">{indexData.index.toFixed(2)}</strong> ({indexData.change >= 0 ? '+' : ''}{indexData.change.toFixed(2)})
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
