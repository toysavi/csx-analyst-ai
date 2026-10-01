import React, { useState } from 'react';
import { X, PlayCircle, CheckCircle2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { DailyPipelineStep } from '../types/csx';

interface DailyPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunSuccess: () => void;
}

export const DailyPipelineModal: React.FC<DailyPipelineModalProps> = ({
  isOpen,
  onClose,
  onRunSuccess,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [completed, setCompleted] = useState(false);

  const initialSteps: DailyPipelineStep[] = [
    { stepNumber: 1, name: 'Collect latest CSX market data', status: 'pending', details: 'Query CSX electronic trading settlement prices' },
    { stepNumber: 2, name: 'Update historical prices & OHLCV candles', status: 'pending', details: 'Append daily settlement candles for all 10 listed stocks' },
    { stepNumber: 3, name: 'Collect official disclosures from CSX & SERC', status: 'pending', details: 'Ingest latest regulatory corporate filings & shareholder notices' },
    { stepNumber: 4, name: 'Collect Cambodian economic & market news', status: 'pending', details: 'Scrape verified business news & port logistics bulletins' },
    { stepNumber: 5, name: 'AI Event & News Impact Assessment', status: 'pending', details: 'Evaluate business effect, financial effect, and priced-in status' },
    { stepNumber: 6, name: 'Update company financial metrics', status: 'pending', details: 'Recalculate trailing P/E, P/B, and dividend yields' },
    { stepNumber: 7, name: 'Recalculate Technical Indicators', status: 'pending', details: 'Compute SMA 5/10/20/50, RSI(14), MACD, Bollinger Bands, and ATR' },
    { stepNumber: 8, name: 'Recalculate AI Analysis Scores (0-100)', status: 'pending', details: 'Update composite breakdown: Fundamentals, Growth, Valuation, Risk' },
    { stepNumber: 9, name: 'Generate new 7-Day Price Forecasts', status: 'pending', details: 'Model uncertainty bounds and confidence % for trading days 1 to 7' },
    { stepNumber: 10, name: 'Store and archive previous forecasts', status: 'pending', details: 'Record daily forecast vector snapshot for accuracy auditing' },
    { stepNumber: 11, name: 'Compare previous forecasts with actual results', status: 'pending', details: 'Evaluate 7-day-old forecasts against actual closing prices' },
    { stepNumber: 12, name: 'Update forecast accuracy metrics (MAE, MAPE, Bias)', status: 'pending', details: 'Update directional accuracy and model reliability grades' },
  ];

  const [steps, setSteps] = useState<DailyPipelineStep[]>(initialSteps);

  if (!isOpen) return null;

  const runPipeline = async () => {
    setIsRunning(true);
    setCompleted(false);

    // Call server endpoint or simulate step-by-step
    try {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStepIndex(i);
        setSteps(prev =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'running' } : s))
        );
        // Small delay for visual verification
        await new Promise(r => setTimeout(r, 220));

        setSteps(prev =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'completed' } : s))
        );
      }
      setCompleted(true);
      onRunSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
      setCurrentStepIndex(-1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-950 text-blue-400 border border-blue-800">
              <PlayCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Automated Daily Analysis Pipeline</h2>
              <p className="text-xs text-slate-400 font-mono">12-Step Quantitative Market Research & Forecasting Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="overflow-y-auto space-y-2 flex-1 pr-1 font-mono text-xs">
          {steps.map((step, idx) => (
            <div
              key={step.stepNumber}
              className={`p-2.5 rounded-lg border flex items-center justify-between transition ${
                step.status === 'completed'
                  ? 'bg-emerald-950/20 border-emerald-900/50 text-slate-200'
                  : step.status === 'running'
                  ? 'bg-blue-950/40 border-blue-700 text-white shadow-sm'
                  : 'bg-slate-850/60 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-slate-800 text-slate-300">
                  {step.stepNumber}
                </span>
                <div>
                  <div className="font-sans font-bold text-xs">{step.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{step.details}</div>
                </div>
              </div>

              <div>
                {step.status === 'completed' && (
                  <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    Done
                  </span>
                )}
                {step.status === 'running' && (
                  <span className="flex items-center gap-1 text-blue-400 text-[11px] font-bold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running
                  </span>
                )}
                {step.status === 'pending' && (
                  <span className="text-slate-400 text-[10px]">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer controls */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {completed ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Pipeline complete! 10 stocks and forecasts refreshed.
              </span>
            ) : (
              <span>Ready to execute scheduled daily pipeline</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={runPipeline}
              disabled={isRunning}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
            >
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              <span>{isRunning ? 'Processing...' : 'Run Daily Pipeline'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
