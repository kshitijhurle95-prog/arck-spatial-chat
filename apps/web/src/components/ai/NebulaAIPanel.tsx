import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  FileText,
  Activity,
  CheckCircle2,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useChat } from '../../context/ChatContext';

export const NebulaAIPanel: React.FC = () => {
  const { activeConversation, activeConversationId } = useChat();

  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: 'Greetings, Operator. I am ARCK AI (v2046.4), your sub-space synthetic intelligence copilot. How may I assist your mission coordination today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    summary: string;
    actionItems: string[];
    keyTopics: string[];
    participantSentiment: string;
  } | null>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userText = prompt.trim();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [...prev, { sender: 'user', text: userText, time: timeNow }]);
    setPrompt('');
    setIsLoading(true);

    try {
      const res = await api.aiChat(userText);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: res.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Signal degradation encountered during neural synthesis. Please try again.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarizeActiveChat = async () => {
    if (!activeConversationId) {
      alert('Please select an active transmission frequency first.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.aiSummarize(activeConversationId);
      setSummaryData(res);
    } catch (err: any) {
      alert(err.message || 'Failed to synthesize summary.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full rounded-[30px] bg-white/75 dark:bg-[#111626]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-glass-card dark:shadow-glass-card-dark overflow-hidden select-none relative">
      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-white/5 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#ECE6FA] dark:bg-[#6E44FF]/20 border border-[#6E44FF]/30 flex items-center justify-center text-[#6E44FF]">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white font-sans flex items-center gap-2">
              <span>ARCK AI</span>
              <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Active
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-sans">Sub-Space Synthetic Assistant</p>
          </div>
        </div>

        {/* Quick Summarize Action */}
        <button
          onClick={handleSummarizeActiveChat}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ECE6FA] dark:bg-[#6E44FF]/20 hover:bg-[#6E44FF]/30 border border-[#6E44FF]/30 text-[#6E44FF] text-xs font-medium transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Summarize Conversation</span>
        </button>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto smooth-scroll p-6 space-y-6 max-w-4xl w-full mx-auto">
        {/* Executive Summary Card if triggered */}
        {summaryData && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-nebula-card to-nebula-surface border border-nebula-cyan/40 shadow-glow-cyan space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between border-b border-nebula-border pb-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-nebula-cyan uppercase">
                <Activity className="w-4 h-4" />
                <span>Executive Transmission Briefing // {activeConversation?.name || 'Channel'}</span>
              </div>
              <button
                onClick={() => setSummaryData(null)}
                className="text-xs text-nebula-muted hover:text-nebula-text font-mono"
              >
                Dismiss
              </button>
            </div>

            <p className="text-sm text-nebula-text leading-relaxed font-sans">{summaryData.summary}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Action items */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-nebula-cyan uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Action Items & Directives:</span>
                </h4>
                <ul className="space-y-1.5">
                  {summaryData.actionItems.map((item, idx) => (
                    <li key={idx} className="text-xs text-nebula-muted flex items-start gap-2">
                      <span className="text-nebula-cyan font-mono">&bull;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sentiment & Key Topics */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-nebula-violet uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Sentiment & Core Focus:</span>
                </h4>
                <div className="space-y-1.5">
                  <p className="text-xs text-nebula-muted">
                    <span className="font-mono text-white">Sentiment:</span> {summaryData.participantSentiment}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {summaryData.keyTopics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-nebula-violet/15 text-nebula-violet border border-nebula-violet/30"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Stream */}
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-nebula-cyan to-nebula-violet flex items-center justify-center text-nebula-bg shrink-0 mt-1 shadow-glow-cyan">
                  <Cpu className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[80%] p-4 rounded-2xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap select-text ${
                  msg.sender === 'user'
                    ? 'bg-nebula-cyan/20 border border-nebula-cyan/40 text-nebula-text rounded-tr-sm shadow-glow-cyan'
                    : 'bg-nebula-card light:bg-light-card border border-nebula-border light:border-light-border text-nebula-text light:text-light-text rounded-tl-sm'
                }`}
              >
                {msg.text}
                <div className="text-[10px] font-mono text-nebula-muted mt-2 text-right">{msg.time}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-mono text-nebula-cyan p-2">
              <div className="w-3 h-3 rounded-full border border-nebula-cyan border-t-transparent animate-spin" />
              <span>Synthesizing response through quantum neural mesh...</span>
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="p-4 bg-nebula-surface/90 light:bg-light-surface/90 border-t border-nebula-border light:border-light-border backdrop-blur-xl">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask ARCK AI to analyze orbital telemetry, draft replies, or explain protocol..."
            className="flex-1 py-3 px-4 text-xs md:text-sm bg-nebula-card light:bg-light-card border border-nebula-border rounded-xl text-nebula-text focus:outline-none focus:border-nebula-cyan/50 font-sans"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="p-3 rounded-xl bg-gradient-to-r from-nebula-cyan to-nebula-violet hover:shadow-glow-cyan text-nebula-bg flex items-center justify-center transition-all disabled:opacity-40"
          >
            <Send className="w-4 h-4 fill-nebula-bg" />
          </button>
        </form>
      </div>
    </div>
  );
};
