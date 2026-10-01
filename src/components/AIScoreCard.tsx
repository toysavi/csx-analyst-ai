import React from 'react';
import { AIScoreBreakdown, RiskAnalysis } from '../types/csx';
import { Award, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface AIScoreCardProps {
  score: AIScoreBreakdown;
  risk: RiskAnalysis;
  ticker: string;
}

export const AIScoreCard: React.FC<AIScoreCardProps> = ({ score, risk, ticker }) => {
  const getSignalBadgeColor = (signal: string) => {
    switch (signal) {
      case 'Strong Positive':
        return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      case 'Positive':
        return 'bg-emerald-900/60 text-emerald-400 border-emerald-800';
      case 'Neutral':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'Negative':
        return 'bg-rose-900/60 text-rose-400 border-rose-800';
      case 'Strong Negative':
        return 'bg-rose-950 text-rose-300 border-rose-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'Low':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-800';
      case 'Medium':
        return 'bg-amber-950/80 text-amber-400 border-amber-800';
      case 'High':
        return 'bg-rose-950/80 text-rose-400 border-rose-800';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const components = [
    score.fundamentals,
    score.growth,
    score.valuation,
    score.technical,
    score.newsEventImpact,
    score.riskScore,
    score.liquidity,
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
      {/* Top Summary Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          {/* Big Circular Score */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-900/60 via-slate-900 to-indigo-950 border border-blue-500/30 flex flex-col items-center justify-center shadow-lg">
            <span className="text-2xl font-black text-white font-mono">{score.overallScore}</span>
            <span className="text-[9px] font-bold uppercase text-slate-400">/ 100</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                TRANSPARENT AI COMPOSITE SCORE
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSignalBadgeColor(score.signal)}`}>
                {score.signal}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">{ticker} Multi-Factor Valuation & Risk Rating</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
              {score.summaryNarrative}
            </p>
          </div>
        </div>

        {/* Risk Level Widget */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-800">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">Assigned Risk Level</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getRiskBadgeColor(risk.level)}`}>
                {risk.level} Risk
              </span>
              <span className="text-xs font-mono text-slate-400">{risk.overallScore}/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Component Breakdown Cards (Section 7) */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Component Score Breakdown & Explanations</span>
          <span className="text-[10px] font-mono text-slate-400">Total Weighted 100%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {components.map(comp => {
            const pct = (comp.score / comp.maxScore) * 100;
            return (
              <div
                key={comp.label}
                className="bg-slate-850/80 border border-slate-800 hover:border-slate-700/80 rounded-lg p-3.5 space-y-2 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">{comp.label}</span>
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">({comp.weightPercent}%)</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-blue-400">
                    {comp.score} / {comp.maxScore}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">{comp.explanation}</p>

                {comp.keyMetrics && comp.keyMetrics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/80">
                    {comp.keyMetrics.map((km, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono"
                      >
                        {km.name}: <strong className="text-white">{km.value}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Analysis Factors & Mitigants (Section 8) */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Risk Factor Evaluation ({risk.level})</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Source: SERC Disclosures & Price Volatility</span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">{risk.riskExplanation}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="space-y-1.5 bg-slate-900/60 p-3 rounded border border-rose-950/40">
            <div className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
              <span>Primary Risk Vectors</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              {risk.primaryRisks.map((r, i) => (
                <li key={i} className="text-[11px] text-slate-400">
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5 bg-slate-900/60 p-3 rounded border border-emerald-950/40">
            <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
              <span>Mitigating Catalysts</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              {risk.mitigatingFactors.map((m, i) => (
                <li key={i} className="text-[11px] text-slate-400">
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
