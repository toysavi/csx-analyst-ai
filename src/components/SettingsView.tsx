import React, { useState } from 'react';
import { Database, Server, Cpu, ShieldCheck, Code, Globe, HelpCircle, Cloud, Terminal, Key, RefreshCw, AlertTriangle, CheckCircle2, Copy, Check } from 'lucide-react';

interface SettingsViewProps {
  currency: 'KHR' | 'USD';
  onCurrencyToggle: () => void;
  language: 'EN' | 'KH';
  onLanguageToggle: () => void;
  onOpenLiveSync?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currency,
  onCurrencyToggle,
  language,
  onLanguageToggle,
  onOpenLiveSync,
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

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

  const dockerfileSnippet = `# Production Dockerfile for CSX AI Analyst
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src

EXPOSE 3000
CMD ["npm", "start"]`;

  const githubActionsWorkflow = `name: Build and Push Docker Image to GitHub Container Registry

on:
  push:
    branches: [main, master]
    tags: ['v*.*.*']
  workflow_dispatch:

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: ghcr.io/\${{ github.repository }}:latest`;

  const dockerPullRun = `# 1. Pull the automated image from GitHub Container Registry
docker pull ghcr.io/toysavi/csx-analyst-ai:latest

# 2. Run the container with Gemini API Key
docker run -d \\
  --name csx-analyst \\
  -p 3000:3000 \\
  -e GEMINI_API_KEY="YOUR_GEMINI_API_KEY" \\
  -e PORT=3000 \\
  ghcr.io/toysavi/csx-analyst-ai:latest

# Or start with Docker Compose:
# docker compose up -d`;

  return (
    <div className="space-y-6">
      {/* Top Banner: Quick Access to Live CSX Sync */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-purple-950/70 border border-blue-800/40 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-400" />
            Live CSX Market Feed & Price Synchronization
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Need to update prices to match today's real trading session from the CSX Trade app or csx.com.kh?
          </p>
        </div>
        {onOpenLiveSync && (
          <button
            onClick={onOpenLiveSync}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition shadow-lg shadow-blue-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            Open Live Price Manager & Sync
          </button>
        )}
      </div>

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

      {/* SECTION 1: HOW TO HOST WITH AI ACCESS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">How to Host with Server-Side AI Access</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
            Node.js Express + Gemini 3.8 Flash
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <Key className="w-4 h-4 text-amber-400" />
              1. Secure API Key Handling
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              <strong>Never put Gemini API keys in client-side React code.</strong> The app uses <code className="text-amber-300">server.ts</code> as a backend proxy with <code className="text-amber-300">@google/genai</code>. The browser sends prompts to <code className="text-blue-300">POST /api/ai/chat</code>, keeping your <code className="text-amber-300">GEMINI_API_KEY</code> completely secure on the server.
            </p>
          </div>

          <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <Server className="w-4 h-4 text-emerald-400" />
              2. Google AI Studio Hosting
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              In Google AI Studio, click <strong>Deploy / Share</strong>. AI Studio automatically provisions Cloud Run and injects <code className="text-emerald-300">GEMINI_API_KEY</code> from user secrets into the container runtime. No manual environment configuration is needed.
            </p>
          </div>

          <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white">
              <Terminal className="w-4 h-4 text-purple-400" />
              3. Self-Hosted (Cloud Run / VPS)
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Run <code className="text-purple-300">npm run build</code>, configure <code className="text-purple-300">GEMINI_API_KEY=AIzaSy...</code> in your environment, and start with <code className="text-purple-300">npm start</code>. It serves the Vite production bundle and the API from port 3000.
            </p>
          </div>
        </div>

        {/* Code Snippets for Deployment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 font-mono">GitHub Actions CI/CD (.github/workflows/docker-build-push.yml):</span>
            <button
              onClick={() => copyToClipboard(githubActionsWorkflow, 'gha')}
              className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-mono text-[11px]"
            >
              {copiedSection === 'gha' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSection === 'gha' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-blue-300 overflow-x-auto max-h-48">
            {githubActionsWorkflow}
          </pre>

          <div className="flex items-center justify-between text-xs pt-2">
            <span className="font-bold text-slate-300 font-mono">Pull & Run from GitHub Container Registry (ghcr.io):</span>
            <button
              onClick={() => copyToClipboard(dockerPullRun, 'pull')}
              className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-mono text-[11px]"
            >
              {copiedSection === 'pull' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSection === 'pull' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto">
            {dockerPullRun}
          </pre>

          <div className="flex items-center justify-between text-xs pt-2">
            <span className="font-bold text-slate-300 font-mono">Production Multi-Stage Dockerfile:</span>
            <button
              onClick={() => copyToClipboard(dockerfileSnippet, 'dockerfile')}
              className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-mono text-[11px]"
            >
              {copiedSection === 'dockerfile' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedSection === 'dockerfile' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
            {dockerfileSnippet}
          </pre>
        </div>
      </div>

      {/* SECTION 2: WHY CSX DATA IS NOT REAL-TIME & HOW TO CONNECT REAL DATA */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Why CSX Data Is Not Real-Time Out-of-the-Box</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
            Cambodia Market Specifics
          </span>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-white text-sm">1. Lack of Free Open Market Data API</div>
            <p className="text-slate-400">
              Unlike the New York Stock Exchange or European exchanges, the <strong>Cambodia Securities Exchange (CSX)</strong> does not provide a free, unauthenticated public REST or WebSocket API. Live order book feeds are restricted by the <strong>Securities and Exchange Regulator of Cambodia (SERC)</strong> and require licensed member broker subscriptions (e.g., ACLEDA Securities, Yuanta Securities, Cana Securities).
            </p>
          </div>

          <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-white text-sm">2. Trading Session Hours (ICT / UTC+7)</div>
            <p className="text-slate-400">
              CSX trades only Monday through Friday from <strong>08:00 AM to 03:00 PM (Indochina Time, UTC+7)</strong>. Outside of these hours, trading is closed and prices do not fluctuate.
            </p>
          </div>

          <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-white text-sm">3. Decoupled Provider Solution & Live Sync Manager</div>
            <p className="text-slate-400">
              To solve this, the application architecture decouples the frontend from the data source via <code className="text-purple-300">ICSXDataProvider</code> in <code className="text-purple-300">src/services/csxDataProvider.ts</code>. You can click <strong>"Open Live Price Manager & Sync"</strong> above to:
            </p>
            <ul className="list-disc list-inside text-slate-400 space-y-1 ml-2">
              <li>Instantly synchronize with the latest session ticks.</li>
              <li>Manually input today's exact closing price from your CSX Trade app or broker statement.</li>
              <li>Instantly witness the system recalculate SMA 5/20/50, RSI(14), MACD, Bollinger Bands, and recalibrate the 7-day AI forecast cone in real time!</li>
            </ul>
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

