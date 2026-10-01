import React from 'react';
import { Database, Server, Cpu, ShieldCheck, Code, Globe, HelpCircle } from 'lucide-react';

interface SettingsViewProps {
  currency: 'KHR' | 'USD';
  onCurrencyToggle: () => void;
  language: 'EN' | 'KH';
  onLanguageToggle: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currency,
  onCurrencyToggle,
  language,
  onLanguageToggle,
}) => {
  const tools = [
    { name: 'get_market_data(stock)', description: 'Retrieves current settlement price, daily change, and volume from CSX' },
    { name: 'get_historical_prices(stock)', description: 'Retrieves OHLCV candles across 1D, 1W, 1M, 3M, 6M, 1Y, 3Y periods' },
    { name: 'get_financial_data(stock)', description: 'Retrieves audited Income Statement, Balance Sheet, and cash flows in KHR' },
    { name: 'get_company_disclosures(stock)', description: 'Queries official corporate disclosures and SERC filings' },
    { name: 'search_company_news(stock)', description: 'Retrieves verified local business articles (Phnom Penh Post, Khmer Times)' },
    { name: 'analyze_news(article)', description: 'Evaluates business effect, financial effect, and whether market priced it in' },
    { name: 'calculate_technical_indicators(stock)', description: 'Calculates SMA 5/10/20/50, EMA, RSI(14), MACD, Bollinger Bands, ATR' },
    { name: 'calculate_ai_score(stock)', description: 'Computes transparent 0-100 score across 7 weighted components' },
    { name: 'forecast_7_days(stock)', description: 'Calculates multi-factor 7-trading-day forecast with confidence and uncertainty cone' },
    { name: 'backtest_strategy(stock, params)', description: 'Runs historical simulation and tracks forecast accuracy metrics' },
  ];

  return (
    <div className="space-y-6">
      {/* Preferences Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-bold text-white">Application Preferences</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-850 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-200">Default Currency Display</div>
              <div className="text-[11px] text-slate-400 font-mono">1 USD ≈ 4,050 KHR (National Bank of Cambodia rate)</div>
            </div>
            <button
              onClick={onCurrencyToggle}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold border border-slate-700 cursor-pointer transition"
            >
              Active: {currency}
            </button>
          </div>

          <div className="p-3.5 bg-slate-850 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-200">Interface Language Preview</div>
              <div className="text-[11px] text-slate-400 font-sans">English (EN) default with Khmer (KH) terminology preview</div>
            </div>
            <button
              onClick={onLanguageToggle}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold border border-slate-700 cursor-pointer transition"
            >
              {language === 'EN' ? '🇬🇧 English' : '🇰🇭 ភាសាខ្មែរ'}
            </button>
          </div>
        </div>
      </div>

      {/* Official CSX Market Rules & Statutory Parameters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Cambodia Securities Exchange (CSX) Official Rules</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            csx.com.kh Grounded
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-850 rounded-lg border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Trading Schedule (ICT)</div>
            <div className="text-white font-bold">08:00 - 15:00</div>
            <div className="text-[11px] text-slate-400 font-sans">
              Pre-Open (08:00-09:00), Continuous Auction (09:00-14:50), Closing Auction (14:50-15:00).
            </div>
          </div>

          <div className="p-3 bg-slate-850 rounded-lg border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Daily Price Limit</div>
            <div className="text-emerald-400 font-bold">±10% Base Price</div>
            <div className="text-[11px] text-slate-400 font-sans">
              Daily floor and ceiling strictly bounded by CSX auction matching engines.
            </div>
          </div>

          <div className="p-3 bg-slate-850 rounded-lg border border-slate-800 space-y-1">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Official Tick Sizes</div>
            <div className="text-blue-400 font-bold">10 / 20 / 50 KHR</div>
            <div className="text-[11px] text-slate-400 font-sans">
              &lt;4,000 KHR: 10 KHR; 4,000 - 20,000 KHR: 20 KHR; 20,000 - 40,000 KHR: 50 KHR.
            </div>
          </div>
        </div>
      </div>

      {/* Data Architecture (Section 16) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-bold text-white">Data Architecture & Decoupled Pipeline</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The CSX AI Analyst engine is designed with strict separation between data collectors, analytical calculation modules, and the Gemini AI inference layer.
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
          <div className="text-blue-400 font-bold">DATA FLOW PIPELINE:</div>
          <div className="p-2 bg-slate-900 rounded border border-slate-800">
            CSX Settlement / Disclosures / Port News → CSXDataProvider Interface (Plug-and-play adapter) → Quantitative Analytics Engine (SMA, RSI, ATR) → 7-Day Volatility Forecasting Engine → Gemini 3.8 Flash (Server-side) → Interactive React Dashboard
          </div>
        </div>
      </div>

      {/* AI Agent Function Declarations (Section 17) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-bold text-white">Quantitative Agent Tool Declarations</h3>
        </div>
        <p className="text-xs text-slate-400">
          Tools used by the server-side Gemini 3.8 Flash engine to query factual CSX figures instead of hallucinating:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
          {tools.map(t => (
            <div key={t.name} className="p-2.5 rounded-lg bg-slate-850 border border-slate-800">
              <div className="font-bold text-purple-400">{t.name}</div>
              <div className="text-[11px] text-slate-400 font-sans mt-0.5">{t.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
