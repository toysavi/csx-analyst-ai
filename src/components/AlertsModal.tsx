import React from 'react';
import { X, Bell, AlertTriangle, TrendingUp, Sparkles, Check, CheckCheck } from 'lucide-react';
import { MarketAlert } from '../types/csx';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: MarketAlert[];
  onMarkAllAsRead: () => void;
  onSelectStock: (ticker: string) => void;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onMarkAllAsRead,
  onSelectStock,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">CSX Market & Forecast Alerts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{alerts.length} notifications generated</span>
          <button
            onClick={onMarkAllAsRead}
            className="text-blue-400 hover:text-blue-300 transition flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        </div>

        <div className="overflow-y-auto space-y-2.5 flex-1 pr-1 text-xs font-sans">
          {alerts.map(a => (
            <div
              key={a.id}
              onClick={() => {
                if (a.ticker && a.ticker !== 'CSX') onSelectStock(a.ticker);
              }}
              className={`p-3 rounded-xl border transition cursor-pointer ${
                a.read
                  ? 'bg-slate-850/60 border-slate-800/80 text-slate-400'
                  : 'bg-slate-850 border-blue-900/50 text-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <div className="flex items-center gap-2">
                  {a.ticker && (
                    <span className="font-mono font-bold px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800/60">
                      {a.ticker}
                    </span>
                  )}
                  <span className="font-bold text-white">{a.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{a.message}</p>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
