import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User, Loader2, AlertCircle, HelpCircle, Terminal, TrendingUp, ShieldCheck, ExternalLink } from 'lucide-react';
import { CSXStock } from '../types/csx';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStock?: CSXStock | null;
  stocks: CSXStock[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  selectedStock,
  stocks,
}) => {
  const [chatMode, setChatMode] = useState<'market' | 'devops'>('market');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'model',
      text: `Hello! I am your CSX AI Analyst assistant. I have live access to actual market prices, financial filings, technical indicators, 7-day quantitative forecasts, and news impact assessments for all securities listed on the Cambodia Securities Exchange.

How can I assist your research today? You can select any recommended question below or switch to the "ArgoCD & DevOps" mode for deployment assistance.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const marketPrompts = [
    'Analyze PAS.',
    'Give me PAS\'s 7-day forecast.',
    'What news affected PAS recently?',
    'Compare PAS and PPAP.',
    'What are the biggest risks for PAS?',
    'Which companies have the highest analysis scores?',
    'What happened to the CSX Index today?',
    'Compare valuation between PAS, PPAP, and PWSA.',
  ];

  const devopsPrompts = [
    'How do I deploy with ArgoCD to csx.toysavi.com?',
    'Show Traefik IngressRoute with cert-manager.',
    'How do I create the GEMINI_API_KEY Secret?',
    'How to verify cert-manager SSL for csx.toysavi.com?',
    'Show ArgoCD Application YAML.',
    'How do I configure DNS for csx.toysavi.com?',
  ];

  const handleModeChange = (newMode: 'market' | 'devops') => {
    if (newMode === chatMode) return;
    setChatMode(newMode);

    if (newMode === 'devops') {
      setMessages(prev => [
        ...prev,
        {
          id: `devops-${Date.now()}`,
          sender: 'model',
          text: `⚙️ **ArgoCD & DevOps Deployment Guide Activated**

Target Setup:
• **Repository**: \`https://github.com/toysavi/csx-analyst-ai.git\`
• **FQDN**: \`csx.toysavi.com\`
• **Ingress**: Traefik with TLS
• **Certificates**: Cert-Manager (\`letsencrypt-prod\`)
• **Manifests**: Ready in \`/k8s/\` directory

Ask any question below about syncing ArgoCD, testing Traefik IngressRoutes, verifying ACME challenges, or managing Kubernetes secrets!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        {
          id: `market-${Date.now()}`,
          sender: 'model',
          text: `📈 **CSX Quantitative Market Analyst Activated**\n\nAsk me about stock forecasts, corporate disclosures, technical signals, or valuations on the Cambodia Securities Exchange.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          selectedStockTicker: selectedStock?.ticker || 'PAS',
          conversationHistory: messages.slice(-5),
          chatMode,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server error occurred');
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'model',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'model',
        text: 'The AI service is currently busy. ' + (err.message || 'Please try again in a moment.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md ${chatMode === 'devops' ? 'bg-gradient-to-br from-purple-600 to-indigo-600 shadow-purple-500/20' : 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/20'}`}>
              {chatMode === 'devops' ? <Terminal className="w-5 h-5 text-emerald-300" /> : <Sparkles className="w-5 h-5 text-amber-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  {chatMode === 'devops' ? 'ArgoCD & Traefik DevOps Assistant' : 'CSX Quantitative AI Analyst'}
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800">
                  GEMINI 3.8 FLASH
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {chatMode === 'devops'
                  ? 'GitOps deployment for toysavi/csx-analyst-ai on csx.toysavi.com'
                  : 'Grounded in actual CSX order books, historical disclosures, and 7-day volatility models'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex items-center gap-1 text-xs">
              <button
                onClick={() => handleModeChange('market')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  chatMode === 'market'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Market Analyst</span>
              </button>
              <button
                onClick={() => handleModeChange('devops')}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  chatMode === 'devops'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>ArgoCD & DevOps</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
          {messages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : chatMode === 'devops'
                      ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                      : 'bg-slate-800 text-purple-400 border border-slate-700'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : chatMode === 'devops' ? <Terminal className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl space-y-1 ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none shadow-sm'
                  }`}
                >
                  <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                  <div
                    className={`text-[9px] font-mono text-right ${
                      isUser ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs bg-slate-800 text-purple-400 border border-slate-700">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-slate-300 rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="font-mono text-xs">
                  {chatMode === 'devops'
                    ? 'Consulting ArgoCD, Traefik & Kubernetes knowledge base...'
                    : 'Analyzing CSX dataset & compiling thesis...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Prompts */}
        <div className="p-2.5 bg-slate-950/60 border-t border-slate-800/80 overflow-x-auto whitespace-nowrap shrink-0 flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0 ml-1">
            {chatMode === 'devops' ? 'DevOps Prompts:' : 'Market Prompts:'}
          </span>
          {(chatMode === 'devops' ? devopsPrompts : marketPrompts).map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p)}
              disabled={isLoading}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition cursor-pointer shrink-0 disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder={
              chatMode === 'devops'
                ? "Ask about ArgoCD sync, Traefik ingress, Let's Encrypt for csx.toysavi.com..."
                : "Ask about any CSX stock (e.g., 'What are PAS's primary revenue drivers and 7-day target?')..."
            }
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-slate-850 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition cursor-pointer shadow-md shadow-blue-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
